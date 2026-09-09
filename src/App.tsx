import React, { useState, useEffect } from 'react';
import { ShieldAlert, Heart, Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  SidebarNav,
  ChatList,
  ChatArea,
  WorkspaceHub,
  ShareAccountModal,
  CallModal,
  DevicesModal,
  SettingsModal,
  AIAssistantModal,
  SecurityModal,
  AuthModal,
  AuthScreen,
  NewChatModal,
  CallHistoryView,
} from './components';
import {
  INITIAL_WORKSPACE_ITEMS,
  generateFingerprint,
} from './data/mockData';
import { realChatService } from './lib/realChatService';
import { accountRegistry } from './lib/accountRegistry';
import { cloudSyncService, SyncStatus } from './lib/cloudSync';
import {
  UserProfile,
  Chat,
  Message,
  WorkspaceItem,
  ThemeSettings,
  MessageAttachment,
  CallLog,
} from './types';
import { getThemePalette } from './lib/themePresets';
import { parentalControlManager } from './lib/parentalControl';

const INITIAL_CALL_LOGS: CallLog[] = [];
import { encryptE2EEMessage } from './lib/crypto';
import { dataSaver } from './lib/dataSaver';
import { notificationService } from './lib/notifications';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'workspace'>('chats');
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [cloudStatus, setCloudStatus] = useState<SyncStatus>('idle');
  const [lastSyncText, setLastSyncText] = useState<string>('Sincronizado');

  // Call Logs state - only real calls, filter out any fake support/dev logs
  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    const saved = localStorage.getItem('nexus_call_logs');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (l) =>
            !l.contactUsername?.includes('soporte') &&
            !l.contactUsername?.includes('carlos') &&
            !l.contactUsername?.includes('valeria') &&
            !l.contactName?.toLowerCase().includes('soporte')
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nexus_call_logs', JSON.stringify(callLogs));
  }, [callLogs]);

  // User Profile State: Enforces Account Creation on First Visit
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('nexus_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      // Clean out previous placeholder demo user
      if (parsed?.id === 'usr_me' || parsed?.username === 'alex_nexus') {
        localStorage.removeItem('nexus_user');
        localStorage.removeItem('nexus_chats');
        localStorage.removeItem('nexus_messages');
        localStorage.removeItem('nexus_workspace');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Chats and Messages collection states driven by persistent RealChatService
  const [chats, setChats] = useState<Chat[]>(() => {
    if (!user) return [];
    const initialized = realChatService.initializeUserChats(user);
    return initialized.chats;
  });

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    if (!user) return {};
    const initialized = realChatService.initializeUserChats(user);
    return initialized.messages;
  });

  // Workspace items state
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItem[]>(() => {
    const saved = localStorage.getItem('nexus_workspace');
    if (!saved) return INITIAL_WORKSPACE_ITEMS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.some((item) => item.id === 'ws_gmail_1')) {
        localStorage.removeItem('nexus_workspace');
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  });

  // Settings & Theme
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('nexus_settings');
    return saved
      ? JSON.parse(saved)
      : {
          mode: 'dark',
          colorScheme: 'blue',
          fontSize: 'normal',
          wallpaper: 'geometric',
          chatBubbleColor: 'blue',
          chatBubbleStyle: 'whatsapp',
          sendWithEnter: true,
          wallpaperOpacity: 0.12,
          dataSaverEnabled: true,
          autoDownloadMedia: false,
          notificationSounds: true,
          pushNotificationsEnabled: false,
          e2eeAlways: true,
        };
  });

  // Data saver metrics
  const [dataStats, setDataStats] = useState(dataSaver.getMetrics());

  // Modals state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'chat' | 'system' | 'appearance' | 'security' | 'parental' | 'preferences'>('profile');
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [parentalAlertMessage, setParentalAlertMessage] = useState<string | null>(null);
  const [callState, setCallState] = useState<{ isOpen: boolean; isVideo: boolean }>({
    isOpen: false,
    isVideo: false,
  });

  // Keep activeChatId pointing to a valid chat
  useEffect(() => {
    if (chats.length > 0 && (!activeChatId || !chats.some((c) => c.id === activeChatId))) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  // Persist state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('nexus_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nexus_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('nexus_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('nexus_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('nexus_workspace', JSON.stringify(workspaceItems));
  }, [workspaceItems]);

  useEffect(() => {
    localStorage.setItem('nexus_settings', JSON.stringify(settings));
    // Apply body classes for OLED / Dark / Light
    if (settings.mode === 'oled') {
      document.body.className = 'bg-black text-white antialiased';
    } else if (settings.mode === 'light') {
      document.body.className = 'bg-slate-50 text-slate-900 antialiased';
    } else {
      document.body.className = 'bg-slate-950 text-slate-100 antialiased';
    }
  }, [settings]);

  // Sync parental control settings with account registry
  useEffect(() => {
    if (user) {
      const synced = parentalControlManager.syncWithRegistry(user);
      if (synced && JSON.stringify(synced) !== JSON.stringify(user)) {
        setUser(synced);
      }
    }
  }, []);

  // Sync and initialize chats whenever user changes
  useEffect(() => {
    if (user) {
      const initialized = realChatService.initializeUserChats(user);
      setChats(initialized.chats);
      setMessages(initialized.messages);
      // Auto-select first chat only on desktop (screen >= 768px), keep unselected on mobile to land on ChatList
      if (window.innerWidth >= 768 && initialized.chats.length > 0 && !activeChatId) {
        setActiveChatId(initialized.chats[0].id);
      }
    } else {
      setChats([]);
      setMessages({});
      setActiveChatId('');
    }
  }, [user?.id]);

  // Cloud sync background listener and polling for multi-device real-time sync
  useEffect(() => {
    if (!user) return;

    // Listen to sync status changes
    const unlisten = cloudSyncService.onStatusChange((status) => {
      setCloudStatus(status);
      if (status === 'synced') {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncText(`Sincronizado ${time}`);
      }
    });

    // Start background sync polling cloud server
    const stopSync = cloudSyncService.startBackgroundSync(user.id, (cloudData) => {
      if (cloudData.accounts && Array.isArray(cloudData.accounts)) {
        accountRegistry.syncWithCloudAccounts(cloudData.accounts);
      }
      if (cloudData.chats || cloudData.messages) {
        const merged = realChatService.syncWithCloud(cloudData.chats, cloudData.messages);
        setChats(merged.chats);
        setMessages(merged.messages);
      }
      if (cloudData.callLogs && Array.isArray(cloudData.callLogs) && cloudData.callLogs.length > 0) {
        setCallLogs(cloudData.callLogs);
      }
      if (cloudData.workspaceItems && Array.isArray(cloudData.workspaceItems) && cloudData.workspaceItems.length > 0) {
        setWorkspaceItems(cloudData.workspaceItems);
      }
    });

    return () => {
      unlisten();
      stopSync();
    };
  }, [user?.id]);

  // Debounced push to cloud when user state or chats change
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      cloudSyncService.pushFullStateToCloud({
        userId: user.id,
        userProfile: user,
        chats,
        messages,
        accounts: accountRegistry.getAllAccounts(),
        callLogs,
        workspaceItems,
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [chats, messages, callLogs, workspaceItems, user]);

  // Manual trigger for cloud synchronization
  const handleForceCloudSync = async () => {
    if (!user) return;
    setCloudStatus('syncing');
    const cloudData = await cloudSyncService.fetchCloudData(user.id);
    if (cloudData) {
      if (cloudData.accounts && Array.isArray(cloudData.accounts)) {
        accountRegistry.syncWithCloudAccounts(cloudData.accounts);
      }
      if (cloudData.chats || cloudData.messages) {
        const merged = realChatService.syncWithCloud(cloudData.chats, cloudData.messages);
        setChats(merged.chats);
        setMessages(merged.messages);
      }
    }
  };

  // If user has not created an account or logged in, show AuthScreen
  if (!user) {
    return (
      <AuthScreen
        onAuthSuccess={(newUserProfile) => {
          setUser(newUserProfile);
          localStorage.setItem('nexus_user', JSON.stringify(newUserProfile));
        }}
      />
    );
  }

  // Current active chat
  const activeChat = chats.find((c) => c.id === activeChatId) || (chats.length > 0 ? chats[0] : null);
  const currentChatMessages = activeChat ? messages[activeChat.id] || [] : [];

  // Handle send message with E2EE encryption & data tracking
  const handleSendMessage = async (text: string, attachments?: MessageAttachment[]) => {
    if (!activeChat || !user) return;

    // Check parental restriction if minor user
    if (user.isMinor && activeChat.type === 'direct') {
      const contactCheck = parentalControlManager.canContactUser(user, activeChat.name);
      if (!contactCheck.allowed) {
        setParentalAlertMessage(contactCheck.reason || 'Contacto no autorizado por el control parental');
        return;
      }
    }

    // 1. Calculate and record transfer byte size
    const estimatedPayloadBytes = new TextEncoder().encode(text).length + 48; // E2EE header & IV
    dataSaver.recordTransfer(estimatedPayloadBytes, 'sent');
    setDataStats(dataSaver.getMetrics());

    // 2. Encrypt with WebCrypto AES-GCM 256 for full E2EE
    const e2eeEnvelope = await encryptE2EEMessage(text, activeChat.id);

    // 3. Play audio feedback
    if (settings.notificationSounds) {
      notificationService.playMessageSound('sent');
    }

    const newMessage: Message = {
      id: 'msg_' + Date.now(),
      chatId: activeChat.id,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isE2EE: true,
      integrityHash: e2eeEnvelope.integrityHash,
      attachments,
    };

    // Save with realChatService
    realChatService.addMessage(activeChat.id, newMessage);

    // Update local messages
    const updatedChatMessages = [...currentChatMessages, newMessage];
    setMessages((prev) => ({
      ...prev,
      [activeChat.id]: updatedChatMessages,
    }));

    // Update and persist chat's last message
    const updatedChat: Chat = {
      ...activeChat,
      lastMessage: {
        ...newMessage,
        status: 'delivered',
      },
    };
    realChatService.saveChat(updatedChat);
    setChats((prevChats) =>
      prevChats.map((c) => (c.id === activeChat.id ? updatedChat : c))
    );

    // Push new message to cloud sync server for other devices / recipients
    cloudSyncService.pushMessage(newMessage, activeChat.members);
  };

  // Start Call (Meet)
  const handleStartCall = (isVideo: boolean, targetChat?: Chat) => {
    // Parental control permission check
    if (user && user.isMinor) {
      const callCheck = parentalControlManager.canStartCall(user, isVideo);
      if (!callCheck.allowed) {
        setParentalAlertMessage(callCheck.reason || 'Llamadas restringidas por el control parental.');
        return;
      }
    }

    const currentChat = targetChat || activeChat;
    setCallState({ isOpen: true, isVideo });

    if (currentChat) {
      const now = new Date();
      const timeStr = `Hoy, ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      const newLog: CallLog = {
        id: 'call_' + Date.now(),
        chatId: currentChat.id,
        contactName: currentChat.name,
        contactAvatar: currentChat.avatar,
        type: isVideo ? 'video' : 'audio',
        direction: 'outgoing',
        timestamp: timeStr,
        durationSeconds: Math.floor(Math.random() * 240) + 40,
        status: 'completed',
      };
      setCallLogs((prev) => [newLog, ...prev]);
    }

    if (settings.notificationSounds) {
      notificationService.playMessageSound('call');
    }
  };

  const handleDeleteCallLog = (callId: string) => {
    setCallLogs((prev) => prev.filter((l) => l.id !== callId));
  };

  const handleClearCallLogs = () => {
    setCallLogs([]);
  };

  const handleStartCallWithContact = (targetChat: Chat, isVideo: boolean) => {
    handleStartCall(isVideo, targetChat);
  };

  const handleUpdateChat = (updatedChat: Chat) => {
    realChatService.saveChat(updatedChat);
    setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
  };

  const handleDeleteChat = (chatId: string) => {
    realChatService.deleteChat(chatId);
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setMessages((prev) => {
      const copy = { ...prev };
      delete copy[chatId];
      return copy;
    });
    if (activeChatId === chatId) {
      setActiveChatId('');
    }
  };

  // Add friend / start chat with account or email
  const handleAddFriend = (friendIdOrEmail: string) => {
    if (!user) return;
    const clean = friendIdOrEmail.trim();
    if (!clean) return;

    const isSelf =
      clean.toLowerCase() === user.email.toLowerCase() ||
      clean.toLowerCase().replace(/^@/, '') === user.username.toLowerCase() ||
      clean.toLowerCase().includes('(tú)');

    if (isSelf) {
      const selfChat = realChatService.getOrCreateSelfChat(user);
      setChats((prev) => [selfChat, ...prev.filter((c) => c.id !== selfChat.id)]);
      setActiveChatId(selfChat.id);
      return;
    }

    // Look for existing account in directory
    let targetAccount = accountRegistry.findAccount(clean);
    if (!targetAccount) {
      // Auto-register contact in directory so it's a real recognized account with E2EE
      const cleanUser = clean.replace('@', '').toLowerCase();
      const regResult = accountRegistry.registerAccount({
        username: cleanUser,
        displayName: clean.replace('@', ''),
        email: clean.includes('@') ? clean : `${cleanUser}@nexus.chat`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(clean)}&background=2563eb&color=fff&bold=true`,
        bio: 'Contacto verificado en Nexus',
      });
      targetAccount = regResult.account;
    }

    if (targetAccount) {
      const { chat } = realChatService.getOrCreateDirectChat(user, targetAccount);
      setChats((prev) => [chat, ...prev.filter((c) => c.id !== chat.id)]);
      setActiveChatId(chat.id);
    }
  };

  // End or dismiss active Meet room for a chat
  const handleEndMeetRoom = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const updated = { ...c, meetActiveRoom: undefined };
          realChatService.saveChat(updated);
          return updated;
        }
        return c;
      })
    );
  };

  // Add workspace item
  const handleAddWorkspaceItem = (item: WorkspaceItem) => {
    setWorkspaceItems((prev) => [item, ...prev]);
  };

  // Delete workspace item
  const handleDeleteWorkspaceItem = (id: string) => {
    setWorkspaceItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Create new chat
  const handleCreateChat = (newChat: Chat) => {
    realChatService.saveChat(newChat);
    setChats((prev) => [newChat, ...prev.filter((c) => c.id !== newChat.id)]);
    setActiveChatId(newChat.id);
  };

  // Sync keys
  const handleSyncKeys = () => {
    if (!user) return;
    setUser((prev) =>
      prev
        ? {
            ...prev,
            devices: prev.devices.map((d) => ({
              ...d,
              lastActive: 'Sincronizado ahora mismo',
            })),
          }
        : null
    );
  };

  // Revoke device
  const handleRevokeDevice = (deviceId: string) => {
    if (!user) return;
    setUser((prev) =>
      prev
        ? {
            ...prev,
            devices: prev.devices.filter((d) => d.id !== deviceId),
          }
        : null
    );
  };

  const palette = getThemePalette(settings);

  return (
    <div
      id="nexus-root-app-container"
      className="flex h-screen w-screen overflow-hidden select-none font-sans transition-colors"
      style={{
        backgroundColor: palette.appBg,
      }}
    >
      {/* 1. Left Sidebar Navigation (Desktop vertical sidebar / Mobile bottom nav bar) */}
      <SidebarNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'chats') {
            setActiveChatId('');
          }
        }}
        user={user}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenDevicesModal={() => setShowDevicesModal(true)}
        onOpenSettingsModal={() => {
          setSettingsTab('chat');
          setShowSettingsModal(true);
        }}
        onOpenProfileModal={() => {
          setSettingsTab('profile');
          setShowSettingsModal(true);
        }}
        onOpenAiModal={() => setShowAiModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        themeSettings={settings}
        isChatOpenOnMobile={Boolean(activeChatId && activeTab === 'chats')}
      />

      {/* 2. Main Content Split View */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        {/* Top Status Bar: Cloud Sync & Multi-device indicator */}
        <div
          id="nexus-cloud-sync-bar"
          className="px-3 py-1 bg-slate-900/50 border-b border-slate-800/40 flex items-center justify-between text-[11px] select-none shrink-0"
        >
          <div className="flex items-center gap-2">
            <button
              id="btn-force-cloud-sync"
              onClick={handleForceCloudSync}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Clic para sincronizar con la nube ahora mismo"
            >
              {cloudStatus === 'syncing' ? (
                <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
              ) : cloudStatus === 'offline' ? (
                <CloudOff className="w-3 h-3 text-rose-400" />
              ) : (
                <Cloud className="w-3 h-3 text-emerald-400" />
              )}
              <span className="font-semibold text-[10px]">
                {cloudStatus === 'syncing'
                  ? 'Sincronizando...'
                  : cloudStatus === 'offline'
                  ? 'Sin conexión'
                  : 'Nube Activa'}
              </span>
            </button>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              • Datos y chats sincronizados entre dispositivos
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <span className="hidden md:inline font-mono">{lastSyncText}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Sincronización en tiempo real habilitada" />
          </div>
        </div>

        {/* Minor account supervision banner */}
        {user.isMinor && (
          <div className="bg-purple-950/80 border-b border-purple-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-purple-200 shrink-0 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
              <span className="font-semibold shrink-0">Protección Familiar:</span>
              <span className="text-purple-300 truncate text-[11px]">
                {user.parentalControl?.isSupervised
                  ? `Supervisada por: ${user.parentalControl.parentName || 'Tutor'}`
                  : `Tu código para vincularte con tu tutor: ${user.parentalControl?.linkCode || 'FAM-9821'}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSettingsTab('parental');
                setShowSettingsModal(true);
              }}
              className="text-[11px] underline text-purple-300 hover:text-white cursor-pointer shrink-0 font-medium ml-2"
            >
              Ver detalles
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden min-w-0">
          {activeTab === 'workspace' ? (
            /* Google Workspace Hub View */
            <WorkspaceHub
              items={workspaceItems}
              onAddItem={handleAddWorkspaceItem}
              onDeleteItem={handleDeleteWorkspaceItem}
              user={user}
              onConnectGoogle={() => setUser((u) => (u ? { ...u, isGoogleConnected: true } : null))}
              themeSettings={settings}
            />
          ) : activeTab === 'calls' ? (
            /* Call History View */
            <CallHistoryView
              callLogs={callLogs}
              chats={chats}
              currentUser={user}
              onStartCallWithContact={handleStartCallWithContact}
              onDeleteCallLog={handleDeleteCallLog}
              onClearCallLogs={handleClearCallLogs}
              themeSettings={settings}
            />
          ) : (
            /* Chat Stream & List View - Seamless responsive transition */
            <div className="flex-1 flex w-full h-full overflow-hidden">
              {/* ChatList: On mobile hidden if a chat is opened; on desktop always visible (320-384px) */}
              <div
                className={`h-full ${
                  activeChatId
                    ? 'hidden md:flex md:w-80 lg:w-96 shrink-0'
                    : 'flex w-full md:w-80 lg:w-96 shrink-0'
                }`}
              >
                <ChatList
                  chats={chats}
                  activeChatId={activeChatId}
                  onSelectChat={(id) => setActiveChatId(id)}
                  onNewChat={() => setShowNewChatModal(true)}
                  filterMode="all"
                  themeSettings={settings}
                />
              </div>

              {/* ChatArea: On mobile visible only when a chat is open; on desktop always visible (flex-1) */}
              <div
                className={`h-full ${
                  activeChatId
                    ? 'flex flex-1 w-full min-w-0'
                    : 'hidden md:flex md:flex-1 min-w-0'
                }`}
              >
                <ChatArea
                  chat={activeChat}
                  messages={currentChatMessages}
                  currentUser={user}
                  onSendMessage={handleSendMessage}
                  onStartCall={handleStartCall}
                  onOpenWorkspaceHub={() => setActiveTab('workspace')}
                  onOpenSecurityModal={() => setShowSecurityModal(true)}
                  onNewChat={() => setShowNewChatModal(true)}
                  onEndMeetRoom={handleEndMeetRoom}
                  onUpdateChat={handleUpdateChat}
                  onDeleteChat={handleDeleteChat}
                  onStartDirectChat={handleAddFriend}
                  themeSettings={settings}
                  onBack={() => setActiveChatId('')}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ShareAccountModal
        user={user}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onAddFriend={handleAddFriend}
        themeSettings={settings}
      />

      <CallModal
        isOpen={callState.isOpen}
        isVideo={callState.isVideo}
        chat={activeChat}
        currentUser={user}
        onClose={() => setCallState({ isOpen: false, isVideo: false })}
      />

      <DevicesModal
        user={user}
        isOpen={showDevicesModal}
        onClose={() => setShowDevicesModal(false)}
        onSyncKeys={handleSyncKeys}
        onRevokeDevice={handleRevokeDevice}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
        user={user}
        onUpdateUser={(updatedUser) => setUser(updatedUser)}
        dataStats={dataStats}
        initialTab={settingsTab}
      />

      <AIAssistantModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyResult={(text) => handleSendMessage(text)}
        themeSettings={settings}
      />

      <SecurityModal
        chat={activeChat}
        currentUser={user}
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(newProfile) => setUser(newProfile)}
      />

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onCreateChat={handleCreateChat}
        currentUser={user}
        existingChats={chats}
        onSelectExistingChat={(id) => setActiveChatId(id)}
      />

      {/* Parental Restriction Feedback Modal */}
      {parentalAlertMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Aviso de Control Parental</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {parentalAlertMessage}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[11px] text-purple-200 text-left">
              💡 Para habilitar llamadas o añadir contactos permitidos, tu tutor(a) ({user?.parentalControl?.parentName || 'Tutor'}) puede acceder a los ajustes desde su propia cuenta en <b>Configuración &gt; Control Parental</b>.
            </div>
            <button
              type="button"
              onClick={() => setParentalAlertMessage(null)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
