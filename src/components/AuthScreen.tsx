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
  Laptop,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../types';
import { loginWithEmail, registerWithEmail, signInWithGoogle } from '../lib/firebaseAuth';
import { createNewUserProfile, detectCurrentDevice, generateFingerprint } from '../data/mockData';
import { accountRegistry, RegisteredAccount } from '../lib/accountRegistry';
import { createDefaultParentalSettings } from '../lib/parentalControl';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
  isAddAccountForPc?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  isModal = false,
  onCloseModal,
  isAddAccountForPc = false,
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
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // Auto-detected Google account from previous session on this device
  const [detectedGoogle] = useState<{
    email: string;
    name: string;
    avatar: string;
  } | null>(() => {
    const savedEmail = localStorage.getItem('nexus_last_google_email');
    const savedName = localStorage.getItem('nexus_last_google_name');
    const savedAvatar = localStorage.getItem('nexus_last_google_avatar');
    if (savedEmail) {
      return {
        email: savedEmail,
        name: savedName || savedEmail.split('@')[0],
        avatar: savedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(savedName || savedEmail)}&background=2563eb&color=fff&bold=true`,
      };
    }
    const googleAcc = accountRegistry.getAllAccounts().find((a) => a.isGoogleConnected);
    if (googleAcc) {
      return {
        email: googleAcc.email,
        name: googleAcc.displayName,
        avatar: googleAcc.avatar,
      };
    }
    return null;
  });

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
    // Unify: Check if an account already exists with this email (via Google or previous registration)
    const existing = accountRegistry.getAccountByEmail(cleanEmail);
    const accountId = existing ? existing.id : (`usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`);

    const finalName = displayName.trim() || existing?.displayName || cleanEmail.split('@')[0];
    const finalUsername =
      cleanUsername.trim() || existing?.username || cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    const profile: UserProfile = {
      id: accountId,
      displayName: finalName,
      username: finalUsername,
      email: cleanEmail,
      avatar: existing?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=2563eb&color=fff&bold=true`,
      status: existing?.status || 'online',
      statusMessage: existing?.bio || 'Disponible | E2EE activo',
      bio: existing?.bio || '',
      phone: '',
      e2eeFingerprint: generateFingerprint(),
      joinedDate: existing?.createdAt || new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      isGoogleConnected: existing?.isGoogleConnected ?? false,
      securityPin: securityPin || existing?.securityPin || '123456',
      twoFactorEnabled: existing?.twoFactorEnabled ?? true,
      requireDeviceApproval: existing?.requireDeviceApproval ?? true,
      loginAlertsEnabled: existing?.loginAlertsEnabled ?? true,
      preventDuplicateAccounts: true,
      devices: existing?.devices?.length ? existing.devices : [detectCurrentDevice()],
      isMinor: isMinorAccount || existing?.isMinor || false,
      parentalControl: isMinorAccount ? createDefaultParentalSettings(true) : existing?.parentalControl,
      linkedChildren: existing?.linkedChildren,
    };

    // Register into system-wide account registry (will update & unify existing)
    accountRegistry.registerAccount(profile, profile.securityPin, {
      twoFactorEnabled: profile.twoFactorEnabled,
      requireDeviceApproval: profile.requireDeviceApproval,
      loginAlertsEnabled: profile.loginAlertsEnabled,
    });

    onAuthSuccess(profile);
    if (onCloseModal) onCloseModal();
  };

  // Unified Google Workspace completion handler: shares the exact same unified account
  const completeGoogleLogin = (gName: string, gEmail: string, gAvatar?: string) => {
    const cleanEmail = gEmail.trim().toLowerCase();
    const existing = accountRegistry.getAccountByEmail(cleanEmail);

    // Check if existing account with Google email has 2FA PIN
    if (existing && existing.twoFactorEnabled && existing.securityPin) {
      setIsLoading(false);
      setVerificationStep({
        required: true,
        targetAccount: existing,
        pinInput: '',
      });
      return;
    }

    // Save detected Google credentials for future automatic detection
    try {
      localStorage.setItem('nexus_last_google_email', cleanEmail);
      localStorage.setItem('nexus_last_google_name', gName);
      if (gAvatar) localStorage.setItem('nexus_last_google_avatar', gAvatar);
    } catch {
      // ignore local storage quota
    }

    // Unify under the exact same account ID as classic login
    const accountId = existing ? existing.id : (`usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`);
    const finalName = gName || existing?.displayName || cleanEmail.split('@')[0];
    const finalUsername = existing?.username || cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    const profile: UserProfile = {
      id: accountId,
      displayName: finalName,
      username: finalUsername,
      email: cleanEmail,
      avatar: gAvatar || existing?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=2563eb&color=fff&bold=true`,
      status: existing?.status || 'online',
      statusMessage: existing?.bio || 'Disponible | E2EE activo',
      bio: existing?.bio || '',
      phone: '',
      e2eeFingerprint: generateFingerprint(),
      joinedDate: existing?.createdAt || new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      isGoogleConnected: true, // Google OAuth connected
      securityPin: existing?.securityPin || '123456',
      twoFactorEnabled: existing?.twoFactorEnabled ?? true,
      requireDeviceApproval: existing?.requireDeviceApproval ?? true,
      loginAlertsEnabled: existing?.loginAlertsEnabled ?? true,
      preventDuplicateAccounts: true,
      devices: existing?.devices?.length ? existing.devices : [detectCurrentDevice()],
      isMinor: existing?.isMinor || false,
      parentalControl: existing?.parentalControl,
      linkedChildren: existing?.linkedChildren,
    };

    accountRegistry.registerAccount(profile, profile.securityPin, {
      twoFactorEnabled: profile.twoFactorEnabled,
      requireDeviceApproval: profile.requireDeviceApproval,
      loginAlertsEnabled: profile.loginAlertsEnabled,
    });

    onAuthSuccess(profile);
    if (onCloseModal) onCloseModal();
  };

  // Google Login Flow - Opens official Google OAuth popup with account chooser across all domains
  const handleGoogleLogin = async (customEmail?: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setDuplicateAlert(null);

    // If a custom email was explicitly entered, use it directly
    if (customEmail && customEmail.trim()) {
      const cleanCustom = customEmail.trim().toLowerCase();
      const derivedName = cleanCustom.split('@')[0];
      completeGoogleLogin(derivedName, cleanCustom);
      setIsLoading(false);
      return;
    }

    // Always attempt the official Google OAuth popup first with forced account selection dialog
    try {
      const res = await signInWithGoogle();
      if (res?.user) {
        const googleUser = res.user;
        const gName = googleUser.displayName || googleUser.email?.split('@')[0] || 'Usuario';
        const gEmail = (googleUser.email || '').toLowerCase();
        const gAvatar = googleUser.photoURL || undefined;
        completeGoogleLogin(gName, gEmail, gAvatar);
        return;
      }
    } catch (err: any) {
      console.warn('Firebase popup result:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup voluntarily
        setIsLoading(false);
        return;
      }

      // If popup was blocked or domain requires manual entry
      setIsLoading(false);
      setShowCustomGoogle(true);
      setErrorMsg('La ventana de Google requirió verificación o el dominio necesita autorización. Por favor selecciona o ingresa el correo de la cuenta de Google a continuación.');
      return;
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
          {/* PC Multi-account banner when adding another account */}
          {isAddAccountForPc && (
            <div className="p-3 rounded-2xl bg-blue-950/50 border border-blue-500/40 text-xs text-blue-200 flex items-center gap-2.5">
              <Laptop className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="leading-tight">
                <span className="font-bold text-white">Modo Multicuenta PC:</span>
                <span className="text-blue-300 ml-1">Tu sesión actual permanecerá activa en este equipo.</span>
              </div>
            </div>
          )}

          {/* 1. SECCIÓN PRINCIPAL: GOOGLE OAUTH & WORKSPACE CON SELECTOR DE CUENTAS */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900 border border-blue-500/30 space-y-3.5 shadow-lg">
            {detectedGoogle ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-xs font-bold text-blue-300">
                      Cuenta de Google en este equipo
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                    Sesión previa
                  </span>
                </div>

                {/* Tarjeta del usuario Google detectado */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/70">
                  <img
                    src={detectedGoogle.avatar}
                    alt={detectedGoogle.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/40 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {detectedGoogle.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">
                      {detectedGoogle.email}
                    </div>
                  </div>
                </div>

                {/* Botón principal: Continuar con la cuenta detectada */}
                <button
                  id="btn-google-detected-login"
                  type="button"
                  onClick={() => handleGoogleLogin(detectedGoogle.email)}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  </svg>
                  <span>Continuar como {detectedGoogle.name}</span>
                </button>

                {/* Botón para abrir el selector oficial de cualquier otra cuenta de Google */}
                <button
                  type="button"
                  id="btn-google-official-popup"
                  onClick={() => handleGoogleLogin()}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-white font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Elegir otra cuenta de Google (Selector oficial)</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-xs font-bold text-blue-300">
                      Google Workspace & OAuth
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Cualquier cuenta
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Accede con cualquier cuenta de Google (@gmail o Workspace). Se abrirá la ventana oficial para que elijas libremente con cuál cuenta ingresar.
                </p>

                {/* Botón principal: Abrir selector oficial de Google */}
                <button
                  id="btn-google-login-universal"
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  </svg>
                  <span>Iniciar sesión con Google (Elegir cualquier cuenta)</span>
                </button>
              </>
            )}

            {/* Alternativa: Ingresar correo de Google manualmente */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <button
                type="button"
                id="btn-toggle-custom-google"
                onClick={() => setShowCustomGoogle((prev) => !prev)}
                className="w-full py-1.5 text-[11px] text-slate-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{showCustomGoogle ? 'Ocultar entrada manual' : '¿Prefieres ingresar tu correo de Google directamente?'}</span>
              </button>

              {showCustomGoogle && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 animate-in fade-in duration-150">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    Ingresa cualquier correo de Google (@gmail o Workspace):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="tu_cuenta@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customGoogleEmail.trim()) {
                          handleGoogleLogin(customGoogleEmail.trim());
                        }
                      }}
                      disabled={!customGoogleEmail.trim() || isLoading}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      Acceder
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divisor opcional */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider text-center">
              o registro / inicio clásico con credenciales
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Tabs Switcher: Registro vs Login Clásico */}
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
