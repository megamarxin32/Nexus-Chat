import React from 'react';
import { ThemeSettings } from '../types';

interface ChatWallpaperProps {
  settings: ThemeSettings;
  idPrefix?: string;
}

export const ChatWallpaper: React.FC<ChatWallpaperProps> = ({ settings, idPrefix = 'main' }) => {
  const { wallpaper, customWallpaperUrl, wallpaperOpacity = 0.12, mode } = settings;
  const isDark = mode !== 'light';

  if (wallpaper === 'custom' && customWallpaperUrl) {
    return (
      <div
        className="absolute inset-0 pointer-events-none transition-all z-0"
        style={{
          backgroundImage: `url(${customWallpaperUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: wallpaperOpacity,
        }}
      />
    );
  }

  if (wallpaper === 'whatsapp_doodle') {
    // Elegant SVG Pattern of classic WhatsApp doodles (speech bubbles, coffee, hearts, headphones, stars)
    const strokeColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(30,41,59,0.7)';
    const patternId = `${idPrefix}-wa-doodle-pattern`;
    return (
      <div
        className="absolute inset-0 pointer-events-none transition-all z-0 overflow-hidden"
        style={{ opacity: Math.max(wallpaperOpacity, 0.12) }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id={patternId}
              x="0"
              y="0"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              {/* Chat bubble */}
              <path
                d="M15 15 h20 a5 5 0 0 1 5 5 v10 a5 5 0 0 1 -5 5 h-12 l-6 5 v-5 a5 5 0 0 1 -2 -5 v-10 a5 5 0 0 1 5 -5 z"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Heart */}
              <path
                d="M75 20 c-3 -4 -9 -4 -12 0 c-3 4 -1 9 4 13 l8 6 l8 -6 c5 -4 7 -9 4 -13 c-3 -4 -9 -4 -12 0 z"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              {/* Star */}
              <polygon
                points="105,15 107,21 113,21 108,25 110,31 105,27 100,31 102,25 97,21 103,21"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              {/* Headphones */}
              <path
                d="M20 75 a14 14 0 0 1 24 0 v8 h-4 v-8 a10 10 0 0 0 -16 0 v8 h-4 z"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Coffee cup */}
              <path
                d="M70 70 h18 v12 a6 6 0 0 1 -6 6 h-6 a6 6 0 0 1 -6 -6 v-12 z M88 74 h3 a3 3 0 0 1 0 6 h-3"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Note icon */}
              <path
                d="M102 68 h10 v14 h-10 z M104 72 h6 M104 76 h4"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Double checkmark */}
              <path
                d="M10 105 l4 4 l8 -8 M16 105 l4 4 l8 -8"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Smiley */}
              <circle cx="60" cy="105" r="7" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <path d="M57 106 q3 3 6 0" fill="none" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      </div>
    );
  }

  if (wallpaper === 'telegram_stars') {
    const starColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(30,41,59,0.75)';
    const patternId = `${idPrefix}-tg-stars-pattern`;
    return (
      <div
        className="absolute inset-0 pointer-events-none transition-all z-0 overflow-hidden"
        style={{ opacity: Math.max(wallpaperOpacity, 0.14) }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id={patternId}
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="15" cy="20" r="1.5" fill={starColor} />
              <circle cx="85" cy="35" r="1" fill={starColor} />
              <circle cx="45" cy="70" r="2" fill={starColor} />
              <circle cx="70" cy="85" r="1.2" fill={starColor} />
              <circle cx="20" cy="80" r="1" fill={starColor} />
              <polygon points="50,15 52,21 58,21 53,24 55,30 50,26 45,30 47,24 42,21 48,21" fill={starColor} opacity="0.6" />
              <polygon points="90,70 91,73 94,73 92,75 93,78 90,76 87,78 88,75 86,73 89,73" fill={starColor} opacity="0.7" />
              <path d="M10 50 q15 -10 30 0" fill="none" stroke={starColor} strokeWidth="0.8" opacity="0.3" strokeDasharray="2 3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      </div>
    );
  }

  if (wallpaper === 'discord_dark') {
    return null; // The background color of ChatArea already renders the exact Discord gray
  }

  if (wallpaper === 'geometric') {
    return (
      <div
        className="absolute inset-0 pointer-events-none transition-all z-0"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)'
            : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          opacity: wallpaperOpacity * 3,
        }}
      />
    );
  }

  if (wallpaper === 'gradient') {
    return (
      <div
        className="absolute inset-0 pointer-events-none transition-all z-0"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(241, 245, 249, 0.8) 0%, rgba(226, 232, 240, 0.9) 100%)',
          opacity: 1,
        }}
      />
    );
  }

  // Solid
  return null;
};
