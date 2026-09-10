import React from 'react';
import {
  MessageSquare,
  PhoneCall,
  Briefcase,
  Share2,
  Smartphone,
  Settings,
  ShieldCheck,
  Zap,
  LogOut,
  QrCode,
  Sparkles,
  Laptop,
  Radio,
  Users,
  Gamepad2,
} from 'lucide-react';
import { UserProfile, ThemeSettings, AppTab } from '../types';
import { getThemePalette } from '../lib/themePresets';
import { NexusLogo } from './NexusLogo';

interface SidebarNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user: UserProfile;
  onOpenShareModal: () => void;
  onOpenDevicesModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenProfileModal?: () => void;
  onOpenAiModal: () => void;
  onOpenAuthModal: () => void;
  onOpenPcMultiAccount?: () => void;
  onLogout?: () => void;
  themeSettings: ThemeSettings;
  isChatOpenOnMobile?: boolean;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
  user,
  onOpenShareModal,
  onOpenDevicesModal,
  onOpenSettingsModal,
  onOpenProfileModal,
  onOpenAiModal,
  onOpenAuthModal,
  onOpenPcMultiAccount,
  onLogout,
  themeSettings,
  isChatOpenOnMobile = false,
}) => {
  const palette = getThemePalette(themeSettings);

  return (
    <>
      {/* 1. DESKTOP VERTICAL SIDEBAR (Visible on md and larger screens) */}
      <aside
        id="nexus-sidebar-nav"
        className="hidden md:flex w-16 md:w-20 flex-col items-center justify-between py-4 border-r transition-colors z-20 shrink-0 select-none"
        style={{
          backgroundColor: palette.navBg,
          borderColor: palette.navBorder,
        }}
      >
        {/* Top Branding & Logo */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div
            id="nexus-app-logo"
            className="relative group cursor-pointer flex items-center justify-center w-11 h-11 transition-all hover:scale-105"
            onClick={() => onTabChange('chats')}
            title="Nexus Comunicación Universal & E2EE"
          >
            <NexusLogo size="sm" showText={false} isBusiness={user.accountType === 'business'} />
          </div>

          {/* Ultra Data Saver Badge */}
          {themeSettings.dataSaverEnabled && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium"
              title="Modo Ultra Ahorro de Datos activo"
            >
              <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
              <span className="hidden md:inline">Lite</span>
            </div>
          )}

          {/* Main Navigation Items */}
          <nav className="flex flex-col items-center gap-1.5 w-full px-2 mt-1">
            {/* Chats */}
            <button
              id="nav-btn-chats"
              onClick={() => onTabChange('chats')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'chats'
                  ? 'text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              style={{
                backgroundColor: activeTab === 'chats' ? palette.accentBg : undefined,
              }}
              title="Chats & Mensajes E2EE"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Canales & Estados (Stories 24h & Canales de Avisos) */}
            <button
              id="nav-btn-channels-status"
              onClick={() => onTabChange('channels_status')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'channels_status'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title="Canales de Avisos & Estados de 24h"
            >
              <Radio className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Comunidades & Servidores (WhatsApp Communities + Discord Servers) */}
            <button
              id="nav-btn-communities"
              onClick={() => onTabChange('communities')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'communities'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title="Comunidades & Servidores (Discord & WhatsApp)"
            >
              <Users className="w-5 h-5" />
            </button>

            {/* Nexus Arcade Lounge (Juegos & Retos) */}
            <button
              id="nav-btn-arcade"
              onClick={() => onTabChange('arcade')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'arcade'
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title="Nexus Arcade Lounge (Trivia, Palabra Secreta, Conecta 4, Retos)"
            >
              <Gamepad2 className="w-5 h-5" />
            </button>

            {/* Workspace & Archivos */}
            <button
              id="nav-btn-workspace"
              onClick={() => onTabChange('workspace')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title="Workspace & Archivos (Crear notas, tablas, código y descargar archivos)"
            >
              <Briefcase className="w-5 h-5" />
            </button>

            {/* Historial de llamadas */}
            <button
              id="nav-btn-calls"
              onClick={() => onTabChange('calls')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'calls'
                  ? 'text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              style={{
                backgroundColor: activeTab === 'calls' ? palette.accentBg : undefined,
              }}
              title="Historial de llamadas"
            >
              <PhoneCall className="w-5 h-5" />
            </button>

            {/* Gemini AI Floating Super-Assistant */}
            <button
              id="nav-btn-ai-assistant"
              onClick={onOpenAiModal}
              className="relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-blue-600/20 text-purple-400 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-600/30 transition-all group cursor-pointer"
              title="Asistente Gemini AI (Resumen, Tareas, Borradores)"
            >
              <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            </button>
          </nav>
        </div>

        {/* Bottom Controls & User Profile */}
        <div className="flex flex-col items-center gap-2.5 w-full px-2">
          {/* QR Code & Share Profile */}
          <button
            id="nav-btn-share-qr"
            onClick={onOpenShareModal}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all cursor-pointer"
            title="Código QR y Compartir Cuenta"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            id="nav-btn-settings"
            onClick={onOpenSettingsModal}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all cursor-pointer"
            title="Ajustes de Tema, Ahorro de Datos y Cifrado"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* PC Multi-Account Switcher */}
          <button
            id="nav-btn-pc-multiaccount"
            type="button"
            onClick={onOpenPcMultiAccount}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800/60 transition-all cursor-pointer group"
            title="Multicuentas PC (Añadir o alternar cuentas en este equipo sin cerrar la sesión actual)"
          >
            <Laptop className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-full bg-blue-500/30 text-blue-300 border border-blue-500/40">
              PC
            </span>
          </button>

          {/* User Profile Avatar with Online Status */}
          <div
            id="nav-user-avatar"
            onClick={onOpenProfileModal || onOpenSettingsModal}
            className="relative cursor-pointer group"
            title={`${user.displayName} (@${user.username}) - Clic para personalizar perfil`}
          >
            <img
              src={user.avatar}
              alt={user.displayName}
              className="w-9 h-9 rounded-full object-cover border-2 border-slate-700 group-hover:border-blue-500 transition-colors"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                user.status === 'online'
                  ? 'bg-emerald-500'
                  : user.status === 'busy'
                  ? 'bg-rose-500'
                  : user.status === 'away'
                  ? 'bg-amber-500'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          {/* Logout */}
          <button
            id="nav-btn-logout"
            type="button"
            onClick={onLogout}
            className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800/40 cursor-pointer"
            title="Cerrar sesión actual e ir a iniciar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly on phones, hidden when inside active chat) */}
      {!isChatOpenOnMobile && (
        <nav
          id="nexus-mobile-bottom-nav"
          className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-30 flex items-center justify-around px-1 border-t backdrop-blur-xl shadow-2xl select-none"
          style={{
            backgroundColor: palette.navBg,
            borderColor: palette.navBorder,
          }}
        >
          {/* Chats */}
          <button
            id="mobile-nav-chats"
            onClick={() => onTabChange('chats')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              activeTab === 'chats' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-9 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'chats' ? palette.accentBg : 'transparent',
              }}
            >
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-semibold mt-0.5">Chats</span>
          </button>

          {/* Canales & Estados */}
          <button
            id="mobile-nav-channels-status"
            onClick={() => onTabChange('channels_status')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              activeTab === 'channels_status' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-9 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'channels_status' ? '#059669' : 'transparent',
              }}
            >
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-semibold mt-0.5">Canales</span>
          </button>

          {/* Comunidades */}
          <button
            id="mobile-nav-communities"
            onClick={() => onTabChange('communities')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              activeTab === 'communities' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-9 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'communities' ? '#4f46e5' : 'transparent',
              }}
            >
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-semibold mt-0.5">Comunidad</span>
          </button>

          {/* Arcade */}
          <button
            id="mobile-nav-arcade"
            onClick={() => onTabChange('arcade')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              activeTab === 'arcade' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-9 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'arcade' ? '#d97706' : 'transparent',
              }}
            >
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-semibold mt-0.5">Arcade</span>
          </button>

          {/* Workspace */}
          <button
            id="mobile-nav-workspace"
            onClick={() => onTabChange('workspace')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              activeTab === 'workspace' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-9 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'workspace' ? '#0891b2' : 'transparent',
              }}
            >
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-semibold mt-0.5">Docs</span>
          </button>

          {/* Ajustes */}
          <button
            id="mobile-nav-settings"
            onClick={onOpenSettingsModal}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 hover:text-white transition-colors min-h-[48px] cursor-pointer"
          >
            <div className="w-9 h-6 rounded-full flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-semibold mt-0.5">Ajustes</span>
          </button>
        </nav>
      )}
    </>
  );
};
