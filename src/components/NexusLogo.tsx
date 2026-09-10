import React from 'react';
import { ShieldCheck, Sparkles, Building2 } from 'lucide-react';

interface NexusLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  isBusiness?: boolean;
  showShield?: boolean;
  className?: string;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle = 'UNIVERSAL',
  isBusiness = false,
  showShield = true,
  className = '',
}) => {
  // Dimensions map
  const sizeMap = {
    xs: { icon: 24, font: 'text-sm', sub: 'text-[8px]', p: 'p-1' },
    sm: { icon: 32, font: 'text-base', sub: 'text-[9px]', p: 'p-1.5' },
    md: { icon: 42, font: 'text-lg', sub: 'text-[10px]', p: 'p-2' },
    lg: { icon: 56, font: 'text-2xl', sub: 'text-xs', p: 'p-2.5' },
    xl: { icon: 72, font: 'text-3xl', sub: 'text-sm', p: 'p-3' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon Badge */}
      <div className="relative shrink-0 group">
        <svg
          width={current.icon}
          height={current.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105 filter drop-shadow-md"
        >
          <defs>
            {/* Main Gradient */}
            <linearGradient id="nexusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            {/* Inner Glow */}
            <linearGradient id="nexusCore" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.4" />
            </linearGradient>
            {/* Hexagon Background */}
            <linearGradient id="nexusBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>

          {/* Hexagonal Shield Plate */}
          <polygon
            points="50,4 92,26 92,74 50,96 8,74 8,26"
            fill="url(#nexusBg)"
            stroke="url(#nexusGrad)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Interconnected Network Paths */}
          <path
            d="M50 20 L78 36 L78 64 L50 80 L22 64 L22 36 Z"
            stroke="url(#nexusGrad)"
            strokeWidth="2.5"
            strokeDasharray="4 2"
            opacity="0.75"
          />

          {/* Central Nexus Prism 'N' motif */}
          <path
            d="M32 68 V32 L68 68 V32"
            stroke="url(#nexusGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Connection Nodes */}
          <circle cx="32" cy="32" r="4.5" fill="#60A5FA" />
          <circle cx="68" cy="32" r="4.5" fill="#34D399" />
          <circle cx="32" cy="68" r="4.5" fill="#38BDF8" />
          <circle cx="68" cy="68" r="4.5" fill="#10B981" />
          <circle cx="50" cy="50" r="3.5" fill="#FFFFFF" />
        </svg>

        {/* Status Badge */}
        {showShield && (
          <div
            className={`absolute -bottom-1 -right-1 rounded-full border-2 border-slate-950 flex items-center justify-center ${
              isBusiness ? 'bg-amber-500 w-4 h-4' : 'bg-emerald-500 w-3.5 h-3.5'
            }`}
            title={isBusiness ? 'Cuenta de Empresa Verificada' : 'Cifrado E2EE Universal'}
          >
            {isBusiness ? (
              <Building2 className="w-2.5 h-2.5 text-slate-950" />
            ) : (
              <ShieldCheck className="w-2 h-2 text-white" />
            )}
          </div>
        )}
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none justify-center">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 ${current.font}`}
              style={{ letterSpacing: '0.08em' }}
            >
              NEXUS
            </span>
            {isBusiness ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                Empresa
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <span
            className={`text-slate-400 font-semibold tracking-widest ${current.sub}`}
            style={{ letterSpacing: '0.22em' }}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
