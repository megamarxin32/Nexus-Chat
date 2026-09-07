import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Phone,
  Lock,
  MoreVertical,
  Paperclip,
  Send,
  Sparkles,
  CheckCheck,
  Check,
  Image as ImageIcon,
  FileText,
  Mic,
  Zap,
  ShieldCheck,
  Info,
  Calendar,
  Plus,
  ExternalLink,
  ChevronDown,
  Briefcase,
  X,
} from 'lucide-react';
import { Chat, Message, UserProfile, ThemeSettings, MessageAttachment } from '../types';
import { dataSaver } from '../lib/dataSaver';
import { encryptE2EEMessage, decryptE2EEMessage } from '../lib/crypto';
import { notificationService } from '../lib/notifications';
import { ChatWallpaper } from './ChatWallpaper';
import { ChatInfoModal } from './ChatInfoModal';
import { BUBBLE_COLOR_MAP, getThemePalette } from '../lib/themePresets';

interface ChatAreaProps {
  chat?: Chat | null;
  messages: Message[];
  currentUser: UserProfile;
  onSendMessage: (text: string, attachments?: MessageAttachment[]) => void;
  onStartCall: (isVideo: boolean) => void;
  onOpenWorkspaceHub: () => void;
  onOpenSecurityModal: () => void;
  onNewChat?: () => void;
  onEndMeetRoom?: (chatId: string) => void;
  onUpdateChat?: (updatedChat: Chat) => void;
  onDeleteChat?: (chatId: string) => void;
  onStartDirectChat?: (userIdOrEmail: string) => void;
  themeSettings: ThemeSettings;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  currentUser,
  onSendMessage,
  onStartCall,
  onOpenWorkspaceHub,
  onOpenSecurityModal,
  onNewChat,
  onEndMeetRoom,
  onUpdateChat,
  onDeleteChat,
  onStartDirectChat,
  themeSettings,
}) => {
  const [inputText, setInputText] = useState('');
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showChatInfoModal, setShowChatInfoModal] = useState(false);
  const [downloadedMedia, setDownloadedMedia] = useState<Record<string, boolean>>({});
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioTimer, setAudioTimer] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Request Smart Replies from Gemini API on chat switch or last message
  useEffect(() => {
    let isMounted = true;
    if (!chat?.id || messages.length === 0) {
      setSmartReplies([]);
      return;
    }

    const fetchSmartReplies = async () => {
      try {
        const res = await fetch('/api/ai/chat-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'smart-replies',
            messages: messages.slice(-4).map((m) => ({ sender: m.senderName, text: m.text })),
            isDataSaver: themeSettings.dataSaverEnabled,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.replies && Array.isArray(data.replies)) {
            setSmartReplies(data.replies);
          }
        }
      } catch (err) {
        console.warn('Smart replies fallback active');
      }
    };

    fetchSmartReplies();
    return () => {
      isMounted = false;
    };
  }, [chat?.id, messages.length, themeSettings.dataSaverEnabled]);

  // Audio recording timer simulation
  useEffect(() => {
    let interval: any;
    if (isRecordingAudio) {
      interval = setInterval(() => {
        setAudioTimer((t) => t + 1);
      }, 1000);
    } else {
      setAudioTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingAudio]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (themeSettings.sendWithEnter) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    } else {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleSmartReplyClick = (reply: string) => {
    onSendMessage(reply);
  };

  const handleAiToneAdjust = async (tone: 'formal' | 'concise' | 'friendly') => {
    if (!inputText.trim()) return;
    setIsAiLoading(true);
    setShowAiMenu(false);
    try {
      const res = await fetch('/api/ai/chat-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rewrite-tone',
          prompt: inputText,
          tone,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setInputText(data.result);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Summarize chat with Gemini
  const handleSummarizeThread = async () => {
    setIsAiLoading(true);
    setShowAiMenu(false);
    try {
      const res = await fetch('/api/ai/chat-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          messages: messages.map((m) => ({ sender: m.senderName, text: m.text })),
          isDataSaver: themeSettings.dataSaverEnabled,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          onSendMessage(`📋 **Resumen de Gemini AI del equipo:**\n${data.result}`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle file uploads (HD vs Data Saver Compressed)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowAttachMenu(false);
    let attachment: MessageAttachment;

    if (file.type.startsWith('image/')) {
      if (themeSettings.dataSaverEnabled) {
        // Compress image client-side to save bandwidth
        const { dataUrl, sizeBytes } = await dataSaver.compressImage(file, 0.4, 600);
        dataSaver.recordTransfer(sizeBytes, 'sent', file.size);
        attachment = {
          id: 'att_' + Date.now(),
          name: file.name,
          type: 'image',
          url: dataUrl,
          sizeBytes,
          quality: 'compressed_lite',
          mimeType: file.type,
        };
      } else {
        // Original HD file
        const reader = new FileReader();
        reader.onload = () => {
          dataSaver.recordTransfer(file.size, 'sent');
          const hdAttachment: MessageAttachment = {
            id: 'att_' + Date.now(),
            name: file.name,
            type: 'image',
            url: reader.result as string,
            sizeBytes: file.size,
            quality: 'original_hd',
            mimeType: file.type,
          };
          onSendMessage(`📸 Envío de foto en Alta Definición (${(file.size / 1024).toFixed(0)} KB)`, [hdAttachment]);
        };
        reader.readAsDataURL(file);
        return;
      }
    } else {
      // Document
      dataSaver.recordTransfer(file.size, 'sent');
      attachment = {
        id: 'att_' + Date.now(),
        name: file.name,
        type: 'doc',
        url: '#',
        sizeBytes: file.size,
        quality: 'original_hd',
        mimeType: file.type || 'application/octet-stream',
      };
    }

    onSendMessage(`📎 Archivo adjunto: ${file.name}`, [attachment]);
  };

  // Toggle voice recording
  const handleToggleAudioRecord = () => {
    if (isRecordingAudio) {
      // Finish recording and send
      setIsRecordingAudio(false);
      const audioAttachment: MessageAttachment = {
        id: 'aud_' + Date.now(),
        name: `Nota_de_voz_${audioTimer}s.aac`,
        type: 'audio',
        url: '#',
        sizeBytes: audioTimer * 1200,
        quality: themeSettings.dataSaverEnabled ? 'compressed_lite' : 'original_hd',
        mimeType: 'audio/aac',
      };
      onSendMessage(`🎤 Nota de voz (${audioTimer}s) [Cifrado E2EE]`, [audioAttachment]);
    } else {
      setIsRecordingAudio(true);
    }
  };

  const isDark = themeSettings.mode !== 'light';
  const palette = getThemePalette(themeSettings);

  if (!chat) {
    return (
      <div
        id="nexus-chat-area-empty"
        className="flex-1 flex flex-col items-center justify-center p-6 text-center transition-colors relative overflow-hidden"
        style={{
          backgroundColor: palette.chatBg,
        }}
      >
        <ChatWallpaper settings={themeSettings} />
        <div
          className="max-w-md w-full p-8 rounded-3xl border space-y-6 flex flex-col items-center relative z-10 backdrop-blur-md shadow-lg"
          style={{
            backgroundColor: palette.chatHeaderBg,
            borderColor: palette.chatHeaderBorder,
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: `${palette.accentBg}20`,
              borderColor: `${palette.accentBg}40`,
              color: palette.accentBg,
            }}
          >
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2
              className="text-xl font-bold"
              style={{ color: palette.textPrimary }}
            >
              Nexus Chat & Team Hub
            </h2>
            <p
              className="text-xs leading-relaxed"
              style={{ color: palette.textSecondary }}
            >
              Mensajería segura con cifrado de extremo a extremo (E2EE) y acceso directo al ecosistema de Google Workspace.
            </p>
          </div>

          <div className="w-full space-y-2.5">
            {onNewChat && (
              <button
                id="btn-empty-new-chat"
                onClick={onNewChat}
                className="w-full py-3 px-4 rounded-2xl text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:opacity-95"
                style={{
                  backgroundColor: palette.accentBg,
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Iniciar una nueva conversación</span>
              </button>
            )}

            <button
              id="btn-empty-workspace"
              onClick={onOpenWorkspaceHub}
              className="w-full py-3 px-4 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border hover:opacity-90"
              style={{
                backgroundColor: palette.chatInputContainerBg,
                borderColor: palette.chatInputBorder,
                color: palette.textPrimary,
              }}
            >
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Explorar Google Workspace Hub</span>
            </button>
          </div>

          <div
            className="flex items-center gap-4 text-[11px] pt-2 border-t w-full justify-center"
            style={{
              borderColor: palette.chatHeaderBorder,
              color: palette.textSecondary,
            }}
          >
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              AES-GCM 256
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              Ultra Lite &lt;4KB
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="nexus-chat-area-main"
      className="flex-1 flex flex-col h-full relative overflow-hidden transition-colors"
      style={{
        backgroundColor: palette.chatBg,
      }}
    >
      {/* Dynamic Vector/Image Wallpaper (fixed canvas background behind messages) */}
      <ChatWallpaper settings={themeSettings} />

      {/* Top Header */}
      <header
        id="chat-header-bar"
        className="h-16 px-4 md:px-6 flex items-center justify-between border-b relative z-20 shrink-0 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: palette.chatHeaderBg,
          borderColor: palette.chatHeaderBorder,
        }}
      >
        <div
          id="chat-header-info-trigger"
          onClick={() => setShowChatInfoModal(true)}
          className="flex items-center gap-3 min-w-0 cursor-pointer group hover:opacity-90 transition-all select-none p-1 rounded-2xl hover:bg-slate-800/30"
          title={chat.type === 'group' ? 'Toca para ver información y miembros del grupo' : 'Toca para ver información del contacto'}
        >
          <div className="relative shrink-0">
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-10 h-10 rounded-2xl object-cover border border-slate-700/50 group-hover:scale-105 transition-transform"
            />
            {chat.type === 'group' ? (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-slate-900" />
            ) : (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                className="font-bold text-sm md:text-base truncate group-hover:underline decoration-slate-400/50 underline-offset-2"
                style={{ color: palette.textPrimary }}
              >
                {chat.name}
              </h2>
              {/* E2EE Safety Lock Badge */}
              <button
                id="btn-verify-e2ee-header"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSecurityModal();
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-all shrink-0"
                title="Cifrado de extremo a extremo activo. Clic para verificar huella de seguridad (60 dígitos)."
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">E2EE Verificado</span>
              </button>
            </div>
            <p
              className="text-xs truncate text-slate-400 group-hover:text-slate-300 transition-colors"
            >
              {chat.type === 'group'
                ? `${chat.members.length} miembros • Toca para ver info del grupo`
                : 'En línea • Toca para ver perfil'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Chat Info button */}
          <button
            id="btn-open-chat-info-header"
            onClick={() => setShowChatInfoModal(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            title={chat.type === 'group' ? 'Información y miembros del grupo' : 'Información del contacto'}
          >
            <Info className="w-4 h-4" />
          </button>
          {/* Google Meet Voice Call */}
          <button
            id="btn-call-audio"
            onClick={() => onStartCall(false)}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60 transition-all"
            title="Llamada de voz con Google Meet"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Google Meet Video Call */}
          <button
            id="btn-call-video"
            onClick={() => onStartCall(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-all shadow-sm"
            title="Iniciar videollamada Google Meet"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Google Workspace Hub Quick Launcher */}
          <button
            id="btn-workspace-quick"
            onClick={onOpenWorkspaceHub}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-xs font-medium transition-all"
            title="Abrir herramientas de Google Workspace (Drive, Calendar, Docs, etc.)"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Workspace</span>
          </button>

          {/* Gemini Chat Summarizer Button */}
          <button
            id="btn-summarize-gemini"
            onClick={handleSummarizeThread}
            disabled={isAiLoading}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-purple-400 hover:bg-purple-600/20 transition-all"
            title="Resumir este chat con Gemini AI"
          >
            <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Meet Active Room Banner if room exists */}
      {chat.meetActiveRoom && (
        <div className="bg-emerald-950/70 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs text-emerald-300 relative z-20 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">
              Sala de Google Meet activa:{' '}
              <a
                href={chat.meetActiveRoom}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-mono underline hover:text-emerald-200"
              >
                {chat.meetActiveRoom}
              </a>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onStartCall(true)}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm cursor-pointer"
            >
              <Video className="w-3 h-3" />
              <span>Unirse</span>
            </button>
            <button
              id="btn-dismiss-meet-room"
              onClick={() => onEndMeetRoom && onEndMeetRoom(chat.id)}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700/80 hover:border-rose-500/40 transition-all cursor-pointer"
              title="Finalizar y cerrar esta sala de reunión"
            >
              <X className="w-3.5 h-3.5" />
              <span>Finalizar sala</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages Stream Container */}
      <div
        id="nexus-messages-stream"
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative z-10"
      >
        {/* Security Announcement Card */}
        <div className="relative z-10 max-w-md mx-auto my-2 p-3 rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 text-center text-xs text-slate-400 shadow-sm flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cifrado de Extremo a Extremo Verificado (AES-GCM 256)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Los mensajes, llamadas y archivos adjuntos están protegidos criptográficamente. Nadie fuera de este chat puede leerlos.
          </p>
          <button
            onClick={onOpenSecurityModal}
            className="text-[10px] text-blue-400 hover:underline mt-0.5 cursor-pointer"
          >
            Ver huella de seguridad y verificar claves
          </button>
        </div>

        {/* Empty Conversation State */}
        {messages.length === 0 && (
          <div className="relative z-10 text-center py-10 px-4 text-xs text-slate-400 max-w-sm mx-auto space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-200 text-sm">Esta conversación está lista</p>
            <p className="text-slate-400">
              Envía tu primer mensaje para iniciar el intercambio seguro protegido por cifrado E2EE.
            </p>
          </div>
        )}

        {/* Message Items with Customized Styles (WhatsApp, Telegram, Discord, Nexus) */}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const currentBubble = BUBBLE_COLOR_MAP[themeSettings.chatBubbleColor] || BUBBLE_COLOR_MAP.blue;
          const bubbleStyle = themeSettings.chatBubbleStyle || 'whatsapp';
          const fontSizeClass =
            themeSettings.fontSize === 'compact'
              ? 'text-xs'
              : themeSettings.fontSize === 'large'
              ? 'text-base'
              : 'text-sm';

          // 1. DISCORD-STYLE STREAM LAYOUT
          if (bubbleStyle === 'discord') {
            return (
              <div
                key={msg.id}
                id={`message-bubble-${msg.id}`}
                className={`relative z-10 w-full flex items-start gap-3 p-2 rounded-2xl transition-colors group hover:bg-slate-800/40 ${
                  isMe ? 'bg-slate-800/15' : ''
                }`}
              >
                <img
                  src={isMe ? currentUser.avatar : msg.senderAvatar}
                  alt={isMe ? currentUser.displayName : msg.senderName}
                  className="w-9 h-9 rounded-2xl object-cover shrink-0 mt-0.5 border border-slate-700 shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs text-white">
                      {isMe ? currentUser.displayName : msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                    <span title="Cifrado E2EE">
                      <Lock className="w-2.5 h-2.5 text-emerald-400 inline" />
                    </span>
                    {isMe && (
                      <span className="ml-auto">
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                        )}
                      </span>
                    )}
                  </div>
                  <div
                    className={`whitespace-pre-wrap break-words ${fontSizeClass} leading-relaxed`}
                    style={{ color: palette.textPrimary }}
                  >
                    {msg.text}
                  </div>
                  {/* Attachments rendering */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((att) => {
                        const isDownloaded = !themeSettings.dataSaverEnabled || downloadedMedia[att.id];
                        if (att.type === 'image') {
                          return (
                            <div key={att.id} className="rounded-xl overflow-hidden border border-slate-700/60 bg-black/20 max-w-sm">
                              {isDownloaded ? (
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-full max-h-72 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                  onClick={() => window.open(att.url, '_blank')}
                                />
                              ) : (
                                <div className="p-4 flex flex-col items-center justify-center gap-2 bg-slate-900/80 text-center">
                                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                                  <span className="text-xs text-slate-200">Foto ({dataSaver.formatBytes(att.sizeBytes)})</span>
                                  <button
                                    onClick={() => {
                                      setDownloadedMedia((prev) => ({ ...prev, [att.id]: true }));
                                      dataSaver.recordTransfer(att.sizeBytes, 'received');
                                    }}
                                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs"
                                  >
                                    Descargar
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div key={att.id} className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-slate-700/50 text-xs max-w-sm">
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="truncate flex-1">{att.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // 2. WHATSAPP & TELEGRAM & BUBBLE MODES
          const bubbleShapeClass =
            bubbleStyle === 'telegram'
              ? 'rounded-3xl'
              : isMe
              ? 'rounded-2xl rounded-br-xs'
              : 'rounded-2xl rounded-bl-xs';

          return (
            <div
              key={msg.id}
              id={`message-bubble-${msg.id}`}
              className={`relative z-10 flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
            >
              {/* Group sender name */}
              {chat.type === 'group' && !isMe && (
                <div className="flex items-center gap-1.5 mb-1 ml-1 text-xs text-slate-400 font-medium">
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span>{msg.senderName}</span>
                </div>
              )}

              {/* Bubble Body with Dynamic Colors and Shape */}
              <div
                className={`relative max-w-[85%] sm:max-w-md md:max-w-lg px-4 py-2.5 shadow-md transition-all ${fontSizeClass} leading-relaxed ${bubbleShapeClass} border`}
                style={
                  isMe
                    ? {
                        backgroundColor: currentBubble.bg,
                        color: currentBubble.text,
                        borderColor: 'transparent',
                      }
                    : {
                        backgroundColor: palette.incomingBubbleBg,
                        color: palette.incomingBubbleText,
                        borderColor: palette.incomingBubbleBorder,
                      }
                }
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                {/* Attachments rendering */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((att) => {
                      const isDownloaded =
                        !themeSettings.dataSaverEnabled || downloadedMedia[att.id];

                      if (att.type === 'image') {
                        return (
                          <div
                            key={att.id}
                            className="rounded-xl overflow-hidden border border-slate-700/60 bg-black/20"
                          >
                            {isDownloaded ? (
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-full max-h-72 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(att.url, '_blank')}
                              />
                            ) : (
                              /* Data-saver preview placeholder */
                              <div className="p-4 flex flex-col items-center justify-center gap-2 bg-slate-900/80 text-center">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-slate-200">
                                  Foto en calidad HD ({dataSaver.formatBytes(att.sizeBytes)})
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Modo Ultra Ahorro activo: toca para descargar
                                </span>
                                <button
                                  onClick={() => {
                                    setDownloadedMedia((prev) => ({ ...prev, [att.id]: true }));
                                    dataSaver.recordTransfer(att.sizeBytes, 'received');
                                  }}
                                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                                >
                                  <Zap className="w-3 h-3" />
                                  <span>Descargar ({dataSaver.formatBytes(att.sizeBytes)})</span>
                                </button>
                              </div>
                            )}
                            <div className="p-1.5 px-2 bg-black/40 text-[10px] flex items-center justify-between text-slate-300">
                              <span className="truncate">{att.name}</span>
                              <span className="font-mono text-emerald-400">
                                {att.quality === 'original_hd' ? 'HD Original' : 'Ultra-Lite'}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={att.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-black/20 border border-slate-700/50 text-xs"
                        >
                          <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{att.name}</p>
                            <p className="text-[10px] text-slate-300 opacity-80">
                              {dataSaver.formatBytes(att.sizeBytes)} • Cifrado E2EE
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                            Listo
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bubble Footer: Timestamp, E2EE check & Status */}
                <div
                  className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] select-none ${
                    isMe ? 'opacity-85' : 'text-slate-400'
                  }`}
                >
                  <span title="Cifrado E2EE verificado por SHA-256">
                    <Lock className="w-2.5 h-2.5 text-emerald-400 inline mr-0.5" />
                  </span>
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-3.5 h-3.5 opacity-70 inline" />
                      ) : (
                        <Check className="w-3.5 h-3.5 opacity-70 inline" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Gemini AI Smart Replies Pill Carousel */}
      {smartReplies.length > 0 && (
        <div
          id="gemini-smart-replies-bar"
          className="px-4 py-2 border-t flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 backdrop-blur-sm"
          style={{
            backgroundColor:
              themeSettings.mode === 'oled'
                ? '#050505'
                : isDark
                ? '#0e1726'
                : '#f1f5f9',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          }}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 shrink-0 pr-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sugerencias IA:</span>
          </div>
          {smartReplies.map((reply, idx) => (
            <button
              key={idx}
              id={`smart-reply-${idx}`}
              onClick={() => handleSmartReplyClick(reply)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-purple-600/30 hover:border-purple-500/50 border border-slate-700/60 text-slate-200 whitespace-nowrap transition-all shadow-xs shrink-0"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Message Composer Footer */}
      <footer
        id="nexus-composer-footer"
        className="p-3 md:p-4 border-t shrink-0 relative z-20 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: palette.chatHeaderBg,
          borderColor: palette.chatHeaderBorder,
        }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,video/*,application/pdf,.doc,.docx"
        />

        {/* Attachment Popup Menu */}
        {showAttachMenu && (
          <div
            className="absolute bottom-18 left-4 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-1 z-30 min-w-56"
          >
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Adjuntar archivo
            </div>
            <button
              onClick={() => {
                setShowAttachMenu(false);
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-medium">Foto o Video HD</p>
                <p className="text-[10px] text-slate-400">
                  {themeSettings.dataSaverEnabled ? 'Compresión optimizada Lite' : 'Calidad original sin pérdida'}
                </p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowAttachMenu(false);
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <div>
                <p className="font-medium">Documento</p>
                <p className="text-[10px] text-slate-400">PDF, Word, Hojas de cálculo</p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowAttachMenu(false);
                onOpenWorkspaceHub();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left border-t border-slate-800"
            >
              <div className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px]">
                ▲
              </div>
              <div>
                <p className="font-medium">Vincular desde Google Drive</p>
                <p className="text-[10px] text-slate-400">Archivos sincronizados del equipo</p>
              </div>
            </button>
          </div>
        )}

        {/* Gemini AI Adjust Tone Popup Menu */}
        {showAiMenu && (
          <div
            className="absolute bottom-18 right-16 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-1 z-30 min-w-56"
          >
            <div className="px-3 py-1 text-[11px] font-semibold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini AI Editor</span>
            </div>
            <button
              onClick={() => handleAiToneAdjust('formal')}
              className="px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 text-left transition-colors"
            >
              💼 Reescribir en tono Formal y Ejecutivo
            </button>
            <button
              onClick={() => handleAiToneAdjust('concise')}
              className="px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 text-left transition-colors"
            >
              ⚡ Hacer Ultra Conciso (Ahorro de lectura)
            </button>
            <button
              onClick={() => handleAiToneAdjust('friendly')}
              className="px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 text-left transition-colors"
            >
              🤝 Tono Amigable y Motivador
            </button>
            <button
              onClick={handleSummarizeThread}
              className="px-3 py-2 rounded-xl text-xs text-purple-300 hover:bg-purple-900/30 text-left transition-colors border-t border-slate-800"
            >
              📋 Resumir últimos mensajes de este chat
            </button>
          </div>
        )}

        {/* Audio Recording Banner if active */}
        {isRecordingAudio ? (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="font-semibold text-sm">Grabando nota de voz E2EE...</span>
              <span className="font-mono text-xs bg-rose-500/20 px-2 py-0.5 rounded-full">
                00:{audioTimer.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRecordingAudio(false)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleAudioRecord}
                className="text-xs px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
              >
                Enviar audio
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Bar */
          <div className="flex items-end gap-2">
            {/* Attachment Button */}
            <button
              id="btn-attach-file"
              onClick={() => setShowAttachMenu((v) => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all shrink-0"
              title="Adjuntar archivo o imagen"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Input Text Area */}
            <div
              className="flex-1 flex items-center rounded-2xl border px-3.5 py-1.5 transition-colors"
              style={{
                backgroundColor: palette.chatInputContainerBg,
                borderColor: palette.chatInputBorder,
              }}
            >
              <textarea
                id="message-input-textarea"
                rows={1}
                placeholder="Escribe un mensaje cifrado E2EE..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent resize-none outline-none text-sm py-1.5 max-h-28"
                style={{
                  color: palette.chatInputText,
                }}
              />

              {/* Gemini Tone Adjuster Toggle */}
              {inputText.trim().length > 3 && (
                <button
                  onClick={() => setShowAiMenu((v) => !v)}
                  className="text-purple-400 hover:text-purple-300 p-1 shrink-0 transition-colors"
                  title="Ajustar tono con Gemini AI"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Voice Recorder button (if input is empty) or Send button */}
            {inputText.trim().length === 0 ? (
              <button
                id="btn-record-voice"
                onClick={handleToggleAudioRecord}
                className="flex items-center justify-center w-10 h-10 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
                title="Grabar nota de voz cifrada"
              >
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <button
                id="btn-send-message"
                onClick={handleSend}
                className="flex items-center justify-center w-10 h-10 rounded-2xl text-white transition-all shadow-md shrink-0 cursor-pointer"
                style={{
                  backgroundColor: palette.accentBg,
                }}
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </footer>

      {/* Chat / Group / Contact Information Modal */}
      {showChatInfoModal && (
        <ChatInfoModal
          isOpen={showChatInfoModal}
          onClose={() => setShowChatInfoModal(false)}
          chat={chat}
          currentUser={currentUser}
          onUpdateChat={(updated) => {
            if (onUpdateChat) onUpdateChat(updated);
          }}
          onDeleteChat={(chatId) => {
            if (onDeleteChat) onDeleteChat(chatId);
          }}
          onStartDirectChat={onStartDirectChat}
          onStartCall={onStartCall}
          themeSettings={themeSettings}
        />
      )}
    </div>
  );
};
