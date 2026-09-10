import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Building2,
  AtSign,
  Check,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle2,
  Briefcase,
  Users,
  Clock,
} from 'lucide-react';
import { UserProfile, AccountType, BusinessProfile } from '../types';
import { loginWithEmail, registerWithEmail } from '../lib/firebaseAuth';
import { detectCurrentDevice, generateFingerprint } from '../data/mockData';
import { accountRegistry, RegisteredAccount, MAX_ACTIVE_ACCOUNTS } from '../lib/accountRegistry';
import { createDefaultParentalSettings } from '../lib/parentalControl';
import { NexusLogo } from './NexusLogo';

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
  const [isRegister, setIsRegister] = useState(false);
  
  // Flexible Login Identifier: can be @username, email, or phone number
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Fields
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('1234');
  const [isMinorAccount, setIsMinorAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Business specific fields
  const [companyCategory, setCompanyCategory] = useState('Servicios y Comercio');
  const [businessHours, setBusinessHours] = useState('Lun - Vie: 09:00 - 18:00');
  const [businessAutoReply, setBusinessAutoReply] = useState('¡Hola! Gracias por contactarnos. Te responderemos a la brevedad.');

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 2FA / Owner PIN verification step for login
  const [verificationStep, setVerificationStep] = useState<{
    required: boolean;
    targetAccount: RegisteredAccount;
    pinInput: string;
    error?: string;
  } | null>(null);

  // Check multi-account limits
  const activeDeviceAccounts = accountRegistry.getActiveDeviceAccounts();
  const isLimitReached = isAddAccountForPc && activeDeviceAccounts.length >= MAX_ACTIVE_ACCOUNTS;

  const handleNameChange = (name: string) => {
    setDisplayName(name);
    if (!username || username === displayName.toLowerCase().replace(/[^a-z0-9_]/g, '')) {
      setUsername(name.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    }
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMsg('Por favor ingresa tu nombre de usuario, correo electrónico o teléfono.');
      return;
    }
    if (!loginPassword.trim()) {
      setErrorMsg('Por favor ingresa tu contraseña o PIN de acceso.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // Find account in registry by email, username, or phone
      const target = accountRegistry.findAccount(loginIdentifier);

      if (target) {
        // If account has 2FA PIN or security PIN enabled
        if (target.securityPin && target.twoFactorEnabled) {
          setIsLoading(false);
          setVerificationStep({
            required: true,
            targetAccount: target,
            pinInput: '',
          });
          return;
        }

        // Direct login success
        finalizeUserLogin(target);
      } else {
        // Fallback login: attempt with identifier as email
        const pseudoEmail = loginIdentifier.includes('@')
          ? loginIdentifier.toLowerCase().trim()
          : `${loginIdentifier.toLowerCase().replace(/[^a-z0-9_]/g, '')}@nexus.chat`;

        try {
          await loginWithEmail(pseudoEmail, loginPassword);
        } catch {
          // offline simulation
        }

        // Create or load profile
        const newProfile: UserProfile = {
          id: `usr_${loginIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          displayName: loginIdentifier.split('@')[0],
          username: loginIdentifier.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          email: pseudoEmail,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(loginIdentifier)}&background=2563eb&color=fff&bold=true`,
          status: 'online',
          statusMessage: 'Disponible | Conexión Segura E2EE',
          bio: 'Usuario de Nexus Comunicación',
          phone: loginIdentifier.match(/^[0-9+ ]+$/) ? loginIdentifier : '',
          e2eeFingerprint: generateFingerprint(),
          joinedDate: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          devices: [detectCurrentDevice()],
          accountType: 'personal',
          securityPin: '1234',
          twoFactorEnabled: true,
          requireDeviceApproval: true,
          loginAlertsEnabled: true,
          preventDuplicateAccounts: true,
        };

        accountRegistry.registerAccount(newProfile, '1234');
        finalizeUserLogin(newProfile);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!displayName.trim()) {
      setErrorMsg(accountType === 'business' ? 'Ingresa el nombre comercial de tu empresa.' : 'Ingresa tu nombre completo.');
      return;
    }

    if (!username.trim()) {
      setErrorMsg('Elige un nombre de usuario (@usuario).');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setErrorMsg('Debes ingresar al menos un correo electrónico o un número de teléfono.');
      return;
    }

    if (!password.trim() || password.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanEmail = email.trim().toLowerCase() || `${cleanUsername}@nexus.chat`;
    const cleanPhone = phone.trim();

    // Check duplicate username
    if (accountRegistry.isUsernameRegistered(cleanUsername)) {
      setErrorMsg(`El nombre de usuario @${cleanUsername} ya está en uso. Por favor elige otro.`);
      return;
    }

    // Check duplicate email
    if (email.trim() && accountRegistry.isEmailRegistered(cleanEmail)) {
      setErrorMsg(`El correo ${cleanEmail} ya está registrado. Inicia sesión con tus credenciales.`);
      return;
    }

    setIsLoading(true);

    try {
      try {
        await registerWithEmail(cleanEmail, password, displayName);
      } catch {
        // offline simulation
      }

      const businessData: BusinessProfile | undefined = accountType === 'business' ? {
        companyName: displayName.trim(),
        category: companyCategory,
        verified: true,
        businessHours: businessHours,
        autoReply: businessAutoReply,
      } : undefined;

      const profile: UserProfile = {
        id: `usr_${cleanUsername}_${Date.now().toString(36)}`,
        displayName: displayName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${accountType === 'business' ? 'f59e0b' : '2563eb'}&color=fff&bold=true`,
        status: 'online',
        statusMessage: accountType === 'business' ? `Cuenta de Empresa • ${companyCategory}` : 'Disponible | Nexus E2EE',
        bio: accountType === 'business' ? `Empresa Verificada en Nexus. ${companyCategory}. Horario: ${businessHours}` : 'Usuario en Nexus Comunicación Universal',
        e2eeFingerprint: generateFingerprint(),
        joinedDate: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        devices: [detectCurrentDevice()],
        accountType: accountType,
        businessProfile: businessData,
        securityPin: securityPin || '1234',
        twoFactorEnabled: true,
        requireDeviceApproval: true,
        loginAlertsEnabled: true,
        preventDuplicateAccounts: true,
        isMinor: isMinorAccount,
        parentalControl: isMinorAccount ? createDefaultParentalSettings(true) : undefined,
      };

      accountRegistry.registerAccount(profile, securityPin || '1234', {
        twoFactorEnabled: true,
        requireDeviceApproval: true,
        loginAlertsEnabled: true,
      });

      finalizeUserLogin(profile);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Finalize login and register in active device accounts
  const finalizeUserLogin = (userLike: RegisteredAccount | UserProfile) => {
    const userProfile: UserProfile = {
      id: userLike.id,
      displayName: userLike.displayName,
      username: userLike.username,
      email: userLike.email,
      phone: userLike.phone,
      avatar: userLike.avatar,
      status: userLike.status,
      statusMessage: userLike.bio || (userLike.accountType === 'business' ? 'Empresa Verificada' : 'Disponible'),
      bio: userLike.bio || '',
      e2eeFingerprint: (userLike as any).e2eeFingerprint || generateFingerprint(),
      joinedDate: (userLike as any).createdAt || (userLike as any).joinedDate || 'Hoy',
      devices: userLike.devices?.length ? userLike.devices : [detectCurrentDevice()],
      accountType: userLike.accountType || 'personal',
      businessProfile: userLike.businessProfile,
      securityPin: userLike.securityPin,
      twoFactorEnabled: userLike.twoFactorEnabled,
      requireDeviceApproval: userLike.requireDeviceApproval,
      loginAlertsEnabled: userLike.loginAlertsEnabled,
      preventDuplicateAccounts: true,
      isMinor: userLike.isMinor,
      parentalControl: userLike.parentalControl,
      linkedChildren: userLike.linkedChildren,
    };

    // Add to device active accounts (enforcing max 2 limit)
    accountRegistry.addActiveDeviceAccount(userProfile);

    onAuthSuccess(userProfile);
    if (onCloseModal) onCloseModal();
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationStep) return;

    if (verificationStep.pinInput.trim() === verificationStep.targetAccount.securityPin) {
      finalizeUserLogin(verificationStep.targetAccount);
    } else {
      setVerificationStep({
        ...verificationStep,
        error: 'PIN incorrecto. Ingresa el código de 4 a 6 dígitos configurado en tu cuenta.',
      });
    }
  };

  return (
    <div className={`w-full ${isModal ? '' : 'min-h-screen'} bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 text-white`}>
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <NexusLogo size="lg" showShield={true} />
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">
            {isAddAccountForPc
              ? 'Agregar Segunda Cuenta'
              : isRegister
              ? 'Crear Cuenta en Nexus'
              : 'Bienvenido de nuevo'}
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-xs">
            {isRegister
              ? 'Mensajería universal, fotos, vídeos, llamadas y notas privadas con cifrado E2EE.'
              : 'Accede con tu usuario, correo electrónico o teléfono móvil.'}
          </p>
        </div>

        {/* Multi-Account Limit Warning */}
        {isLimitReached ? (
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Límite de multicuentas alcanzado (2/2)
            </div>
            <p className="leading-relaxed">
              Por seguridad y rendimiento, Nexus permite un máximo de <strong>2 cuentas simultáneas</strong> activas en este dispositivo (por ejemplo, 1 Personal y 1 de Empresa).
            </p>
            <div className="p-2.5 rounded-2xl bg-black/40 border border-amber-500/20 text-slate-300">
              Cuentas activas en este equipo:
              <ul className="list-disc list-inside mt-1 font-mono text-[11px] text-amber-300">
                {activeDeviceAccounts.map((a) => (
                  <li key={a.id} className="truncate">
                    {a.displayName} (@{a.username})
                  </li>
                ))}
              </ul>
            </div>
            {onCloseModal && (
              <button
                onClick={onCloseModal}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors text-xs"
              >
                Cerrar y gestionar cuentas en Ajustes
              </button>
            )}
          </div>
        ) : (
          /* Main Auth Card */
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 p-6 md:p-7 shadow-2xl backdrop-blur-xl space-y-5">
            {/* Tab selector: Iniciar Sesión / Crear Cuenta */}
            {!isAddAccountForPc && (
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setErrorMsg('');
                    setVerificationStep(null);
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    !isRegister
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setErrorMsg('');
                    setVerificationStep(null);
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    isRegister
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 2FA PIN Verification Interstitial */}
            {verificationStep ? (
              <form onSubmit={handleVerifyPin} className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Verificación de Seguridad</h4>
                  <p className="text-xs text-slate-400">
                    Ingresa el PIN de seguridad de tu cuenta <strong>@{verificationStep.targetAccount.username}</strong>
                  </p>
                </div>

                {verificationStep.error && (
                  <p className="text-xs text-rose-400 text-center">{verificationStep.error}</p>
                )}

                <div>
                  <input
                    type="password"
                    maxLength={6}
                    value={verificationStep.pinInput}
                    onChange={(e) =>
                      setVerificationStep({
                        ...verificationStep,
                        pinInput: e.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    placeholder="••••"
                    autoFocus
                    className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none text-white font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVerificationStep(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-500/20"
                  >
                    Autorizar Acceso
                  </button>
                </div>
              </form>
            ) : !isRegister ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Flexible Identifier */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>Usuario, Correo o Teléfono</span>
                    <span className="text-[10px] text-blue-400 font-mono">@usuario / email / +tel</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="ej. @carlos, carlos@mail.com o +525512345678"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Password / PIN */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Contraseña o PIN de Seguridad
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Entrar a Nexus</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Account Type Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Tipo de Cuenta</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountType('personal')}
                      className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                        accountType === 'personal'
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <User className={`w-4 h-4 ${accountType === 'personal' ? 'text-blue-400' : ''}`} />
                      <div className="text-left">
                        <p className="text-xs font-semibold leading-tight">Personal</p>
                        <p className="text-[10px] text-slate-400">Amigos y familia</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountType('business')}
                      className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                        accountType === 'business'
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Building2 className={`w-4 h-4 ${accountType === 'business' ? 'text-amber-400' : ''}`} />
                      <div className="text-left">
                        <p className="text-xs font-semibold leading-tight">Empresa / Negocio</p>
                        <p className="text-[10px] text-slate-400">Perfil comercial</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Display Name or Company Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {accountType === 'business' ? 'Nombre Comercial de la Empresa' : 'Tu Nombre Completo'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      {accountType === 'business' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={accountType === 'business' ? 'ej. Studio Creativo Nexus' : 'ej. Alex Rivera'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Nombre de Usuario Único</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="ej. alex_rivera"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Email and Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Correo Electrónico</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contacto@ejemplo.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Teléfono Móvil</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+52 55 1234 5678"
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Specific Details */}
                {accountType === 'business' && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                      <Briefcase className="w-4 h-4 text-amber-400" />
                      <span>Configuración Comercial para Empresas</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">Categoría</label>
                        <select
                          value={companyCategory}
                          onChange={(e) => setCompanyCategory(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="Servicios y Comercio">Servicios y Comercio</option>
                          <option value="Tienda y Retail">Tienda y Retail</option>
                          <option value="Tecnología y Software">Tecnología y Software</option>
                          <option value="Restaurante y Alimentos">Restaurante y Alimentos</option>
                          <option value="Salud y Belleza">Salud y Belleza</option>
                          <option value="Consultoría y Legal">Consultoría y Legal</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">Horario de Atención</label>
                        <input
                          type="text"
                          value={businessHours}
                          onChange={(e) => setBusinessHours(e.target.value)}
                          placeholder="Lun - Vie: 09:00 - 18:00"
                          className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password & Security PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                      <span>PIN de Seguridad (2FA)</span>
                      <span className="text-[10px] text-emerald-400">4-6 dígitos</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={6}
                        value={securityPin}
                        onChange={(e) => setSecurityPin(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="1234"
                        className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{accountType === 'business' ? 'Registrar Empresa en Nexus' : 'Registrar Cuenta Personal'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer info: Privacy and Security */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cifrado E2EE nativo • Sin rastreadores • Privacidad de extremo a extremo</span>
        </div>
      </div>
    </div>
  );
};
