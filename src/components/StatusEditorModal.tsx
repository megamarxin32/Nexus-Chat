import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  RotateCw,
  FlipHorizontal,
  Type,
  Smile,
  Volume2,
  VolumeX,
  Sliders,
  ShieldCheck,
  Check,
  ArrowLeft,
  Trash2,
  Play,
  Pause,
  Palette,
} from 'lucide-react';
import { StatusStory, UserProfile } from '../types';

interface StatusEditorModalProps {
  currentUser: UserProfile | null;
  contactUserIds: Set<string>;
  onClose: () => void;
  onPublishStory: (newStory: StatusStory) => void;
}

// Visual Filter Presets
interface FilterPreset {
  id: string;
  name: string;
  css: string;
  colorPreview: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none', name: 'Normal', css: 'none', colorPreview: '#64748b' },
  { id: 'vibrant', name: 'Vibrante', css: 'saturate(1.45) contrast(1.1)', colorPreview: '#ec4899' },
  { id: 'bw', name: 'B&W', css: 'grayscale(100%) contrast(1.2)', colorPreview: '#334155' },
  { id: 'warm', name: 'Cálido', css: 'sepia(0.3) saturate(1.3) hue-rotate(-10deg)', colorPreview: '#f59e0b' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.45) contrast(0.95) brightness(1.05)', colorPreview: '#d97706' },
  { id: 'cyber', name: 'Neón', css: 'contrast(1.3) saturate(1.5) hue-rotate(45deg)', colorPreview: '#06b6d4' },
  { id: 'cool', name: 'Frío', css: 'hue-rotate(180deg) saturate(1.15)', colorPreview: '#3b82f6' },
  { id: 'dramatic', name: 'Dramático', css: 'contrast(1.4) brightness(0.9)', colorPreview: '#8b5cf6' },
];

const QUICK_EMOJIS = ['🔥', '❤️', '✨', '😂', '👏', '📍', '⚡', '🎉', '🚀', '💡', '🎧', '☕', '💯', '🌸'];

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
];

interface StickerItem {
  id: string;
  emoji: string;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
}

export const StatusEditorModal: React.FC<StatusEditorModalProps> = ({
  currentUser,
  contactUserIds,
  onClose,
  onPublishStory,
}) => {
  // Mode: 'pick_media' | 'edit_media' | 'text_mode'
  const [editorMode, setEditorMode] = useState<'pick_media' | 'edit_media' | 'text_mode'>('pick_media');

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');

  // Editing state for media
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [caption, setCaption] = useState<string>('');

  // Overlay text
  const [overlayText, setOverlayText] = useState<string>('');
  const [overlayTextColor, setOverlayTextColor] = useState<string>('#ffffff');
  const [overlayBgStyle, setOverlayBgStyle] = useState<'dark' | 'neon' | 'none'>('dark');

  // Stickers / Emojis
  const [stickers, setStickers] = useState<StickerItem[]>([]);

  // Video specific state
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);

  // Active editor subtool: 'none' | 'filters' | 'text' | 'stickers'
  const [activeSubtool, setActiveSubtool] = useState<'none' | 'filters' | 'text' | 'stickers'>('none');

  // Text-only mode state
  const [textStoryContent, setTextStoryContent] = useState<string>('');
  const [textStoryGradient, setTextStoryGradient] = useState<string>(GRADIENT_PRESETS[0]);

  // UI state
  const [isProcessingPublish, setIsProcessingPublish] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imagePreviewRef = useRef<HTMLImageElement>(null);

  // Handle incoming file (image or video)
  const handleSelectFile = (file: File) => {
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      alert('Por favor selecciona un archivo de imagen (JPG, PNG, GIF, WebP) o video (MP4, WebM, MOV).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setMediaFile(file);
      setMediaType(isVideo ? 'video' : 'image');
      setMediaUrl(result);
      setEditorMode('edit_media');
      // Reset edit adjustments
      setSelectedFilter(FILTER_PRESETS[0]);
      setRotation(0);
      setFlipH(false);
      setOverlayText('');
      setStickers([]);
      setIsVideoMuted(false);
      setIsVideoPlaying(true);
      setActiveSubtool('none');
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Flip horizontal
  const handleFlipHorizontal = () => {
    setFlipH((prev) => !prev);
  };

  // Add sticker emoji
  const handleAddSticker = (emoji: string) => {
    const newSticker: StickerItem = {
      id: 'stk_' + Date.now() + Math.random().toString(36).substr(2, 4),
      emoji,
      xPercent: 30 + Math.random() * 40,
      yPercent: 30 + Math.random() * 30,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const handleRemoveSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  // Toggle video play/pause
  const handleToggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  // Bake image edits to Canvas for 100% fidelity export
  const bakeImageToCanvas = async (): Promise<string> => {
    if (!imagePreviewRef.current || mediaType !== 'image') {
      return mediaUrl;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const isRotated90or270 = rotation === 90 || rotation === 270;
        const targetWidth = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
        const targetHeight = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

        // Cap max size to 1440px for rapid performance & fast loading
        const maxDim = 1440;
        const scale = Math.min(1, maxDim / Math.max(targetWidth, targetHeight));
        const finalW = Math.round(targetWidth * scale);
        const finalH = Math.round(targetHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = finalW;
        canvas.height = finalH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(mediaUrl);
          return;
        }

        ctx.save();

        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, finalW, finalH);

        // Center origin for transforms
        ctx.translate(finalW / 2, finalH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, 1);

        // Apply visual CSS filter if supported
        if (selectedFilter.css !== 'none') {
          try {
            ctx.filter = selectedFilter.css;
          } catch {
            // fallback if filter is not supported in canvas context
          }
        }

        const drawW = (isRotated90or270 ? finalH : finalW);
        const drawH = (isRotated90or270 ? finalW : finalH);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.restore();

        // Render Stickers
        if (stickers.length > 0) {
          ctx.save();
          const emojiSize = Math.max(28, Math.round(finalW * 0.08));
          ctx.font = `${emojiSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          stickers.forEach((s) => {
            const posX = (s.xPercent / 100) * finalW;
            const posY = (s.yPercent / 100) * finalH;
            ctx.fillText(s.emoji, posX, posY);
          });
          ctx.restore();
        }

        // Render Overlay Text
        if (overlayText.trim()) {
          ctx.save();
          const fontSize = Math.max(22, Math.round(finalW * 0.052));
          ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textY = finalH * 0.45;
          const textX = finalW / 2;
          const textMetrics = ctx.measureText(overlayText);
          const boxPaddingH = fontSize * 0.8;
          const boxPaddingV = fontSize * 0.45;
          const boxW = textMetrics.width + boxPaddingH * 2;
          const boxH = fontSize + boxPaddingV * 2;

          if (overlayBgStyle === 'dark') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
            ctx.beginPath();
            ctx.roundRect(textX - boxW / 2, textY - boxH / 2, boxW, boxH, fontSize * 0.4);
            ctx.fill();
          } else if (overlayBgStyle === 'neon') {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
            ctx.beginPath();
            ctx.roundRect(textX - boxW / 2, textY - boxH / 2, boxW, boxH, fontSize * 0.4);
            ctx.fill();
          }

          ctx.fillStyle = overlayBgStyle === 'neon' ? '#022c22' : overlayTextColor;
          ctx.fillText(overlayText, textX, textY);
          ctx.restore();
        }

        const bakedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(bakedDataUrl);
      };
      img.onerror = () => resolve(mediaUrl);
      img.src = mediaUrl;
    });
  };

  // Publish Story Action
  const handlePublish = async () => {
    setIsProcessingPublish(true);

    try {
      if (editorMode === 'text_mode') {
        if (!textStoryContent.trim()) {
          setIsProcessingPublish(false);
          return;
        }

        const newStory: StatusStory = {
          id: 'story_' + Date.now(),
          userId: currentUser?.id || 'usr_me',
          userName: currentUser?.displayName || 'Tú',
          userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          type: 'text',
          content: textStoryContent.trim(),
          backgroundGradient: textStoryGradient,
          timestamp: 'Justo ahora',
          expiresAt: 'En 24 horas',
          viewsCount: 0,
          isSelf: true,
          visibility: 'contacts',
          allowedViewerIds: currentUser ? [currentUser.id, ...Array.from(contactUserIds)] : [],
        };

        onPublishStory(newStory);
        onClose();
        return;
      }

      // Media Story (Image or Video)
      let finalContent = mediaUrl;
      if (mediaType === 'image') {
        finalContent = await bakeImageToCanvas();
      }

      const newStory: StatusStory = {
        id: 'story_' + Date.now(),
        userId: currentUser?.id || 'usr_me',
        userName: currentUser?.displayName || 'Tú',
        userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        type: mediaType || 'image',
        content: finalContent,
        filter: selectedFilter.css !== 'none' ? selectedFilter.css : undefined,
        caption: caption.trim() || undefined,
        isMuted: mediaType === 'video' ? isVideoMuted : undefined,
        timestamp: 'Justo ahora',
        expiresAt: 'En 24 horas',
        viewsCount: 0,
        isSelf: true,
        visibility: 'contacts',
        allowedViewerIds: currentUser ? [currentUser.id, ...Array.from(contactUserIds)] : [],
      };

      onPublishStory(newStory);
      onClose();
    } catch (err) {
      console.error('Error publishing story:', err);
    } finally {
      setIsProcessingPublish(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSelectFile(e.target.files[0]);
          }
        }}
      />

      <div className="relative w-full max-w-xl h-full max-h-[92vh] sm:max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/60 z-20">
          <div className="flex items-center gap-2.5">
            {editorMode !== 'pick_media' && (
              <button
                type="button"
                onClick={() => setEditorMode('pick_media')}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Volver a seleccionar medio"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-white text-sm">
                {editorMode === 'pick_media'
                  ? 'Nuevo Estado (24 Horas)'
                  : editorMode === 'text_mode'
                  ? 'Crear Estado de Texto'
                  : `Editor de ${mediaType === 'video' ? 'Video' : 'Imagen'}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header: Privacy guarantee badge */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Visible únicamente para tus contactos y amigos autorizados</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 uppercase font-bold tracking-wider">Cifrado E2EE</span>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* SCREEN 1: PICK MEDIA OR TEXT */}
          {editorMode === 'pick_media' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-md p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10 scale-102'
                    : 'border-slate-700 hover:border-emerald-500/80 bg-slate-950/40 hover:bg-slate-800/40'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Subir Foto o Video</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Arrastra aquí o haz clic para abrir la galería de tu dispositivo
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-300">
                    <ImageIcon className="w-3 h-3 text-emerald-400" /> Fotos (JPG, PNG, GIF, WebP)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-300">
                    <VideoIcon className="w-3 h-3 text-cyan-400" /> Videos (MP4, MOV, WebM)
                  </span>
                </div>
              </div>

              {/* Alternative: Text Story Button */}
              <div className="w-full max-w-md flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">o si prefieres</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <button
                type="button"
                onClick={() => setEditorMode('text_mode')}
                className="w-full max-w-md p-4 rounded-2xl bg-gradient-to-r from-indigo-950/50 to-purple-950/50 hover:from-indigo-900/60 hover:to-purple-900/60 border border-indigo-500/30 hover:border-indigo-400/60 flex items-center justify-center gap-2.5 text-slate-200 hover:text-white transition-all cursor-pointer font-semibold text-xs shadow-md"
              >
                <Type className="w-4 h-4 text-indigo-400" />
                <span>Escribir Estado de Solo Texto con Fondos de Colores</span>
              </button>
            </div>
          )}

          {/* SCREEN 2: TEXT-ONLY STORY MODE */}
          {editorMode === 'text_mode' && (
            <div className="flex-1 flex flex-col p-5 space-y-4">
              {/* Visual Card Canvas */}
              <div
                className="flex-1 min-h-[220px] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden"
                style={{ background: textStoryGradient }}
              >
                <textarea
                  placeholder="¿Qué estás pensando hoy? Escribe algo inspirador o un aviso..."
                  value={textStoryContent}
                  onChange={(e) => setTextStoryContent(e.target.value)}
                  rows={4}
                  className="w-full max-w-sm bg-transparent text-white font-extrabold text-xl sm:text-2xl text-center placeholder-white/65 focus:outline-none resize-none drop-shadow-md"
                  autoFocus
                />
              </div>

              {/* Gradient Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-400" />
                  Elige un degradado de fondo:
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                  {GRADIENT_PRESETS.map((grad, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTextStoryGradient(grad)}
                      className={`w-8 h-8 rounded-full transition-all shrink-0 cursor-pointer ${
                        textStoryGradient === grad
                          ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ background: grad }}
                    />
                  ))}
                </div>
              </div>

              {/* Footer publish */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditorMode('pick_media')}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!textStoryContent.trim() || isProcessingPublish}
                  onClick={handlePublish}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Publicar Estado</span>
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: INTEGRATED MEDIA EDITOR (Image / Video) */}
          {editorMode === 'edit_media' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Media Preview Canvas Container */}
              <div className="relative flex-1 min-h-[260px] bg-slate-950 flex items-center justify-center overflow-hidden p-2">
                {/* Media Item */}
                {mediaType === 'image' ? (
                  <div className="relative max-h-full max-w-full flex items-center justify-center">
                    <img
                      ref={imagePreviewRef}
                      src={mediaUrl}
                      alt="Story preview"
                      className="max-h-[46vh] sm:max-h-[50vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all"
                      style={{
                        filter: selectedFilter.css !== 'none' ? selectedFilter.css : undefined,
                        transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                      }}
                    />

                    {/* Stickers Overlay */}
                    {stickers.map((stk) => (
                      <div
                        key={stk.id}
                        className="absolute group cursor-pointer"
                        style={{
                          left: `${stk.xPercent}%`,
                          top: `${stk.yPercent}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onClick={() => handleRemoveSticker(stk.id)}
                        title="Toca para eliminar sticker"
                      >
                        <span className="text-3xl select-none drop-shadow-lg">{stk.emoji}</span>
                        <span className="hidden group-hover:block absolute -top-4 -right-4 p-1 rounded-full bg-red-600 text-white text-[8px]">
                          ✕
                        </span>
                      </div>
                    ))}

                    {/* Overlay Text */}
                    {overlayText.trim() && (
                      <div
                        className="absolute pointer-events-none text-center px-4 max-w-[85%]"
                        style={{
                          top: '45%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span
                          className={`font-black text-lg sm:text-xl drop-shadow-md px-4 py-2 rounded-2xl inline-block ${
                            overlayBgStyle === 'dark'
                              ? 'bg-black/75 text-white'
                              : overlayBgStyle === 'neon'
                              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40'
                              : 'bg-transparent text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]'
                          }`}
                          style={{
                            color: overlayBgStyle === 'none' ? overlayTextColor : undefined,
                          }}
                        >
                          {overlayText}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Video preview */
                  <div className="relative max-h-full max-w-full flex items-center justify-center">
                    <video
                      ref={videoRef}
                      src={mediaUrl}
                      playsInline
                      loop
                      autoPlay
                      muted={isVideoMuted}
                      className="max-h-[46vh] sm:max-h-[50vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all"
                      style={{
                        filter: selectedFilter.css !== 'none' ? selectedFilter.css : undefined,
                      }}
                    />

                    {/* Play/Pause center overlay button */}
                    <button
                      type="button"
                      onClick={handleToggleVideoPlay}
                      className="absolute p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all cursor-pointer"
                    >
                      {isVideoPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </button>

                    {/* Stickers Overlay */}
                    {stickers.map((stk) => (
                      <div
                        key={stk.id}
                        className="absolute group cursor-pointer"
                        style={{
                          left: `${stk.xPercent}%`,
                          top: `${stk.yPercent}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onClick={() => handleRemoveSticker(stk.id)}
                        title="Toca para eliminar sticker"
                      >
                        <span className="text-3xl select-none drop-shadow-lg">{stk.emoji}</span>
                      </div>
                    ))}

                    {/* Overlay Text */}
                    {overlayText.trim() && (
                      <div
                        className="absolute pointer-events-none text-center px-4 max-w-[85%]"
                        style={{
                          top: '45%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span
                          className={`font-black text-lg sm:text-xl drop-shadow-md px-4 py-2 rounded-2xl inline-block ${
                            overlayBgStyle === 'dark'
                              ? 'bg-black/75 text-white'
                              : overlayBgStyle === 'neon'
                              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40'
                              : 'bg-transparent text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]'
                          }`}
                        >
                          {overlayText}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* EDITOR TOOLBAR & CONTROLS */}
              <div className="bg-slate-900 border-t border-slate-800 p-3 space-y-3">
                {/* Primary Quick Tool Buttons */}
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-xs">
                  {/* Filters button */}
                  <button
                    type="button"
                    onClick={() => setActiveSubtool(activeSubtool === 'filters' ? 'none' : 'filters')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer shrink-0 ${
                      activeSubtool === 'filters'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Filtros</span>
                    {selectedFilter.id !== 'none' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    )}
                  </button>

                  {/* Text overlay button */}
                  <button
                    type="button"
                    onClick={() => setActiveSubtool(activeSubtool === 'text' ? 'none' : 'text')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer shrink-0 ${
                      activeSubtool === 'text'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Texto</span>
                    {overlayText && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />}
                  </button>

                  {/* Stickers / Emojis button */}
                  <button
                    type="button"
                    onClick={() => setActiveSubtool(activeSubtool === 'stickers' ? 'none' : 'stickers')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer shrink-0 ${
                      activeSubtool === 'stickers'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5" />
                    <span>Stickers</span>
                    {stickers.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-[9px] text-slate-950 font-bold">
                        {stickers.length}
                      </span>
                    )}
                  </button>

                  {/* Image only tools: Rotate & Flip */}
                  {mediaType === 'image' && (
                    <>
                      <button
                        type="button"
                        onClick={handleRotate}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold cursor-pointer shrink-0"
                        title="Girar 90° a la derecha"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Girar</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFlipHorizontal}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold cursor-pointer shrink-0 transition-colors ${
                          flipH ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                        title="Espejo horizontal"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Espejo</span>
                      </button>
                    </>
                  )}

                  {/* Video only tool: Mute audio toggle */}
                  {mediaType === 'video' && (
                    <button
                      type="button"
                      onClick={() => setIsVideoMuted((prev) => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold cursor-pointer shrink-0 transition-colors ${
                        isVideoMuted
                          ? 'bg-amber-600/90 text-white'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isVideoMuted ? 'Sin Audio' : 'Audio Activo'}</span>
                    </button>
                  )}

                  {/* Replace media file */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white font-medium cursor-pointer shrink-0 ml-auto"
                    title="Cambiar foto o video"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Cambiar</span>
                  </button>
                </div>

                {/* SUBTOOL 1: FILTERS DRAWER */}
                {activeSubtool === 'filters' && (
                  <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2 overflow-x-auto">
                    {FILTER_PRESETS.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setSelectedFilter(filter)}
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                          selectedFilter.id === filter.id
                            ? 'bg-emerald-500/20 border border-emerald-500 text-white'
                            : 'hover:bg-slate-800/60 text-slate-400'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg shadow-md border border-slate-700/80 flex items-center justify-center overflow-hidden font-black text-xs"
                          style={{
                            background: filter.colorPreview,
                            filter: filter.css !== 'none' ? filter.css : undefined,
                          }}
                        >
                          Aa
                        </div>
                        <span className="text-[10px] font-medium">{filter.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* SUBTOOL 2: TEXT OVERLAY DRAWER */}
                {activeSubtool === 'text' && (
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Escribe texto sobre la imagen..."
                        value={overlayText}
                        onChange={(e) => setOverlayText(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        maxLength={60}
                      />
                      {overlayText && (
                        <button
                          type="button"
                          onClick={() => setOverlayText('')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400"
                          title="Borrar texto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Estilo:</span>
                        <button
                          type="button"
                          onClick={() => setOverlayBgStyle('dark')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                            overlayBgStyle === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400'
                          }`}
                        >
                          Fondo Oscuro
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverlayBgStyle('neon')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                            overlayBgStyle === 'neon' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Resaltado
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverlayBgStyle('none')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                            overlayBgStyle === 'none' ? 'bg-slate-700 text-white' : 'text-slate-400'
                          }`}
                        >
                          Sin Fondo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTOOL 3: STICKERS DRAWER */}
                {activeSubtool === 'stickers' && (
                  <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-semibold">Toca para añadir sticker:</span>
                      {stickers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setStickers([])}
                          className="text-[10px] text-red-400 hover:underline"
                        >
                          Limpiar todos
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {QUICK_EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddSticker(emoji)}
                          className="text-2xl p-1.5 rounded-xl hover:bg-slate-800 active:scale-90 transition-transform cursor-pointer shrink-0"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Caption & Final Publish Button */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Añade un pie de foto o comentario..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    maxLength={120}
                  />

                  <button
                    type="button"
                    disabled={isProcessingPublish}
                    onClick={handlePublish}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    {isProcessingPublish ? (
                      <span className="animate-spin text-sm">⏳</span>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Publicar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
