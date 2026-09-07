import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserCheck,
  UserPlus,
  Video,
  Clock,
  Moon,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Plus,
  Heart,
  Lock,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { UserProfile, ParentalControlSettings, LinkedChildProfile } from '../types';
import { parentalControlManager, generateFamilyLinkCode } from '../lib/parentalControl';

interface ParentalControlViewProps {
  user: UserProfile;
  onUpdateUser: (newUser: UserProfile) => void;
  onShowToast: (msg: string) => void;
}

export const ParentalControlView: React.FC<ParentalControlViewProps> = ({
  user,
  onUpdateUser,
  onShowToast,
}) => {
  const isMinor = user.isMinor || user.parentalControl?.isMinor;
  const [childCodeInput, setChildCodeInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>(
    user.linkedChildren && user.linkedChildren.length > 0 ? user.linkedChildren[0].id : ''
  );
  const [newContactInput, setNewContactInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // If user is a minor child, retrieve or generate their link code
  const childLinkCode = user.parentalControl?.linkCode || 'FAM-9821';
  const supervisorName = user.parentalControl?.parentName || 'Tutor Familiar';
  const supervisorEmail = user.parentalControl?.parentEmail || '';
  const isSupervised = user.parentalControl?.isSupervised;

  // Active child being managed by parent
  const activeChild = user.linkedChildren?.find(
    (c) => c.id === selectedChildId || c.linkCode === selectedChildId
  ) || (user.linkedChildren && user.linkedChildren[0]);

  // Handle parent linking a child account
  const handleLinkChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childCodeInput.trim()) return;

    setIsLinking(true);
    const result = parentalControlManager.linkChild(user, childCodeInput);
    setIsLinking(false);

    if (result.success && result.updatedParent) {
      onUpdateUser(result.updatedParent);
      if (result.linkedChild) {
        setSelectedChildId(result.linkedChild.id);
      }
      setChildCodeInput('');
      onShowToast(result.message);
    } else {
      onShowToast(result.message || 'No se pudo vincular la cuenta.');
    }
  };

  // Update a setting for the selected child
  const handleUpdateSetting = (childId: string, patch: Partial<ParentalControlSettings>) => {
    const updated = parentalControlManager.updateChildSettings(user, childId, patch);
    onUpdateUser(updated);
    onShowToast('Permisos de supervisión actualizados');
  };

  // Add approved contact for child
  const handleAddApprovedContact = (child: LinkedChildProfile) => {
    const clean = newContactInput.trim().replace(/^@/, '');
    if (!clean) return;

    const currentList = child.settings.approvedContacts || [];
    if (currentList.includes(clean)) {
      onShowToast('Este contacto ya está en la lista permitida.');
      return;
    }

    const updatedList = [...currentList, clean];
    handleUpdateSetting(child.id, { approvedContacts: updatedList });
    setNewContactInput('');
  };

  // Remove approved contact
  const handleRemoveApprovedContact = (child: LinkedChildProfile, contactToRemove: string) => {
    const currentList = child.settings.approvedContacts || [];
    const updatedList = currentList.filter((c) => c !== contactToRemove);
    handleUpdateSetting(child.id, { approvedContacts: updatedList });
  };

  // Unlink a child
  const handleUnlinkChild = (childId: string, childName: string) => {
    const updated = parentalControlManager.unlinkChild(user, childId);
    onUpdateUser(updated);
    if (updated.linkedChildren && updated.linkedChildren.length > 0) {
      setSelectedChildId(updated.linkedChildren[0].id);
    } else {
      setSelectedChildId('');
    }
    onShowToast(`Cuenta de ${childName} desvinculada.`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    onShowToast('¡Código copiado al portapapeles!');
  };

  return (
    <div id="parental-control-view" className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* VIEW A: CURRENT USER IS A MINOR CHILD                         */}
      {/* ------------------------------------------------------------- */}
      {isMinor ? (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-indigo-950/40 to-blue-950/50 border border-purple-500/30 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-purple-400 fill-purple-400/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Cuenta Infantil Protegida</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Menor de 13 años
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-1 leading-relaxed">
                Tu cuenta incluye protección familiar para que navegues, estudies y charles de forma segura.
              </p>
            </div>
          </div>

          {/* Status of Supervision */}
          {isSupervised ? (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Supervisada por tu tutor(a)</h5>
                    <p className="text-[11px] text-slate-400">
                      {supervisorName} {supervisorEmail ? `(${supervisorEmail})` : ''}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Activo</span>
                </span>
              </div>

              {/* Active Rules List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-teal-400" />
                    Videollamadas
                  </span>
                  <span
                    className={`font-semibold ${
                      user.parentalControl?.allowVideoCalls ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {user.parentalControl?.allowVideoCalls ? 'Permitidas' : 'Solo llamadas de voz'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    Contactos desconocidos
                  </span>
                  <span
                    className={`font-semibold ${
                      user.parentalControl?.allowUnknownContacts ? 'text-slate-400' : 'text-emerald-400'
                    }`}
                  >
                    {user.parentalControl?.allowUnknownContacts ? 'Permitidos' : 'Solo autorizados'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    IA Gemini (Deberes)
                  </span>
                  <span
                    className={`font-semibold ${
                      user.parentalControl?.allowAiAssistant ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {user.parentalControl?.allowAiAssistant ? 'Activo para estudio' : 'Pausado'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    Horario de descanso
                  </span>
                  <span className="font-semibold text-indigo-300">21:00 - 07:00</span>
                </div>
              </div>
            </div>
          ) : (
            /* Child needs to link to parent */
            <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Vincula tu cuenta con tu padre, madre o tutor</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  Para activar la protección completa, comparte este código con tu tutor legal. Ellos solo deben ingresarlo desde su cuenta de Nexus.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 max-w-xs mx-auto space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Tu Código Familiar
                </span>
                <div className="text-2xl font-mono font-bold text-purple-300 tracking-widest">
                  {childLinkCode}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(childLinkCode)}
                  className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '¡Código Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* VIEW B: CURRENT USER IS A PARENT / ADULT SUPERVISOR           */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Header */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/20 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Supervisión Familiar & Control Parental</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Conecta las cuentas de tus hijos menores de 13 años para configurar sus permisos de videollamadas, contactos aprobados y horario de descanso directamente desde tu propia cuenta.
              </p>
            </div>
          </div>

          {/* Form to Link a Child Account */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h5 className="text-xs font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>Vincular cuenta de hijo/a o menor</span>
            </h5>
            <p className="text-[11px] text-slate-400">
              Ingresa el código familiar de 6 caracteres (ej. FAM-7K39) o el correo electrónico de la cuenta del menor.
            </p>

            <form onSubmit={handleLinkChild} className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                placeholder="Código FAM-XXXX o correo del menor..."
                value={childCodeInput}
                onChange={(e) => setChildCodeInput(e.target.value)}
                className="flex-1 text-xs rounded-xl p-2.5 bg-slate-900 border border-slate-700 text-white outline-none focus:border-blue-500 font-mono uppercase"
              />
              <button
                type="submit"
                disabled={isLinking || !childCodeInput.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Vincular Menor</span>
              </button>
            </form>
          </div>

          {/* List of Linked Children */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Cuentas Supervisadas ({user.linkedChildren?.length || 0})</span>
            </h5>

            {!user.linkedChildren || user.linkedChildren.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  No tienes cuentas de menores vinculadas aún
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Cuando tu hijo o hija cree su cuenta en Nexus y elija la opción de menor de 13 años, dale clic a vincular arriba con su código familiar.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Child selector tabs if more than one child */}
                {user.linkedChildren.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {user.linkedChildren.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setSelectedChildId(child.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          selectedChildId === child.id
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <img
                          src={child.avatar}
                          alt={child.displayName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{child.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Configuration Panel for Active Child */}
                {activeChild && (
                  <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-5">
                    {/* Child Profile Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <img
                          src={activeChild.avatar}
                          alt={activeChild.displayName}
                          className="w-11 h-11 rounded-2xl object-cover border-2 border-purple-500/40"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{activeChild.displayName}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                              Menor Supervisado
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            @{activeChild.username} • Código: {activeChild.linkCode}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUnlinkChild(activeChild.id, activeChild.displayName)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 self-start sm:self-center cursor-pointer p-1.5 rounded-xl hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Desvincular</span>
                      </button>
                    </div>

                    {/* Controls Grid */}
                    <div className="space-y-4">
                      {/* Control 1: Videollamadas */}
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                            <Video className="w-4 h-4" />
                          </div>
                          <div>
                            <h6 className="text-xs font-bold text-white">Permitir Videollamadas</h6>
                            <p className="text-[11px] text-slate-400">
                              Si está apagado, el menor solo puede realizar llamadas de voz.
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeChild.settings.allowVideoCalls}
                            onChange={(e) =>
                              handleUpdateSetting(activeChild.id, { allowVideoCalls: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                      </div>

                      {/* Control 2: Restricción a contactos aprobados */}
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div>
                              <h6 className="text-xs font-bold text-white">Restricción de Contactos</h6>
                              <p className="text-[11px] text-slate-400">
                                Bloquear mensajes y solicitudes de personas desconocidas.
                              </p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!activeChild.settings.allowUnknownContacts}
                              onChange={(e) =>
                                handleUpdateSetting(activeChild.id, {
                                  allowUnknownContacts: !e.target.checked,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Approved contacts manager */}
                        {!activeChild.settings.allowUnknownContacts && (
                          <div className="pt-2 border-t border-slate-800 space-y-2.5">
                            <span className="text-[11px] font-bold text-slate-300 block">
                              Contactos aprobados por ti:
                            </span>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5">
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                <span>Tú ({user.displayName})</span>
                              </span>
                              {activeChild.settings.approvedContacts?.map((c) => (
                                <span
                                  key={c}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                                >
                                  <span>@{c}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveApprovedContact(activeChild, c)}
                                    className="text-slate-400 hover:text-rose-400 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>

                            {/* Add approved contact input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Agregar usuario o correo (ej. @abuelo, profesor)..."
                                value={newContactInput}
                                onChange={(e) => setNewContactInput(e.target.value)}
                                className="flex-1 text-xs rounded-xl p-2 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddApprovedContact(activeChild)}
                                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                              >
                                Aprobar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Control 3: Horario nocturno (Bedtime) */}
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <Moon className="w-4 h-4" />
                          </div>
                          <div>
                            <h6 className="text-xs font-bold text-white">Modo Descanso Nocturno</h6>
                            <p className="text-[11px] text-slate-400">
                              Silencia llamadas y notificaciones de 21:00 a 07:00.
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeChild.settings.bedtimeQuietHoursEnabled}
                            onChange={(e) =>
                              handleUpdateSetting(activeChild.id, {
                                bedtimeQuietHoursEnabled: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      {/* Control 4: Asistente Gemini para estudio */}
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h6 className="text-xs font-bold text-white">IA Gemini (Ayuda Escolar)</h6>
                            <p className="text-[11px] text-slate-400">
                              Permite al menor resolver dudas de estudio y redacción con IA supervisada.
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeChild.settings.allowAiAssistant}
                            onChange={(e) =>
                              handleUpdateSetting(activeChild.id, {
                                allowAiAssistant: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      {/* Control 5: Límite de tiempo en pantalla */}
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h6 className="text-xs font-bold text-white">Límite Diario en Pantalla</h6>
                            <p className="text-[11px] text-slate-400">
                              Tiempo recomendado de uso diario.
                            </p>
                          </div>
                        </div>
                        <select
                          value={activeChild.settings.dailyScreenTimeMinutes}
                          onChange={(e) =>
                            handleUpdateSetting(activeChild.id, {
                              dailyScreenTimeMinutes: Number(e.target.value),
                            })
                          }
                          className="text-xs rounded-xl p-2 bg-slate-800 border border-slate-700 text-white outline-none focus:border-amber-500"
                        >
                          <option value={30}>30 minutos</option>
                          <option value={60}>1 hora (recomendado)</option>
                          <option value={120}>2 horas</option>
                          <option value={0}>Sin límite</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
