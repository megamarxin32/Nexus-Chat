import React from 'react';
import {
  Users,
  UserPlus,
  CheckCircle2,
  LogOut,
  X,
  Shield,
  ArrowRight,
  Trash2,
  Building2,
  User,
  AlertCircle,
} from 'lucide-react';
import { UserProfile } from '../types';
import { MAX_ACTIVE_ACCOUNTS } from '../lib/accountRegistry';
import { NexusLogo } from './NexusLogo';

interface PcMultiAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  savedPcAccounts: UserProfile[];
  onSwitchAccount: (targetUser: UserProfile) => void;
  onAddNewAccount: () => void;
  onRemoveAccount: (userId: string) => void;
  onImmediateLogout: () => void;
}

export const PcMultiAccountModal: React.FC<PcMultiAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  savedPcAccounts,
  onSwitchAccount,
  onAddNewAccount,
  onRemoveAccount,
  onImmediateLogout,
}) => {
  if (!isOpen) return null;

  // Deduplicate accounts list with currentUser guaranteed at the top, max 2 accounts
  const deduplicated = [
    currentUser,
    ...savedPcAccounts.filter((a) => a.id !== currentUser.id),
  ].slice(0, MAX_ACTIVE_ACCOUNTS);

  const canAddAccount = deduplicated.length < MAX_ACTIVE_ACCOUNTS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <NexusLogo size="sm" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Multicuentas Nexus</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {deduplicated.length} de {MAX_ACTIVE_ACCOUNTS} activas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cambia en 1 clic entre tu cuenta personal y tu cuenta de empresa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Limit Notice */}
        <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200/90 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-semibold text-white">Control de Sesiones Seguras:</span>
            <p className="text-slate-300">
              Para garantizar la máxima seguridad criptográfica E2EE y rendimiento, Nexus admite un máximo de{' '}
              <strong className="text-white">{MAX_ACTIVE_ACCOUNTS} cuentas simultáneas</strong> por dispositivo (ej. Personal + Negocio).
            </p>
          </div>
        </div>

        {/* List of accounts on this PC */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Cuentas en este dispositivo</span>
            <span className="text-blue-400">{deduplicated.length}/{MAX_ACTIVE_ACCOUNTS}</span>
          </div>

          <div className="space-y-2">
            {deduplicated.map((account) => {
              const isCurrent = account.id === currentUser.id;
              const isBusiness = account.accountType === 'business';

              return (
                <div
                  key={account.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={account.avatar}
                        alt={account.displayName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                      />
                      {isCurrent && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-white truncate">
                          {account.displayName}
                        </span>
                        {isBusiness ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            Empresa
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-700/60 text-slate-300">
                            Personal
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        @{account.username} {account.phone ? `• ${account.phone}` : `• ${account.email}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent ? (
                      <span className="text-[11px] font-semibold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        Activa
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            onSwitchAccount(account);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <span>Cambiar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveAccount(account.id)}
                          title="Desvincular esta cuenta del dispositivo"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {canAddAccount ? (
            <button
              type="button"
              onClick={() => {
                onAddNewAccount();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Añadir Segunda Cuenta ({deduplicated.length}/{MAX_ACTIVE_ACCOUNTS})</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400 flex items-center gap-2 justify-center text-center">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Límite de {MAX_ACTIVE_ACCOUNTS} cuentas alcanzado. Desvincula una para añadir otra.</span>
            </div>
          )}

          {/* Logout button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onImmediateLogout();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Cerrar sesión actual</span>
          </button>
        </div>
      </div>
    </div>
  );
};
