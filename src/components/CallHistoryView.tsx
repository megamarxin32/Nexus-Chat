import React, { useState } from 'react';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  ShieldCheck,
  User,
  Users,
  X,
  Clock,
} from 'lucide-react';
import { CallLog, Chat, ThemeSettings, UserProfile } from '../types';
import { getThemePalette } from '../lib/themePresets';

interface CallHistoryViewProps {
  callLogs: CallLog[];
  chats: Chat[];
  currentUser: UserProfile;
  onStartCallWithContact: (chat: Chat, isVideo: boolean) => void;
  onDeleteCallLog: (callId: string) => void;
  onClearCallLogs: () => void;
  themeSettings: ThemeSettings;
}

export const CallHistoryView: React.FC<CallHistoryViewProps> = ({
  callLogs,
  chats,
  currentUser,
  onStartCallWithContact,
  onDeleteCallLog,
  onClearCallLogs,
  themeSettings,
}) => {
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [newCallSearch, setNewCallSearch] = useState('');

  const palette = getThemePalette(themeSettings);

  const filteredLogs = callLogs.filter((log) => {
    if (filter === 'missed' && log.direction !== 'missed' && log.status !== 'missed') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.contactName.toLowerCase().includes(q) ||
        log.contactUsername?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableChatsToCall = chats.filter((c) => {
    if (c.id.startsWith('chat_saved_')) return false; // Skip saved messages self chat
    if (!newCallSearch.trim()) return true;
    const q = newCallSearch.toLowerCase();
    return c.name.toLowerCase().includes(q);
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div
      id="nexus-call-history-view"
      className="flex-1 flex flex-col h-full overflow-hidden transition-colors"
      style={{
        backgroundColor: palette.chatBg,
      }}
    >
      {/* Top Header */}
      <header
        className="h-16 px-4 md:px-6 flex items-center justify-between border-b shrink-0 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: palette.chatHeaderBg,
          borderColor: palette.chatHeaderBorder,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: palette.accentBg }}
          >
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg" style={{ color: palette.textPrimary }}>
              Historial de llamadas
            </h1>
            <p className="text-xs text-slate-400">
              Llamadas cifradas E2EE y videoconferencias de Google Meet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {callLogs.length > 0 && (
            <button
              onClick={() => {
                if (confirm('¿Vaciar todo el historial de llamadas?')) {
                  onClearCallLogs();
                }
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer"
              title="Borrar historial"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowNewCallModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-all cursor-pointer hover:opacity-95"
            style={{ backgroundColor: palette.accentBg }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva llamada</span>
          </button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div
        className="px-4 md:px-6 py-3 border-b flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
        style={{
          backgroundColor: palette.listBg,
          borderColor: palette.listBorder,
        }}
      >
        {/* Pills: Todas / Perdidas */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({callLogs.length})
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'missed'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Perdidas (
            {
              callLogs.filter((l) => l.direction === 'missed' || l.status === 'missed')
                .length
            }
            )
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por contacto..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Call Logs Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 pb-24 md:pb-6">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-sm mx-auto">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center border shadow-lg"
              style={{
                backgroundColor: `${palette.accentBg}15`,
                borderColor: `${palette.accentBg}30`,
                color: palette.accentBg,
              }}
            >
              <Phone className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-200">
                {filter === 'missed'
                  ? 'No hay llamadas perdidas'
                  : 'Sin llamadas recientes'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inicia una llamada de voz o videollamada Google Meet con cualquier contacto o grupo.
              </p>
            </div>
            <button
              onClick={() => setShowNewCallModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              style={{ backgroundColor: palette.accentBg }}
            >
              <Plus className="w-4 h-4" />
              <span>Hacer una llamada</span>
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-2">
            {filteredLogs.map((log) => {
              const isMissed = log.direction === 'missed' || log.status === 'missed';
              const isIncoming = log.direction === 'incoming';
              const isOutgoing = log.direction === 'outgoing';
              const isVideo = log.type === 'video';

              // Find associated chat
              const matchedChat = chats.find(
                (c) =>
                  c.id === log.chatId ||
                  c.name.toLowerCase() === log.contactName.toLowerCase()
              );

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all hover:bg-slate-900/40"
                  style={{
                    backgroundColor: palette.chatHeaderBg,
                    borderColor: palette.chatHeaderBorder,
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={log.contactAvatar}
                        alt={log.contactName}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-700/60"
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] border-2 border-slate-900 ${
                          isVideo ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {isVideo ? <Video className="w-2.5 h-2.5" /> : <Phone className="w-2.5 h-2.5" />}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isMissed ? 'text-rose-400 font-bold' : ''
                        }`}
                        style={{ color: !isMissed ? palette.textPrimary : undefined }}
                      >
                        {log.contactName}
                      </h4>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        {/* Call direction indicator */}
                        {isMissed ? (
                          <span className="flex items-center gap-1 text-rose-400 font-medium">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Perdida</span>
                          </span>
                        ) : isIncoming ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Entrante</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-400">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Saliente</span>
                          </span>
                        )}

                        <span>•</span>
                        <span>{log.timestamp}</span>

                        {log.durationSeconds && log.durationSeconds > 0 ? (
                          <>
                            <span>•</span>
                            <span className="text-slate-300">
                              {formatDuration(log.durationSeconds)}
                            </span>
                          </>
                        ) : null}

                        {isVideo && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400 font-medium text-[11px]">
                              Google Meet
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Callback Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Audio Call */}
                    <button
                      onClick={() => {
                        if (matchedChat) {
                          onStartCallWithContact(matchedChat, false);
                        } else {
                          // Synthetic call
                          const syntheticChat: Chat = {
                            id: log.chatId || 'chat_' + Date.now(),
                            name: log.contactName,
                            avatar: log.contactAvatar,
                            type: 'direct',
                            unreadCount: 0,
                            members: [currentUser.id],
                            e2eeFingerprint: currentUser.e2eeFingerprint,
                            createdAt: new Date().toISOString(),
                          };
                          onStartCallWithContact(syntheticChat, false);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-all cursor-pointer"
                      title="Devolver llamada de voz"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                    </button>

                    {/* Video Call (Google Meet) */}
                    <button
                      onClick={() => {
                        if (matchedChat) {
                          onStartCallWithContact(matchedChat, true);
                        } else {
                          const syntheticChat: Chat = {
                            id: log.chatId || 'chat_' + Date.now(),
                            name: log.contactName,
                            avatar: log.contactAvatar,
                            type: 'direct',
                            unreadCount: 0,
                            members: [currentUser.id],
                            e2eeFingerprint: currentUser.e2eeFingerprint,
                            createdAt: new Date().toISOString(),
                          };
                          onStartCallWithContact(syntheticChat, true);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-blue-400 transition-all cursor-pointer"
                      title="Devolver videollamada Google Meet"
                    >
                      <Video className="w-4 h-4 text-blue-400" />
                    </button>

                    {/* Delete single log */}
                    <button
                      onClick={() => onDeleteCallLog(log.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sub-modal: Iniciar Nueva Llamada */}
      {showNewCallModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowNewCallModal(false)}
        >
          <div
            className="w-full max-w-md p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Nueva llamada</h3>
              </div>
              <button
                onClick={() => setShowNewCallModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newCallSearch}
                onChange={(e) => setNewCallSearch(e.target.value)}
                placeholder="Buscar contacto o grupo a llamar..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {availableChatsToCall.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No hay contactos disponibles. Agrega contactos o crea chats primero.
                </div>
              ) : (
                availableChatsToCall.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={chat.avatar}
                        alt={chat.name}
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-200 block truncate">
                          {chat.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {chat.type === 'group' ? 'Grupo' : 'Contacto directo'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setShowNewCallModal(false);
                          onStartCallWithContact(chat, false);
                        }}
                        className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                        title="Llamada de voz"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setShowNewCallModal(false);
                          onStartCallWithContact(chat, true);
                        }}
                        className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                        title="Videollamada Google Meet"
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowNewCallModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
