import { UserProfile, ConnectedDevice, ParentalControlSettings, LinkedChildProfile } from '../types';
import { detectCurrentDevice, generateFingerprint } from '../data/mockData';

export interface RegisteredAccount {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  isGoogleConnected: boolean;
  securityPin?: string; // 6-digit PIN for 2FA / owner verification
  twoFactorEnabled: boolean;
  requireDeviceApproval: boolean;
  loginAlertsEnabled: boolean;
  preventDuplicateAccounts: boolean;
  devices: ConnectedDevice[];
  createdAt: string;
  isMinor?: boolean;
  parentalControl?: ParentalControlSettings;
  linkedChildren?: LinkedChildProfile[];
}

// Clean real account directory (no fictitious dev or support accounts)
const DEFAULT_ACCOUNTS: RegisteredAccount[] = [];

const FAKE_ACCOUNT_IDS = new Set(['usr_valeria_ui', 'usr_carlos_dev', 'usr_soporte_nexus']);
const FAKE_USERNAMES = new Set(['valeria_ui', 'carlos_dev', 'soporte_nexus']);

const STORAGE_KEY = 'nexus_registered_accounts_v2';

class AccountRegistry {
  private accounts: RegisteredAccount[] = [];

  constructor() {
    this.loadAccounts();
  }

  private isFakeAccount(a: Partial<RegisteredAccount>): boolean {
    if (a.id && FAKE_ACCOUNT_IDS.has(a.id)) return true;
    if (a.username && FAKE_USERNAMES.has(a.username.toLowerCase())) return true;
    const name = (a.displayName || '').toLowerCase();
    if (name.includes('soporte') || name.includes('valeria') || name.includes('carlos')) {
      if (a.email?.includes('nexus.chat') || a.id?.startsWith('usr_valeria') || a.id?.startsWith('usr_carlos')) {
        return true;
      }
    }
    return false;
  }

  private loadAccounts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('nexus_registered_accounts_v1');
      if (saved) {
        const parsed: RegisteredAccount[] = JSON.parse(saved);
        // Exclude all fictitious devs and support accounts
        this.accounts = parsed.filter((a) => !this.isFakeAccount(a));
        this.persist();
      } else {
        this.accounts = [];
        this.persist();
      }
    } catch {
      this.accounts = [];
    }
  }

  /**
   * Merge accounts fetched from cloud sync
   */
  public syncWithCloudAccounts(cloudAccounts: RegisteredAccount[]) {
    if (!Array.isArray(cloudAccounts)) return;
    let changed = false;
    for (const cAcc of cloudAccounts) {
      if (this.isFakeAccount(cAcc)) continue;
      const idx = this.accounts.findIndex((a) => a.id === cAcc.id || a.email.toLowerCase() === cAcc.email.toLowerCase());
      if (idx >= 0) {
        this.accounts[idx] = { ...this.accounts[idx], ...cAcc };
        changed = true;
      } else {
        this.accounts.push(cAcc);
        changed = true;
      }
    }
    if (changed) {
      this.persist();
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.accounts));
    } catch (e) {
      console.error('Error saving account registry:', e);
    }
  }

  /**
   * Check if email is already taken
   */
  public isEmailRegistered(email: string): boolean {
    const clean = email.trim().toLowerCase();
    return this.accounts.some((a) => a.email.toLowerCase() === clean);
  }

  /**
   * Check if username is already taken
   */
  public isUsernameRegistered(username: string): boolean {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    return this.accounts.some((a) => a.username.toLowerCase() === clean);
  }

  /**
   * Find account by email
   */
  public getAccountByEmail(email: string): RegisteredAccount | undefined {
    const clean = email.trim().toLowerCase();
    return this.accounts.find((a) => a.email.toLowerCase() === clean);
  }

  /**
   * Find account by username
   */
  public getAccountByUsername(username: string): RegisteredAccount | undefined {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    return this.accounts.find((a) => a.username.toLowerCase() === clean);
  }

  /**
   * Find account by query (email or username)
   */
  public findAccount(query: string): RegisteredAccount | undefined {
    const clean = query.trim().toLowerCase().replace(/^@/, '');
    return (
      this.getAccountByEmail(clean) ||
      this.getAccountByUsername(clean)
    );
  }

  /**
   * Get all registered accounts
   */
  public getAllAccounts(): RegisteredAccount[] {
    return [...this.accounts];
  }

  /**
   * Get account by ID
   */
  public getAccountById(id: string): RegisteredAccount | undefined {
    return this.accounts.find((a) => a.id === id);
  }

  /**
   * Register or update account in registry
   */
  public registerAccount(
    profile: Partial<UserProfile> & { username: string; displayName: string; email: string; avatar: string },
    securityPin: string = '123456',
    options?: {
      twoFactorEnabled?: boolean;
      requireDeviceApproval?: boolean;
      loginAlertsEnabled?: boolean;
    }
  ): { success: boolean; error?: string; account?: RegisteredAccount } {
    const cleanEmail = profile.email.trim().toLowerCase();
    const cleanUsername = profile.username.trim().toLowerCase().replace(/^@/, '');
    
    // Check if account already exists with this email: UNIFY as a single account
    const existingByEmail = this.getAccountByEmail(cleanEmail);
    const accountId = existingByEmail ? existingByEmail.id : (profile.id || `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`);

    const existingByUsername = this.getAccountByUsername(cleanUsername);
    if (existingByUsername && existingByUsername.id !== accountId && existingByUsername.email !== cleanEmail) {
      return {
        success: false,
        error: `DUPLICATE_USERNAME: El nombre de usuario @${cleanUsername} ya pertenece a otra cuenta. Elige uno diferente.`,
      };
    }

    const index = this.accounts.findIndex((a) => a.id === accountId || a.email.toLowerCase() === cleanEmail);

    const accountData: RegisteredAccount = {
      id: accountId,
      email: cleanEmail,
      username: existingByEmail?.username || cleanUsername,
      displayName: profile.displayName || existingByEmail?.displayName || cleanUsername,
      avatar: profile.avatar || existingByEmail?.avatar || '',
      bio: profile.bio || profile.statusMessage || existingByEmail?.bio || '',
      status: profile.status || existingByEmail?.status || 'online',
      isGoogleConnected: profile.isGoogleConnected || existingByEmail?.isGoogleConnected || false,
      securityPin: securityPin || existingByEmail?.securityPin || '123456',
      twoFactorEnabled: options?.twoFactorEnabled ?? existingByEmail?.twoFactorEnabled ?? true,
      requireDeviceApproval: options?.requireDeviceApproval ?? existingByEmail?.requireDeviceApproval ?? true,
      loginAlertsEnabled: options?.loginAlertsEnabled ?? existingByEmail?.loginAlertsEnabled ?? true,
      preventDuplicateAccounts: true,
      devices: profile.devices || existingByEmail?.devices || [detectCurrentDevice()],
      createdAt: existingByEmail?.createdAt || profile.joinedDate || 'Hoy',
      isMinor: profile.isMinor ?? existingByEmail?.isMinor,
      parentalControl: profile.parentalControl || existingByEmail?.parentalControl,
      linkedChildren: profile.linkedChildren || existingByEmail?.linkedChildren,
    };

    if (index >= 0) {
      // Unify and update existing single account
      this.accounts[index] = {
        ...this.accounts[index],
        ...accountData,
        isGoogleConnected: accountData.isGoogleConnected || this.accounts[index].isGoogleConnected,
      };
    } else {
      this.accounts.push(accountData);
    }

    this.persist();
    return { success: true, account: index >= 0 ? this.accounts[index] : accountData };
  }

  /**
   * Directly update an existing account by ID
   */
  public updateAccount(id: string, partial: Partial<RegisteredAccount>): boolean {
    const idx = this.accounts.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.accounts[idx] = { ...this.accounts[idx], ...partial };
    this.persist();
    return true;
  }

  /**
   * Verify owner credentials with PIN
   */
  public verifyOwnerPin(emailOrUsername: string, pin: string): boolean {
    const acc = this.findAccount(emailOrUsername);
    if (!acc) return false;
    return acc.securityPin === pin.trim();
  }

  /**
   * Update security settings of an account
   */
  public updateSecuritySettings(
    userId: string,
    updates: Partial<Pick<RegisteredAccount, 'securityPin' | 'twoFactorEnabled' | 'requireDeviceApproval' | 'loginAlertsEnabled' | 'preventDuplicateAccounts'>>
  ) {
    const acc = this.accounts.find((a) => a.id === userId);
    if (acc) {
      Object.assign(acc, updates);
      this.persist();
    }
  }

  /**
   * Sync devices for user
   */
  public updateDevices(userId: string, devices: ConnectedDevice[]) {
    const acc = this.accounts.find((a) => a.id === userId);
    if (acc) {
      acc.devices = devices;
      this.persist();
    }
  }

  /**
   * Revoke all other devices except current
   */
  public revokeOtherDevices(userId: string): ConnectedDevice[] {
    const acc = this.accounts.find((a) => a.id === userId);
    if (!acc) return [];
    acc.devices = acc.devices.filter((d) => d.isCurrent);
    this.persist();
    return acc.devices;
  }
}

export const accountRegistry = new AccountRegistry();
