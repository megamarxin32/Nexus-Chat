import React, { useState, useEffect } from 'react';
import {
  Plus,
  Radio,
  Sparkles,
  Share2,
  Heart,
  Flame,
  Rocket,
  ThumbsUp,
  CheckCircle2,
  Eye,
  Send,
  X,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Compass,
  Bell,
  Search,
  MessageCircle,
  Clock,
  Pin,
} from 'lucide-react';
import { StatusStory, BroadcastChannel, BroadcastChannelPost, UserProfile, ThemeSettings, Chat } from '../types';
import { INITIAL_STATUS_STORIES, INITIAL_BROADCAST_CHANNELS } from '../data/channelsAndCommunityData';
import { getThemePalette } from '../lib/themePresets';

interface ChannelsAndStatusViewProps {
  currentUser: UserProfile | null;
  chats: Chat[];
  themeSettings: ThemeSettings;
  onSendMessageToChat: (chatId: string, text: string) => void;
  onNavigateToChat?: (chatId: string) => void;
}

export const ChannelsAndStatusView: React.FC<ChannelsAndStatusViewProps> = ({
  currentUser,
  chats,
  themeSettings,
  onSendMessageToChat,
  onNavigateToChat,
}) => {
  const palette = getThemePalette(themeSettings);

  // Stories State
  const [stories, setStories] = useState<StatusStory[]>(() => {
    const saved = localStorage.getItem('nexus_status_stories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STATUS_STORIES;
      }
    }
    return INITIAL_STATUS_STORIES;
  });

  // Broadcast Channels State
  const [channels, setChannels] = useState<BroadcastChannel[]>(() => {
    const saved = localStorage.getItem('nexus_broadcast_channels');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_BROADCAST_CHANNELS;
      }
    }
    return INITIAL_BROADCAST_CHANNELS;
  });

  useEffect(() => {
    localStorage.setItem('nexus_status_stories', JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem('nexus_broadcast_channels', JSON.stringify(channels));
  }, [channels]);

  // Story Viewer Modal State
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [replyText, setReplyText] = useState<string>('');
  const [replySentSuccess, setReplySentSuccess] = useState<boolean>(false);

  // New Story Modal State
  const [isCreatingStory, setIsCreatingStory] = useState<boolean>(false);
  const [newStoryText, setNewStoryText] = useState<string>('');
  const [newStoryCaption, setNewStoryCaption] = useState<string>('');
  const [newStoryGradient, setNewStoryGradient] = useState<string>('linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)');
  const [newStoryImageUrl, setNewStoryImageUrl] = useState<string>('');
  const [newStoryType, setNewStoryType] = useState<'text' | 'image'>('text');

  // Channel Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [channelSearchQuery, setChannelSearchQuery] = useState<string>('');
  const [channelTab, setChannelTab] = useState<'followed' | 'explore'>('followed');

  // New Channel Modal State
  const [isCreatingChannel, setIsCreatingChannel] = useState<boolean>(false);
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [newChannelDescription, setNewChannelDescription] = useState<string>('');
  const [newChannelCategory, setNewChannelCategory] = useState<BroadcastChannel['category']>('comunidad');

  // Share post to chat state
  const [shareModalPost, setShareModalPost] = useState<BroadcastChannelPost | null>(null);

  // Story Auto-Advance Timer
  useEffect(() => {
    if (activeStoryIndex === null) return;
    setStoryProgress(0);

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story or close
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex((curr) => (curr !== null ? curr + 1 : null));
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, stories.length]);

  const handleNextStory = () => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setStoryProgress(0);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setStoryProgress(0);
    }
  };

  const handlePublishStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryText.trim() && newStoryType === 'text') return;
    if (!newStoryImageUrl.trim() && newStoryType === 'image') return;

    const newStory: StatusStory = {
      id: 'story_' + Date.now(),
      userId: currentUser?.id || 'usr_me',
      userName: currentUser?.displayName || 'Tú',
      userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      type: newStoryType,
      content: newStoryType === 'text' ? newStoryText.trim() : newStoryImageUrl.trim(),
      backgroundGradient: newStoryType === 'text' ? newStoryGradient : undefined,
      caption: newStoryCaption.trim() || undefined,
      timestamp: 'Justo ahora',
      expiresAt: 'En 24 horas',
      viewsCount: 1,
      isSelf: true,
    };

    setStories([newStory, ...stories]);
    setIsCreatingStory(false);
    setNewStoryText('');
    setNewStoryCaption('');
    setNewStoryImageUrl('');
  };

  const handleReplyToStory = (story: StatusStory) => {
    if (!replyText.trim()) return;

    // Send as message to the chat of this user if exists
    const matchingChat = chats.find(
      (c) => c.type === 'direct' && c.members.includes(story.userId)
    );

    const messagePayload = `💬 Respondió a tu estado ("${story.type === 'text' ? story.content.slice(0, 30) : story.caption || 'Foto'}..."): ${replyText.trim()}`;

    if (matchingChat) {
      onSendMessageToChat(matchingChat.id, messagePayload);
    } else if (chats.length > 0) {
      onSendMessageToChat(chats[0].id, `[A ${story.userName}]: ${messagePayload}`);
    }

    setReplySentSuccess(true);
    setTimeout(() => {
      setReplySentSuccess(false);
      setReplyText('');
    }, 1500);
  };

  // Toggle Reaction on Channel Post
  const handleToggleReaction = (channelId: string, postId: string, emoji: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch;
        return {
          ...ch,
          posts: ch.posts.map((p) => {
            if (p.id !== postId) return p;
            const currentReacted = Boolean(p.userReacted?.[emoji]);
            const currentCount = p.reactions[emoji] || 0;
            const newCount = currentReacted ? Math.max(0, currentCount - 1) : currentCount + 1;

            return {
              ...p,
              reactions: { ...p.reactions, [emoji]: newCount },
              userReacted: { ...p.userReacted, [emoji]: !currentReacted },
            };
          }),
        };
      })
    );
  };

  // Follow/Unfollow Channel
  const handleToggleFollowChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch;
        const newFollowing = !ch.isFollowing;
        return {
          ...ch,
          isFollowing: newFollowing,
          subscribersCount: newFollowing ? ch.subscribersCount + 1 : Math.max(0, ch.subscribersCount - 1),
        };
      })
    );
  };

  // Create Channel
  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const newChan: BroadcastChannel = {
      id: 'chan_' + Date.now(),
      name: newChannelName.trim(),
      handle: '@' + newChannelName.trim().toLowerCase().replace(/\s+/g, '_'),
      avatar: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150',
      description: newChannelDescription.trim() || 'Canal oficial de difusión comunitaria',
      subscribersCount: 1,
      isVerified: false,
      creatorId: currentUser?.id || 'usr_me',
      creatorName: currentUser?.displayName || 'Tú',
      category: newChannelCategory,
      isFollowing: true,
      posts: [
        {
          id: 'post_' + Date.now(),
          channelId: 'chan_' + Date.now(),
          title: `¡Bienvenidos a ${newChannelName.trim()}!`,
          text: 'Este es el primer aviso de nuestro canal de difusión. Síguenos para no perderte ninguna novedad.',
          timestamp: 'Justo ahora',
          reactions: { '❤️': 1, '🔥': 1 },
          views: 1,
        },
      ],
    };

    setChannels([newChan, ...channels]);
    setIsCreatingChannel(false);
    setNewChannelName('');
    setNewChannelDescription('');
  };

  const filteredChannels = channels.filter((ch) => {
    const matchesTab = channelTab === 'followed' ? ch.isFollowing : true;
    const matchesCat = selectedCategory === 'todos' || ch.category === selectedCategory;
    const matchesQuery =
      ch.name.toLowerCase().includes(channelSearchQuery.toLowerCase()) ||
      ch.description.toLowerCase().includes(channelSearchQuery.toLowerCase());
    return matchesTab && matchesCat && matchesQuery;
  });

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-950 text-slate-100">
      {/* 1. Header Section */}
      <div className="p-4 md:p-6 border-b border-slate-800/80 bg-slate-900/60 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-6xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Canales & Estados
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    En Vivo
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Historias efímeras de 24h y avisos oficiales de difusión sin límites
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingStory(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Estado</span>
            </button>
            <button
              onClick={() => setIsCreatingChannel(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Crear Canal</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto p-4 md:p-6 space-y-8">
        {/* 2. WhatsApp / Instagram Stories Bar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Estados de Contactos (24 Horas)
            </h2>
            <span className="text-xs text-slate-500">{stories.length} estados activos</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-800">
            {/* My Status Bubble (+ add) */}
            <div
              onClick={() => setIsCreatingStory(true)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div className="relative w-16 h-16 md:w-18 md:h-18 rounded-full p-0.5 border-2 border-dashed border-emerald-400/80 group-hover:border-emerald-400 transition-all flex items-center justify-center bg-slate-900">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt="Mi Estado"
                  className="w-full h-full rounded-full object-cover group-hover:scale-95 transition-transform"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-950 font-bold">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-300 group-hover:text-emerald-400 truncate max-w-[72px]">
                Mi Estado
              </span>
            </div>

            {/* Contact Stories */}
            {stories.map((story, idx) => (
              <div
                key={story.id}
                onClick={() => setActiveStoryIndex(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div className="relative w-16 h-16 md:w-18 md:h-18 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 group-hover:scale-105 transition-all shadow-md">
                  <div className="w-full h-full rounded-full p-0.5 bg-slate-950 overflow-hidden">
                    <img
                      src={story.userAvatar}
                      alt={story.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  {story.type === 'text' && (
                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center font-bold border border-slate-900">
                      T
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate max-w-[76px] text-center">
                  {story.userName.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Broadcast Channels Feed (Telegram / WhatsApp Channels) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setChannelTab('followed')}
                className={`text-sm font-bold pb-2 border-b-2 transition-all cursor-pointer ${
                  channelTab === 'followed'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Canales Seguidos
              </button>
              <button
                onClick={() => setChannelTab('explore')}
                className={`text-sm font-bold pb-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  channelTab === 'explore'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-4 h-4" />
                Explorar Directorio
              </button>
            </div>

            {/* Search and Category */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar canal o tema..."
                  value={channelSearchQuery}
                  onChange={(e) => setChannelSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 md:w-56"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1 text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value="noticias">Noticias</option>
                <option value="tecnologia">Tecnología</option>
                <option value="gaming">Gaming</option>
                <option value="comunidad">Comunidad</option>
              </select>
            </div>
          </div>

          {/* Channels Grid / Feed */}
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
              <Radio className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-300">No se encontraron canales en esta vista</p>
              <p className="text-xs text-slate-500 mt-1">
                Explora el directorio o crea tu propio canal de avisos comunitario.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden hover:border-slate-700 transition-all shadow-lg"
                >
                  {/* Channel Top Header */}
                  <div className="p-4 bg-slate-900/80 flex items-center justify-between gap-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={channel.avatar}
                        alt={channel.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-white text-sm truncate">{channel.name}</h3>
                          {channel.isVerified && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{channel.handle}</span>
                          <span>•</span>
                          <span>{channel.subscribersCount.toLocaleString()} seguidores</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleFollowChannel(channel.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          channel.isFollowing
                            ? 'bg-slate-800 text-slate-300 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>{channel.isFollowing ? 'Siguiendo' : 'Seguir'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Channel Posts Feed */}
                  <div className="p-4 space-y-4">
                    {channel.posts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-xl p-4 bg-slate-950/70 border border-slate-800/80 space-y-3"
                      >
                        {post.isPinned && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold">
                            <Pin className="w-3.5 h-3.5 rotate-45" />
                            <span>Aviso fijado en el canal</span>
                          </div>
                        )}

                        {post.title && (
                          <h4 className="font-bold text-base text-white">{post.title}</h4>
                        )}

                        <p className="text-xs md:text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                          {post.text}
                        </p>

                        {post.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-slate-800 max-h-80">
                            <img
                              src={post.imageUrl}
                              alt="Adjunto de aviso"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Post Footer: Reactions, Views & Share */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-800/60">
                          {/* Emojis with live counters */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {['❤️', '🔥', '🚀', '👏'].map((emoji) => {
                              const count = post.reactions[emoji] || 0;
                              const isReacted = Boolean(post.userReacted?.[emoji]);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(channel.id, post.id, emoji)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                    isReacted
                                      ? 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-300'
                                      : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span>{count}</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-slate-500" />
                              {post.views.toLocaleString()}
                            </span>
                            <span>{post.timestamp}</span>
                            <button
                              onClick={() => setShareModalPost(post)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Reenviar aviso a tus chats"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 4. Fullscreen Story Viewer (Instagram / WhatsApp style) */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none">
          {/* Top Story Controls & Progress Bar */}
          <div className="w-full max-w-md pt-2 space-y-2 z-10">
            {/* Multi-segment progress bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-100 ease-linear"
                style={{ width: `${storyProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeStory.userAvatar}
                  alt={activeStory.userName}
                  className="w-9 h-9 rounded-full object-cover border border-white/30"
                />
                <div>
                  <p className="text-xs font-bold leading-tight">{activeStory.userName}</p>
                  <p className="text-[10px] text-white/70">{activeStory.timestamp}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStoryIndex(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Story Card Content */}
          <div className="relative w-full max-w-md flex-1 my-4 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center bg-slate-900 border border-white/10">
            {activeStory.type === 'text' ? (
              <div
                className="w-full h-full p-8 flex flex-col items-center justify-center text-center select-text"
                style={{ background: activeStory.backgroundGradient || '#4f46e5' }}
              >
                <p className="text-xl md:text-2xl font-black text-white leading-snug drop-shadow-md">
                  {activeStory.content}
                </p>
                {activeStory.caption && (
                  <span className="mt-6 px-3 py-1 rounded-full bg-black/40 text-xs text-white/90 backdrop-blur-sm">
                    {activeStory.caption}
                  </span>
                )}
              </div>
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={activeStory.content}
                  alt="Story Visual"
                  className="w-full h-full object-cover"
                />
                {activeStory.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white text-center">
                    <p className="text-sm font-medium">{activeStory.caption}</p>
                  </div>
                )}
              </div>
            )}

            {/* Left & Right touch trigger zones */}
            <div
              onClick={handlePrevStory}
              className="absolute left-0 inset-y-0 w-1/3 cursor-pointer z-10"
              title="Anterior"
            />
            <div
              onClick={handleNextStory}
              className="absolute right-0 inset-y-0 w-1/3 cursor-pointer z-10"
              title="Siguiente"
            />
          </div>

          {/* Bottom Reply Bar */}
          <div className="w-full max-w-md pb-4 z-10">
            {replySentSuccess ? (
              <div className="p-2.5 rounded-2xl bg-emerald-600/90 text-white text-center text-xs font-bold animate-fadeIn">
                ¡Respuesta enviada al chat de {activeStory.userName}! 🚀
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Responder a ${activeStory.userName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReplyToStory(activeStory)}
                  className="flex-1 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleReplyToStory(activeStory)}
                  className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-transform active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Create Story Modal */}
      {isCreatingStory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Nuevo Estado (24 Horas)
              </h3>
              <button
                onClick={() => setIsCreatingStory(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewStoryType('text')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  newStoryType === 'text'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Texto & Color
              </button>
              <button
                type="button"
                onClick={() => setNewStoryType('image')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  newStoryType === 'image'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Foto / Imagen
              </button>
            </div>

            <form onSubmit={handlePublishStory} className="space-y-4">
              {newStoryType === 'text' ? (
                <>
                  <div
                    className="rounded-2xl p-6 min-h-[140px] flex items-center justify-center text-center shadow-inner"
                    style={{ background: newStoryGradient }}
                  >
                    <textarea
                      placeholder="Escribe lo que estás pensando hoy..."
                      value={newStoryText}
                      onChange={(e) => setNewStoryText(e.target.value)}
                      rows={3}
                      className="w-full bg-transparent text-white font-bold text-lg text-center placeholder-white/60 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Gradient Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Color de fondo:</label>
                    <div className="flex items-center gap-2">
                      {[
                        'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                        'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                        'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                        'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      ].map((grad, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewStoryGradient(grad)}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            newStoryGradient === grad ? 'scale-110 ring-2 ring-white' : 'opacity-80'
                          }`}
                          style={{ background: grad }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 font-semibold mb-1 block">
                      Enlace de imagen o foto:
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newStoryImageUrl}
                      onChange={(e) => setNewStoryImageUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-semibold mb-1 block">
                      Pie de foto / Pie de historia:
                    </label>
                    <input
                      type="text"
                      placeholder="Un momento genial..."
                      value={newStoryCaption}
                      onChange={(e) => setNewStoryCaption(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingStory(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Publicar Ahora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Create Broadcast Channel Modal */}
      {isCreatingChannel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Crear Canal de Difusión
              </h3>
              <button
                onClick={() => setIsCreatingChannel(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  Nombre del Canal:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Anuncios del Equipo Alfa"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  Categoría:
                </label>
                <select
                  value={newChannelCategory}
                  onChange={(e) => setNewChannelCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="noticias">Noticias & Alertas</option>
                  <option value="tecnologia">Tecnología & Proyectos</option>
                  <option value="gaming">Gaming & Entretenimiento</option>
                  <option value="comunidad">Comunidad & Social</option>
                  <option value="empresa">Empresa & Negocios</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  Descripción:
                </label>
                <textarea
                  rows={2}
                  placeholder="Explica de qué trata este canal para tus suscriptores..."
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingChannel(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Crear Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Share Post to Chat Modal */}
      {shareModalPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                Reenviar Aviso a un Chat
              </h3>
              <button
                onClick={() => setShareModalPost(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    const postContent = `📢 [Reenviado de Canal] ${shareModalPost.title ? '*' + shareModalPost.title + '*\n' : ''}${shareModalPost.text}`;
                    onSendMessageToChat(c.id, postContent);
                    setShareModalPost(null);
                    if (onNavigateToChat) onNavigateToChat(c.id);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 flex items-center gap-3 transition-colors text-left cursor-pointer"
                >
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="truncate flex-1">
                    <p className="text-xs font-bold text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {c.type === 'group' ? 'Grupo' : 'Chat Directo'}
                    </p>
                  </div>
                  <Send className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
