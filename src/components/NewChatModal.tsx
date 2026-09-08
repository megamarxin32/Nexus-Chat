import React, { useState, useMemo } from 'react';
import {
  Users,
  User,
  Plus,
  ShieldCheck,
  Video,
  X,
  Check,
  Bookmark,
  AlertTriangle,
  Mail,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Chat, UserProfile } from '../types';
import { generateFingerprint } from '../data/mockData';
import { accountRegistry, RegisteredAccount } from '../lib/accountRegistry';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (newChat: Chat) => void;
  currentUser: UserProfile;
  existingChats?: Chat[];
  onSelectExistingChat?: (chatId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
  currentUser,
  existingChats = [],
  onSelectExistingChat,
}) => {
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [name, setName] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [topic, setTopic] = useState('');
  const [includeMeet, setIncludeMeet] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Determine if the input matches self, an existing account, or no one
  const searchResult = useMemo(() => {
    const clean = targetUsername.trim().toLowerCase();
    if (!clean) return { type: 'empty' as const };

    // 1. Is it self?
    const isSelfEmail = clean === currentUser.email.toLowerCase();
    const isSelfUsername = clean.replace(/^@/, '') === currentUser.username.toLowerCase();
    if (isSelfEmail || isSelfUsername) {
      return { type: 'self' as const };
    }

    // 2. Is it in the registered account directory?
    const found = accountRegistry.findAccount(clean);
    if (found) {
      return { type: 'found' as const, account: found };
    }

    // 3. Not registered
    return { type: 'not_found' as const, query: targetUsername.trim() };
  }, [targetUsername, currentUser]);

  if (!isOpen) return null;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`https://nexus.chat/join?invite=${encodeURIComponent(currentUser.username)}`);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleSelectSampleUser = (email: string) => {
    setTargetUsername(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (chatType === 'group') {
      if (!name.trim()) return;
      const newChatId = 'chat_group_' + Date.now();
      const createdChat: Chat = {
        id: newChatId,
        name: name.trim(),
        type: 'group',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name.trim()
        )}&background=4f46e5&color=fff&bold=true`,
        topic: topic || 'Canal de colaboración grupal',
        unreadCount: 0,
        isPinned: false,
        members: [currentUser.id, 'usr_valeria_ui', 'usr_carlos_dev'],
        creatorId: currentUser.id,
        adminIds: [currentUser.id],
        e2eeFingerprint: generateFingerprint(),
        meetActiveRoom: includeMeet
          ? `https://meet.google.com/nex-${Math.random().toString(36).substring(2, 6)}-hub`
          : undefined,
        createdAt: new Date().toISOString(),
      };
      onCreateChat(createdChat);
      onClose();
      return;
    }

    // DIRECT CHAT
    if (searchResult.type === 'self') {
      // Check if self chat already exists
      const existingSelfChat = existingChats.find(
        (c) =>
          c.id === `chat_saved_${currentUser.id}` ||
          (c.type === 'direct' && (c.name.includes('(Tú)') || (c.members.length === 1 && c.members[0] === currentUser.id)))
      );

      if (existingSelfChat && onSelectExistingChat) {
        onSelectExistingChat(existingSelfChat.id);
        onClose();
        return;
      }

      // Create new self chat
      const selfChat: Chat = {
        id: `chat_saved_${currentUser.id}`,
        name: 'Mensajes Guardados (Tú)',
        type: 'direct',
        avatar: currentUser.avatar,
        topic: 'Tu bloc de notas personal, enlaces y archivos cifrados',
        unreadCount: 0,
        isPinned: true,
        members: [currentUser.id],
        e2eeFingerprint: currentUser.e2eeFingerprint,
        meetActiveRoom: undefined,
        createdAt: new Date().toISOString(),
      };
      onCreateChat(selfChat);
      onClose();
      return;
    }

    if (searchResult.type === 'found') {
      const acc = searchResult.account;

      // Check if conversation already exists with this user
      const existingWithUser = existingChats.find(
        (c) => c.type === 'direct' && c.members.includes(acc.id)
      );

      if (existingWithUser && onSelectExistingChat) {
        onSelectExistingChat(existingWithUser.id);
        onClose();
        return;
      }

      const createdChat: Chat = {
        id: 'chat_user_' + Date.now(),
        name: acc.displayName,
        type: 'direct',
        avatar: acc.avatar,
        topic: acc.bio || 'Conversación directa segura',
        unreadCount: 0,
        isPinned: false,
        members: [currentUser.id, acc.id],
        e2eeFingerprint: generateFingerprint(),
        meetActiveRoom: includeMeet
          ? `https://meet.google.com/nex-${Math.random().toString(36).substring(2, 6)}-hub`
          : undefined,
        createdAt: new Date().toISOString(),
      };

      onCreateChat(createdChat);
      onClose();
      return;
    }

    if (searchResult.type === 'not_found') {
      const q = searchResult.query.trim();
      if (!q) return;
      const cleanUser = q.replace('@', '').toLowerCase();
      const registered = accountRegistry.registerAccount({
        username: cleanUser,
        displayName: q.replace('@', ''),
        email: q.includes('@') ? q : `${cleanUser}@nexus.chat`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(q)}&background=2563eb&color=fff&bold=true`,
        bio: 'Contacto registrado en Nexus',
      });
      const newAcc = registered.account || {
        id: 'usr_' + Date.now(),
        displayName: q.replace('@', ''),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(q)}&background=2563eb&color=fff&bold=true`,
        bio: 'Contacto verificado',
      };

      const createdChat: Chat = {
        id: 'chat_user_' + Date.now(),
        name: newAcc.displayName,
        type: 'direct',
        avatar: newAcc.avatar,
        topic: newAcc.bio || 'Conversación directa segura',
        unreadCount: 0,
        isPinned: false,
        members: [currentUser.id, newAcc.id],
        e2eeFingerprint: generateFingerprint(),
        meetActiveRoom: includeMeet
          ? `https://meet.google.com/nex-${Math.random().toString(36).substring(2, 6)}-hub`
          : undefined,
        createdAt: new Date().toISOString(),
      };

      onCreateChat(createdChat);
      onClose();
      return;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Nueva Conversación</h3>
              <p className="text-xs text-slate-400">Canal individual o de grupo con cifrado E2EE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setChatType('direct')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              chatType === 'direct'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Chat Individual / Para mí</span>
          </button>

          <button
            type="button"
            onClick={() => setChatType('group')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              chatType === 'group'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Chat Grupal</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {chatType === 'direct' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Correo Electrónico o Usuario de Nexus
                </label>
                <div className="relative">
                  <input
                    id="input-contact-search"
                    type="text"
                    placeholder="ej. valeria.rodriguez@gmail.com o @carlos_dev"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl p-3 bg-slate-800/90 border border-slate-700 text-white outline-none focus:border-blue-500 pr-24"
                  />
                  {/* Quick self-fill button */}
                  <button
                    type="button"
                    onClick={() => setTargetUsername(currentUser.email)}
                    className="absolute right-2 top-2 px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[10px] font-semibold transition-all cursor-pointer"
                    title="Usar mi propio correo para notas personales"
                  >
                    Usar mi correo
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ingresa el correo exacto de la persona o tu propio correo para mensajes guardados.
                </p>
              </div>

              {/* Quick sample chips */}
              <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  Contactos de prueba en el directorio:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectSampleUser('valeria.rodriguez@gmail.com')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>valeria.rodriguez@gmail.com (Google)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSampleUser('carlos.mendoza@gmail.com')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>carlos.mendoza@gmail.com (Google)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSampleUser(currentUser.email)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-500/30 cursor-pointer flex items-center gap-1.5 font-medium"
                  >
                    <Bookmark className="w-3 h-3 text-blue-400" />
                    <span>Mi propio correo ({currentUser.email})</span>
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* CASE 1: USER'S OWN EMAIL (SELF-CHAT / MENSAJES GUARDADOS)    */}
              {/* ------------------------------------------------------------- */}
              {searchResult.type === 'self' && (
                <div
                  id="search-card-self"
                  className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/50 to-blue-900/40 border border-blue-500/40 space-y-3"
                >
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                    <Bookmark className="w-4 h-4 text-blue-400" />
                    <span>¡Reconocido! Es tu propio correo</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-blue-500/20">
                    <div className="relative">
                      <img
                        src={currentUser.avatar}
                        alt="Tú"
                        className="w-11 h-11 rounded-2xl object-cover border border-blue-400/40"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">
                        ★
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white truncate">
                          Mensajes Guardados (Tú)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Tu Espacio
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate">
                        {currentUser.email} • @{currentUser.username}
                      </p>
                      <p className="text-[10px] text-blue-400/80 mt-0.5">
                        Usa este chat para notas rápidas, enlaces, archivos de Google Drive y recordatorios cifrados.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* CASE 2: REGISTERED USER FOUND (PUBLIC PROFILE INFO)          */}
              {/* ------------------------------------------------------------- */}
              {searchResult.type === 'found' && (
                <div
                  id="search-card-found"
                  className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="w-4 h-4" />
                      Cuenta Verificada en Nexus
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Miembro desde {searchResult.account.createdAt}
                    </span>
                  </div>

                  {/* Public Card */}
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="relative shrink-0">
                      <img
                        src={searchResult.account.avatar}
                        alt={searchResult.account.displayName}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                          searchResult.account.status === 'online'
                            ? 'bg-emerald-400'
                            : searchResult.account.status === 'busy'
                            ? 'bg-rose-400'
                            : 'bg-amber-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-white truncate">
                          {searchResult.account.displayName}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          @{searchResult.account.username}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{searchResult.account.email}</span>
                      </div>

                      {/* Google Connection Badge */}
                      <div className="pt-1">
                        {searchResult.account.isGoogleConnected ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-900/30 text-blue-300 border border-blue-500/30 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            <span>Cuenta de Google Verificada (Workspace)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-900/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Cuenta Nexus E2EE Activa</span>
                          </div>
                        )}
                      </div>

                      {searchResult.account.bio && (
                        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                          "{searchResult.account.bio}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CASE 3: NEW ACCOUNT DETECTION */}
              {searchResult.type === 'not_found' && (
                <div
                  id="search-card-not-found"
                  className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-3"
                >
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Nuevo usuario detectado: {searchResult.query}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Al iniciar la conversación, se generarán automáticamente las claves criptográficas E2EE y se registrará la cuenta en el directorio de Nexus para este usuario.
                  </p>

                  {/* Invite Action */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      ¿Quieres compartirle un enlace de invitación?
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                    >
                      {copiedInvite ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>¡Enlace copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copiar enlace</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Directory of all registered accounts (old chats and new accounts) */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Cuentas detectadas en el sistema:
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Chats activos y nuevos
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {accountRegistry
                    .getAllAccounts()
                    .filter((a) => a.id !== currentUser.id)
                    .map((acc) => {
                      const existingChat = existingChats.find(
                        (c) => c.type === 'direct' && c.members.includes(acc.id)
                      );
                      return (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={acc.avatar}
                                alt={acc.displayName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <span
                                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                                  acc.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-semibold text-slate-200 truncate">
                                  {acc.displayName}
                                </p>
                                {acc.isGoogleConnected && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-medium shrink-0">
                                    Google
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                @{acc.username} • {acc.email}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 ml-2">
                            {existingChat ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectExistingChat) {
                                    onSelectExistingChat(existingChat.id);
                                    onClose();
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>Abrir chat</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newChat: Chat = {
                                    id: 'chat_user_' + Date.now(),
                                    name: acc.displayName,
                                    type: 'direct',
                                    avatar: acc.avatar,
                                    topic: acc.bio || 'Conversación directa',
                                    unreadCount: 0,
                                    isPinned: false,
                                    members: [currentUser.id, acc.id],
                                    e2eeFingerprint: generateFingerprint(),
                                    createdAt: new Date().toISOString(),
                                  };
                                  onCreateChat(newChat);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Chatear</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            /* GROUP CHAT FIELDS */
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre del Grupo o Canal
                </label>
                <input
                  type="text"
                  placeholder="Ej. Proyecto Alpha & Google Workspace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Propósito o Tema del Grupo
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sprints, tareas y documentos compartidos"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Include Google Meet link */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-medium text-slate-300 block">
                  Vincular sala de Google Meet
                </span>
                <span className="text-[10px] text-slate-500">
                  Desactivado por defecto. Actívalo si necesitas videollamada permanente.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeMeet}
              onChange={(e) => setIncludeMeet(e.target.checked)}
              className="accent-blue-600 rounded w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>

            {/* ACTION SUBMIT BUTTON: Conditionally active or disabled */}
            {chatType === 'group' ? (
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 cursor-pointer transition-all"
              >
                Crear Grupo Cifrado
              </button>
            ) : searchResult.type === 'self' ? (
              <button
                type="submit"
                id="btn-open-self-chat"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Bookmark className="w-4 h-4" />
                <span>Abrir mis Mensajes Guardados</span>
              </button>
            ) : searchResult.type === 'found' ? (
              <button
                type="submit"
                id="btn-create-direct-chat"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Iniciar Conversación Cifrada</span>
              </button>
            ) : (
              <button
                type="submit"
                id="btn-create-direct-chat"
                disabled={!targetUsername.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  targetUsername.trim()
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Registrar y Chatear</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
