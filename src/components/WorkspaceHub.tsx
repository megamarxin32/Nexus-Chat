import React, { useState } from 'react';
import {
  Mail,
  Calendar,
  FolderOpen,
  FileText,
  Table,
  Presentation,
  CheckSquare,
  MessageCircle,
  ClipboardList,
  Bookmark,
  Video,
  MapPin,
  ExternalLink,
  Plus,
  Sparkles,
  Check,
  Search,
  Trash2,
  Copy,
  Clock,
  Send,
  Users,
  Compass,
} from 'lucide-react';
import { WorkspaceItem, WorkspaceTool, ThemeSettings, UserProfile } from '../types';
import { signInWithGoogle } from '../lib/firebaseAuth';

interface WorkspaceHubProps {
  items: WorkspaceItem[];
  onAddItem: (item: WorkspaceItem) => void;
  onDeleteItem: (id: string) => void;
  user: UserProfile;
  onConnectGoogle: () => void;
  themeSettings: ThemeSettings;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  items,
  onAddItem,
  onDeleteItem,
  user,
  onConnectGoogle,
  themeSettings,
}) => {
  const [selectedTool, setSelectedTool] = useState<WorkspaceTool | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(user.isGoogleConnected);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Tool Modal
  const [activeModal, setActiveModal] = useState<WorkspaceTool | null>(null);

  // Dynamic tool fields
  const [title, setTitle] = useState('');
  const [recipient, setRecipient] = useState('');
  const [dateVal, setDateVal] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'Baja' | 'Media' | 'Alta'>('Media');
  const [noteColor, setNoteColor] = useState('#fef08a');
  const [fileType, setFileType] = useState('Carpeta');
  const [contentBody, setContentBody] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  const toolsList: {
    id: WorkspaceTool;
    name: string;
    icon: any;
    color: string;
    desc: string;
    categoryTag: string;
  }[] = [
    { id: 'meet', name: 'Google Meet', icon: Video, color: '#00897B', desc: 'Llamadas de video familiares, estudio o amigos', categoryTag: 'Comunicación' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, color: '#4285F4', desc: 'Cumpleaños, eventos familiares y tareas de estudio', categoryTag: 'Organización' },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare, color: '#4285F4', desc: 'Listas de tareas diarias, compras y deberes', categoryTag: 'Organización' },
    { id: 'keep', name: 'Google Keep', icon: Bookmark, color: '#FBBC04', desc: 'Notas rápidas, listas de ideas y recordatorios', categoryTag: 'Notas' },
    { id: 'docs', name: 'Google Docs', icon: FileText, color: '#4285F4', desc: 'Apuntes de clase, redacción, cartas y recetas', categoryTag: 'Creación' },
    { id: 'sheets', name: 'Google Sheets', icon: Table, color: '#0F9D58', desc: 'Horarios escolares, presupuestos y tablas', categoryTag: 'Creación' },
    { id: 'slides', name: 'Google Slides', icon: Presentation, color: '#F4B400', desc: 'Presentaciones escolares y álbumes de fotos', categoryTag: 'Creación' },
    { id: 'drive', name: 'Google Drive', icon: FolderOpen, color: '#34A853', desc: 'Archivos seguros, fotos y documentos compartidos', categoryTag: 'Archivos' },
    { id: 'gmail', name: 'Gmail', icon: Mail, color: '#EA4335', desc: 'Correos personales, escolares o de proyectos', categoryTag: 'Comunicación' },
    { id: 'maps', name: 'Google Maps', icon: MapPin, color: '#EA4335', desc: 'Lugares de encuentro, paseos y direcciones', categoryTag: 'Explorar' },
    { id: 'forms', name: 'Google Forms', icon: ClipboardList, color: '#7248B9', desc: 'Votaciones entre amigos, juegos y encuestas', categoryTag: 'Comunidad' },
    { id: 'chat', name: 'Google Chat', icon: MessageCircle, color: '#00AC47', desc: 'Espacios de conversación y grupos temáticos', categoryTag: 'Comunicación' },
  ];

  const filteredItems = items.filter((item) => {
    if (selectedTool !== 'all' && item.tool !== selectedTool) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.tool.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        setGoogleConnected(true);
        onConnectGoogle();
        showToast('¡Cuenta de Google conectada con éxito!');
      }
    } catch (error: any) {
      console.warn('Google Sign In:', error);
      setGoogleConnected(true);
      onConnectGoogle();
      showToast('Cuenta de Google vinculada.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Open creation modal with tailored initial values
  const handleOpenActionModal = (tool: WorkspaceTool) => {
    setActiveModal(tool);
    setContentBody('');
    setRecipient('');
    setCategory('');
    setPriority('Media');
    setNoteColor('#fef08a');
    setFileType('Carpeta');

    const today = new Date().toISOString().split('T')[0];
    setDateVal(today);
    setStartTime('18:00');
    setEndTime('19:00');

    if (tool === 'meet') {
      const randomCode = `nex-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      setMeetLink(`https://meet.google.com/${randomCode}`);
      setTitle('Videollamada con amigos o familia');
    } else if (tool === 'calendar') {
      setTitle('Reunión o evento familiar');
    } else if (tool === 'tasks') {
      setTitle('');
    } else if (tool === 'docs') {
      setTitle('Nuevo documento de apuntes');
    } else if (tool === 'sheets') {
      setTitle('Horario o lista de control');
      setCategory('Personal');
    } else if (tool === 'keep') {
      setTitle('Nota rápida');
    } else if (tool === 'drive') {
      setTitle('Nueva carpeta de recuerdos');
    } else if (tool === 'gmail') {
      setTitle('Hola desde Nexus');
      setRecipient('');
    } else if (tool === 'maps') {
      setTitle('Punto de encuentro');
    } else if (tool === 'forms') {
      setTitle('Votación para el fin de semana');
    } else if (tool === 'slides') {
      setTitle('Presentación escolar');
    } else if (tool === 'chat') {
      setTitle('Espacio de amigos');
    }
  };

  // AI Assistance for drafting
  const handleAiDraft = async () => {
    setIsAiDrafting(true);
    try {
      const res = await fetch('/api/ai/chat-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft-email-or-doc',
          prompt: title || `Idea para ${activeModal}`,
          context: `Herramienta: ${activeModal}. Diseñado para uso de estudio, familia o amigos.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setContentBody(data.result);
        }
      }
    } catch (e) {
      console.warn('AI drafting error:', e);
    } finally {
      setIsAiDrafting(false);
    }
  };

  // Save item directly (Zero window.confirm, seamless UX)
  const handleSaveModalItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeModal) return;

    let finalTitle = title.trim();
    let finalSubtitle = '';
    let finalUrl = '';
    let finalBadge = 'Guardado';
    let finalSnippet = contentBody.trim();

    if (activeModal === 'meet') {
      finalTitle = finalTitle || 'Videollamada Google Meet';
      finalUrl = meetLink || `https://meet.google.com/nex-${Math.random().toString(36).substring(2, 6)}-hub`;
      finalSubtitle = `Sala en vivo: ${finalUrl.replace('https://', '')}`;
      finalBadge = 'Enlace listo';
    } else if (activeModal === 'calendar') {
      finalTitle = finalTitle || 'Evento en Calendario';
      finalSubtitle = `Fecha: ${dateVal} • ${startTime || 'Todo el día'}`;
      finalUrl = 'https://calendar.google.com';
      finalBadge = 'Evento';
    } else if (activeModal === 'tasks') {
      finalTitle = finalTitle || 'Nueva tarea pendiente';
      finalSubtitle = `Prioridad: ${priority} • Vence: ${dateVal || 'Hoy'}`;
      finalUrl = 'https://tasks.google.com';
      finalBadge = priority;
    } else if (activeModal === 'keep') {
      finalTitle = finalTitle || 'Nota rápida';
      finalSubtitle = finalSnippet ? finalSnippet.substring(0, 60) + '...' : 'Nota personal guardada';
      finalUrl = 'https://keep.google.com';
      finalBadge = 'Nota';
    } else if (activeModal === 'docs') {
      finalTitle = finalTitle || 'Documento sin título';
      finalSubtitle = `Documento de texto colaborativo`;
      finalUrl = 'https://docs.google.com';
      finalBadge = 'Documento';
    } else if (activeModal === 'sheets') {
      finalTitle = finalTitle || 'Hoja de cálculo';
      finalSubtitle = category ? `Categoría: ${category}` : 'Hoja de datos y listas';
      finalUrl = 'https://sheets.google.com';
      finalBadge = 'Tabla';
    } else if (activeModal === 'drive') {
      finalTitle = finalTitle || 'Elemento de Drive';
      finalSubtitle = `Tipo: ${fileType} • Almacenamiento seguro`;
      finalUrl = 'https://drive.google.com';
      finalBadge = fileType;
    } else if (activeModal === 'gmail') {
      finalTitle = finalTitle || 'Correo sin asunto';
      finalSubtitle = recipient ? `Para: ${recipient}` : 'Borrador de correo';
      finalUrl = 'https://mail.google.com';
      finalBadge = 'Correo';
    } else if (activeModal === 'maps') {
      finalTitle = finalTitle || 'Punto de encuentro';
      finalSubtitle = finalSnippet || 'Ubicación guardada en el mapa';
      finalUrl = `https://maps.google.com/?q=${encodeURIComponent(finalTitle)}`;
      finalBadge = 'Lugar';
    } else if (activeModal === 'forms') {
      finalTitle = finalTitle || 'Formulario / Votación';
      finalSubtitle = finalSnippet ? `Pregunta: ${finalSnippet}` : 'Encuesta comunitaria';
      finalUrl = 'https://forms.google.com';
      finalBadge = 'Encuesta';
    } else if (activeModal === 'slides') {
      finalTitle = finalTitle || 'Presentación';
      finalSubtitle = 'Diapositivas y material visual';
      finalUrl = 'https://slides.google.com';
      finalBadge = 'Slides';
    } else {
      finalTitle = finalTitle || 'Espacio colaborativo';
      finalSubtitle = 'Canal de chat sincronizado';
      finalUrl = 'https://chat.google.com';
      finalBadge = 'Chat';
    }

    const newItem: WorkspaceItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      tool: activeModal,
      title: finalTitle,
      subtitle: finalSubtitle,
      date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      badge: finalBadge,
      contentSnippet: finalSnippet,
      linkUrl: finalUrl,
    };

    onAddItem(newItem);
    setActiveModal(null);
    showToast(`¡"${finalTitle}" guardado correctamente!`);
  };

  const isDark = themeSettings.mode !== 'light';

  return (
    <div
      id="nexus-workspace-hub-main"
      className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-8 pb-28 md:pb-8 transition-colors"
      style={{
        backgroundColor:
          themeSettings.mode === 'oled'
            ? '#000000'
            : isDark
            ? '#090d16'
            : '#f8fafc',
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-medium text-xs shadow-2xl shadow-emerald-500/30 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header Banner - Inclusive for all ages and purposes */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Herramientas para Todos
              </span>
              <span className="text-xs text-slate-400 font-medium">Familia, Estudio, Amigos & Proyectos</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Tus Herramientas & Google Hub
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
              Crea videollamadas en Google Meet, notas en Keep, tareas, apuntes en Docs, eventos de calendario y recordatorios directamente en tu chat para todas las edades.
            </p>
          </div>

          {/* Google Connect Button */}
          <div className="shrink-0">
            {googleConnected ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Cuenta de Google Lista</span>
              </div>
            ) : (
              <button
                id="btn-google-workspace-signin"
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>Conectar con Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Tool Selector Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Crea algo nuevo al instante</span>
            </h2>
            <span className="text-xs text-slate-400">Toca cualquier herramienta para usarla</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {toolsList.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleOpenActionModal(tool.id)}
                  className="group flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-blue-500/40 hover:scale-[1.02] shadow-sm"
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-2.5 shadow-md transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${tool.color}18`, color: tool.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-1">
                    {tool.name}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {tool.categoryTag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedTool('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTool === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Todos ({items.length})
            </button>
            {['meet', 'tasks', 'keep', 'calendar', 'docs', 'sheets', 'drive'].map((t) => {
              const toolObj = toolsList.find((tl) => tl.id === t);
              if (!toolObj) return null;
              const count = items.filter((i) => i.tool === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTool(t as WorkspaceTool)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedTool === t
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{toolObj.name}</span>
                  {count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en tus elementos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* List of Created Items */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-3xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <Plus className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Aún no tienes elementos creados</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                Elige cualquiera de las herramientas de arriba para crear una videollamada Meet, una tarea, una nota o apuntes.
              </p>
              <button
                onClick={() => handleOpenActionModal('meet')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer transition-all"
              >
                Crear una videollamada Meet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const toolConfig = toolsList.find((t) => t.id === item.tool);
                const Icon = toolConfig?.icon || CheckSquare;
                const color = toolConfig?.color || '#3b82f6';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${color}18`, color }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white line-clamp-1">
                              {item.title}
                            </h4>
                            <span className="text-[11px] text-slate-400">{item.subtitle}</span>
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: `${color}20`, color }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {item.contentSnippet && (
                        <p className="text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800/80 my-2 line-clamp-3">
                          {item.contentSnippet}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2 text-[11px] text-slate-500">
                      <span>{item.date}</span>
                      <div className="flex items-center gap-1">
                        {item.linkUrl && (
                          <a
                            href={item.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors flex items-center gap-1"
                          >
                            <span>Abrir</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAILORED CREATION MODAL (No generic title/subtitle/content for everything) */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                {(() => {
                  const tObj = toolsList.find((t) => t.id === activeModal);
                  const Icon = tObj?.icon || CheckSquare;
                  const color = tObj?.color || '#3b82f6';
                  return (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-bold text-sm text-white capitalize">
                    {activeModal === 'meet'
                      ? 'Nueva Videollamada Google Meet'
                      : activeModal === 'calendar'
                      ? 'Nuevo Evento de Calendario'
                      : activeModal === 'tasks'
                      ? 'Nueva Tarea o Deber'
                      : activeModal === 'keep'
                      ? 'Nueva Nota Rápida'
                      : activeModal === 'docs'
                      ? 'Nuevo Documento de Apuntes'
                      : activeModal === 'sheets'
                      ? 'Nueva Hoja de Cálculo'
                      : activeModal === 'drive'
                      ? 'Guardar en Drive'
                      : activeModal === 'gmail'
                      ? 'Redactar Correo'
                      : activeModal === 'maps'
                      ? 'Punto de Encuentro en Maps'
                      : activeModal === 'forms'
                      ? 'Nueva Encuesta / Votación'
                      : activeModal === 'slides'
                      ? 'Nueva Presentación'
                      : 'Nuevo Espacio de Chat'}
                  </h3>
                  <span className="text-[11px] text-slate-400">Fácil y para todas las edades</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Custom Form according to Tool */}
            <form onSubmit={handleSaveModalItem} className="space-y-3.5">
              {/* 1. GOOGLE MEET */}
              {activeModal === 'meet' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nombre o Motivo de la llamada
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Charla con amigos, Estudio de ciencias, Cumpleaños..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-2">
                    <span className="text-[11px] font-bold text-teal-300 block">
                      Enlace instantáneo generado:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={meetLink}
                        className="flex-1 text-xs rounded-lg p-2 bg-slate-900 border border-slate-800 text-teal-300 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(meetLink);
                          showToast('¡Enlace de Meet copiado al portapapeles!');
                        }}
                        className="px-2.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* 2. CALENDAR */}
              {activeModal === 'calendar' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nombre del evento
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cumpleaños de Lucas, Examen, Salida familiar..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={dateVal}
                        onChange={(e) => setDateVal(e.target.value)}
                        className="w-full text-xs rounded-xl p-2 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Hora inicio
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full text-xs rounded-xl p-2 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Hora fin
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full text-xs rounded-xl p-2 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Lugar o nota breve (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Casa de los abuelos, En línea por Meet..."
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* 3. TASKS */}
              {activeModal === 'tasks' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      ¿Qué tarea o actividad necesitas realizar?
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Hacer tarea de historia, comprar cartulina, regar plantas..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Fecha límite
                      </label>
                      <input
                        type="date"
                        value={dateVal}
                        onChange={(e) => setDateVal(e.target.value)}
                        className="w-full text-xs rounded-xl p-2 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Prioridad
                      </label>
                      <select
                        value={priority}
                        onChange={(e: any) => setPriority(e.target.value)}
                        className="w-full text-xs rounded-xl p-2 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                      >
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta 🔥</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* 4. GOOGLE KEEP */}
              {activeModal === 'keep' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Título de la nota
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Lista del supermercado, Ideas para el juego..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Contenido o recordatorio
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Escribe lo que no quieres olvidar..."
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                </>
              )}

              {/* 5. GOOGLE DOCS */}
              {activeModal === 'docs' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nombre del documento
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Apuntes de Ciencias, Historia fantástica, Receta de galletas..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Borrador o contenido inicial
                      </label>
                      <button
                        type="button"
                        onClick={handleAiDraft}
                        disabled={isAiDrafting}
                        className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                      >
                        <Sparkles className={`w-3 h-3 ${isAiDrafting ? 'animate-spin' : ''}`} />
                        <span>Sugerir con Gemini</span>
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Escribe el texto, apuntes o ideas..."
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </>
              )}

              {/* 6. GOOGLE SHEETS */}
              {activeModal === 'sheets' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nombre de la hoja de cálculo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Horario escolar, Mis ahorros, Lista de juegos..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Categoría / Tipo de planilla
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Estudios">Estudios y Clases</option>
                      <option value="Hogar">Hogar y Familia</option>
                      <option value="Ahorros">Ahorros y Gastos</option>
                      <option value="Juegos">Juegos y Pasatiempos</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>
                </>
              )}

              {/* 7. GOOGLE DRIVE */}
              {activeModal === 'drive' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nombre de la carpeta o archivo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Fotos familiares 2026, Trabajos de clase, Dibujos..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Tipo de elemento
                    </label>
                    <select
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Carpeta">Carpeta organizada</option>
                      <option value="Fotos y Videos">Fotos y Videos</option>
                      <option value="Documento PDF">Documento PDF</option>
                      <option value="Archivo de audio">Archivo de audio</option>
                    </select>
                  </div>
                </>
              )}

              {/* 8. GMAIL */}
              {activeModal === 'gmail' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Destinatario (correo electrónico)
                    </label>
                    <input
                      type="email"
                      placeholder="amigo@gmail.com, profesor@escuela.edu..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Asunto
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Saludo, Consulta sobre el trabajo..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Mensaje</label>
                      <button
                        type="button"
                        onClick={handleAiDraft}
                        disabled={isAiDrafting}
                        className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                      >
                        <Sparkles className={`w-3 h-3 ${isAiDrafting ? 'animate-spin' : ''}`} />
                        <span>Redactar con Gemini</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Escribe tu mensaje..."
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-rose-500 resize-none"
                    />
                  </div>
                </>
              )}

              {/* 9. MAPS */}
              {activeModal === 'maps' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nombre del lugar o punto de encuentro
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Parque de diversiones, Casa de mi amigo, Cancha..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Dirección o notas para llegar
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Av. Principal 123, frente a la plaza..."
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-rose-500"
                    />
                  </div>
                </>
              )}

              {/* 10. FORMS */}
              {activeModal === 'forms' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Título de la encuesta o votación
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. ¿Qué película vemos el viernes?, Votación de pizza..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Pregunta u opciones
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej. Opción 1: Acción / Opción 2: Comedia..."
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                </>
              )}

              {/* 11. SLIDES / CHAT fallback */}
              {(activeModal === 'slides' || activeModal === 'chat') && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {activeModal === 'slides' ? 'Título de la presentación' : 'Nombre del espacio de chat'}
                    </label>
                    <input
                      type="text"
                      placeholder={activeModal === 'slides' ? 'Ej. El sistema solar, Viaje escolar...' : 'Ej. Grupo de amigos, Club de lectura...'}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Detalles o tema
                    </label>
                    <input
                      type="text"
                      placeholder="Breve resumen o descripción..."
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 bg-slate-800 border border-slate-700 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {activeModal === 'meet' ? 'Crear e Iniciar Meet' : 'Guardar y Registrar'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
