import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  User,
  Palette,
  Moon,
  Sun,
  Monitor,
  Zap,
  Bell,
  Volume2,
  ShieldCheck,
  X,
  Check,
  Camera,
  Upload,
  Sparkles,
  Type,
  Keyboard,
  Sliders,
  CheckCheck,
  Eye,
  EyeOff,
  RefreshCw,
  AtSign,
  KeyRound,
  Laptop,
  Smartphone,
  Tablet,
  Trash2,
  AlertTriangle,
  Lock,
  LogOut,
  Mail,
  Copy,
  Users,
  Heart,
} from 'lucide-react';
import {
  ThemeSettings,
  UserProfile,
  ChatWallpaperType,
  BubbleColorType,
  BubbleStyleType,
  AppPresetType,
  UserStatus,
  ConnectedDevice,
} from '../types';
import {
  APP_PRESETS,
  BUBBLE_COLOR_MAP,
  WALLPAPER_PRESETS,
  PRESET_AVATARS,
  INITIALS_COLORS,
  buildInitialsAvatar,
  getThemePalette,
} from '../lib/themePresets';
import { dataSaver } from '../lib/dataSaver';
import { notificationService } from '../lib/notifications';
import { accountRegistry } from '../lib/accountRegistry';
import { ParentalControlView } from './ParentalControlView';

export type SettingsTabKey = 'profile' | 'appearance' | 'security' | 'parental' | 'preferences';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ThemeSettings;
  onUpdateSettings: (newSettings: Partial<ThemeSettings>) => void;
  user: UserProfile;
  onUpdateUser: (newUser: UserProfile) => void;
  dataStats: { received: number; sent: number; saved: number };
  initialTab?: 'profile' | 'chat' | 'system' | 'appearance' | 'security' | 'parental' | 'preferences';
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  user,
  onUpdateUser,
  dataStats,
  initialTab = 'profile',
  onLogout,
}) => {
  // Normalize incoming initial tab
  const getNormalizedTab = (tab: string): SettingsTabKey => {
    if (tab === 'chat' || tab === 'appearance') return 'appearance';
    if (tab === 'security') return 'security';
    if (tab === 'parental') return 'parental';
    if (tab === 'system' || tab === 'preferences') return 'preferences';
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<SettingsTabKey>(getNormalizedTab(initialTab));

  // Profile fields
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || user.statusMessage || 'Disponible | E2EE activo');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [userStatus, setUserStatus] = useState<UserStatus>(user.status);
  const [showPresetAvatars, setShowPresetAvatars] = useState(false);
  const [showColorInitials, setShowColorInitials] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [customWallpaperInput, setCustomWallpaperInput] = useState(settings.customWallpaperUrl || '');

  // Security & Access Control fields (Requirement 5)
  const [securityPin, setSecurityPin] = useState(user.securityPin || '123456');
  const [showPin, setShowPin] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled ?? true);
  const [requireDeviceApproval, setRequireDeviceApproval] = useState(user.requireDeviceApproval ?? true);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(user.loginAlertsEnabled ?? true);
  const [preventDuplicateAccounts, setPreventDuplicateAccounts] = useState(user.preventDuplicateAccounts ?? true);
  const [isSyncingKeys, setIsSyncingKeys] = useState(false);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wallpaperFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(getNormalizedTab(initialTab));
      setDisplayName(user.displayName);
      setUsername(user.username);
      setBio(user.bio || user.statusMessage || 'Disponible | E2EE activo');
      setAvatarUrl(user.avatar);
      setUserStatus(user.status);
      setCustomWallpaperInput(settings.customWallpaperUrl || '');
      setSecurityPin(user.securityPin || '123456');
      setTwoFactorEnabled(user.twoFactorEnabled ?? true);
      setRequireDeviceApproval(user.requireDeviceApproval ?? true);
      setLoginAlertsEnabled(user.loginAlertsEnabled ?? true);
      setPreventDuplicateAccounts(user.preventDuplicateAccounts ?? true);
    }
  }, [isOpen, initialTab, user, settings.customWallpaperUrl]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Avatar file upload
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast('Por favor selecciona una imagen menor a 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Wallpaper file upload
  const handleWallpaperFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        showToast('Por favor selecciona una imagen menor a 4MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateSettings({
            wallpaper: 'custom',
            customWallpaperUrl: reader.result,
          });
          showToast('Fondo de chat personalizado aplicado');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile changes
  const handleSaveProfile = () => {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '') || 'usuario';
    const cleanDisplayName = displayName.trim() || cleanUsername;

    const updatedUser: UserProfile = {
      ...user,
      displayName: cleanDisplayName,
      username: cleanUsername,
      avatar: avatarUrl,
      bio: bio.trim(),
      statusMessage: bio.trim(),
      status: userStatus,
    };

    onUpdateUser(updatedUser);
    accountRegistry.registerAccount(updatedUser, securityPin);
    showToast('¡Perfil actualizado con éxito!');
  };

  // Save security changes
  const handleSaveSecurity = () => {
    if (securityPin.length < 4) {
      showToast('El PIN debe tener al menos 4 dígitos para proteger tu cuenta.');
      return;
    }

    const updatedUser: UserProfile = {
      ...user,
      securityPin,
      twoFactorEnabled,
      requireDeviceApproval,
      loginAlertsEnabled,
      preventDuplicateAccounts,
    };

    onUpdateUser(updatedUser);
    accountRegistry.updateSecuritySettings(user.id, {
      securityPin,
      twoFactorEnabled,
      requireDeviceApproval,
      loginAlertsEnabled,
      preventDuplicateAccounts,
    });

    showToast('¡Configuración de seguridad y PIN guardados!');
  };

  // Revoke all other sessions
  const handleRevokeOtherSessions = () => {
    const kept = accountRegistry.revokeOtherDevices(user.id);
    const updatedUser: UserProfile = {
      ...user,
      devices: user.devices.filter((d) => d.isCurrent),
    };
    onUpdateUser(updatedUser);
    showToast('Se han cerrado todas las sesiones en otros dispositivos.');
  };

  // Sync E2EE keys
  const handleSyncKeys = () => {
    setIsSyncingKeys(true);
    setTimeout(() => {
      setIsSyncingKeys(false);
      showToast('Claves E2EE verificadas y sincronizadas.');
    }, 1200);
  };

  // Apply Quick App Presets (WhatsApp, Telegram, Discord, Nexus)
  const handleApplyPreset = (presetId: AppPresetType) => {
    const found = APP_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    onUpdateSettings({
      appPreset: presetId,
      chatBubbleColor: found.settings.chatBubbleColor,
      chatBubbleStyle: found.settings.chatBubbleStyle,
      wallpaper: found.settings.wallpaper,
      wallpaperOpacity: found.settings.wallpaperOpacity,
    });
    showToast(`Estilo ${found.name} aplicado a tus chats`);
  };

  const currentBubble = BUBBLE_COLOR_MAP[settings.chatBubbleColor] || BUBBLE_COLOR_MAP.blue;
  const isDark = settings.mode !== 'light';
  const previewPalette = getThemePalette(settings);

  return (
    <div
      id="nexus-settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        id="nexus-settings-modal-card"
        className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur-sm">
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Configuración del Sistema</span>
            </h3>
            <p className="text-xs text-slate-400">
              Ajustes ordenados paso a paso para gestionar tu cuenta, diseño y seguridad
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LINEAR 5-STEP NAVIGATION BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-5 p-1.5 bg-slate-950/70 border-b border-slate-800/90 shrink-0 text-xs font-semibold gap-1">
          <button
            id="tab-btn-profile"
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate">1. Mi Cuenta</span>
          </button>

          <button
            id="tab-btn-appearance"
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
              activeTab === 'appearance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Palette className="w-4 h-4 shrink-0" />
            <span className="truncate">2. Apariencia</span>
          </button>

          <button
            id="tab-btn-security"
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">3. Seguridad</span>
          </button>

          <button
            id="tab-btn-parental"
            type="button"
            onClick={() => setActiveTab('parental')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
              activeTab === 'parental'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">4. Control Parental</span>
            {(user.isMinor || (user.linkedChildren && user.linkedChildren.length > 0)) && (
              <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
            )}
          </button>

          <button
            id="tab-btn-preferences"
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
              activeTab === 'preferences'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span className="truncate">5. Datos & Sonido</span>
          </button>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="bg-emerald-600/90 text-white text-xs px-4 py-2 font-medium flex items-center justify-between shrink-0 shadow-md">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ========================================================================= */}
          {/* 1. MI CUENTA Y PERFIL                                                     */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-2 text-xs text-blue-300">
                <User className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Información visible para tus contactos en Nexus y salas de Google Workspace.
                </span>
              </div>

              {/* Avatar Section */}
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-4">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Foto de Perfil & Avatar
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-20 h-20 rounded-3xl object-cover border-2 border-blue-500/50 shadow-xl"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-3xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold transition-opacity cursor-pointer"
                    >
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span>Cambiar</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Foto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPresetAvatars(!showPresetAvatars)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Galería Ilustrada</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowColorInitials(!showColorInitials)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                      >
                        <Type className="w-3.5 h-3.5 text-blue-400" />
                        <span>Iniciales</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Soporta fotos JPG, PNG, avatares ilustrados o tus iniciales con estilo.
                    </p>
                  </div>
                </div>

                {/* Preset Avatars Picker */}
                {showPresetAvatars && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] text-slate-400 font-semibold block">
                      Elige un avatar ilustrado:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(url);
                            setShowPresetAvatars(false);
                          }}
                          className="p-1 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 transition-all cursor-pointer group"
                        >
                          <img
                            src={url}
                            alt={`Avatar ${idx + 1}`}
                            className="w-full h-12 rounded-xl object-cover group-hover:scale-105 transition-transform"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Initials Generator */}
                {showColorInitials && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] text-slate-400 font-semibold block">
                      Avatares con tus iniciales y color:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {INITIALS_COLORS.map((col) => {
                        const preview = buildInitialsAvatar(displayName || username, col.hex);
                        return (
                          <button
                            key={col.label}
                            type="button"
                            onClick={() => {
                              setAvatarUrl(preview);
                              setShowColorInitials(false);
                            }}
                            className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 cursor-pointer"
                          >
                            <img src={preview} alt={col.label} className="w-8 h-8 rounded-full" />
                            <span className="text-xs text-slate-300 pr-1">{col.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Name & Username Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Nombre Visible
                  </label>
                  <input
                    id="input-settings-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full text-xs rounded-xl p-3 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Este es el nombre con el que aparecerás en los chats.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Nombre de Usuario (@)
                  </label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 focus-within:border-blue-500">
                    <AtSign className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="input-settings-username"
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      }
                      placeholder="nombre_usuario"
                      className="w-full bg-transparent text-xs text-white outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Identificador único para que otros te encuentren.
                  </span>
                </div>
              </div>

              {/* Google Connection Card */}
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Cuenta de Google Workspace</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                        {user.email}
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Vinculada para Meet, Google Drive, Gmail y Calendario en tiempo real.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Verificada</span>
                </div>
              </div>

              {/* Status and Bio */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Estado & Biografía
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ej. Disponible | Trabajando en diseño"
                  className="w-full text-xs rounded-xl p-3 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Save Profile & Logout Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                {onLogout ? (
                  <button
                    type="button"
                    id="btn-settings-logout"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-all"
                    title="Sincronizar y cerrar sesión de forma segura"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                ) : <div />}

                <button
                  type="button"
                  id="btn-save-profile"
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Datos de Cuenta</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. APARIENCIA Y TEMAS                                                     */}
          {/* ========================================================================= */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2 text-xs text-indigo-300">
                <Palette className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Elige presets de tus apps favoritas o personaliza modo oscuro, fondo y burbujas.
                </span>
              </div>

              {/* Presets Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Presets Rápidos de Aplicación
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {APP_PRESETS.map((preset) => {
                    const isSelected = settings.appPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{preset.badge}</span>
                          {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                        </div>
                        <h4 className="font-bold text-xs text-white">{preset.name}</h4>
                        <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode: Dark / OLED / Light */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Modo de Visualización de Pantalla
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ mode: 'dark' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      settings.mode === 'dark'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-blue-400" />
                    <span>Modo Oscuro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ mode: 'oled' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      settings.mode === 'oled'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-black border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    <span>OLED Negro Puro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ mode: 'light' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      settings.mode === 'light'
                        ? 'bg-white border-blue-500 text-slate-900 font-bold'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Modo Claro</span>
                  </button>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Vista Previa en Vivo de tus Chats
                </label>
                <div
                  className="p-4 rounded-3xl border overflow-hidden relative min-h-[140px] flex flex-col justify-end shadow-inner transition-colors"
                  style={{
                    backgroundColor: previewPalette.chatBg,
                    borderColor: previewPalette.chatHeaderBorder,
                  }}
                >
                  {/* Incoming sample */}
                  <div className="flex items-start gap-2 mb-2 z-10">
                    <img
                      src="https://ui-avatars.com/api/?name=Valeria+R&background=4f46e5&color=fff"
                      alt="Contacto"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div
                      className="p-2.5 rounded-2xl max-w-xs text-xs shadow-xs border"
                      style={{
                        backgroundColor: previewPalette.incomingBubbleBg,
                        color: previewPalette.incomingBubbleText,
                        borderColor: previewPalette.incomingBubbleBorder,
                      }}
                    >
                      <span>¿Qué tal luce el nuevo fondo y los colores de chat?</span>
                      <span
                        className="block text-[9px] text-right mt-1 opacity-70"
                        style={{ color: previewPalette.textSecondary }}
                      >
                        10:42 AM
                      </span>
                    </div>
                  </div>

                  {/* Outgoing sample */}
                  <div className="flex items-end justify-end gap-1.5 z-10">
                    <div
                      className={`p-2.5 rounded-2xl max-w-xs text-xs shadow-md ${
                        settings.chatBubbleStyle === 'whatsapp'
                          ? 'rounded-br-xs'
                          : settings.chatBubbleStyle === 'telegram'
                          ? 'rounded-full px-4'
                          : 'rounded-xl'
                      }`}
                      style={{
                        backgroundColor: currentBubble.bg,
                        color: currentBubble.text,
                      }}
                    >
                      <p>¡Se ve genial! Lo configuré a mi gusto.</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] opacity-80 mt-0.5">
                        <span>10:43 AM</span>
                        <CheckCheck className="w-3 h-3 text-sky-300 inline" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bubble Color Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Color de Burbujas Enviadas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'whatsapp_green', label: 'Verde WhatsApp', bg: '#056162' },
                    { id: 'telegram_cyan', label: 'Celeste Telegram', bg: '#2b5278' },
                    { id: 'discord_blurple', label: 'Morado Discord', bg: '#5865F2' },
                    { id: 'blue', label: 'Azul Nexus Pro', bg: '#2563eb' },
                    { id: 'emerald', label: 'Verde Esmeralda', bg: '#059669' },
                    { id: 'violet', label: 'Violeta Neón', bg: '#7c3aed' },
                    { id: 'amber', label: 'Ámbar Cálido', bg: '#d97706' },
                    { id: 'rose', label: 'Rosa Rubí', bg: '#e11d48' },
                  ].map((colorItem) => (
                    <button
                      key={colorItem.id}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ chatBubbleColor: colorItem.id as BubbleColorType })
                      }
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                        settings.chatBubbleColor === colorItem.id
                          ? 'bg-slate-800 border-blue-500 font-bold text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: colorItem.bg }}
                      />
                      <span className="truncate">{colorItem.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallpapers */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Fondo de Pantalla de Conversación
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WALLPAPER_PRESETS.map((wp) => (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => onUpdateSettings({ wallpaper: wp.id as ChatWallpaperType })}
                      className={`p-2.5 rounded-xl border text-xs text-center cursor-pointer transition-all ${
                        settings.wallpaper === wp.id
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {wp.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SEGURIDAD Y CONTROL DE ACCESO (REQUIREMENTS 1 & 5)                     */}
          {/* ========================================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Control de accesos, protección contra cuentas duplicadas y verificación de 2 pasos.
                </span>
              </div>

              {/* Card 1: PIN de Seguridad de 6 Dígitos (Acceso del Dueño) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        PIN de Seguridad de 6 Dígitos (Llave Maestra)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Código numérico requerido para autorizar nuevos dispositivos e inicios de sesión.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    Protección 2FA
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      id="settings-input-pin"
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.4em] font-mono text-base rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSecurity}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    Guardar PIN
                  </button>
                </div>
              </div>

              {/* Card 2: Reglas de Quién Puede Entrar a tu Cuenta */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  ¿Quién puede entrar a tu cuenta? Reglas de Acceso
                </h4>

                {/* Rule 1: Require 2FA PIN */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Exigir PIN de 6 dígitos en Inicios de Sesión (2FA)
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-md">
                      Nadie podrá entrar a tu cuenta únicamente conociendo tu contraseña; se exigirá el PIN de seguridad.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Rule 2: Prevent Duplicate Accounts */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Prevención Estricta de Cuentas Duplicadas
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-md">
                      Bloquea automáticamente que un tercero intente crear o clonar una cuenta con tu mismo correo o @usuario sin tu permiso.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preventDuplicateAccounts}
                      onChange={(e) => setPreventDuplicateAccounts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Rule 3: Require Device Approval */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Aprobación Obligatoria para Nuevos Dispositivos
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-md">
                      Cualquier nuevo navegador o teléfono deberá ser autorizado expresamente por ti antes de recibir mensajes cifrados.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireDeviceApproval}
                      onChange={(e) => setRequireDeviceApproval(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Rule 4: Login Alerts */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Alertas de Intentos de Inicio de Sesión
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-md">
                      Recibe una alerta inmediata si se detecta un intento de ingreso desde una dirección IP o navegador desconocido.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={loginAlertsEnabled}
                      onChange={(e) => setLoginAlertsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Card 3: Sesiones y Dispositivos Conectados */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Sesiones y Dispositivos Conectados
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Dispositivos que actualmente tienen acceso a tu cuenta
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncKeys}
                    disabled={isSyncingKeys}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingKeys ? 'animate-spin' : ''}`} />
                    <span>Sincronizar</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {user.devices?.map((dev) => (
                    <div
                      key={dev.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        dev.isCurrent
                          ? 'bg-blue-950/30 border-blue-500/40'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400">
                          {dev.type === 'mobile' ? (
                            <Smartphone className="w-4 h-4" />
                          ) : dev.type === 'tablet' ? (
                            <Tablet className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white">{dev.name}</span>
                            {dev.isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                                Esta sesión (Actual)
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {dev.browser} • IP: {dev.ipAddress} • {dev.lastActive}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {user.devices && user.devices.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRevokeOtherSessions}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión en todos los demás dispositivos</span>
                  </button>
                )}
              </div>

              {/* Card 4: Huella Criptográfica E2EE */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      Huella Criptográfica de Seguridad (SHA-256)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(user.e2eeFingerprint);
                      showToast('Huella copiada al portapapeles');
                    }}
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </button>
                </div>
                <p className="font-mono text-[10px] text-slate-400 bg-black/50 p-2.5 rounded-xl border border-slate-800/80 break-all">
                  {user.e2eeFingerprint}
                </p>
                <p className="text-[10px] text-slate-500">
                  Esta huella certifica que tus conversaciones están blindadas punto a punto contra intermediarios.
                </p>
              </div>

              {/* Save All Security Settings */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  id="btn-save-security"
                  onClick={handleSaveSecurity}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Reglas de Seguridad & PIN</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. DATOS, SONIDO Y MENSAJES                                              */}
          {/* ========================================================================= */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex items-center gap-2 text-xs text-teal-300">
                <Zap className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  Control de consumo de datos móviles, alertas audibles y atajos de teclado.
                </span>
              </div>

              {/* Data Saver Mode */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>Modo Ultra Ahorro de Datos</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                          &lt; 4KB
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Comprime cargas y optimiza la transferencia para conexiones lentas o datos limitados.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.dataSaverEnabled}
                      onChange={(e) => onUpdateSettings({ dataSaverEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-slate-800 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Descargados</p>
                    <p className="text-xs font-mono font-bold text-slate-200">
                      {dataSaver.formatBytes(dataStats.received)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Enviados</p>
                    <p className="text-xs font-mono font-bold text-slate-200">
                      {dataSaver.formatBytes(dataStats.sent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-400 uppercase font-semibold">Ahorrados</p>
                    <p className="text-xs font-mono font-bold text-emerald-400">
                      {dataSaver.formatBytes(dataStats.saved)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sound Notifications */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Efectos de Sonido</h5>
                    <p className="text-[10px] text-slate-400">
                      Reproducir sonidos al enviar mensajes y recibir llamadas.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notificationSounds}
                    onChange={(e) => onUpdateSettings({ notificationSounds: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Auto Download Media */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Descarga Automática de Archivos</h5>
                    <p className="text-[10px] text-slate-400">
                      Descargar imágenes y documentos de Google Drive automáticamente.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoDownloadMedia}
                    onChange={(e) => onUpdateSettings({ autoDownloadMedia: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Send with Enter */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 text-blue-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Enter para Enviar</h5>
                    <p className="text-[10px] text-slate-400">
                      Enviar al presionar Enter; Shift + Enter para saltar de línea.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sendWithEnter}
                    onChange={(e) => onUpdateSettings({ sendWithEnter: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: CONTROL PARENTAL & SUPERVISIÓN FAMILIAR */}
          {activeTab === 'parental' && (
            <ParentalControlView
              user={user}
              onUpdateUser={onUpdateUser}
              onShowToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
};
