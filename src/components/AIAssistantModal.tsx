import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckSquare,
  FileText,
  Calendar,
  Mail,
  Send,
  Copy,
  Check,
  X,
  Zap,
  Users,
  UserCheck,
  MessageSquare,
  User,
} from 'lucide-react';
import { ThemeSettings, Chat, Message, UserProfile } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResult: (text: string) => void;
  themeSettings: ThemeSettings;
  activeChat?: Chat | null;
  currentUser?: UserProfile | null;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyResult,
  themeSettings,
  activeChat,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<
    'differentiate' | 'summarize' | 'tasks' | 'agenda' | 'email'
  >('differentiate');
  const [inputContext, setInputContext] = useState('');
  const [useChatMessages, setUseChatMessages] = useState(true);
  const [aiOutput, setAiOutput] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compute detected participants from activeChat
  const participants = useMemo(() => {
    if (!activeChat || !activeChat.messages || activeChat.messages.length === 0) {
      return [
        { label: 'Tú', name: currentUser?.displayName || 'Usuario Actual', role: 'self' },
        { label: 'Persona A', name: activeChat?.name || 'Interlocutor', role: 'other' },
      ];
    }

    const map = new Map<string, { label: string; name: string; role: string }>();
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let letterIdx = 0;

    // Add current user first
    const selfId = currentUser?.id || 'current_user';
    map.set(selfId, {
      label: 'Tú (Usuario)',
      name: currentUser?.displayName || 'Tú',
      role: 'self',
    });

    activeChat.messages.forEach((m) => {
      const isSelf = m.senderId === selfId || m.senderName === currentUser?.displayName;
      if (!isSelf && !map.has(m.senderId)) {
        const letter = letters[letterIdx % letters.length];
        map.set(m.senderId, {
          label: `Persona ${letter}`,
          name: m.senderName || `Persona ${letter}`,
          role: 'other',
        });
        letterIdx++;
      }
    });

    return Array.from(map.values());
  }, [activeChat, currentUser]);

  if (!isOpen) return null;

  // Format messages payload with participant attribution
  const prepareMessagesPayload = () => {
    if (!useChatMessages || !activeChat || !activeChat.messages) return [];

    const selfId = currentUser?.id || 'current_user';
    return activeChat.messages.slice(-35).map((m) => ({
      senderId: m.senderId,
      senderName: m.senderName,
      sender: m.senderName,
      text: m.text,
      isSelf: m.senderId === selfId || m.senderName === currentUser?.displayName,
      senderTag: m.senderId === selfId || m.senderName === currentUser?.displayName ? 'self' : 'other',
    }));
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setAiOutput('');
    setExtractedTasks([]);

    const messagesPayload = prepareMessagesPayload();
    const promptToSend = inputContext.trim() || undefined;

    try {
      if (activeTab === 'differentiate') {
        const res = await fetch('/api/ai/chat-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze-participants',
            prompt: promptToSend || 'Diferencia y desglosa claramente qué dijo el usuario (Tú), Persona A, Persona B y las demás personas en este chat.',
            messages: messagesPayload,
            currentUserName: currentUser?.displayName || 'Tú',
            isDataSaver: themeSettings.dataSaverEnabled,
          }),
        });
        const data = await res.json();
        setAiOutput(data.result || 'Análisis completado.');
      } else if (activeTab === 'summarize') {
        const res = await fetch('/api/ai/chat-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'summarize',
            prompt: promptToSend,
            messages: messagesPayload,
            currentUserName: currentUser?.displayName || 'Tú',
            isDataSaver: themeSettings.dataSaverEnabled,
          }),
        });
        const data = await res.json();
        setAiOutput(data.result || 'Resumen generado');
      } else if (activeTab === 'tasks') {
        const res = await fetch('/api/ai/chat-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'extract-tasks',
            prompt: promptToSend,
            messages: messagesPayload,
            currentUserName: currentUser?.displayName || 'Tú',
            isDataSaver: themeSettings.dataSaverEnabled,
          }),
        });
        const data = await res.json();
        if (data.tasks) {
          setExtractedTasks(data.tasks);
        } else if (data.result) {
          setAiOutput(data.result);
        }
      } else if (activeTab === 'agenda') {
        const res = await fetch('/api/ai/chat-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'draft-email-or-doc',
            prompt: 'Orden del día para reunión Google Meet con tareas por persona',
            context: inputContext.trim(),
            messages: messagesPayload,
            currentUserName: currentUser?.displayName || 'Tú',
            isDataSaver: themeSettings.dataSaverEnabled,
          }),
        });
        const data = await res.json();
        setAiOutput(data.result || '');
      } else {
        // Email
        const res = await fetch('/api/ai/chat-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'draft-email-or-doc',
            prompt: 'Redacción de correo para Gmail',
            context: inputContext.trim(),
            messages: messagesPayload,
            currentUserName: currentUser?.displayName || 'Tú',
            isDataSaver: themeSettings.dataSaverEnabled,
          }),
        });
        const data = await res.json();
        setAiOutput(data.result || '');
      }
    } catch (e) {
      console.error(e);
      setAiOutput('Error procesando solicitud con Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy =
      extractedTasks.length > 0 ? JSON.stringify(extractedTasks, null, 2) : aiOutput;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Gemini AI Workspace Assistant</h3>
              <p className="text-xs text-slate-400">
                Diferenciación de participantes: Tú, Persona A, Persona B y más
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detected Participants Badge Bar */}
        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300 uppercase tracking-wide">
              <Users className="w-3.5 h-3.5" />
              <span>Participantes detectados en la conversación:</span>
            </div>
            {activeChat && (
              <span className="text-[10px] text-slate-400 font-mono">
                {activeChat.name} ({activeChat.messages?.length || 0} msgs)
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  p.role === 'self'
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                    : 'bg-slate-700/40 border-slate-600/40 text-slate-300'
                }`}
              >
                {p.role === 'self' ? <UserCheck className="w-3 h-3 text-blue-400" /> : <User className="w-3 h-3 text-purple-400" />}
                <strong className="font-bold">{p.label}:</strong> {p.name}
              </span>
            ))}
          </div>

          {activeChat && activeChat.messages && activeChat.messages.length > 0 && (
            <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useChatMessages}
                onChange={(e) => setUseChatMessages(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-purple-600 focus:ring-0"
              />
              <span>Vincular automáticamente los mensajes de <strong>"{activeChat.name}"</strong> para análisis</span>
            </label>
          )}
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/60 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('differentiate')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'differentiate'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Diferenciar Personas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summarize')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'summarize'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resumen con Atribución</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tareas por Persona</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'agenda'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Google Meet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'email'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail</span>
          </button>
        </div>

        {/* Input prompt / context */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">
            {activeTab === 'differentiate'
              ? 'Pregunta específica sobre los participantes o deja en blanco para desglose completo:'
              : activeTab === 'summarize'
              ? 'Notas adicionales para el resumen (opcional):'
              : activeTab === 'tasks'
              ? 'Filtro o especificaciones para las tareas (opcional):'
              : activeTab === 'agenda'
              ? 'Tema y objetivos de la reunión Meet:'
              : 'Detalles clave para el correo de Gmail:'}
          </label>
          <textarea
            rows={2}
            placeholder={
              useChatMessages && activeChat
                ? 'Mensajes del chat cargados automáticamente. Puedes añadir instrucciones adicionales aquí...'
                : 'Escribe o pega aquí el texto para la IA...'
            }
            value={inputContext}
            onChange={(e) => setInputContext(e.target.value)}
            className="w-full text-xs rounded-2xl p-3 bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>
            {isLoading
              ? 'Analizando con Gemini...'
              : activeTab === 'differentiate'
              ? 'Analizar y Diferenciar Participantes'
              : 'Generar Asistencia con IA'}
          </span>
        </button>

        {/* Result Area */}
        {(aiOutput || extractedTasks.length > 0) && (
          <div className="space-y-2 p-4 rounded-2xl bg-black/40 border border-purple-500/30">
            <div className="flex items-center justify-between text-xs text-purple-300 font-semibold pb-2 border-b border-slate-800">
              <span>Resultado Generado:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text =
                      extractedTasks.length > 0
                        ? extractedTasks
                            .map((t) => `• [${t.assignedTo || 'Equipo'}] ${t.title} (${t.dueDate || 'Hoy'})`)
                            .join('\n')
                        : aiOutput;
                    onApplyResult(text);
                    onClose();
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer"
                >
                  Insertar en el chat
                </button>
              </div>
            </div>

            {extractedTasks.length > 0 ? (
              <div className="space-y-1.5 pt-2">
                {extractedTasks.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="font-semibold text-white truncate">{t.title}</span>
                      {t.assignedTo && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold shrink-0">
                          {t.assignedTo}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono shrink-0 ml-2">
                      {t.dueDate || 'Hoy'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed pt-2">
                {aiOutput}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
