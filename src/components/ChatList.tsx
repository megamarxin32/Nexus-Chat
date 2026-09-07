import React, { useState } from 'react';
import {
  Search,
  Plus,
  Lock,
  Pin,
  Users,
  Video,
  CheckCheck,
  Check,
  Zap,
} from 'lucide-react';
import { Chat, ThemeSettings } from '../types';
import { getThemePalette } from '../lib/themePresets';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  filterMode?: 'all' | 'groups' | 'direct';
  themeSettings: ThemeSettings;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  filterMode = 'all',
  themeSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups' | 'e2ee'>('all');

  const filteredChats = chats.filter((chat) => {
    // Mode filter from nav
    if (filterMode === 'groups' && chat.type !== 'group') return false;
    if (filterMode === 'direct' && chat.type !== 'direct') return false;

    // Filter pills
    if (activeFilter === 'unread' && chat.unreadCount === 0) return false;
    if (activeFilter === 'groups' && chat.type !== 'group') return false;
    if (activeFilter === 'e2ee' && !chat.e2eeFingerprint) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = chat.name.toLowerCase().includes(q);
      const matchMsg = chat.lastMessage?.text?.toLowerCase().includes(q);
      return matchName || matchMsg;
    }
    return true;
  });

  const isDark = themeSettings.mode !== 'light';
  const palette = getThemePalette(themeSettings);

  return (
    <div
      id="nexus-chat-list-panel"
      className="w-full sm:w-80 md:w-96 flex flex-col border-r h-full shrink-0 transition-colors"
      style={{
        backgroundColor: palette.listBg,
        borderColor: palette.listBorder,
      }}
    >
      {/* Top Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: palette.textPrimary }}
            >
              Chats
            </h1>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-semibold border"
              style={{
                backgroundColor: `${palette.accentBg}15`,
                borderColor: `${palette.accentBg}40`,
                color: palette.accentBg,
              }}
              title="Cifrado E2EE con AES-GCM 256"
            >
              E2EE
            </span>
          </div>
          <button
            id="btn-new-chat-action"
            onClick={onNewChat}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white transition-all shadow-sm cursor-pointer hover:opacity-95"
            style={{
              backgroundColor: palette.accentBg,
            }}
            title="Crear nuevo chat o grupo"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            id="chat-search-input"
            type="text"
            placeholder="Buscar personas, grupos o mensajes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition-colors border"
            style={{
              backgroundColor: palette.chatInputContainerBg,
              borderColor: palette.chatInputBorder,
              color: palette.textPrimary,
            }}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            id="filter-all-btn"
            onClick={() => setActiveFilter('all')}
            className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
            style={
              activeFilter === 'all'
                ? { backgroundColor: palette.accentBg, color: '#ffffff', fontWeight: 600 }
                : { backgroundColor: palette.chatInputContainerBg, color: palette.textSecondary }
            }
          >
            Todos ({chats.length})
          </button>
          <button
            id="filter-unread-btn"
            onClick={() => setActiveFilter('unread')}
            className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
            style={
              activeFilter === 'unread'
                ? { backgroundColor: palette.accentBg, color: '#ffffff', fontWeight: 600 }
                : { backgroundColor: palette.chatInputContainerBg, color: palette.textSecondary }
            }
          >
            No leídos
          </button>
          <button
            id="filter-groups-btn"
            onClick={() => setActiveFilter('groups')}
            className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
            style={
              activeFilter === 'groups'
                ? { backgroundColor: palette.accentBg, color: '#ffffff', fontWeight: 600 }
                : { backgroundColor: palette.chatInputContainerBg, color: palette.textSecondary }
            }
          >
            Grupos
          </button>
          <button
            id="filter-e2ee-btn"
            onClick={() => setActiveFilter('e2ee')}
            className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
            style={
              activeFilter === 'e2ee'
                ? { backgroundColor: palette.accentBg, color: '#ffffff', fontWeight: 600 }
                : { backgroundColor: palette.chatInputContainerBg, color: palette.textSecondary }
            }
          >
            <Lock className="w-2.5 h-2.5" />
            Cifrados
          </button>
        </div>
      </div>

      {/* Chat List Items */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filteredChats.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400 text-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">Sin conversaciones aún</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Inicia un nuevo chat individual o crea un grupo seguro.
              </p>
            </div>
            <button
              id="btn-empty-start-chat"
              onClick={onNewChat}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Chat</span>
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                id={`chat-item-${chat.id}`}
                onClick={() => onSelectChat(chat.id)}
                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border"
                style={{
                  backgroundColor: isSelected ? palette.listActive : undefined,
                  borderColor: isSelected ? `${palette.accentBg}40` : 'transparent',
                }}
              >
                {/* Avatar with type indicator */}
                <div className="relative shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                  {chat.type === 'group' ? (
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] border-2 border-slate-900"
                      title="Grupo de equipo"
                    >
                      <Users className="w-2.5 h-2.5" />
                    </div>
                  ) : (
                    <div
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900"
                      title="En línea"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="font-semibold text-sm truncate"
                        style={{ color: palette.textPrimary }}
                      >
                        {chat.name}
                      </span>
                      {chat.e2eeFingerprint && (
                        <Lock
                          className="w-3 h-3 text-emerald-400 shrink-0"
                          title="Cifrado de Extremo a Extremo Verificado"
                        />
                      )}
                    </div>
                    <span
                      className="text-[11px] shrink-0"
                      style={{ color: palette.textSecondary }}
                    >
                      {chat.lastMessage?.timestamp || ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 truncate pr-2">
                      {chat.lastMessage?.status === 'read' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      ) : chat.lastMessage?.status === 'delivered' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span
                        className="truncate"
                        style={{ color: palette.textSecondary }}
                      >
                        {chat.lastMessage?.text || 'Nueva conversación iniciada'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {chat.meetActiveRoom && (
                        <div
                          className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"
                          title="Sala Google Meet disponible"
                        >
                          <Video className="w-2.5 h-2.5" />
                        </div>
                      )}
                      {chat.isPinned && (
                        <Pin className="w-3 h-3 text-slate-400 fill-slate-400" />
                      )}
                      {chat.unreadCount > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-white text-[10px] font-bold"
                          style={{ backgroundColor: palette.accentBg }}
                        >
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Ultra-Data Status Footer */}
      <div
        className="p-3 border-t flex items-center justify-between text-[11px] text-slate-400"
        style={{ borderColor: isDark ? '#1e293b' : '#e2e8f0' }}
      >
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Modo Ultra Lite activo</span>
        </div>
        <span className="text-slate-500">&lt; 4 KB / msg</span>
      </div>
    </div>
  );
};
