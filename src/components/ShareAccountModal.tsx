import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Check,
  Mail,
  Share2,
  Download,
  UserPlus,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, ThemeSettings } from '../types';
import { accountRegistry } from '../lib/accountRegistry';

interface ShareAccountModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (usernameOrEmail: string) => void;
  themeSettings: ThemeSettings;
}

export const ShareAccountModal: React.FC<ShareAccountModalProps> = ({
  user,
  isOpen,
  onClose,
  onAddFriend,
  themeSettings,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const [addFeedback, setAddFeedback] = useState<{ type: 'success' | 'error' | 'self'; msg: string } | null>(null);

  const profileUrl = `https://nexus.chat/@${user.username}`;
  const sharePayload = JSON.stringify({
    app: 'nexus_chat',
    uid: user.id,
    username: user.username,
    name: user.displayName,
    fp: user.e2eeFingerprint,
    url: profileUrl,
  });

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(sharePayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [isOpen, sharePayload]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(user.e2eeFingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `nexus_qr_${user.username}.png`;
    a.click();
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = friendInput.trim().toLowerCase();
    if (!clean) return;

    // Check if it's self
    if (clean === user.email.toLowerCase() || clean.replace(/^@/, '') === user.username.toLowerCase()) {
      onAddFriend(clean);
      setAddFeedback({
        type: 'self',
        msg: '¡Reconocido! Es tu propio correo. Creando tu chat de Mensajes Guardados (Tú).',
      });
      setFriendInput('');
      setTimeout(() => setAddFeedback(null), 4000);
      return;
    }

    // Check if user exists in registered accounts directory
    const found = accountRegistry.findAccount(clean);
    if (!found) {
      setAddFeedback({
        type: 'error',
        msg: `El correo o usuario "${friendInput}" no está registrado en Nexus. No es posible enviar mensajes a personas sin cuenta activa.`,
      });
      return;
    }

    // User is registered
    onAddFriend(found.displayName || found.username);
    setAddFeedback({
      type: 'success',
      msg: `¡Contacto verificado! Se añadió a ${found.displayName} (@${found.username}) a tus conversaciones cifradas.`,
    });
    setFriendInput('');
    setTimeout(() => setAddFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Mi Código QR & Perfil</h3>
              <p className="text-[11px] text-slate-400">Comparte tu cuenta fácilmente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Card */}
        <div className="p-5 rounded-2xl bg-white text-slate-900 flex flex-col items-center gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 w-full">
            <img
              src={user.avatar}
              alt={user.displayName}
              className="w-11 h-11 rounded-full object-cover border-2 border-slate-200"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-slate-900 truncate">{user.displayName}</h4>
              <p className="text-xs text-blue-600 font-medium">@{user.username}</p>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>E2EE</span>
            </div>
          </div>

          {/* QR Image */}
          <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-inner">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                Generando QR...
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 text-center font-medium">
            Escanea este código desde la app Nexus para añadirme al instante.
          </p>
        </div>

        {/* Sharing Options */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">
            Métodos rápidos de compartir:
          </label>

          <div className="grid grid-cols-2 gap-2">
            {/* Copy Link */}
            <button
              id="btn-copy-profile-link"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Enlace copiado!' : 'Copiar enlace'}</span>
            </button>

            {/* Download QR PNG */}
            <button
              onClick={handleDownloadQr}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar QR</span>
            </button>

            {/* Share via Gmail */}
            <a
              href={`mailto:?subject=Conéctate conmigo en Nexus Chat&body=¡Hola! Agrégame en Nexus Chat y Team Hub para chatear con cifrado E2EE y colaborar con Google Workspace: ${profileUrl}`}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span>Enviar por Correo</span>
            </a>

            {/* Share via WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `¡Hola! Agrégame en Nexus Chat para chatear con cifrado E2EE y colaborar en equipo: ${profileUrl}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Add Friend by Username or Email */}
        <div className="pt-3 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Añadir a un amigo por Username o Correo:
          </label>
          <form onSubmit={handleAddSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="@usuario o amigo@gmail.com"
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              className="flex-1 text-xs rounded-xl px-3 py-2 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </form>
          {addFeedback && (
            <div
              className={`p-2.5 rounded-xl text-[11px] mt-2 border ${
                addFeedback.type === 'error'
                  ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                  : addFeedback.type === 'self'
                  ? 'bg-blue-950/40 text-blue-300 border-blue-500/30'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {addFeedback.msg}
            </div>
          )}
        </div>

        {/* Safety Fingerprint */}
        <div className="p-3 rounded-2xl bg-black/40 border border-slate-800 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Huella de Seguridad Criptográfica (E2EE)
            </span>
            <button
              onClick={handleCopyFingerprint}
              className="text-blue-400 hover:underline text-[10px]"
            >
              {copiedFingerprint ? 'Copiada' : 'Copiar'}
            </button>
          </div>
          <p className="font-mono text-slate-300 text-[10px] break-all leading-relaxed bg-black/50 p-2 rounded-lg">
            {user.e2eeFingerprint}
          </p>
        </div>
      </div>
    </div>
  );
};
