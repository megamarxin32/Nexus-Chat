import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Phone,
  Video,
  User,
  Users,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  MoreVertical,
  Edit2,
  Check,
  Trash2,
  LogOut,
  Mail,
  Copy,
  ExternalLink,
  Search,
  MessageSquare,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Chat, UserProfile, ThemeSettings } from '../types';
import { accountRegistry, RegisteredAccount } from '../lib/accountRegistry';
import { getThemePalette } from '../lib/themePresets';

interface ChatInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat | null;
  currentUser: UserProfile;
  onUpdateChat: (updatedChat: Chat) => void;
  onDeleteChat?: (chatId: string) => void;
  onStartDirectChat?: (userIdOrEmail: string) => void;
  onStartCall: (isVideo: boolean) => void;
  themeSettings: ThemeSettings;
}

export const ChatInfoModal: React.FC<ChatInfoModalProps> = ({
  isOpen,
  onClose,
  chat,
  currentUser,
  onUpdateChat,
  onDeleteChat,
  onStartDirectChat,
  onStartCall,
  themeSettings,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editedTopic, setEditedTopic] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'leave' | 'deleteGroup' | 'deleteChat' | null>(null);

  const palette = getThemePalette(themeSettings);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isOpen || !chat) return null;

  const isGroup = chat.type === 'group';

  // Group creator identification
  const creatorId = chat.creatorId || chat.members[0] || currentUser.id;
  const isCreator = currentUser.id === creatorId;
  const adminIds = chat.adminIds || (isCreator ? [creatorId] : [chat.members[0]]);
  const isAdmin = adminIds.includes(currentUser.id) || isCreator;

  // Resolve all members info
  const allAccounts = accountRegistry.getAllAccounts();
  const membersList = useMemo(() => {
    return chat.members.map((memberId) => {
      if (memberId === currentUser.id) {
        return {
          id: currentUser.id,
          displayName: currentUser.displayName,
          username: currentUser.username,
          email: currentUser.email,
          avatar: currentUser.avatar,
          bio: currentUser.bio || currentUser.statusMessage,
          isCurrent: true,
          isCreator: memberId === creatorId,
          isAdmin: adminIds.includes(memberId) || memberId === creatorId,
        };
      }

      const acc = allAccounts.find((a) => a.id === memberId);
      if (acc) {
        return {
          id: acc.id,
          displayName: acc.displayName,
          username: acc.username,
          email: acc.email,
          avatar: acc.avatar,
          bio: acc.bio,
          isCurrent: false,
          isCreator: memberId === creatorId,
          isAdmin: adminIds.includes(memberId) || memberId === creatorId,
        };
      }

      // Fallback synthetic member
      const cleanName = memberId.replace(/[^a-zA-Z0-9_]/g, '');
      return {
        id: memberId,
        displayName: memberId.startsWith('usr_') ? 'Usuario Nexus' : memberId,
        username: cleanName.slice(0, 12),
        email: `${cleanName}@nexus.chat`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=3b82f6&color=fff&bold=true`,
        bio: 'Miembro del grupo',
        isCurrent: false,
        isCreator: memberId === creatorId,
        isAdmin: adminIds.includes(memberId) || memberId === creatorId,
      };
    });
  }, [chat.members, currentUser, creatorId, adminIds, allAccounts]);

  const filteredMembers = membersList.filter((m) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      m.displayName.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  // Available users to add to group
  const availableUsersToAdd = allAccounts.filter(
    (acc) =>
      !chat.members.includes(acc.id) &&
      acc.id !== currentUser.id &&
      (addMemberSearch.trim() === '' ||
        acc.displayName.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
        acc.username.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
        acc.email.toLowerCase().includes(addMemberSearch.toLowerCase()))
  );

  // Handlers for Group Admin & Member Actions (WhatsApp rules)
  const handleSaveName = () => {
    if (!editedName.trim()) return;
    onUpdateChat({
      ...chat,
      name: editedName.trim(),
    });
    setIsEditingName(false);
  };

  const handleSaveTopic = () => {
    onUpdateChat({
      ...chat,
      topic: editedTopic.trim(),
    });
    setIsEditingTopic(false);
  };

  // 1. Only Creator can designate Admins
  const handlePromoteToAdmin = (targetId: string) => {
    if (!isCreator) return;
    if (adminIds.includes(targetId)) return;

    const newAdmins = [...adminIds, targetId];
    onUpdateChat({
      ...chat,
      adminIds: newAdmins,
    });
    setActiveMenuMemberId(null);
  };

  // 2. Only Creator can demote/remove Admins
  const handleDemoteAdmin = (targetId: string) => {
    if (!isCreator) return;
    if (targetId === creatorId) return; // Cannot demote creator

    const newAdmins = adminIds.filter((id) => id !== targetId);
    onUpdateChat({
      ...chat,
      adminIds: newAdmins,
    });
    setActiveMenuMemberId(null);
  };

  // 3. Remove member from group:
  // Creator can remove anyone except self.
  // Admins can remove non-admin members.
  const handleRemoveMember = (targetId: string) => {
    if (targetId === creatorId) return; // Creator cannot be removed by anyone

    const isTargetAdmin = adminIds.includes(targetId);
    if (!isCreator && isTargetAdmin) {
      showToast('Solo el creador del grupo puede eliminar o cambiar administradores.');
      return;
    }

    if (!isAdmin) {
      showToast('Solo los administradores o el creador pueden eliminar miembros.');
      return;
    }

    const newMembers = chat.members.filter((id) => id !== targetId);
    const newAdmins = adminIds.filter((id) => id !== targetId);

    onUpdateChat({
      ...chat,
      members: newMembers,
      adminIds: newAdmins,
    });

    setConfirmRemoveMember(null);
    setActiveMenuMemberId(null);
    showToast('Miembro eliminado del grupo');
  };

  // 4. Add new member (Admins or Creator)
  const handleAddMember = (account: RegisteredAccount) => {
    if (!isAdmin) return;
    if (chat.members.includes(account.id)) return;

    const newMembers = [...chat.members, account.id];
    onUpdateChat({
      ...chat,
      members: newMembers,
    });
    setShowAddMemberModal(false);
    showToast('Miembro añadido al grupo');
  };

  // 5. Leave group (CurrentUser)
  const executeLeaveGroup = () => {
    const newMembers = chat.members.filter((id) => id !== currentUser.id);
    const newAdmins = adminIds.filter((id) => id !== currentUser.id);

    if (newMembers.length === 0 && onDeleteChat) {
      onDeleteChat(chat.id);
    } else {
      onUpdateChat({
        ...chat,
        members: newMembers,
        adminIds: newAdmins,
        creatorId: isCreator ? newMembers[0] : creatorId,
      });
    }
    setConfirmAction(null);
    onClose();
  };

  const handleCopySecurityCode = () => {
    navigator.clipboard.writeText(chat.e2eeFingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  return (
    <div
      id="chat-info-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="chat-info-modal-container"
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all"
        style={{
          backgroundColor: palette.chatHeaderBg,
          borderColor: palette.chatHeaderBorder,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: palette.chatHeaderBorder }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold" style={{ color: palette.textPrimary }}>
              {isGroup ? 'Información del grupo' : 'Información del contacto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Top Profile Summary */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-24 h-24 rounded-3xl object-cover border-2 shadow-md"
                style={{ borderColor: palette.accentBg }}
              />
              <div
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-md border-2 border-slate-900"
                style={{
                  backgroundColor: isGroup ? '#4f46e5' : '#10b981',
                }}
              >
                {isGroup ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
            </div>

            {/* Name with edit capability for admins */}
            <div className="w-full max-w-sm">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl text-sm border bg-slate-900/60 text-white focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold" style={{ color: palette.textPrimary }}>
                    {chat.name}
                  </h3>
                  {isGroup && isAdmin && (
                    <button
                      onClick={() => {
                        setEditedName(chat.name);
                        setIsEditingName(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      title="Editar nombre del grupo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Subtitle / Topic */}
              {isGroup ? (
                isEditingTopic ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={editedTopic}
                      onChange={(e) => setEditedTopic(e.target.value)}
                      placeholder="Descripción del grupo..."
                      className="flex-1 px-3 py-1 text-xs rounded-xl border bg-slate-900/60 text-white focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTopic}
                      className="p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsEditingTopic(false)}
                      className="p-1 rounded-lg bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <p className="text-xs text-slate-400">
                      {chat.topic || 'Sin descripción de grupo'}
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setEditedTopic(chat.topic || '');
                          setIsEditingTopic(true);
                        }}
                        className="p-0.5 rounded text-slate-500 hover:text-slate-300 cursor-pointer"
                        title="Editar descripción"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">
                  {membersList.find((m) => !m.isCurrent)?.email || 'Contacto Verificado'}
                </p>
              )}
            </div>

            {/* Fast Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onStartCall(false);
                }}
                className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700/50 transition-all cursor-pointer min-w-[70px]"
              >
                <Phone className="w-5 h-5 text-emerald-400" />
                <span className="text-[11px] font-medium">Llamar</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onStartCall(true);
                }}
                className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-blue-400 border border-slate-700/50 transition-all cursor-pointer min-w-[70px]"
              >
                <Video className="w-5 h-5 text-blue-400" />
                <span className="text-[11px] font-medium">Video Meet</span>
              </button>

              {chat.meetActiveRoom && (
                <a
                  href={chat.meetActiveRoom}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all min-w-[70px]"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span className="text-[11px] font-medium">Unirse</span>
                </a>
              )}
            </div>
          </div>

          {/* Group Details: Creator & Date info */}
          {isGroup && (
            <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Creado por:</span>
                <span className="font-semibold text-slate-200">
                  {membersList.find((m) => m.id === creatorId)?.displayName || 'Administrador'}
                  {creatorId === currentUser.id ? ' (Tú)' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Fecha de creación:</span>
                <span className="text-slate-300">
                  {new Date(chat.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Tu rol:</span>
                <span className="font-bold text-emerald-400">
                  {isCreator ? '👑 Creador del grupo' : isAdmin ? '🛡️ Administrador del grupo' : 'Miembro'}
                </span>
              </div>
            </div>
          )}

          {/* E2EE Security Verification Badge */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Cifrado de extremo a extremo (E2EE)</span>
              </div>
              <button
                onClick={handleCopySecurityCode}
                className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedFingerprint ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Los mensajes y llamadas en este chat están protegidos con claves criptográficas privadas AES-GCM 256. Nadie fuera de este chat puede leerlos o escucharlos.
            </p>
            <div className="p-2 rounded-xl bg-black/40 font-mono text-[10px] text-slate-300 tracking-wider text-center break-all select-all">
              {chat.e2eeFingerprint}
            </div>
          </div>

          {/* GROUP MEMBERS SECTION (Only for groups) */}
          {isGroup && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold" style={{ color: palette.textPrimary }}>
                    Participantes
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {membersList.length}
                  </span>
                </div>

                {/* Add member button (Visible for Admins & Creator) */}
                {isAdmin && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Añadir miembros</span>
                  </button>
                )}
              </div>

              {/* Members search filter */}
              {membersList.length > 4 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Buscar participante..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Members List */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="relative flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.displayName}
                        className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-700/50"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {member.displayName}
                          </span>
                          {member.isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                              Tú
                            </span>
                          )}
                          {member.isCreator ? (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold">
                              <Crown className="w-2.5 h-2.5 fill-amber-400" />
                              <span>Creador</span>
                            </span>
                          ) : member.isAdmin ? (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                              <Shield className="w-2.5 h-2.5 fill-emerald-400" />
                              <span>Admin</span>
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          @{member.username} • {member.email}
                        </p>
                      </div>
                    </div>

                    {/* Member Options / Context Menu */}
                    {!member.isCurrent && (
                      <div className="relative shrink-0">
                        <button
                          onClick={() =>
                            setActiveMenuMemberId(
                              activeMenuMemberId === member.id ? null : member.id
                            )
                          }
                          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          title="Opciones de participante"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuMemberId === member.id && (
                          <div
                            className="absolute right-0 top-8 z-30 w-52 p-1.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl space-y-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Direct Message */}
                            {onStartDirectChat && (
                              <button
                                onClick={() => {
                                  onStartDirectChat(member.email || member.username);
                                  setActiveMenuMemberId(null);
                                  onClose();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer text-left"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                <span>Enviar mensaje a @{member.username}</span>
                              </button>
                            )}

                            {/* CREATOR SPECIFIC CONTROLS (WhatsApp Rules: Only creator designates/removes admins) */}
                            {isCreator && !member.isCreator && (
                              <>
                                <div className="h-px bg-slate-800 my-1" />
                                {member.isAdmin ? (
                                  <button
                                    onClick={() => handleDemoteAdmin(member.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-300 hover:bg-amber-950/40 cursor-pointer text-left"
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                    <span>Descartar como admin</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePromoteToAdmin(member.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-emerald-300 hover:bg-emerald-950/40 cursor-pointer text-left"
                                  >
                                    <Crown className="w-3.5 h-3.5" />
                                    <span>Hacer admin del grupo</span>
                                  </button>
                                )}
                              </>
                            )}

                            {/* REMOVE MEMBER (Creator can remove anyone; Admins can only remove non-admins) */}
                            {((isCreator && !member.isCreator) ||
                              (isAdmin && !isCreator && !member.isAdmin && !member.isCreator)) && (
                              <>
                                <div className="h-px bg-slate-800 my-1" />
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 cursor-pointer text-left font-medium"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  <span>Eliminar del grupo</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group / Chat Exit actions */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            {toastMessage && (
              <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs text-center font-medium animate-fade-in">
                {toastMessage}
              </div>
            )}

            {isGroup ? (
              <>
                {confirmAction === 'leave' ? (
                  <div className="p-3 rounded-2xl bg-slate-900 border border-rose-500/40 space-y-2 text-center">
                    <p className="text-xs text-slate-300">¿Estás seguro de que deseas salir de este grupo?</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={executeLeaveGroup}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                      >
                        Sí, salir
                      </button>
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmAction('leave')}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Salir del grupo</span>
                  </button>
                )}

                {isCreator && onDeleteChat && (
                  confirmAction === 'deleteGroup' ? (
                    <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-600/50 space-y-2 text-center">
                      <p className="text-xs text-rose-200">¿Eliminar este grupo para todos los miembros definitivamente?</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            onDeleteChat(chat.id);
                            setConfirmAction(null);
                            onClose();
                          }}
                          className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                        >
                          Sí, eliminar grupo
                        </button>
                        <button
                          onClick={() => setConfirmAction(null)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmAction('deleteGroup')}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar grupo definitivamente</span>
                    </button>
                  )
                )}
              </>
            ) : (
              confirmAction === 'deleteChat' ? (
                <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-600/50 space-y-2 text-center">
                  <p className="text-xs text-rose-200">¿Deseas cerrar y eliminar este chat?</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        if (onDeleteChat) onDeleteChat(chat.id);
                        setConfirmAction(null);
                        onClose();
                      }}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmAction('deleteChat')}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar chat</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Sub-modal: Add Member to Group */}
      {showAddMemberModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setShowAddMemberModal(false)}
        >
          <div
            className="w-full max-w-md p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Añadir miembros al grupo</h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={addMemberSearch}
                onChange={(e) => setAddMemberSearch(e.target.value)}
                placeholder="Buscar por nombre, @usuario o correo..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {availableUsersToAdd.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No hay más cuentas registradas para añadir.
                </div>
              ) : (
                availableUsersToAdd.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={acc.avatar}
                        alt={acc.displayName}
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-200 block truncate">
                          {acc.displayName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          @{acc.username} • {acc.email}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(acc)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Añadir
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAddMemberModal(false)}
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
