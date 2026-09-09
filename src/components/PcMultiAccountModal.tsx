import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Users,
  UserPlus,
  CheckCircle2,
  LogOut,
  X,
  Shield,
  ArrowRight,
  Trash2,
  Laptop,
} from 'lucide-react';
import { UserProfile } from '../types';

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

  // Deduplicate accounts list with currentUser guaranteed at the top
  const allAccounts = [
    currentUser,
    ...savedPcAccounts.filter((a) => a.id !== currentUser.id),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Multicuentas en PC</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Solo PC (Temporal)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Añade o alterna cuentas en esta computadora sin cerrar tu sesión actual
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

        {/* Notice Info Box */}
        <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200/90 flex items-start gap-2.5">
          <Monitor className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-semibold text-white">Sesiones simultáneas activas en PC:</span>
            <p className="text-slate-300">
              Puedes agregar otra cuenta (de Google o de Nexus) y tu sesión actual permanecerá guardada y segura en este equipo para cambiar en 1 clic.
            </p>
          </div>
        </div>

        {/* List of accounts on this PC */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Cuentas guardadas en este equipo ({allAccounts.length})
          </label>

          <div className="space-y-2">
            {allAccounts.map((account) => {
              const isCurrent = account.id === currentUser.id;
              return (
                <div
                  key={account.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-sm'
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
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white truncate">
                          {account.displayName}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                            En uso
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        @{account.username} • {account.email}
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
                          title="Desvincular de esta PC"
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
          {/* Button 1: Add new account without closing current */}
          <button
            type="button"
            onClick={() => {
              onAddNewAccount();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Añadir nueva cuenta a esta PC (sin cerrar la anterior)</span>
          </button>

          {/* Button 2: Immediate logout of current session */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onImmediateLogout();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Cerrar sesión actual inmediatamente e ir a inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
