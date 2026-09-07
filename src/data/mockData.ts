import { UserProfile, Chat, Message, WorkspaceItem, ConnectedDevice } from '../types';

export const INITIAL_CHATS: Chat[] = [];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};

export const INITIAL_WORKSPACE_ITEMS: WorkspaceItem[] = [];

export function generateFingerprint(): string {
  const blocks: string[] = [];
  for (let i = 0; i < 12; i++) {
    const num = Math.floor(10000 + Math.random() * 90000);
    blocks.push(num.toString());
  }
  return blocks.join(' ');
}

export function detectCurrentDevice(): ConnectedDevice {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);

  let browser = 'Navegador Web';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'Dispositivo';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return {
    id: 'dev_' + Date.now(),
    name: `${browser} en ${os}`,
    type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
    browser: `${browser} / ${os}`,
    lastActive: 'Activo ahora',
    isCurrent: true,
    ipAddress: '127.0.0.1',
    e2eeKeySynced: true,
  };
}

export function createNewUserProfile(params: {
  displayName: string;
  email: string;
  username?: string;
  avatar?: string;
  isGoogle?: boolean;
}): UserProfile {
  const cleanUsername =
    params.username ||
    params.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'usuario';

  const avatar =
    params.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(params.displayName || cleanUsername)}&background=2563eb&color=fff&bold=true`;

  return {
    id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    displayName: (params.displayName || cleanUsername).trim(),
    username: cleanUsername,
    email: params.email.trim(),
    avatar,
    status: 'online',
    statusMessage: 'Disponible | E2EE activo',
    bio: '',
    phone: '',
    e2eeFingerprint: generateFingerprint(),
    joinedDate: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    isGoogleConnected: !!params.isGoogle,
    securityPin: '123456',
    twoFactorEnabled: true,
    requireDeviceApproval: true,
    loginAlertsEnabled: true,
    preventDuplicateAccounts: true,
    devices: [detectCurrentDevice()],
  };
}
