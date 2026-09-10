import React, { useState, useEffect } from 'react';
import {
  Hash,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  Plus,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Send,
  Smile,
  Shield,
  Crown,
  Sparkles,
  PhoneOff,
  Headphones,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  Pin,
} from 'lucide-react';
import {
  CommunityServer,
  CommunityChannel,
  CommunityMember,
  UserProfile,
  ThemeSettings,
} from '../types';
import { INITIAL_COMMUNITY_SERVERS } from '../data/channelsAndCommunityData';

interface CommunitiesViewProps {
  currentUser: UserProfile | null;
  themeSettings: ThemeSettings;
}

interface CommunityMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: CommunityMember['role'];
  text: string;
  timestamp: string;
  reactions: Record<string, string[]>; // emoji -> [userNames]
}

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({
  currentUser,
  themeSettings,
}) => {
  const [servers, setServers] = useState<CommunityServer[]>(() => {
    const saved = localStorage.getItem('nexus_community_servers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_COMMUNITY_SERVERS;
      }
    }
    return INITIAL_COMMUNITY_SERVERS;
  });

  useEffect(() => {
    localStorage.setItem('nexus_community_servers', JSON.stringify(servers));
  }, [servers]);

  const [activeServerId, setActiveServerId] = useState<string>(servers[0]?.id || '');
  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0];

  // Selected Channel
  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
    const firstChan = activeServer?.categories[0]?.channels[0]?.id;
    return firstChan || '';
  });

  // Keep active channel in sync if server changes
  useEffect(() => {
    if (activeServer) {
      const firstTextChan = activeServer.categories
        .flatMap((c) => c.channels)
        .find((ch) => ch.type === 'text' || ch.type === 'announcement');
      if (firstTextChan) {
        setActiveChannelId(firstTextChan.id);
      }
    }
  }, [activeServerId]);

  // Voice Lounge Connected State
  const [connectedVoiceChannelId, setConnectedVoiceChannelId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);

  // Messages per channel state
  const [channelMessages, setChannelMessages] = useState<Record<string, CommunityMessage[]>>(() => {
    return {
      'chan_gam_general': [
        {
          id: 'msg_gam_1',
          channelId: 'chan_gam_general',
          authorId: 'usr_marcos',
          authorName: 'Marcos Dev',
          authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          authorRole: 'owner',
          text: '¡Bienvenidos a la comunidad gamer de Nexus! Aquí compartimos clips, armamos squads y jugamos los torneos de Arcade.',
          timestamp: '10:15 AM',
          reactions: { '🔥': ['Carlos M.', 'Tú'], '🎮': ['Valeria M.'] },
        },
        {
          id: 'msg_gam_2',
          channelId: 'chan_gam_general',
          authorId: 'usr_carlos',
          authorName: 'Carlos Méndez',
          authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          authorRole: 'admin',
          text: 'Acabo de sacar récord de 10 aciertos seguidos en Nexus Trivia en la categoría de Ciencia 🏆 ¿Alguien me supera?',
          timestamp: '10:42 AM',
          reactions: { '🧠': ['Tú'], '👏': ['Marcos Dev'] },
        },
      ],
      'chan_tech_general': [
        {
          id: 'msg_tech_1',
          channelId: 'chan_tech_general',
          authorId: 'usr_carlos',
          authorName: 'Carlos Méndez',
          authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          authorRole: 'owner',
          text: 'Hola a todos. Ya tenemos integrado el cifrado E2EE nativo con integrity hash SHA-256 en Nexus. ¡Seguridad de primer nivel!',
          timestamp: '09:30 AM',
          reactions: { '🚀': ['Valeria M.', 'Tú'], '🔒': ['Tú'] },
        },
      ],
    };
  });

  const [inputMessageText, setInputMessageText] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [showMembersSidebar, setShowMembersSidebar] = useState<boolean>(true);

  // Create Server Modal
  const [isCreatingServer, setIsCreatingServer] = useState<boolean>(false);
  const [newServerName, setNewServerName] = useState<string>('');
  const [newServerDescription, setNewServerDescription] = useState<string>('');
  const [newServerIcon, setNewServerIcon] = useState<string>('🌐');

  // Toggle Category Collapse
  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Find currently active channel object
  const activeChannel = activeServer?.categories
    .flatMap((c) => c.channels)
    .find((ch) => ch.id === activeChannelId);

  // Send Message in active channel
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessageText.trim() || !activeChannelId) return;

    const newMsg: CommunityMessage = {
      id: 'cmsg_' + Date.now(),
      channelId: activeChannelId,
      authorId: currentUser?.id || 'usr_me',
      authorName: currentUser?.displayName || 'Tú',
      authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      authorRole: 'member',
      text: inputMessageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
    };

    setChannelMessages((prev) => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMsg],
    }));

    setInputMessageText('');
  };

  // Toggle Reaction on message
  const handleToggleReaction = (msgId: string, emoji: string) => {
    const myName = currentUser?.displayName || 'Tú';
    setChannelMessages((prev) => {
      const msgs = prev[activeChannelId] || [];
      return {
        ...prev,
        [activeChannelId]: msgs.map((m) => {
          if (m.id !== msgId) return m;
          const currentUsers = m.reactions[emoji] || [];
          const hasReacted = currentUsers.includes(myName);
          const newUsers = hasReacted
            ? currentUsers.filter((u) => u !== myName)
            : [...currentUsers, myName];

          const newReactions = { ...m.reactions };
          if (newUsers.length === 0) {
            delete newReactions[emoji];
          } else {
            newReactions[emoji] = newUsers;
          }

          return { ...m, reactions: newReactions };
        }),
      };
    });
  };

  // Join / Leave Voice Channel
  const handleVoiceChannelClick = (voiceChannel: CommunityChannel) => {
    if (connectedVoiceChannelId === voiceChannel.id) {
      // Disconnect
      setConnectedVoiceChannelId(null);
    } else {
      // Connect
      setConnectedVoiceChannelId(voiceChannel.id);
    }
  };

  // Create Server
  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;

    const newSrv: CommunityServer = {
      id: 'srv_' + Date.now(),
      name: newServerName.trim(),
      icon: newServerIcon || '💬',
      bannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000',
      description: newServerDescription.trim() || 'Comunidad creada en Nexus',
      ownerId: currentUser?.id || 'usr_me',
      categories: [
        {
          id: 'cat_info_' + Date.now(),
          name: '📢 INFORMACIÓN',
          channels: [
            { id: 'chan_rules_' + Date.now(), name: 'anuncios', type: 'announcement', topic: 'Canal de bienvenida' },
          ],
        },
        {
          id: 'cat_chat_' + Date.now(),
          name: '💬 TEXTO & CHARLA',
          channels: [
            { id: 'chan_gen_' + Date.now(), name: 'general', type: 'text', topic: 'Conversación general' },
            { id: 'chan_ideas_' + Date.now(), name: 'ideas', type: 'text', topic: 'Lluvia de ideas' },
          ],
        },
        {
          id: 'cat_voice_' + Date.now(),
          name: '🔊 SALAS DE VOZ',
          channels: [
            { id: 'chan_voice_' + Date.now(), name: 'Voz Principal', type: 'voice', topic: 'Sala de audio comunitaria' },
          ],
        },
      ],
      members: [
        {
          id: currentUser?.id || 'usr_me',
          name: currentUser?.displayName || 'Tú',
          avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          role: 'owner',
          status: 'online',
          activity: '👑 Creando la comunidad',
        },
      ],
    };

    setServers([...servers, newSrv]);
    setActiveServerId(newSrv.id);
    setIsCreatingServer(false);
    setNewServerName('');
    setNewServerDescription('');
  };

  const currentMessages = channelMessages[activeChannelId] || [];

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Leftmost Server Icon Strip (Discord / Guilds rail) */}
      <div className="w-16 md:w-18 bg-slate-900 border-r border-slate-800/80 flex flex-col items-center py-3 space-y-3 shrink-0 select-none z-10">
        {/* Servers list */}
        <div className="flex-1 w-full flex flex-col items-center space-y-2.5 overflow-y-auto scrollbar-none">
          {servers.map((server) => {
            const isActive = server.id === activeServerId;
            return (
              <div key={server.id} className="relative group flex items-center justify-center w-full">
                {/* Active Pill Indicator */}
                <div
                  className={`absolute left-0 w-1 rounded-r-full bg-emerald-400 transition-all duration-200 ${
                    isActive ? 'h-9' : 'h-2 group-hover:h-5 opacity-60'
                  }`}
                />

                <button
                  onClick={() => setActiveServerId(server.id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all duration-200 shadow-md cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white rounded-xl ring-2 ring-emerald-400/50'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:rounded-xl'
                  }`}
                  title={server.name}
                >
                  {server.icon}
                </button>
              </div>
            );
          })}

          {/* Add Server Button */}
          <div className="pt-2 w-full flex items-center justify-center">
            <button
              onClick={() => setIsCreatingServer(true)}
              className="w-12 h-12 rounded-2xl bg-slate-800/60 hover:bg-emerald-600/90 text-emerald-400 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all duration-200 hover:rounded-xl cursor-pointer shadow-md group"
              title="Crear o unirse a un servidor"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* User Mini Avatar Indicator */}
        <div className="pt-2 border-t border-slate-800 w-full flex justify-center">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt="Perfil"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/60"
          />
        </div>
      </div>

      {/* 2. Server Channels Sidebar */}
      <div className="w-60 md:w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0">
        {/* Server Header */}
        <div className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between shadow-sm">
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-lg">{activeServer?.icon}</span>
            <h2 className="font-bold text-white text-sm truncate">{activeServer?.name}</h2>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>

        {/* Channels Tree List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
          {activeServer?.categories.map((cat) => {
            const isCollapsed = collapsedCategories[cat.id];
            return (
              <div key={cat.id} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <span>{cat.name}</span>
                </button>

                {/* Category Channels */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pl-1">
                    {cat.channels.map((chan) => {
                      const isSelected = chan.id === activeChannelId;
                      const isVoice = chan.type === 'voice';
                      const isVoiceConnected = connectedVoiceChannelId === chan.id;

                      return (
                        <div key={chan.id}>
                          <button
                            onClick={() => {
                              if (isVoice) {
                                handleVoiceChannelClick(chan);
                              } else {
                                setActiveChannelId(chan.id);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                              isSelected && !isVoice
                                ? 'bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/40'
                                : isVoiceConnected
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isVoice ? (
                                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : chan.type === 'announcement' ? (
                                <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : (
                                <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{chan.name}</span>
                            </div>

                            {isVoiceConnected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                          </button>

                          {/* If voice channel has active members or connected */}
                          {isVoice && (
                            <div className="pl-6 pt-1 pb-1 space-y-1">
                              {isVoiceConnected && (
                                <div className="flex items-center gap-2 text-[11px] text-emerald-300 font-semibold py-0.5">
                                  <img
                                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                                    alt="Yo"
                                    className="w-4 h-4 rounded-full object-cover ring-1 ring-emerald-400"
                                  />
                                  <span>{currentUser?.displayName || 'Tú'}</span>
                                  {isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
                                </div>
                              )}
                              {activeServer.activeVoiceMembers?.[chan.id]?.map((vm) => (
                                <div
                                  key={vm.id}
                                  className="flex items-center gap-2 text-[11px] text-slate-300 py-0.5"
                                >
                                  <img
                                    src={vm.avatar}
                                    alt={vm.name}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                  <span className="truncate">{vm.name}</span>
                                  {vm.isSpeaking && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  )}
                                  {vm.isMuted && (
                                    <MicOff className="w-3 h-3 text-slate-500" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Voice Connection Status Bar (Discord Style) */}
        {connectedVoiceChannelId && (
          <div className="p-3 bg-emerald-950/70 border-t border-emerald-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-300 truncate leading-tight">
                  Voz Conectada
                </p>
                <p className="text-[10px] text-emerald-400/80 truncate">Baja latencia</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isMuted ? 'bg-rose-500/20 text-rose-400' : 'hover:bg-emerald-900/60 text-emerald-300'
                }`}
                title={isMuted ? 'Desmutear micrófono' : 'Mutear micrófono'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setConnectedVoiceChannelId(null)}
                className="p-1.5 rounded-lg hover:bg-rose-600/30 text-rose-400 transition-colors cursor-pointer"
                title="Desconectar voz"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Center Channel Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* Channel Top Header */}
        <div className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeChannel?.type === 'announcement' ? (
              <Radio className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <Hash className="w-5 h-5 text-slate-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate">
                {activeChannel?.name || 'Selecciona un canal'}
              </h3>
              {activeChannel?.topic && (
                <p className="text-[11px] text-slate-400 truncate">{activeChannel.topic}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMembersSidebar(!showMembersSidebar)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showMembersSidebar
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Miembros de la comunidad"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Channel Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-slate-900/30 border border-slate-800 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-xl font-bold">
              {activeChannel?.type === 'announcement' ? '📢' : '#'}
            </div>
            <h4 className="text-base font-bold text-white">
              ¡Bienvenido al canal #{activeChannel?.name}!
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {activeChannel?.topic ||
                'Este es el comienzo del canal en la comunidad de Nexus. Comparte mensajes, colabora y reacciona libremente.'}
            </p>
          </div>

          {/* Messages list */}
          {currentMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group rounded-xl p-2 hover:bg-slate-900/50 transition-colors">
              <img
                src={msg.authorAvatar}
                alt={msg.authorName}
                className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{msg.authorName}</span>
                  {msg.authorRole === 'owner' && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-0.5 border border-amber-500/30">
                      <Crown className="w-2.5 h-2.5" /> Dueño
                    </span>
                  )}
                  {msg.authorRole === 'admin' && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center gap-0.5 border border-indigo-500/30">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                </div>

                <p className="text-xs md:text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                  {msg.text}
                </p>

                {/* Reactions */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {Object.entries(msg.reactions).map(([emoji, userList]) => {
                    const users = Array.isArray(userList) ? (userList as string[]) : [];
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          users.includes(currentUser?.displayName || 'Tú')
                            ? 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{users.length}</span>
                      </button>
                    );
                  })}

                  {/* Quick Reaction additions */}
                  <button
                    onClick={() => handleToggleReaction(msg.id, '❤️')}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-opacity text-xs"
                    title="Reaccionar ❤️"
                  >
                    ❤️
                  </button>
                  <button
                    onClick={() => handleToggleReaction(msg.id, '🔥')}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-opacity text-xs"
                    title="Reaccionar 🔥"
                  >
                    🔥
                  </button>
                  <button
                    onClick={() => handleToggleReaction(msg.id, '🚀')}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-opacity text-xs"
                    title="Reaccionar 🚀"
                  >
                    🚀
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Message Bar */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`Enviar mensaje en #${activeChannel?.name || 'canal'}...`}
                value={inputMessageText}
                onChange={(e) => setInputMessageText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={!inputMessageText.trim()}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 4. Right Members Sidebar (Discord Style with Roles & Rich Presence) */}
      {showMembersSidebar && (
        <div className="w-56 md:w-60 bg-slate-900/70 border-l border-slate-800/80 flex flex-col shrink-0 hidden lg:flex">
          <div className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Miembros ({activeServer?.members.length})
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {activeServer?.members.map((member) => (
              <div key={member.id} className="flex items-center gap-2.5 group">
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                      member.status === 'online'
                        ? 'bg-emerald-400'
                        : member.status === 'idle'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-200 truncate">{member.name}</span>
                    {member.role === 'owner' && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                    {member.role === 'admin' && <Shield className="w-3 h-3 text-indigo-400 shrink-0" />}
                  </div>
                  {member.activity && (
                    <p className="text-[10px] text-slate-400 truncate">{member.activity}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Create Server Modal */}
      {isCreatingServer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Crear Servidor o Comunidad
              </h3>
              <button onClick={() => setIsCreatingServer(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateServer} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  Icono del Servidor:
                </label>
                <div className="flex items-center gap-2">
                  {['🎮', '🚀', '🎨', '☕', '💡', '🎵', '🌐', '🛡️'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewServerIcon(emoji)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        newServerIcon === emoji
                          ? 'bg-emerald-600 scale-110 ring-2 ring-emerald-400'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  Nombre del Servidor / Comunidad:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Desarrolladores Nexus"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  Descripción:
                </label>
                <textarea
                  rows={2}
                  placeholder="¿De qué trata este servidor? ¿Para quién está pensado?"
                  value={newServerDescription}
                  onChange={(e) => setNewServerDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingServer(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Crear Servidor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
