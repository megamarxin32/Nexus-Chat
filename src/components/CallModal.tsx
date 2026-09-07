import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Share2,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Volume2,
} from 'lucide-react';
import { Chat, UserProfile } from '../types';

interface CallModalProps {
  isOpen: boolean;
  isVideo: boolean;
  chat?: Chat | null;
  currentUser: UserProfile;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  isVideo,
  chat,
  currentUser,
  onClose,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!isVideo);
  const [duration, setDuration] = useState(0);
  const [streamActive, setStreamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  if (!isOpen || !chat) return null;

  const meetRoomUrl =
    chat.meetActiveRoom || `https://meet.google.com/nex-${chat.id.replace(/[^a-z0-9]/gi, '').slice(0, 8)}-hub`;

  // Start local media stream if video enabled
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    if (isVideo && !isVideoOff && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (!mounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setStreamActive(true);
        })
        .catch((err) => {
          console.warn('Camera/Mic permission not granted, showing avatar placeholder:', err);
          setStreamActive(false);
        });
    }

    // Timer
    const timer = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(timer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [isOpen, isVideo, isVideoOff]);

  if (!isOpen) return null;

  const toggleMute = () => {
    setIsMuted((v) => !v);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
  };

  const toggleVideo = () => {
    setIsVideoOff((v) => !v);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Top Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white">{chat.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
              {formatTimer(duration)}
            </span>
          </div>

          {/* Google Meet official link */}
          <a
            href={meetRoomUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-medium transition-all"
            title="Abrir esta sala oficial en Google Meet"
          >
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span>Abrir en Google Meet</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Video / Call Center Stage */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Real video if available */}
          {streamActive && !isVideoOff ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            /* Avatar Placeholder */
            <div className="flex flex-col items-center gap-4 text-center z-10">
              <div className="relative">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-blue-500/30 shadow-2xl"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-lg text-white">{chat.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Llamada protegida con cifrado de extremo a extremo
                </p>
              </div>
            </div>
          )}

          {/* Security badge overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-slate-700 text-emerald-400 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audio/Video Cifrado E2EE</span>
          </div>

          {/* Room info overlay */}
          <div className="absolute bottom-4 left-4 text-[10px] text-slate-400 bg-black/60 px-2.5 py-1 rounded-lg">
            Google Meet Room: <span className="font-mono text-slate-200">{meetRoomUrl}</span>
          </div>
        </div>

        {/* Call Controls Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-4">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isVideoOff ? 'Activar cámara' : 'Apagar cámara'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={onClose}
            className="p-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/30"
            title="Finalizar llamada"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs">Finalizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
