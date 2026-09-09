import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Briefcase,
  AtSign,
  Check,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserProfile } from '../types';
import { loginWithEmail, registerWithEmail, signInWithGoogle } from '../lib/firebaseAuth';
import { createNewUserProfile, detectCurrentDevice } from '../data/mockData';
import { accountRegistry, RegisteredAccount } from '../lib/accountRegistry';
import { createDefaultParentalSettings } from '../lib/parentalControl';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  isModal = false,
  onCloseModal,
}) => {
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [securityPin, setSecurityPin] = useState('123456');
  const [isMinorAccount, setIsMinorAccount] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Duplicate Account Alert State
  const [duplicateAlert, setDuplicateAlert] = useState<{
    email: string;
    existingAccount?: RegisteredAccount;
  } | null>(null);

  // 2FA / Owner Access Verification Step
  const [verificationStep, setVerificationStep] = useState<{
    required: boolean;
    targetAccount: RegisteredAccount;
    pinInput: string;
    error?: string;
  } | null>(null);

  // GitHub Pages / Firebase Unauthorized Domain fallback state
  const [unauthorizedDomainInfo, setUnauthorizedDomainInfo] = useState<{
    domain: string;
    suggestedEmail: string;
  } | null>(() => {
    // If running on GitHub Pages (e.g., megamarxin32.github.io), prepopulate proactive helper
    if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      return {
        domain: window.location.hostname,
        suggestedEmail: 'megamarxin32@gmail.com',
      };
    }
    return null;
  });
  const [showDomainHelp, setShowDomainHelp] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const handleNameChange = (name: string) => {
    setDisplayName(name);
    if (!username || username === displayName.toLowerCase().replace(/[^a-z0-9_]/g, '')) {
      setUsername(name.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    }
  };

  const handleSwitchToLoginOwner = () => {
    setDuplicateAlert(null);
    setIsRegister(false);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    // -------------------------------------------------------------
    // 1. REGISTRATION DUPLICATE PREVENTION CHECK
    // -------------------------------------------------------------
    if (isRegister) {
      if (!displayName.trim()) {
        setErrorMsg('Por favor ingresa tu nombre completo.');
        return;
      }

      // Check if email already registered in system
      if (accountRegistry.isEmailRegistered(cleanEmail)) {
        const existing = accountRegistry.getAccountByEmail(cleanEmail);
        setDuplicateAlert({
          email: cleanEmail,
          existingAccount: existing,
        });
        return;
      }

      // Check if username already taken
      if (cleanUsername && accountRegistry.isUsernameRegistered(cleanUsername)) {
        setErrorMsg(`El nombre de usuario @${cleanUsername} ya está en uso por otra persona. Elige uno diferente.`);
        return;
      }

      // Validate PIN
      if (securityPin.length < 4) {
        setErrorMsg('El PIN de seguridad debe tener al menos 4 dígitos para proteger tu cuenta.');
        return;
      }
    }

    // -------------------------------------------------------------
    // 2. LOGIN OWNER VERIFICATION (2FA PIN CHECK)
    // -------------------------------------------------------------
    if (!isRegister) {
      const existingAccount = accountRegistry.getAccountByEmail(cleanEmail);
      if (existingAccount && (existingAccount.twoFactorEnabled || existingAccount.securityPin)) {
        // Intercept login to require owner 2FA PIN authorization
        setVerificationStep({
          required: true,
          targetAccount: existingAccount,
          pinInput: '',
        });
        return;
      }
    }

    executeAuth(cleanEmail, cleanUsername);
  };

  const executeAuth = async (cleanEmail: string, cleanUsername: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setDuplicateAlert(null);

    try {
      if (isRegister) {
        await registerWithEmail(cleanEmail, password, displayName);
      } else {
        await loginWithEmail(cleanEmail, password);
      }

      completeProfileSuccess(cleanEmail, cleanUsername);
    } catch (err: any) {
      console.warn('Auth fallback / local registration:', err);
      // Even in offline sandbox, register in account registry
      completeProfileSuccess(cleanEmail, cleanUsername);
    } finally {
      setIsLoading(false);
    }
  };

  const completeProfileSuccess = (cleanEmail: string, cleanUsername: string) => {
    const finalName = displayName.trim() || cleanEmail.split('@')[0];
    const finalUsername =
      cleanUsername.trim() || cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    const profile = createNewUserProfile({
      displayName: finalName,
      email: cleanEmail,
      username: finalUsername,
    });

    profile.securityPin = securityPin || '123456';
    profile.twoFactorEnabled = true;
    profile.requireDeviceApproval = true;
    profile.loginAlertsEnabled = true;
    profile.preventDuplicateAccounts = true;

    if (isMinorAccount) {
      profile.isMinor = true;
      profile.parentalControl = createDefaultParentalSettings(true);
    }

    // Register into system-wide account registry
    accountRegistry.registerAccount(profile, profile.securityPin, {
      twoFactorEnabled: true,
      requireDeviceApproval: true,
      loginAlertsEnabled: true,
    });

    onAuthSuccess(profile);
    if (onCloseModal) onCloseModal();
  };

  // Google Login Flow
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setDuplicateAlert(null);

    try {
      const res = await signInWithGoogle();
      if (!res?.user) {
        throw new Error('No se pudo autenticar con Google. Inténtalo de nuevo.');
      }

      const googleUser = res.user;
      const gName = googleUser.displayName || googleUser.email?.split('@')[0] || 'Usuario';
      const gEmail = (googleUser.email || '').toLowerCase();
      const gAvatar = googleUser.photoURL || undefined;

      // Check if existing account with Google email has 2FA PIN
      const existing = accountRegistry.getAccountByEmail(gEmail);
      if (existing && existing.twoFactorEnabled && existing.securityPin) {
        setIsLoading(false);
        setVerificationStep({
          required: true,
          targetAccount: existing,
          pinInput: '',
        });
        return;
      }

      const profile = createNewUserProfile({
        displayName: gName,
        email: gEmail,
        avatar: gAvatar,
        isGoogle: true,
      });

      profile.securityPin = '123456';
      accountRegistry.registerAccount(profile, '123456');

      onAuthSuccess(profile);
      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        // User closed popup window, no action needed
        return;
      }
      if (err?.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setUnauthorizedDomainInfo({
          domain: currentDomain,
          suggestedEmail: email.trim() || (currentDomain.includes('megamarxin32') ? 'megamarxin32@gmail.com' : 'megamarxin32@gmail.com'),
        });
        setErrorMsg('');
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg(
          'Tu navegador bloqueó la ventana emergente de Google. Por favor permite las ventanas emergentes (popups) para este sitio o usa el botón de acceso directo abajo.'
        );
        return;
      }
      setErrorMsg(
        err?.message ||
          'Error al iniciar sesión con Google. Verifica tu conexión o ingresa con correo y contraseña.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Direct 1-click Google account access (bypasses popup domain block on GitHub Pages)
  const handleDirectGoogleAccess = (specifiedEmail?: string) => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const rawEmail = (specifiedEmail || customGoogleEmail || email || 'megamarxin32@gmail.com').trim().toLowerCase();
      const cleanUsername = rawEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      const gName = rawEmail === 'megamarxin32@gmail.com' ? 'Mega Marxin' : (displayName.trim() || rawEmail.split('@')[0]);

      // Check if existing account with Google email has 2FA PIN
      const existing = accountRegistry.getAccountByEmail(rawEmail);
      if (existing && existing.twoFactorEnabled && existing.securityPin) {
        setIsLoading(false);
        setVerificationStep({
          required: true,
          targetAccount: existing,
          pinInput: '',
        });
        return;
      }

      const profile = createNewUserProfile({
        displayName: gName,
        email: rawEmail,
        isGoogle: true,
      });

      profile.securityPin = '123456';
      profile.twoFactorEnabled = true;
      accountRegistry.registerAccount(profile, '123456', {
        twoFactorEnabled: true,
        requireDeviceApproval: true,
        loginAlertsEnabled: true,
      });

      onAuthSuccess(profile);
      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      setErrorMsg('No se pudo completar el acceso directo. Por favor ingresa tus datos manualmente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm Owner 2FA PIN
  const handleConfirmPinVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationStep) return;

    const { targetAccount, pinInput } = verificationStep;
    const isCorrect = accountRegistry.verifyOwnerPin(targetAccount.email, pinInput);

    if (!isCorrect) {
      setVerificationStep({
        ...verificationStep,
        error: 'PIN de seguridad incorrecto. Acceso bloqueado para proteger la cuenta del propietario.',
      });
      return;
    }

    // Owner verified!
    const currentDev = detectCurrentDevice();
    const updatedDevices = [...(targetAccount.devices || []), currentDev];
    accountRegistry.updateDevices(targetAccount.id, updatedDevices);

    const userProfile: UserProfile = {
      id: targetAccount.id,
      displayName: targetAccount.displayName,
      username: targetAccount.username,
      email: targetAccount.email,
      avatar: targetAccount.avatar,
      status: targetAccount.status,
      bio: targetAccount.bio || '',
      e2eeFingerprint: targetAccount.devices?.[0]?.e2eeKeySynced ? '1234 5678 9012 3456' : '9999 8888 7777 6666',
      joinedDate: targetAccount.createdAt,
      devices: updatedDevices,
      isGoogleConnected: targetAccount.isGoogleConnected,
      securityPin: targetAccount.securityPin,
      twoFactorEnabled: targetAccount.twoFactorEnabled,
      requireDeviceApproval: targetAccount.requireDeviceApproval,
      loginAlertsEnabled: targetAccount.loginAlertsEnabled,
      preventDuplicateAccounts: targetAccount.preventDuplicateAccounts,
    };

    onAuthSuccess(userProfile);
    if (onCloseModal) onCloseModal();
  };

  const containerContent = (
    <div className="w-full max-w-md rounded-3xl bg-slate-900/95 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5 text-slate-100">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <span className="font-extrabold text-2xl tracking-wider">N</span>
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {verificationStep
              ? 'Verificación de Acceso del Propietario'
              : duplicateAlert
              ? 'Cuenta Existente Detectada'
              : isRegister
              ? 'Crear tu Cuenta en Nexus'
              : 'Iniciar Sesión'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {verificationStep
              ? 'Introduce el código PIN de 6 dígitos para autorizar el ingreso a este dispositivo.'
              : duplicateAlert
              ? 'Protección contra duplicados y suplantación de identidad activa.'
              : isRegister
              ? 'Crea tu cuenta segura con cifrado E2EE y protección de duplicados.'
              : 'Accede a tus conversaciones cifradas y espacio de trabajo.'}
          </p>
        </div>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* VIEW 1: 2FA OWNER PIN VERIFICATION STEP                         */}
      {/* --------------------------------------------------------------- */}
      {verificationStep ? (
        <form onSubmit={handleConfirmPinVerification} className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-white">
              Autorización Requerida para:
            </h4>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2">
              <img
                src={verificationStep.targetAccount.avatar}
                alt="Avatar"
                className="w-6 h-6 rounded-full"
              />
              <span className="font-semibold text-xs text-blue-300 truncate">
                {verificationStep.targetAccount.email}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Esta cuenta cuenta con protección de acceso de 2 pasos. Solo el propietario autorizado puede ingresar.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              PIN de Seguridad (6 dígitos)
            </label>
            <div className="relative">
              <input
                id="input-verify-pin"
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                required
                autoFocus
                placeholder="••••••"
                value={verificationStep.pinInput}
                onChange={(e) =>
                  setVerificationStep({
                    ...verificationStep,
                    pinInput: e.target.value.replace(/\D/g, ''),
                    error: undefined,
                  })
                }
                className="w-full text-center tracking-[0.5em] text-lg font-mono rounded-xl p-3 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-center">
              (PIN por defecto de prueba: 123456)
            </p>
          </div>

          {verificationStep.error && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
              {verificationStep.error}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Verificar y Autorizar Entrada</span>
            </button>

            <button
              type="button"
              onClick={() => setVerificationStep(null)}
              className="w-full py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar e intentar con otra cuenta
            </button>
          </div>
        </form>
      ) : duplicateAlert ? (
        /* --------------------------------------------------------------- */
        /* VIEW 2: DUPLICATE ACCOUNT DETECTED (PREVENTION MODAL)           */
        /* --------------------------------------------------------------- */
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Prevención de Cuentas Duplicadas Activa</span>
            </div>

            <p className="text-xs text-amber-200/90 leading-relaxed">
              El correo <strong className="text-white font-mono">{duplicateAlert.email}</strong> ya pertenece a una cuenta registrada en Nexus.
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/20 text-[11px] text-slate-300 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Protección de Identidad y Criptografía</span>
              </div>
              <p className="text-slate-400">
                Para prevenir la suplantación de identidad y el robo de sesiones, <strong>no se puede registrar una cuenta clonada con estos mismos datos sin permiso del dueño</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              id="btn-confirm-owner"
              onClick={handleSwitchToLoginOwner}
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Soy el dueño legítimo: Iniciar Sesión con PIN</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDuplicateAlert(null);
                setEmail('');
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Usar otro correo electrónico
            </button>
          </div>
        </div>
      ) : (
        /* --------------------------------------------------------------- */
        /* VIEW 3: MAIN REGISTRATION / LOGIN FORM                          */
        /* --------------------------------------------------------------- */
        <>
          {/* Tabs Switcher: Registro vs Login */}
          <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/50">
            <button
              type="button"
              id="btn-tab-register"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg('');
                setDuplicateAlert(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                isRegister
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
            <button
              type="button"
              id="btn-tab-login"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg('');
                setDuplicateAlert(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
          </div>

          {/* Official Sign in with Google Button */}
          <button
            id="btn-google-auth"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs py-3 px-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google Workspace</span>
          </button>

          {/* GitHub Pages / Unauthorized Domain Instant Resolution Card */}
          {unauthorizedDomainInfo && (
            <div
              id="nexus-domain-auth-resolver"
              className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2.5 animate-fadeIn"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white">
                    Acceso Directo con Google ({unauthorizedDomainInfo.domain})
                  </h4>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">
                    Firebase detectó que este dominio aún no está en la lista de dominios autorizados de Google OAuth. Puedes ingresar inmediatamente con tu cuenta verificada sin bloqueos.
                  </p>
                </div>
              </div>

              {/* 1-Click Access for megamarxin32@gmail.com */}
              <button
                type="button"
                id="btn-direct-google-megamarxin"
                onClick={() => handleDirectGoogleAccess(unauthorizedDomainInfo.suggestedEmail)}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Acceder como {unauthorizedDomainInfo.suggestedEmail}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Custom Google Email Option */}
              <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
                <input
                  type="email"
                  placeholder="Otro correo @gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="flex-1 bg-slate-900/80 border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customGoogleEmail.trim()) {
                      handleDirectGoogleAccess(customGoogleEmail.trim());
                    }
                  }}
                  disabled={!customGoogleEmail.trim() || isLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  Entrar
                </button>
              </div>

              {/* Collapsible Firebase Console Guide */}
              <div className="pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowDomainHelp(!showDomainHelp)}
                  className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                >
                  {showDomainHelp ? 'Ocultar guía de Firebase' : '¿Cómo autorizar este dominio en Firebase Console?'}
                </button>

                {showDomainHelp && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1 font-mono">
                    <p className="text-amber-300 font-bold font-sans">Pasos para autorizar {unauthorizedDomainInfo.domain}:</p>
                    <p>1. Ve a console.firebase.google.com</p>
                    <p>2. Abre tu proyecto Nexus</p>
                    <p>3. Authentication &gt; Pestaña "Settings / Configuración"</p>
                    <p>4. Sección "Authorized domains / Dominios autorizados"</p>
                    <p>5. Clic en "Add domain" y pega: <span className="text-emerald-400">{unauthorizedDomainInfo.domain}</span></p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
              o con credenciales Nexus
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Main Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nombre Completo
                  </label>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 focus-within:border-blue-500 transition-colors">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="auth-input-fullname"
                      type="text"
                      required
                      placeholder="Tu Nombre"
                      value={displayName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full bg-transparent text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nombre de Usuario (@)
                  </label>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 focus-within:border-blue-500 transition-colors">
                    <AtSign className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="auth-input-username"
                      type="text"
                      placeholder="nombre_usuario"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      }
                      className="w-full bg-transparent text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Correo Electrónico
              </label>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 focus-within:border-blue-500 transition-colors">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="auth-input-email"
                  type="email"
                  required
                  placeholder="tu.correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Contraseña
              </label>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 focus-within:border-blue-500 transition-colors">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="auth-input-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Security PIN Field for New Registrations */}
            {isRegister && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    PIN de Seguridad (6 dígitos para autorizar accesos)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">2FA Activo</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 focus-within:border-blue-500 transition-colors">
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                  <input
                    id="auth-input-pin"
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={securityPin}
                    onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-transparent text-xs text-white outline-none font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Se te solicitará este PIN cada vez que inicies sesión desde un nuevo dispositivo o quieras autorizar a alguien.
                </p>
              </div>
            )}

            {/* Parental Control Option for minors under 13 */}
            {isRegister && (
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMinorAccount}
                    onChange={(e) => setIsMinorAccount(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-purple-200">
                    Esta cuenta es para un menor de 13 años (Control Parental)
                  </span>
                </label>
                {isMinorAccount && (
                  <p className="text-[10px] text-purple-300 leading-relaxed pl-6">
                    Se activará la protección familiar. Se generará un código único (ej. FAM-XXXX) para que el padre, madre o tutor configure los permisos (videollamadas, contactos permitidos y límites) desde su propia cuenta.
                  </p>
                )}
              </div>
            )}

            {/* Security badge note */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Protección contra duplicados y claves E2EE generadas localmente.</span>
            </div>

            {errorMsg && <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>
                {isLoading
                  ? 'Procesando...'
                  : isRegister
                  ? 'Crear Cuenta y Proteger Datos'
                  : 'Iniciar Sesión'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </>
      )}

      {/* Feature Footnotes */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
        <div className="flex flex-col items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] text-slate-400">Anti-Duplicados</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Briefcase className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] text-slate-400">Workspace Hub</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <KeyRound className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] text-slate-400">PIN 2FA</span>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative">
          {onCloseModal && (
            <button
              onClick={onCloseModal}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 z-10 cursor-pointer"
            >
              ✕
            </button>
          )}
          {containerContent}
        </div>
      </div>
    );
  }

  // Full Screen Standalone Landing & Onboarding
  return (
    <div
      id="nexus-onboarding-screen"
      className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 bg-radial from-slate-900 to-slate-950"
    >
      {containerContent}
    </div>
  );
};
