import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  PhoneCall,
  Briefcase,
  Settings,
  ShieldCheck,
  Zap,
  LogOut,
  QrCode,
  Sparkles,
  Laptop,
  Gamepad2,
  Compass,
  ChevronRight,
  Smartphone,
  User,
  Sliders,
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
  onOpenPcMultiAccount,
  onLogout,
  themeSettings,
  isChatOpenOnMobile = false,
}) => {
  const palette = getThemePalette(themeSettings);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const isSpacesActive =
    activeTab === 'spaces' || activeTab === 'channels_status' || activeTab === 'communities';

  return (
    <>
      {/* 1. DESKTOP VERTICAL SIDEBAR (Compact, non-overflowing & ultra-clean) */}
      <aside
        id="nexus-sidebar-nav"
        className="hidden md:flex w-16 md:w-20 flex-col items-center justify-between py-3 border-r transition-colors z-20 shrink-0 select-none overflow-y-auto no-scrollbar max-h-screen relative"
        style={{
          backgroundColor: palette.navBg,
          borderColor: palette.navBorder,
        }}
      >
        {/* Top Branding & Main Hubs */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* Logo with Nexus Brand Identity */}
          <div
            id="nexus-app-logo"
            className="relative group cursor-pointer flex items-center justify-center w-11 h-11 transition-all hover:scale-105"
            onClick={() => onTabChange('chats')}
            title="Nexus E2EE Universal"
          >
            <NexusLogo size="sm" showText={false} isBusiness={user.accountType === 'business'} />
          </div>

          {/* Ultra Data Saver Badge */}
          {themeSettings.dataSaverEnabled && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-medium"
              title="Modo Ultra Ahorro de Datos activo"
            >
              <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
              <span className="hidden md:inline">Lite</span>
            </div>
          )}

          {/* Primary Navigation Hubs (Fused to eliminate screen bugs) */}
          <nav className="flex flex-col items-center gap-1.5 w-full px-2 mt-1">
            {/* 1. Chats & Mensajes Directos */}
            <button
              id="nav-btn-chats"
              onClick={() => onTabChange('chats')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'chats'
                  ? 'text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              style={{
                backgroundColor: activeTab === 'chats' ? palette.accentBg : undefined,
              }}
              title="Chats & Mensajes E2EE"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* 2. Espacios Nexus (Canales de avisos, Estados de 24h & Comunidades) */}
            <button
              id="nav-btn-spaces"
              onClick={() => onTabChange('spaces')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                isSpacesActive
                  ? 'bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title="Espacios Nexus (Canales de Difusión, Estados 24h y Comunidades de Voz)"
            >
              <Compass className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* 3. Nexus Arcade Lounge */}
            <button
              id="nav-btn-arcade"
              onClick={() => onTabChange('arcade')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'arcade'
                  ? 'bg-gradient-to-tr from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title="Nexus Arcade Lounge (Trivia, Palabra Secreta, Conecta 4, Retos)"
            >
              <Gamepad2 className="w-5 h-5" />
            </button>

            {/* 4. Nexus Workspace & Archivos */}
            <button
              id="nav-btn-workspace"
              onClick={() => onTabChange('workspace')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title="Workspace & Archivos (Notas, Tablas, Código y Documentos descargables)"
            >
              <Briefcase className="w-5 h-5" />
            </button>

            {/* 5. Historial de Llamadas & Meet */}
            <button
              id="nav-btn-calls"
              onClick={() => onTabChange('calls')}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'calls'
                  ? 'text-white shadow-sm ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              style={{
                backgroundColor: activeTab === 'calls' ? palette.accentBg : undefined,
              }}
              title="Historial de llamadas & Reuniones Meet"
            >
              <PhoneCall className="w-5 h-5" />
            </button>
          </nav>
        </div>

        {/* Bottom Section: Gemini AI Super-Pill, Direct Settings & Unified User Command Capsule */}
        <div className="flex flex-col items-center gap-2 w-full px-2 pt-2 border-t border-slate-800/60">
          {/* Direct Settings & Appearance Button */}
          <button
            id="nav-btn-settings"
            onClick={onOpenSettingsModal}
            className="relative flex items-center justify-center w-11 h-11 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all group cursor-pointer"
            title="Ajustes y Personalización (Temas, Fondo, Sonidos, Privacidad)"
          >
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          </button>

          {/* Gemini AI Super-Assistant Button */}
          <button
            id="nav-btn-ai-assistant"
            onClick={onOpenAiModal}
            className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-blue-600/30 text-purple-300 border border-purple-500/40 hover:border-purple-400 hover:bg-purple-600/40 transition-all group cursor-pointer shadow-md shadow-purple-900/20"
            title="Nexus Gemini AI (Resumen, Tareas, Borradores, Traductor)"
          >
            <Sparkles className="w-5 h-5 text-purple-300 group-hover:scale-110 transition-transform" />
          </button>

          {/* Unified User Profile & Command Capsule */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="nav-user-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="relative p-0.5 rounded-full border-2 border-slate-700 hover:border-emerald-500 transition-all cursor-pointer group focus:outline-none"
              title={`${user.displayName} - Clic para abrir Menú Nexus de Cuenta y Ajustes`}
            >
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-9 h-9 rounded-full object-cover group-hover:scale-105 transition-transform"
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
            </button>

            {/* Desktop Anchored User Command Popover */}
            {showUserMenu && (
              <div
                className="absolute left-16 bottom-0 w-72 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-left-2 duration-150 text-slate-200"
                style={{
                  backgroundColor: themeSettings.mode === 'light' ? '#ffffff' : undefined,
                  borderColor: themeSettings.mode === 'light' ? '#e2e8f0' : undefined,
                  color: themeSettings.mode === 'light' ? '#0f172a' : undefined,
                }}
              >
                {/* Header: User Info */}
                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-2.5">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/50"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs truncate">{user.displayName}</span>
                      {user.accountType === 'business' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Empresa
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Cifrado E2EE Activo</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions List */}
                <div className="flex flex-col gap-1 text-xs">
                  {/* Configuración de Cuenta & Perfil */}
                  <button
                    id="btn-user-menu-account"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfileModal?.();
                    }}
                    className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-200">Configuración de Cuenta</span>
                        <span className="text-[10px] text-slate-400">Perfil, avatar, nombre y PIN</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>

                  {/* Ajustes de Tema, Sonidos y Ahorro */}
                  <button
                    id="btn-user-menu-settings"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSettingsModal();
                    }}
                    className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                        <Sliders className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-200">Ajustes & Personalización</span>
                        <span className="text-[10px] text-slate-400">Temas, ultra ahorro y privacidad</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>

                  {/* Multicuentas PC */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenPcMultiAccount?.();
                    }}
                    className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                        <Laptop className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-200">Multicuentas PC</span>
                        <span className="text-[10px] text-slate-400">Alternar o agregar cuentas</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>

                  {/* Vincular Dispositivo & QR */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenShareModal();
                    }}
                    className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
                        <QrCode className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-200">Código QR & Vincular</span>
                        <span className="text-[10px] text-slate-400">Compartir o enlazar móvil</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>

                  {/* Dispositivos Conectados E2EE */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenDevicesModal();
                    }}
                    className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-200">Dispositivos E2EE</span>
                        <span className="text-[10px] text-slate-400">Llaves de cifrado activas</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>
                </div>

                {/* Logout Button */}
                <div className="pt-2 mt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar sesión actual</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR (Spacious, 5 thumb-friendly tabs with zero crowding) */}
      {!isChatOpenOnMobile && (
        <nav
          id="nexus-mobile-bottom-nav"
          className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-30 flex items-center justify-around px-1 border-t backdrop-blur-xl shadow-2xl select-none"
          style={{
            backgroundColor: palette.navBg,
            borderColor: palette.navBorder,
          }}
        >
          {/* 1. Chats */}
          <button
            id="mobile-nav-chats"
            onClick={() => onTabChange('chats')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              activeTab === 'chats' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-10 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'chats' ? palette.accentBg : 'transparent',
              }}
            >
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Chats</span>
          </button>

          {/* 2. Espacios Nexus (Canales & Comunidades) */}
          <button
            id="mobile-nav-spaces"
            onClick={() => onTabChange('spaces')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              isSpacesActive ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-10 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: isSpacesActive ? '#059669' : 'transparent',
              }}
            >
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Espacios</span>
          </button>

          {/* 3. Llamadas & Meet */}
          <button
            id="mobile-nav-calls"
            onClick={() => onTabChange('calls')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              activeTab === 'calls' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-10 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'calls' ? palette.accentBg : 'transparent',
              }}
            >
              <PhoneCall className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Llamadas</span>
          </button>

          {/* 4. Workspace */}
          <button
            id="mobile-nav-workspace"
            onClick={() => onTabChange('workspace')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[48px] cursor-pointer ${
              activeTab === 'workspace' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <div
              className="w-10 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: activeTab === 'workspace' ? '#0891b2' : 'transparent',
              }}
            >
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Docs</span>
          </button>

          {/* 5. Tú / Menú de Control */}
          <button
            id="mobile-nav-profile-menu"
            onClick={() => setShowUserMenu(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 hover:text-white transition-colors min-h-[48px] cursor-pointer"
          >
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-5 h-5 rounded-full object-cover border border-slate-600"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${
                  user.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
              />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Tú</span>
          </button>
        </nav>
      )}

      {/* Mobile Drawer Backdrop & Modal Sheet for "Tú" */}
      {showUserMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 w-full max-h-[85vh] overflow-y-auto select-none"
            style={{
              backgroundColor: themeSettings.mode === 'light' ? '#ffffff' : undefined,
              borderColor: themeSettings.mode === 'light' ? '#e2e8f0' : undefined,
            }}
          >
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4" />

            {/* User Profile Info */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-4">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/50"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{user.displayName}</span>
                  {user.accountType === 'business' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Empresa
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">@{user.username}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cifrado E2EE Activado</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-1.5 text-sm mb-4">
              {/* Configuración de Cuenta & Perfil */}
              <button
                id="btn-mobile-account-config"
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenProfileModal?.();
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 font-semibold cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span>Configuración de Cuenta & Perfil</span>
              </button>

              {/* Ajustes y Personalización */}
              <button
                id="btn-mobile-settings-config"
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenSettingsModal();
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 font-semibold cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <span>Ajustes & Personalización</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenPcMultiAccount?.();
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 font-semibold cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                <span>Multicuentas PC</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenShareModal();
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 font-semibold cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <span>Código QR y Compartir</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenDevicesModal();
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 font-semibold cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span>Dispositivos E2EE</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenAiModal();
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Nexus Gemini AI</span>
              </button>
            </div>

            {/* Logout & Close */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout?.();
                }}
                className="flex-1 py-3 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer"
              >
                Cerrar Sesión
              </button>
              <button
                type="button"
                onClick={() => setShowUserMenu(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
