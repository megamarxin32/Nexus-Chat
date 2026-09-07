import React, { useState } from 'react';
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
} from 'lucide-react';
import { ThemeSettings } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResult: (text: string) => void;
  themeSettings: ThemeSettings;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyResult,
  themeSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'summarize' | 'tasks' | 'agenda' | 'email'>('summarize');
  const [inputContext, setInputContext] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!inputContext.trim()) {
      setAiOutput('Por favor escribe o pega el texto que deseas procesar con IA.');
      return;
    }

    setIsLoading(true);
    setAiOutput('');
    setExtractedTasks([]);

    try {
      if (activeTab === 'tasks') {
        const res = await fetch('/api/ai/chat-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'extract-tasks',
            prompt: inputContext.trim(),
            isDataSaver: themeSettings.dataSaverEnabled,
          }),
        });
        const data = await res.json();
        if (data.tasks) {
          setExtractedTasks(data.tasks);
        }
      } else if (activeTab === 'summarize') {
        const res = await fetch('/api/ai/chat-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'summarize',
            prompt: inputContext.trim(),
            isDataSaver: themeSettings.dataSaverEnabled,
          }),
        });
        const data = await res.json();
        setAiOutput(data.result || 'Resumen generado');
      } else if (activeTab === 'agenda') {
        const res = await fetch('/api/ai/chat-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'draft-email-or-doc',
            prompt: 'Orden del día para reunión Google Meet',
            context: inputContext.trim(),
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
    const textToCopy = extractedTasks.length > 0 ? JSON.stringify(extractedTasks, null, 2) : aiOutput;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gemini AI Workspace Assistant</h3>
              <p className="text-xs text-slate-400">
                Optimiza y organiza los flujos de trabajo de tu equipo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('summarize')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'summarize'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resumir Conversación</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'tasks'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Extraer Google Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'agenda'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agenda Google Meet</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'email'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Borrador Gmail</span>
          </button>
        </div>

        {/* Input prompt / context */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">
            {activeTab === 'summarize'
              ? 'Texto o mensajes a resumir:'
              : activeTab === 'tasks'
              ? 'Mensajes para detectar tareas pendientes:'
              : activeTab === 'agenda'
              ? 'Tema y objetivos de la reunión Meet:'
              : 'Detalles clave para el correo de Gmail:'}
          </label>
          <textarea
            rows={3}
            placeholder="Pega aquí los mensajes o escribe el contexto para la IA..."
            value={inputContext}
            onChange={(e) => setInputContext(e.target.value)}
            className="w-full text-xs rounded-2xl p-3 bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Procesando con Gemini...' : 'Generar Asistencia con IA'}</span>
        </button>

        {/* Result Area */}
        {(aiOutput || extractedTasks.length > 0) && (
          <div className="space-y-2 p-4 rounded-2xl bg-black/40 border border-purple-500/30">
            <div className="flex items-center justify-between text-xs text-purple-300 font-semibold pb-2 border-b border-slate-800">
              <span>Resultado Generado:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  onClick={() => {
                    const text =
                      extractedTasks.length > 0
                        ? extractedTasks.map((t) => `• [Google Task] ${t.title} (${t.dueDate || 'Hoy'})`).join('\n')
                        : aiOutput;
                    onApplyResult(text);
                    onClose();
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold"
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
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-medium">{t.title}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                      {t.dueDate || 'Vence pronto'}
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
