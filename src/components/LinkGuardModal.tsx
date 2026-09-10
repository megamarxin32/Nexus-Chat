import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, ExternalLink, ArrowLeft, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface LinkGuardModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmOpen: (url: string, trustDomain?: boolean) => void;
}

// Common verified / safe domains
const TRUSTED_DOMAINS = [
  'google.com',
  'youtube.com',
  'github.com',
  'wikipedia.org',
  'apple.com',
  'microsoft.com',
  'x.com',
  'twitter.com',
  'instagram.com',
  'linkedin.com',
  'spotify.com',
  'nexus.chat',
];

export const LinkGuardModal: React.FC<LinkGuardModalProps> = ({
  url,
  isOpen,
  onClose,
  onConfirmOpen,
}) => {
  const [trustDomain, setTrustDomain] = useState(false);

  if (!isOpen || !url) return null;

  let hostname = '';
  let isHttps = true;
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname.toLowerCase();
    isHttps = parsed.protocol === 'https:';
  } catch {
    hostname = url.split('/')[0] || url;
    isHttps = url.startsWith('https://');
  }

  const isTrusted = TRUSTED_DOMAINS.some(
    (td) => hostname === td || hostname.endsWith('.' + td)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isTrusted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isTrusted ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {isTrusted ? 'Enlace Seguro Verificado' : 'Aviso de Enlace Externo'}
              </h3>
              <p className="text-[11px] text-slate-400">Protector de Navegación Nexus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Assessment Box */}
        <div
          className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
            isTrusted
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {isTrusted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dominio reconocido y seguro</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Sitio web externo no verificado</span>
              </>
            )}
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {isTrusted
              ? `El destino (${hostname}) pertenece a un proveedor popular reconocido. La conexión es cifrada.`
              : `Este enlace te llevará fuera de Nexus a un sitio externo (${hostname}). Nexus no controla el contenido de páginas externas. Verifica que confíes en quien te envió este enlace.`}
          </p>

          {!isHttps && (
            <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-medium pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Advertencia: La conexión no utiliza HTTPS (conexión no cifrada).</span>
            </div>
          )}
        </div>

        {/* URL Box */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Destino del enlace:
          </label>
          <div className="p-3 rounded-2xl bg-black/50 border border-slate-800 break-all font-mono text-xs text-blue-300 select-all">
            {url}
          </div>
        </div>

        {/* Trust Checkbox for external domains */}
        {!isTrusted && (
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={trustDomain}
              onChange={(e) => setTrustDomain(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
            />
            <span>Confiar en este dominio ({hostname}) para esta sesión</span>
          </label>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quedarme en el chat</span>
          </button>

          <button
            type="button"
            onClick={() => onConfirmOpen(url, trustDomain)}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
              isTrusted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
            }`}
          >
            <span>{isTrusted ? 'Abrir enlace' : 'Continuar al enlace'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
