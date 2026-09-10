import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  Tablet,
  ShieldCheck,
  RefreshCw,
  Trash2,
  X,
  Check,
  Key,
} from 'lucide-react';
import { UserProfile, ConnectedDevice } from '../types';

interface DevicesModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSyncKeys: () => void;
  onRevokeDevice: (deviceId: string) => void;
}

export const DevicesModal: React.FC<DevicesModalProps> = ({
  user,
  isOpen,
  onClose,
  onSyncKeys,
  onRevokeDevice,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onSyncKeys();
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1200);
  };

  const getDeviceIcon = (type: ConnectedDevice['type']) => {
    switch (type) {
      case 'desktop':
        return <Laptop className="w-5 h-5 text-blue-400" />;
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Sincronización Multidispositivo</h3>
              <p className="text-xs text-slate-400">
                Gestiona tus sesiones y claves de cifrado E2EE
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-emerald-900/30 border border-blue-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Claves Criptográficas Sincronizadas</h4>
              <p className="text-[11px] text-slate-300">
                Todos tus dispositivos comparten la misma sesión segura E2EE
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>

        {syncSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>¡Claves criptográficas y mensajes sincronizados con éxito en todos los dispositivos!</span>
          </div>
        )}

        {/* Device List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Dispositivos Conectados ({user.devices.length})
          </h4>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {user.devices.map((device) => (
              <div
                key={device.id}
                className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-xs text-white truncate">{device.name}</h5>
                      {device.isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                          Este equipo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {device.browser} • IP: {device.ipAddress}
                    </p>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{device.lastActive}</span>
                    </p>
                  </div>
                </div>

                {!device.isCurrent && (
                  confirmRevokeId === device.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onRevokeDevice(device.id);
                          setConfirmRevokeId(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                      >
                        Sí, revocar
                      </button>
                      <button
                        onClick={() => setConfirmRevokeId(null)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRevokeId(device.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                      title="Cerrar sesión en este dispositivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Protocolo: WebCrypto AES-GCM 256 / SHA-256</span>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
