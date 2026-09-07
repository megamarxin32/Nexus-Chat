import { ThemeSettings, BubbleColorType, ChatWallpaperType, BubbleStyleType, AppPresetType } from '../types';

export interface ThemePalette {
  appBg: string;
  navBg: string;
  navBorder: string;
  listBg: string;
  listBorder: string;
  listHover: string;
  listActive: string;
  chatBg: string;
  chatHeaderBg: string;
  chatHeaderBorder: string;
  chatInputContainerBg: string;
  chatInputBorder: string;
  chatInputText: string;
  chatInputPlaceholder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentBg: string;
  accentHover: string;
  accentText: string;
  accentBorder: string;
  incomingBubbleBg: string;
  incomingBubbleText: string;
  incomingBubbleBorder: string;
  headerText: string;
  headerSubtitle: string;
}

export function getThemePalette(settings: ThemeSettings): ThemePalette {
  const preset = settings.appPreset || 'nexus';
  const mode = settings.mode || 'dark';

  if (preset === 'whatsapp') {
    if (mode === 'light') {
      return {
        appBg: '#f0f2f5',
        navBg: '#f0f2f5',
        navBorder: '#d1d7db',
        listBg: '#ffffff',
        listBorder: '#e9edef',
        listHover: '#f5f6f6',
        listActive: '#eef2f5',
        chatBg: '#efeae2',
        chatHeaderBg: '#f0f2f5',
        chatHeaderBorder: '#e9edef',
        chatInputContainerBg: '#ffffff',
        chatInputBorder: '#d1d7db',
        chatInputText: '#111b21',
        chatInputPlaceholder: '#667781',
        textPrimary: '#111b21',
        textSecondary: '#54656f',
        textMuted: '#8696a0',
        accentBg: '#008069',
        accentHover: '#006a57',
        accentText: '#ffffff',
        accentBorder: '#008069',
        incomingBubbleBg: '#ffffff',
        incomingBubbleText: '#111b21',
        incomingBubbleBorder: '#e9edef',
        headerText: '#111b21',
        headerSubtitle: '#667781',
      };
    }
    if (mode === 'oled') {
      return {
        appBg: '#000000',
        navBg: '#000000',
        navBorder: '#1c2830',
        listBg: '#000000',
        listBorder: '#1c2830',
        listHover: '#0b141a',
        listActive: '#1f2c34',
        chatBg: '#000000',
        chatHeaderBg: '#0c1317',
        chatHeaderBorder: '#1c2830',
        chatInputContainerBg: '#111b21',
        chatInputBorder: '#222e35',
        chatInputText: '#e9edef',
        chatInputPlaceholder: '#8696a0',
        textPrimary: '#ffffff',
        textSecondary: '#8696a0',
        textMuted: '#667781',
        accentBg: '#00a884',
        accentHover: '#02906f',
        accentText: '#ffffff',
        accentBorder: '#00a884',
        incomingBubbleBg: '#1f2c34',
        incomingBubbleText: '#e9edef',
        incomingBubbleBorder: 'transparent',
        headerText: '#ffffff',
        headerSubtitle: '#8696a0',
      };
    }
    // Dark mode WhatsApp
    return {
      appBg: '#0c1317',
      navBg: '#111b21',
      navBorder: '#222e35',
      listBg: '#111b21',
      listBorder: '#222e35',
      listHover: '#202c33',
      listActive: '#2a3942',
      chatBg: '#0b141a',
      chatHeaderBg: '#202c33',
      chatHeaderBorder: '#222e35',
      chatInputContainerBg: '#2a3942',
      chatInputBorder: '#374248',
      chatInputText: '#e9edef',
      chatInputPlaceholder: '#8696a0',
      textPrimary: '#e9edef',
      textSecondary: '#8696a0',
      textMuted: '#667781',
      accentBg: '#00a884',
      accentHover: '#02906f',
      accentText: '#ffffff',
      accentBorder: '#00a884',
      incomingBubbleBg: '#202c33',
      incomingBubbleText: '#e9edef',
      incomingBubbleBorder: 'transparent',
      headerText: '#e9edef',
      headerSubtitle: '#8696a0',
    };
  }

  if (preset === 'telegram') {
    if (mode === 'light') {
      return {
        appBg: '#eef2f5',
        navBg: '#ffffff',
        navBorder: '#e4e9ed',
        listBg: '#ffffff',
        listBorder: '#e4e9ed',
        listHover: '#f3f6f9',
        listActive: '#e3edf7',
        chatBg: '#c9d9e8',
        chatHeaderBg: '#ffffff',
        chatHeaderBorder: '#e4e9ed',
        chatInputContainerBg: '#ffffff',
        chatInputBorder: '#d5dfe6',
        chatInputText: '#222222',
        chatInputPlaceholder: '#707579',
        textPrimary: '#222222',
        textSecondary: '#707579',
        textMuted: '#999999',
        accentBg: '#2481cc',
        accentHover: '#1d6fa8',
        accentText: '#ffffff',
        accentBorder: '#2481cc',
        incomingBubbleBg: '#ffffff',
        incomingBubbleText: '#222222',
        incomingBubbleBorder: '#dce5eb',
        headerText: '#222222',
        headerSubtitle: '#707579',
      };
    }
    if (mode === 'oled') {
      return {
        appBg: '#000000',
        navBg: '#000000',
        navBorder: '#1c242c',
        listBg: '#000000',
        listBorder: '#1c242c',
        listHover: '#141d26',
        listActive: '#203247',
        chatBg: '#000000',
        chatHeaderBg: '#0e1621',
        chatHeaderBorder: '#1c242c',
        chatInputContainerBg: '#101921',
        chatInputBorder: '#1c242c',
        chatInputText: '#ffffff',
        chatInputPlaceholder: '#7f91a4',
        textPrimary: '#ffffff',
        textSecondary: '#7f91a4',
        textMuted: '#627588',
        accentBg: '#2481cc',
        accentHover: '#1d6fa8',
        accentText: '#ffffff',
        accentBorder: '#2481cc',
        incomingBubbleBg: '#182533',
        incomingBubbleText: '#ffffff',
        incomingBubbleBorder: '#242f3d',
        headerText: '#ffffff',
        headerSubtitle: '#7f91a4',
      };
    }
    // Dark mode Telegram
    return {
      appBg: '#0e1621',
      navBg: '#17212b',
      navBorder: '#0e1621',
      listBg: '#17212b',
      listBorder: '#0e1621',
      listHover: '#202b36',
      listActive: '#2b5278',
      chatBg: '#0e1621',
      chatHeaderBg: '#17212b',
      chatHeaderBorder: '#0e1621',
      chatInputContainerBg: '#17212b',
      chatInputBorder: '#242f3d',
      chatInputText: '#f5f5f5',
      chatInputPlaceholder: '#7f91a4',
      textPrimary: '#f5f5f5',
      textSecondary: '#7f91a4',
      textMuted: '#627588',
      accentBg: '#2481cc',
      accentHover: '#1d6fa8',
      accentText: '#ffffff',
      accentBorder: '#2481cc',
      incomingBubbleBg: '#182533',
      incomingBubbleText: '#f5f5f5',
      incomingBubbleBorder: '#242f3d',
      headerText: '#f5f5f5',
      headerSubtitle: '#7f91a4',
    };
  }

  if (preset === 'discord') {
    if (mode === 'light') {
      return {
        appBg: '#e3e5e8',
        navBg: '#e3e5e8',
        navBorder: '#d1d3d7',
        listBg: '#f2f3f5',
        listBorder: '#e3e5e8',
        listHover: '#e8eaed',
        listActive: '#d7dae0',
        chatBg: '#ffffff',
        chatHeaderBg: '#ffffff',
        chatHeaderBorder: '#e3e5e8',
        chatInputContainerBg: '#ebedef',
        chatInputBorder: '#ebedef',
        chatInputText: '#060607',
        chatInputPlaceholder: '#4e5058',
        textPrimary: '#060607',
        textSecondary: '#4e5058',
        textMuted: '#747781',
        accentBg: '#5865f2',
        accentHover: '#4752c4',
        accentText: '#ffffff',
        accentBorder: '#5865f2',
        incomingBubbleBg: '#f2f3f5',
        incomingBubbleText: '#060607',
        incomingBubbleBorder: '#e3e5e8',
        headerText: '#060607',
        headerSubtitle: '#4e5058',
      };
    }
    // Dark mode Discord
    return {
      appBg: '#1e1f22',
      navBg: '#1e1f22',
      navBorder: '#2b2d31',
      listBg: '#2b2d31',
      listBorder: '#1e1f22',
      listHover: '#35373c',
      listActive: '#404249',
      chatBg: '#313338',
      chatHeaderBg: '#313338',
      chatHeaderBorder: '#2b2d31',
      chatInputContainerBg: '#383a40',
      chatInputBorder: '#383a40',
      chatInputText: '#f2f3f5',
      chatInputPlaceholder: '#949ba4',
      textPrimary: '#f2f3f5',
      textSecondary: '#949ba4',
      textMuted: '#80848e',
      accentBg: '#5865f2',
      accentHover: '#4752c4',
      accentText: '#ffffff',
      accentBorder: '#5865f2',
      incomingBubbleBg: '#2b2d31',
      incomingBubbleText: '#f2f3f5',
      incomingBubbleBorder: 'transparent',
      headerText: '#f2f3f5',
      headerSubtitle: '#949ba4',
    };
  }

  // Nexus Pro / Default
  if (mode === 'light') {
    return {
      appBg: '#f8fafc',
      navBg: '#ffffff',
      navBorder: '#e2e8f0',
      listBg: '#ffffff',
      listBorder: '#e2e8f0',
      listHover: '#f1f5f9',
      listActive: '#e2e8f0',
      chatBg: '#f8fafc',
      chatHeaderBg: '#ffffff',
      chatHeaderBorder: '#e2e8f0',
      chatInputContainerBg: '#f1f5f9',
      chatInputBorder: '#e2e8f0',
      chatInputText: '#0f172a',
      chatInputPlaceholder: '#64748b',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      accentBg: '#2563eb',
      accentHover: '#1d4ed8',
      accentText: '#ffffff',
      accentBorder: '#2563eb',
      incomingBubbleBg: '#ffffff',
      incomingBubbleText: '#0f172a',
      incomingBubbleBorder: '#e2e8f0',
      headerText: '#0f172a',
      headerSubtitle: '#475569',
    };
  }

  if (mode === 'oled') {
    return {
      appBg: '#000000',
      navBg: '#000000',
      navBorder: '#1e293b',
      listBg: '#000000',
      listBorder: '#1e293b',
      listHover: '#0f172a',
      listActive: '#1e293b',
      chatBg: '#000000',
      chatHeaderBg: '#000000',
      chatHeaderBorder: '#1e293b',
      chatInputContainerBg: '#0a0e17',
      chatInputBorder: '#1e293b',
      chatInputText: '#ffffff',
      chatInputPlaceholder: '#64748b',
      textPrimary: '#ffffff',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      accentBg: '#3b82f6',
      accentHover: '#2563eb',
      accentText: '#ffffff',
      accentBorder: '#3b82f6',
      incomingBubbleBg: '#0f172a',
      incomingBubbleText: '#ffffff',
      incomingBubbleBorder: '#1e293b',
      headerText: '#ffffff',
      headerSubtitle: '#94a3b8',
    };
  }

  // Nexus Pro Dark
  return {
    appBg: '#090d16',
    navBg: '#0f172a',
    navBorder: '#1e293b',
    listBg: '#0b1120',
    listBorder: '#1e293b',
    listHover: '#1e293b',
    listActive: '#1e3a8a',
    chatBg: '#090d16',
    chatHeaderBg: '#0f172a',
    chatHeaderBorder: '#1e293b',
    chatInputContainerBg: '#0f172a',
    chatInputBorder: '#1e293b',
    chatInputText: '#f8fafc',
    chatInputPlaceholder: '#64748b',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accentBg: '#2563eb',
    accentHover: '#1d4ed8',
    accentText: '#ffffff',
    accentBorder: '#2563eb',
    incomingBubbleBg: '#1e293b',
    incomingBubbleText: '#f8fafc',
    incomingBubbleBorder: '#334155',
    headerText: '#f8fafc',
    headerSubtitle: '#94a3b8',
  };
}

export interface PresetConfig {
  id: AppPresetType;
  name: string;
  badge: string;
  description: string;
  iconColor: string;
  settings: Partial<ThemeSettings>;
}

export const APP_PRESETS: PresetConfig[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Clásico',
    badge: 'Familiar & Móvil',
    description: 'Burbujas en verde característico, patrón doodle, doble check azul (✓✓) y esquinas curvas.',
    iconColor: '#25D366',
    settings: {
      appPreset: 'whatsapp',
      chatBubbleColor: 'whatsapp_green',
      wallpaper: 'whatsapp_doodle',
      chatBubbleStyle: 'whatsapp',
      colorScheme: 'emerald',
      fontSize: 'normal',
      sendWithEnter: true,
      wallpaperOpacity: 0.12,
    },
  },
  {
    id: 'telegram',
    name: 'Telegram Modern',
    badge: 'Rápido & Curvo',
    description: 'Burbujas en cian/azul cielo, fondo estelar cósmico, bordes en píldora y micro-badges.',
    iconColor: '#0088cc',
    settings: {
      appPreset: 'telegram',
      chatBubbleColor: 'telegram_cyan',
      wallpaper: 'telegram_stars',
      chatBubbleStyle: 'telegram',
      colorScheme: 'blue',
      fontSize: 'normal',
      sendWithEnter: true,
      wallpaperOpacity: 0.15,
    },
  },
  {
    id: 'discord',
    name: 'Discord Gamer/Dev',
    badge: 'Servidor & Canales',
    description: 'Burbujas en Blurple (#5865f2), fondo Slate oscuro, flujo de texto con avatar y menciones.',
    iconColor: '#5865F2',
    settings: {
      appPreset: 'discord',
      chatBubbleColor: 'discord_blurple',
      wallpaper: 'discord_dark',
      chatBubbleStyle: 'discord',
      colorScheme: 'violet',
      fontSize: 'compact',
      sendWithEnter: true,
      wallpaperOpacity: 0.08,
    },
  },
  {
    id: 'nexus',
    name: 'Nexus Pro Hub',
    badge: 'Corporativo & E2EE',
    description: 'Azul cobalto profundo, interfaz equilibrada con matriz geométrica y soporte Google Workspace.',
    iconColor: '#2563EB',
    settings: {
      appPreset: 'nexus',
      chatBubbleColor: 'blue',
      wallpaper: 'geometric',
      chatBubbleStyle: 'nexus',
      colorScheme: 'blue',
      fontSize: 'normal',
      sendWithEnter: true,
      wallpaperOpacity: 0.1,
    },
  },
];

export const BUBBLE_COLOR_MAP: Record<
  BubbleColorType,
  { name: string; bg: string; text: string; hover: string; preview: string; isGreenCheck?: boolean }
> = {
  whatsapp_green: {
    name: 'Verde WhatsApp',
    bg: '#005c4b',
    text: '#ffffff',
    hover: '#006c58',
    preview: '#005c4b',
    isGreenCheck: false,
  },
  telegram_cyan: {
    name: 'Cian Telegram',
    bg: '#2b5278',
    text: '#ffffff',
    hover: '#33618d',
    preview: '#2b5278',
  },
  discord_blurple: {
    name: 'Blurple Discord',
    bg: '#5865f2',
    text: '#ffffff',
    hover: '#4752c4',
    preview: '#5865f2',
  },
  blue: {
    name: 'Nexus Blue',
    bg: '#2563eb',
    text: '#ffffff',
    hover: '#1d4ed8',
    preview: '#2563eb',
  },
  emerald: {
    name: 'Esmeralda Menta',
    bg: '#059669',
    text: '#ffffff',
    hover: '#047857',
    preview: '#059669',
  },
  violet: {
    name: 'Cyber Violeta',
    bg: '#7c3aed',
    text: '#ffffff',
    hover: '#6d28d9',
    preview: '#7c3aed',
  },
  amber: {
    name: 'Ámbar Cálido',
    bg: '#d97706',
    text: '#ffffff',
    hover: '#b45309',
    preview: '#d97706',
  },
  rose: {
    name: 'Rosa Magenta',
    bg: '#db2777',
    text: '#ffffff',
    hover: '#be185d',
    preview: '#db2777',
  },
  slate: {
    name: 'Grafito Minimal',
    bg: '#334155',
    text: '#f8fafc',
    hover: '#475569',
    preview: '#334155',
  },
};

export const WALLPAPER_PRESETS: { id: ChatWallpaperType; name: string; iconLabel: string }[] = [
  { id: 'whatsapp_doodle', name: 'Garabatos WhatsApp', iconLabel: '💬' },
  { id: 'telegram_stars', name: 'Estrellas Telegram', iconLabel: '✨' },
  { id: 'discord_dark', name: 'Noche Discord', iconLabel: '🎮' },
  { id: 'geometric', name: 'Matriz Geométrica', iconLabel: '▦' },
  { id: 'gradient', name: 'Degradado Aurora', iconLabel: '🌌' },
  { id: 'solid', name: 'Color Sólido', iconLabel: '⬛' },
  { id: 'custom', name: 'Fondo Personalizado', iconLabel: '🖼️' },
];

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
];

export const INITIALS_COLORS = [
  { label: 'Azul', hex: '2563eb' },
  { label: 'Verde', hex: '059669' },
  { label: 'Púrpura', hex: '7c3aed' },
  { label: 'Ámbar', hex: 'd97706' },
  { label: 'Rosa', hex: 'db2777' },
  { label: 'Cian', hex: '0891b2' },
  { label: 'Rojo', hex: 'dc2626' },
  { label: 'Oscuro', hex: '1e293b' },
];

export function buildInitialsAvatar(name: string, colorHex: string = '2563eb'): string {
  const cleanName = encodeURIComponent((name || 'Usuario').trim());
  return `https://ui-avatars.com/api/?name=${cleanName}&background=${colorHex}&color=fff&bold=true&size=256`;
}
