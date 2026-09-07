import { UserProfile, ParentalControlSettings, LinkedChildProfile } from '../types';
import { accountRegistry } from './accountRegistry';

export function generateFamilyLinkCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let code = 'FAM-';
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

export function createDefaultParentalSettings(isMinor: boolean = true): ParentalControlSettings {
  return {
    isMinor,
    isSupervised: false,
    linkCode: generateFamilyLinkCode(),
    allowUnknownContacts: false, // Default for under 13: only parent-approved contacts
    approvedContacts: [],
    allowVideoCalls: false, // Default: video calls off until parent allows
    allowAiAssistant: true, // Can use AI for study and homework
    dailyScreenTimeMinutes: 60, // Default: 60 min
    bedtimeQuietHoursEnabled: true, // 21:00 - 07:00
    filterSensitiveContent: true, // Safe search / filter on
    lastUpdated: new Date().toISOString(),
  };
}

export class ParentalControlManager {
  // Sync state between parent and child accounts
  syncWithRegistry(user: UserProfile): UserProfile {
    if (!user) return user;

    // 1. If current user is a minor child, verify if parent updated settings
    if (user.isMinor || user.parentalControl?.isMinor) {
      const allAccounts = accountRegistry.getAllAccounts();
      for (const acc of allAccounts) {
        if (acc.linkedChildren?.some((c) => c.id === user.id || c.linkCode === user.parentalControl?.linkCode)) {
          const childInParent = acc.linkedChildren.find(
            (c) => c.id === user.id || c.linkCode === user.parentalControl?.linkCode
          );
          if (childInParent) {
            return {
              ...user,
              isMinor: true,
              parentalControl: {
                ...childInParent.settings,
                parentUserId: acc.id,
                parentName: acc.displayName,
                parentEmail: acc.email,
                isSupervised: true,
              },
            };
          }
        }
      }
    }

    return user;
  }

  // Parent links a child via child's 6-digit link code or email/username
  linkChild(
    parent: UserProfile,
    childIdentifier: string
  ): { success: boolean; message: string; updatedParent?: UserProfile; linkedChild?: LinkedChildProfile } {
    const clean = childIdentifier.trim().toUpperCase();
    const cleanLower = childIdentifier.trim().toLowerCase();

    if (!clean) {
      return { success: false, message: 'Por favor ingresa el código familiar o correo del menor.' };
    }

    // Search in registry
    const allAccounts = accountRegistry.getAllAccounts();
    const targetAccount = allAccounts.find(
      (a) =>
        a.parentalControl?.linkCode?.toUpperCase() === clean ||
        a.email.toLowerCase() === cleanLower ||
        a.username.toLowerCase() === cleanLower.replace(/^@/, '')
    );

    let childProfile: LinkedChildProfile;

    if (targetAccount) {
      if (targetAccount.id === parent.id) {
        return { success: false, message: 'No puedes vincular tu propia cuenta como cuenta supervisada.' };
      }

      // Check if already linked
      if (parent.linkedChildren?.some((c) => c.id === targetAccount.id)) {
        return { success: false, message: 'Esta cuenta ya está vinculada a tu supervisión familiar.' };
      }

      const existingSettings = targetAccount.parentalControl || createDefaultParentalSettings(true);
      const updatedSettings: ParentalControlSettings = {
        ...existingSettings,
        isMinor: true,
        isSupervised: true,
        parentUserId: parent.id,
        parentName: parent.displayName,
        parentEmail: parent.email,
        lastUpdated: new Date().toISOString(),
      };

      childProfile = {
        id: targetAccount.id,
        displayName: targetAccount.displayName,
        username: targetAccount.username,
        email: targetAccount.email,
        avatar: targetAccount.avatar,
        linkCode: targetAccount.parentalControl?.linkCode || generateFamilyLinkCode(),
        linkedAt: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
        settings: updatedSettings,
      };

      // Update child's account in registry
      accountRegistry.updateAccount(targetAccount.id, {
        isMinor: true,
        parentalControl: updatedSettings,
      });
    } else {
      // If child hasn't registered yet or is offline, generate a pre-linked child profile with the code!
      const generatedCode = clean.startsWith('FAM-') ? clean : generateFamilyLinkCode();
      const tempId = 'child_' + Date.now();
      const settings = createDefaultParentalSettings(true);
      settings.isSupervised = true;
      settings.parentUserId = parent.id;
      settings.parentName = parent.displayName;
      settings.parentEmail = parent.email;

      childProfile = {
        id: tempId,
        displayName: cleanLower.includes('@') ? cleanLower.split('@')[0] : `Hijo/a (${clean})`,
        username: cleanLower.includes('@') ? cleanLower.split('@')[0] : 'menor_' + generatedCode.toLowerCase().replace('-', '_'),
        email: cleanLower.includes('@') ? cleanLower : `menor_${generatedCode.toLowerCase()}@nexus.local`,
        avatar: `https://ui-avatars.com/api/?name=Hijo&background=10b981&color=fff&bold=true`,
        linkCode: generatedCode,
        linkedAt: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
        settings,
      };
    }

    const updatedChildren = [...(parent.linkedChildren || []), childProfile];
    const updatedParent: UserProfile = {
      ...parent,
      linkedChildren: updatedChildren,
    };

    // Save parent in registry & local storage
    accountRegistry.updateAccount(parent.id, {
      linkedChildren: updatedChildren,
    });
    localStorage.setItem('nexus_user', JSON.stringify(updatedParent));

    return {
      success: true,
      message: `¡Cuenta de ${childProfile.displayName} vinculada con éxito! Ahora puedes configurar sus permisos.`,
      updatedParent,
      linkedChild: childProfile,
    };
  }

  // Update settings of a linked child from the parent's account
  updateChildSettings(
    parent: UserProfile,
    childId: string,
    newSettings: Partial<ParentalControlSettings>
  ): UserProfile {
    const updatedChildren = (parent.linkedChildren || []).map((c) => {
      if (c.id === childId || c.linkCode === childId) {
        const mergedSettings: ParentalControlSettings = {
          ...c.settings,
          ...newSettings,
          lastUpdated: new Date().toISOString(),
        };

        // Also update child's real account if exists
        const all = accountRegistry.getAllAccounts();
        const target = all.find((a) => a.id === c.id || a.parentalControl?.linkCode === c.linkCode);
        if (target) {
          accountRegistry.updateAccount(target.id, {
            parentalControl: mergedSettings,
          });
        }

        return {
          ...c,
          settings: mergedSettings,
        };
      }
      return c;
    });

    const updatedParent: UserProfile = {
      ...parent,
      linkedChildren: updatedChildren,
    };

    accountRegistry.updateAccount(parent.id, {
      linkedChildren: updatedChildren,
    });
    localStorage.setItem('nexus_user', JSON.stringify(updatedParent));
    return updatedParent;
  }

  // Remove child link
  unlinkChild(parent: UserProfile, childId: string): UserProfile {
    const updatedChildren = (parent.linkedChildren || []).filter((c) => c.id !== childId && c.linkCode !== childId);
    const updatedParent: UserProfile = {
      ...parent,
      linkedChildren: updatedChildren,
    };

    // Release child account
    const all = accountRegistry.getAllAccounts();
    const target = all.find((a) => a.id === childId);
    if (target && target.parentalControl) {
      accountRegistry.updateAccount(target.id, {
        parentalControl: {
          ...target.parentalControl,
          isSupervised: false,
          parentUserId: undefined,
          parentName: undefined,
          parentEmail: undefined,
        },
      });
    }

    accountRegistry.updateAccount(parent.id, {
      linkedChildren: updatedChildren,
    });
    localStorage.setItem('nexus_user', JSON.stringify(updatedParent));
    return updatedParent;
  }

  // Helper validation checks
  canStartCall(user: UserProfile, isVideo: boolean): { allowed: boolean; reason?: string } {
    if (!user.isMinor && !user.parentalControl?.isMinor) {
      return { allowed: true };
    }

    const pc = user.parentalControl;
    if (!pc) return { allowed: true };

    if (isVideo && !pc.allowVideoCalls) {
      return {
        allowed: false,
        reason: `Las videollamadas están bloqueadas por la configuración de control parental de ${
          pc.parentName || 'tu padre o tutor legal'
        }. Solo puedes realizar llamadas de voz.`,
      };
    }

    return { allowed: true };
  }

  canContactUser(user: UserProfile, contactUsernameOrEmail: string): { allowed: boolean; reason?: string } {
    if (!user.isMinor && !user.parentalControl?.isMinor) {
      return { allowed: true };
    }

    const pc = user.parentalControl;
    if (!pc) return { allowed: true };

    // If stranger contacts are allowed, permit
    if (pc.allowUnknownContacts) {
      return { allowed: true };
    }

    const clean = contactUsernameOrEmail.trim().toLowerCase().replace(/^@/, '');
    const isParent =
      pc.parentEmail?.toLowerCase() === clean ||
      pc.parentUserId === clean ||
      clean.includes('padre') ||
      clean.includes('tutor');

    if (isParent) return { allowed: true };

    const isApproved = pc.approvedContacts?.some((c) => {
      const cClean = c.trim().toLowerCase().replace(/^@/, '');
      return cClean === clean;
    });

    if (!isApproved) {
      return {
        allowed: false,
        reason: `Por seguridad de menores, solo puedes conversar con contactos autorizados previamente por tu padre o tutor (${
          pc.parentName || 'Tutor familiar'
        }).`,
      };
    }

    return { allowed: true };
  }
}

export const parentalControlManager = new ParentalControlManager();
