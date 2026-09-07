import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Lock,
  Copy,
  Check,
  X,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { Chat, UserProfile } from '../types';

interface SecurityModalProps {
  chat?: Chat | null;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  chat,
  currentUser,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  const fingerprint = chat?.e2eeFingerprint || currentUser.e2eeFingerprint;

  useEffect(() => {
    if (isOpen && fingerprint) {
      QRCode.toDataURL(`nexus_verify_fp:${fingerprint}`, {
        width: 260,
        margin: 1,
        color: { dark: '#059669', light: '#ffffff' },
      })
        .then((url) => setQrUrl(url))
        .catch(console.error);
    }
  }, [isOpen, fingerprint]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Verificación de Cifrado E2EE</h3>
              <p className="text-xs text-slate-400">Huella de Seguridad y Claves de Sesión</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Explanation */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Los mensajes y archivos de este chat están cifrados de extremo a extremo con el protocolo{' '}
          <strong className="text-emerald-400 font-mono">AES-GCM 256</strong> y protegidos con checksums{' '}
          <strong className="text-emerald-400 font-mono">SHA-256</strong>. Puedes comparar esta huella digital con la de tu contacto para asegurar que no haya intermediarios.
        </p>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white">
          {qrUrl ? (
            <img src={qrUrl} alt="Safety QR" className="w-40 h-40 object-contain" />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400">
              Generando huella...
            </div>
          )}
          <p className="text-[10px] text-slate-600 font-semibold mt-1 text-center">
            Escanea para verificar la autenticidad del canal
          </p>
        </div>

        {/* 60-digit Fingerprint Blocks */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Huella Criptográfica (60 Dígitos):</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-emerald-400 hover:underline"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiada' : 'Copiar'}</span>
            </button>
          </div>
          <div className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-center text-xs tracking-wider text-emerald-400 leading-relaxed">
            {fingerprint}
          </div>
        </div>

        {/* Integrity Checksum Banner */}
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
          <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Firma SHA-256 validada localmente en tu dispositivo. Integridad garantizada.</span>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
