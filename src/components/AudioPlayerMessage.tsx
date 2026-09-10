import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerMessageProps {
  url: string;
  name: string;
  isMe: boolean;
}

export const AudioPlayerMessage: React.FC<AudioPlayerMessageProps> = ({ url, name, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    if (url && url !== '#') {
      audio.src = url;
    }

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (url && url !== '#') {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Simulated playback fallback if audio cannot be decoded
            simulatePlayback();
          });
      } else {
        simulatePlayback();
      }
    }
  };

  const simulatePlayback = () => {
    setIsPlaying(true);
    let sec = 0;
    const maxSec = duration > 0 ? duration : 5;
    const interval = setInterval(() => {
      sec += 1;
      setCurrentTime(sec);
      if (sec >= maxSec) {
        clearInterval(interval);
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }, 1000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Generate bar heights for audio waveform visualization
  const barHeights = [35, 60, 85, 45, 95, 70, 50, 80, 60, 40, 90, 75, 55, 30, 65, 80, 45, 60];

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[200px] max-w-xs select-none">
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer shadow-sm ${
          isMe
            ? 'bg-white text-slate-900 hover:bg-slate-100'
            : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
        title={isPlaying ? 'Pausar nota de voz' : 'Reproducir nota de voz'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-0.5 h-6">
          {barHeights.map((h, i) => {
            const isPast = duration > 0 && (i / barHeights.length) <= (currentTime / duration);
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isPlaying ? 'animate-pulse' : ''
                } ${
                  isPast || isPlaying
                    ? isMe
                      ? 'bg-white/90'
                      : 'bg-emerald-400'
                    : isMe
                    ? 'bg-white/30'
                    : 'bg-slate-600/50'
                }`}
                style={{
                  height: `${h}%`,
                  animationDelay: `${(i % 5) * 150}ms`,
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] opacity-80 font-mono">
          <span>{isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(duration || 4)}</span>
          <span className="flex items-center gap-1 opacity-70">
            <Volume2 className="w-2.5 h-2.5" />
            <span>Nota de voz</span>
          </span>
        </div>
      </div>
    </div>
  );
};
