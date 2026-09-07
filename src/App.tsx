import React, { useState, useEffect } from 'react';
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
  INITIAL_CHATS,
  INITIAL_MESSAGES,
  INITIAL_WORKSPACE_ITEMS,
  generateFingerprint,
} from './data/mockData';
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

const INITIAL_CALL_LOGS: CallLog[] = [
  {
    id: 'call_init_1',
    contactName: 'Valeria Rodríguez',
    contactAvatar: 'https://ui-avatars.com/api/?name=Valeria+Rodriguez&background=4f46e5&color=fff&bold=true',
    contactUsername: 'valeria_ui',
    type: 'video',
    direction: 'incoming',
    timestamp: 'Hoy, 10:14',
    durationSeconds: 840,
    status: 'completed',
  },
  {
    id: 'call_init_2',
    contactName: 'Carlos Mendoza',
    contactAvatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=059669&color=fff&bold=true',
    contactUsername: 'carlos_dev',
    type: 'audio',
    direction: 'outgoing',
    timestamp: 'Ayer, 18:32',
    durationSeconds: 215,
    status: 'completed',
  },
  {
    id: 'call_init_3',
    contactName: 'Equipo de Soporte Nexus',
    contactAvatar: 'https://ui-avatars.com/api/?name=Soporte+Nexus&background=2563eb&color=fff&bold=true',
    contactUsername: 'soporte_nexus',
    type: 'audio',
    direction: 'missed',
    timestamp: '1 de sep, 14:05',
    durationSeconds: 0,
    status: 'missed',
  },
];
import { encryptE2EEMessage } from './lib/crypto';
import { dataSaver } from './lib/dataSaver';
import { notificationService } from './lib/notifications';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'workspace'>('chats');
  const [activeChatId, setActiveChatId] = useState<string>('');

  // Call Logs state
  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    const saved = localStorage.getItem('nexus_call_logs');
    if (!saved) return INITIAL_CALL_LOGS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_CALL_LOGS;
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

  // Chats collection state (clean, no dummy placeholders)
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('nexus_chats');
    if (!saved) return INITIAL_CHATS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.some((c) => c.id === 'chat_group_core' || c.id === 'chat_valeria')) {
        localStorage.removeItem('nexus_chats');
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  });

  // Messages collection state
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('nexus_messages');
    if (!saved) return INITIAL_MESSAGES;
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.chat_group_core || parsed?.chat_valeria) {
        localStorage.removeItem('nexus_messages');
        return {};
      }
      return parsed;
    } catch {
      return {};
    }
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
  const [settingsTab, setSettingsTab] = useState<'profile' | 'chat' | 'system'>('profile');
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
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

    // Update local messages
    const updatedChatMessages = [...currentChatMessages, newMessage];
    setMessages((prev) => ({
      ...prev,
      [activeChat.id]: updatedChatMessages,
    }));

    // Update chat last message
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              lastMessage: {
                ...newMessage,
                status: 'delivered',
              },
            }
          : c
      )
    );
  };

  // Start Call (Meet)
  const handleStartCall = (isVideo: boolean, targetChat?: Chat) => {
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
    setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      const remaining = chats.filter((c) => c.id !== chatId);
      setActiveChatId(remaining[0]?.id || '');
    }
  };

  // Add friend / self contact
  const handleAddFriend = (friendIdOrEmail: string) => {
    if (!user) return;
    const clean = friendIdOrEmail.trim().toLowerCase();
    const isSelf =
      clean === user.email.toLowerCase() ||
      clean.replace(/^@/, '') === user.username.toLowerCase() ||
      clean.includes('(tú)');

    if (isSelf) {
      const existingSelfChat = chats.find(
        (c) =>
          c.id === `chat_saved_${user.id}` ||
          (c.type === 'direct' &&
            (c.name.toLowerCase().includes('(tú)') ||
              (c.members.length === 1 && c.members[0] === user.id)))
      );
      if (existingSelfChat) {
        setActiveChatId(existingSelfChat.id);
        return;
      }

      const selfChat: Chat = {
        id: `chat_saved_${user.id}`,
        name: 'Mensajes Guardados (Tú)',
        type: 'direct',
        avatar: user.avatar,
        topic: 'Tu bloc personal de notas, mensajes y archivos cifrados',
        unreadCount: 0,
        isPinned: true,
        members: [user.id],
        e2eeFingerprint: user.e2eeFingerprint,
        createdAt: new Date().toISOString(),
      };
      setChats((prev) => [selfChat, ...prev]);
      setActiveChatId(selfChat.id);
      return;
    }

    const cleanName = friendIdOrEmail.replace('@', '');
    const newChatId = 'chat_user_' + Date.now();
    const newChat: Chat = {
      id: newChatId,
      name: cleanName,
      type: 'direct',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563eb&color=fff&bold=true`,
      topic: 'Conversación directa',
      unreadCount: 0,
      isPinned: false,
      members: [user.id, 'friend_' + Date.now()],
      e2eeFingerprint: generateFingerprint(),
      meetActiveRoom: undefined,
      createdAt: new Date().toISOString(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  // End or dismiss active Meet room for a chat
  const handleEndMeetRoom = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, meetActiveRoom: undefined } : c))
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
    setChats((prev) => [newChat, ...prev]);
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
      {/* 1. Left Sidebar Navigation (Desktop & Tablet) */}
      <SidebarNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
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
      />

      {/* 2. Main Content Split View */}
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
          /* Chat Stream & List View */
          <>
            <ChatList
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={(id) => setActiveChatId(id)}
              onNewChat={() => setShowNewChatModal(true)}
              filterMode="all"
              themeSettings={settings}
            />

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
            />
          </>
        )}
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
    </div>
  );
}
