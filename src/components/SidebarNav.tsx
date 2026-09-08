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
} from 'lucide-react';
import { UserProfile, ThemeSettings } from '../types';
import { getThemePalette } from '../lib/themePresets';

interface SidebarNavProps {
  activeTab: 'chats' | 'calls' | 'workspace';
  onTabChange: (tab: 'chats' | 'calls' | 'workspace') => void;
  user: UserProfile;
  onOpenShareModal: () => void;
  onOpenDevicesModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenProfileModal?: () => void;
  onOpenAiModal: () => void;
  onOpenAuthModal: () => void;
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
        <div className="flex flex-col items-center gap-4 w-full">
          <div
            id="nexus-app-logo"
            className="relative group cursor-pointer flex items-center justify-center w-11 h-11 rounded-2xl text-white shadow-md transition-all hover:scale-105"
            style={{
              backgroundColor: palette.accentBg,
            }}
            onClick={() => onTabChange('chats')}
            title="Nexus Chat & Team Hub"
          >
            <span className="font-bold text-xl tracking-wider">N</span>
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[8px]"
              title="E2EE Cifrado Activo"
            >
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </div>
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
          <nav className="flex flex-col items-center gap-2 w-full px-2 mt-2">
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
              title="Chats"
            >
              <MessageSquare className="w-5 h-5" />
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

            {/* Google Workspace Hub */}
            <button
              id="nav-btn-workspace"
              onClick={() => onTabChange('workspace')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all ${
                activeTab === 'workspace'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title="Google Workspace Hub (11 Apps: Gmail, Drive, Calendar, Docs, etc.)"
            >
              <Briefcase className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
            </button>

            {/* Gemini AI Floating Super-Assistant */}
            <button
              id="nav-btn-ai-assistant"
              onClick={onOpenAiModal}
              className="relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-blue-600/20 text-purple-400 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-600/30 transition-all group"
              title="Asistente Gemini AI (Resumen, Tareas, Borradores)"
            >
              <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            </button>

            {/* QR Code & Share Profile */}
            <button
              id="nav-btn-share-qr"
              onClick={onOpenShareModal}
              className="relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all"
              title="Código QR y Compartir Cuenta"
            >
              <QrCode className="w-5 h-5" />
            </button>

            {/* Dispositivos Multidispositivo */}
            <button
              id="nav-btn-devices"
              onClick={onOpenDevicesModal}
              className="relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all"
              title="Sincronización Multidispositivo & Claves E2EE"
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </nav>
        </div>

        {/* Bottom Controls & User Profile */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {/* Settings */}
          <button
            id="nav-btn-settings"
            onClick={onOpenSettingsModal}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all cursor-pointer"
            title="Ajustes de Tema, Ahorro de Datos y Cifrado"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Profile Avatar with Online Status */}
          <div
            id="nav-user-avatar"
            onClick={onOpenProfileModal || onOpenSettingsModal}
            className="relative cursor-pointer group"
            title={`${user.displayName} (@${user.username}) - Clic para personalizar perfil, avatar y colores`}
          >
            <img
              src={user.avatar}
              alt={user.displayName}
              className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 group-hover:border-blue-500 transition-colors"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
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

          {/* Switch account / Auth button */}
          <button
            id="nav-btn-logout"
            onClick={onOpenAuthModal}
            className="text-slate-500 hover:text-blue-400 transition-colors p-1 cursor-pointer"
            title="Cambiar de cuenta o iniciar sesión"
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
              className="w-10 h-7 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'chats' ? palette.accentBg : 'transparent',
              }}
            >
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Chats</span>
          </button>

          {/* Llamadas */}
          <button
            id="mobile-nav-calls"
            onClick={() => onTabChange('calls')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              activeTab === 'calls' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-10 h-7 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'calls' ? palette.accentBg : 'transparent',
              }}
            >
              <PhoneCall className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Llamadas</span>
          </button>

          {/* Workspace Hub */}
          <button
            id="mobile-nav-workspace"
            onClick={() => onTabChange('workspace')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              activeTab === 'workspace' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-10 h-7 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'workspace' ? '#4f46e5' : 'transparent',
              }}
            >
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Workspace</span>
          </button>

          {/* Gemini AI */}
          <button
            id="mobile-nav-ai"
            onClick={onOpenAiModal}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-purple-400 transition-colors min-h-[48px] cursor-pointer"
          >
            <div className="w-10 h-7 rounded-full flex items-center justify-center bg-purple-500/15">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Gemini</span>
          </button>

          {/* Ajustes */}
          <button
            id="mobile-nav-settings"
            onClick={onOpenSettingsModal}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 hover:text-white transition-colors min-h-[48px] cursor-pointer"
          >
            <div className="w-10 h-7 rounded-full flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Ajustes</span>
          </button>

          {/* Perfil */}
          <button
            id="mobile-nav-profile"
            onClick={onOpenProfileModal || onOpenSettingsModal}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 hover:text-white transition-colors min-h-[48px] cursor-pointer"
          >
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-6 h-6 rounded-full object-cover border border-slate-700"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${
                  user.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Perfil</span>
          </button>
        </nav>
      )}
    </>
  );
};
