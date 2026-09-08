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

// Initial directory of verified users for testing directory searches
const DEFAULT_ACCOUNTS: RegisteredAccount[] = [
  {
    id: 'usr_valeria_ui',
    email: 'valeria.rodriguez@gmail.com',
    username: 'valeria_ui',
    displayName: 'Valeria Rodríguez',
    avatar: 'https://ui-avatars.com/api/?name=Valeria+Rodriguez&background=4f46e5&color=fff&bold=true',
    bio: 'Diseñadora UI/UX & Google Workspace Specialist',
    status: 'online',
    isGoogleConnected: true,
    securityPin: '123456',
    twoFactorEnabled: true,
    requireDeviceApproval: true,
    loginAlertsEnabled: true,
    preventDuplicateAccounts: true,
    devices: [
      {
        id: 'dev_valeria_1',
        name: 'Chrome en macOS',
        type: 'desktop',
        browser: 'Chrome 122 / macOS Sonoma',
        lastActive: 'Activo hace 5 min',
        isCurrent: false,
        ipAddress: '192.168.1.45',
        e2eeKeySynced: true,
      },
    ],
    createdAt: 'Enero 2026',
  },
  {
    id: 'usr_carlos_dev',
    email: 'carlos.mendoza@gmail.com',
    username: 'carlos_dev',
    displayName: 'Carlos Mendoza',
    avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=059669&color=fff&bold=true',
    bio: 'Ingeniero de Software y Criptografía E2EE',
    status: 'away',
    isGoogleConnected: true,
    securityPin: '654321',
    twoFactorEnabled: true,
    requireDeviceApproval: true,
    loginAlertsEnabled: true,
    preventDuplicateAccounts: true,
    devices: [
      {
        id: 'dev_carlos_1',
        name: 'Firefox en Linux',
        type: 'desktop',
        browser: 'Firefox / Ubuntu 24.04',
        lastActive: 'Activo hoy',
        isCurrent: false,
        ipAddress: '10.0.0.12',
        e2eeKeySynced: true,
      },
    ],
    createdAt: 'Febrero 2026',
  },
  {
    id: 'usr_soporte_nexus',
    email: 'soporte@nexus.chat',
    username: 'soporte_nexus',
    displayName: 'Equipo de Soporte Nexus',
    avatar: 'https://ui-avatars.com/api/?name=Soporte+Nexus&background=2563eb&color=fff&bold=true',
    bio: 'Canal oficial de soporte y seguridad de la plataforma',
    status: 'online',
    isGoogleConnected: false,
    securityPin: '999888',
    twoFactorEnabled: true,
    requireDeviceApproval: true,
    loginAlertsEnabled: true,
    preventDuplicateAccounts: true,
    devices: [],
    createdAt: 'Diciembre 2025',
  },
];

const STORAGE_KEY = 'nexus_registered_accounts_v1';

class AccountRegistry {
  private accounts: RegisteredAccount[] = [];

  constructor() {
    this.loadAccounts();
  }

  private loadAccounts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.accounts = JSON.parse(saved);
      } else {
        this.accounts = [...DEFAULT_ACCOUNTS];
        this.persist();
      }
    } catch {
      this.accounts = [...DEFAULT_ACCOUNTS];
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
    const accountId = profile.id || `usr_${Date.now()}`;

    // Check if account already exists with different ID
    const existingByEmail = this.getAccountByEmail(cleanEmail);
    if (existingByEmail && existingByEmail.id !== accountId) {
      return {
        success: false,
        error: `DUPLICATE_EMAIL: Ya existe una cuenta registrada con el correo ${profile.email}. Por seguridad y protección de identidad, no está permitido duplicar cuentas sin la autorización del propietario.`,
      };
    }

    const existingByUsername = this.getAccountByUsername(cleanUsername);
    if (existingByUsername && existingByUsername.id !== accountId) {
      return {
        success: false,
        error: `DUPLICATE_USERNAME: El nombre de usuario @${cleanUsername} ya pertenece a otra cuenta. Elige uno diferente.`,
      };
    }

    const index = this.accounts.findIndex((a) => a.id === accountId || a.email.toLowerCase() === cleanEmail);

    const accountData: RegisteredAccount = {
      id: accountId,
      email: cleanEmail,
      username: cleanUsername,
      displayName: profile.displayName,
      avatar: profile.avatar,
      bio: profile.bio || profile.statusMessage || '',
      status: profile.status || 'online',
      isGoogleConnected: profile.isGoogleConnected ?? false,
      securityPin: securityPin || '123456',
      twoFactorEnabled: options?.twoFactorEnabled ?? true,
      requireDeviceApproval: options?.requireDeviceApproval ?? true,
      loginAlertsEnabled: options?.loginAlertsEnabled ?? true,
      preventDuplicateAccounts: true,
      devices: profile.devices || [detectCurrentDevice()],
      createdAt: profile.joinedDate || 'Hoy',
      isMinor: profile.isMinor,
      parentalControl: profile.parentalControl,
      linkedChildren: profile.linkedChildren,
    };

    if (index >= 0) {
      // Update existing
      this.accounts[index] = {
        ...this.accounts[index],
        ...accountData,
        securityPin: securityPin || this.accounts[index].securityPin || '123456',
      };
    } else {
      this.accounts.push(accountData);
    }

    this.persist();
    return { success: true, account: accountData };
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
