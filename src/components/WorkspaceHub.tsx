import React, { useState, useRef } from 'react';
import {
  FileText,
  Table,
  Code,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Search,
  FolderOpen,
  Calendar,
  CheckSquare,
  Bookmark,
  Share2,
  File,
  X,
  Eye,
  Save,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { WorkspaceItem, WorkspaceTool, ThemeSettings, UserProfile } from '../types';
import { NexusLogo } from './NexusLogo';

interface WorkspaceHubProps {
  items: WorkspaceItem[];
  onAddItem: (item: WorkspaceItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateItem?: (item: WorkspaceItem) => void;
  user: UserProfile;
  onConnectGoogle?: () => void;
  themeSettings: ThemeSettings;
  onShareToChat?: (text: string) => void;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  items,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
  user,
  themeSettings,
  onShareToChat,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'doc' | 'sheet' | 'code' | 'upload'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File Creator Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileType, setNewFileType] = useState<'doc' | 'sheet' | 'code'>('doc');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  // File Viewer / Editor Modal State
  const [activeFile, setActiveFile] = useState<WorkspaceItem | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  // Hidden file input for uploading files
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeFilter === 'doc' && item.tool !== 'docs' && item.tool !== 'keep') return false;
    if (activeFilter === 'sheet' && item.tool !== 'sheets') return false;
    if (activeFilter === 'code' && item.fileExtension !== 'json' && item.fileExtension !== 'js') return false;
    if (activeFilter === 'upload' && item.tool !== 'drive') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.content && item.content.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Real File Download trigger
  const handleDownloadFile = (item: WorkspaceItem) => {
    try {
      let blob: Blob;
      let filename = item.title;

      if (item.dataUrl) {
        // Base64 file
        const byteString = atob(item.dataUrl.split(',')[1] || '');
        const mimeString = item.dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        blob = new Blob([ab], { type: mimeString });
      } else {
        // Text/Markdown/CSV/JSON
        const ext = item.fileExtension || (item.tool === 'sheets' ? 'csv' : item.tool === 'docs' ? 'txt' : 'txt');
        if (!filename.includes('.')) {
          filename = `${filename}.${ext}`;
        }
        const mimeType =
          ext === 'csv'
            ? 'text/csv;charset=utf-8;'
            : ext === 'json'
            ? 'application/json;charset=utf-8;'
            : 'text/plain;charset=utf-8;';
        blob = new Blob([item.content || item.contentSnippet || ''], { type: mimeType });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Archivo "${filename}" descargado a tu dispositivo con éxito`);
    } catch (e: any) {
      showToast('Error al descargar archivo');
    }
  };

  // Create Real File
  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let tool: WorkspaceTool = 'docs';
    let ext = 'txt';
    let color = '#3b82f6';
    let defaultContent = newFileContent;

    if (newFileType === 'sheet') {
      tool = 'sheets';
      ext = 'csv';
      color = '#10b981';
      if (!defaultContent.trim()) {
        defaultContent = 'Item,Cantidad,Precio,Fecha\nProducto 1,10,15.50,2025-01-15\nProducto 2,5,30.00,2025-01-16';
      }
    } else if (newFileType === 'code') {
      tool = 'docs';
      ext = 'json';
      color = '#f59e0b';
      if (!defaultContent.trim()) {
        defaultContent = '{\n  "nombre": "Proyecto Nexus",\n  "version": "1.0.0",\n  "activo": true\n}';
      }
    } else {
      tool = 'docs';
      ext = 'md';
      color = '#6366f1';
      if (!defaultContent.trim()) {
        defaultContent = `# ${newFileName}\n\nCreado en Nexus Workspace seguro.\nFecha: ${new Date().toLocaleDateString()}\n\n- Nota 1\n- Nota 2`;
      }
    }

    const newItem: WorkspaceItem = {
      id: 'ws_' + Date.now(),
      tool,
      title: newFileName.trim(),
      subtitle: `${ext.toUpperCase()} • ${defaultContent.length} caracteres`,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      status: 'Creado',
      content: defaultContent,
      contentSnippet: defaultContent.slice(0, 120),
      fileExtension: ext,
      fileSizeBytes: new Blob([defaultContent]).size,
      badge: ext.toUpperCase(),
      color,
    };

    onAddItem(newItem);
    setShowCreateModal(false);
    setNewFileName('');
    setNewFileContent('');
    showToast(`Archivo "${newItem.title}" creado con éxito`);
  };

  // Handle Local File Upload into Workspace
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.csv');

    if (isText) {
      reader.onload = () => {
        const textContent = reader.result as string;
        const ext = file.name.split('.').pop() || 'txt';
        const newItem: WorkspaceItem = {
          id: 'ws_' + Date.now(),
          tool: ext === 'csv' ? 'sheets' : 'docs',
          title: file.name,
          subtitle: `Subido • ${(file.size / 1024).toFixed(1)} KB`,
          date: 'Hoy',
          status: 'Local',
          content: textContent,
          contentSnippet: textContent.slice(0, 140),
          fileExtension: ext,
          fileSizeBytes: file.size,
          badge: ext.toUpperCase(),
          color: '#3b82f6',
        };
        onAddItem(newItem);
        showToast(`Archivo "${file.name}" cargado a tu Workspace`);
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const ext = file.name.split('.').pop() || 'file';
        const newItem: WorkspaceItem = {
          id: 'ws_' + Date.now(),
          tool: 'drive',
          title: file.name,
          subtitle: `Binario • ${(file.size / 1024).toFixed(1)} KB`,
          date: 'Hoy',
          status: 'Local',
          dataUrl,
          contentSnippet: `Archivo ${file.name} guardado en el Workspace de tu dispositivo.`,
          fileExtension: ext,
          fileSizeBytes: file.size,
          badge: ext.toUpperCase(),
          color: '#10b981',
        };
        onAddItem(newItem);
        showToast(`Archivo "${file.name}" guardado en tu Workspace`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open viewer / editor
  const handleOpenFile = (item: WorkspaceItem) => {
    setActiveFile(item);
    setEditTitle(item.title);
    setEditContent(item.content || item.contentSnippet || '');
  };

  // Save changes in editor
  const handleSaveFileChanges = () => {
    if (!activeFile) return;
    const updated: WorkspaceItem = {
      ...activeFile,
      title: editTitle.trim() || activeFile.title,
      content: editContent,
      contentSnippet: editContent.slice(0, 120),
      subtitle: `${activeFile.fileExtension?.toUpperCase() || 'TXT'} • ${editContent.length} caracteres`,
      fileSizeBytes: new Blob([editContent]).size,
      date: 'Modificado hoy',
    };

    if (onUpdateItem) {
      onUpdateItem(updated);
    } else {
      onDeleteItem(activeFile.id);
      onAddItem(updated);
    }
    setActiveFile(updated);
    showToast('Cambios guardados con éxito');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white overflow-hidden select-none">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-semibold shadow-xl border border-emerald-400/40 animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileUploadInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <div className="p-4 md:p-6 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight">
                Workspace & Archivos
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Funcional
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Crea, edita y descarga documentos, listas y archivos reales directamente en tu dispositivo
            </p>
          </div>
        </div>

        {/* Create and Upload action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => fileUploadInputRef.current?.click()}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
            title="Subir archivo desde tu computadora o teléfono"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Subir Archivo</span>
          </button>

          <button
            onClick={() => {
              setNewFileName('');
              setNewFileContent('');
              setShowCreateModal(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Archivo</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 md:px-6 border-b border-slate-800/60 bg-slate-900/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        {/* Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({items.length})
          </button>

          <button
            onClick={() => setActiveFilter('doc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'doc'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Notas & Textos</span>
          </button>

          <button
            onClick={() => setActiveFilter('sheet')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'sheet'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tablas & CSV</span>
          </button>

          <button
            onClick={() => setActiveFilter('code')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'code'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Código & JSON</span>
          </button>

          <button
            onClick={() => setActiveFilter('upload')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'upload'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Archivos Locales</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título o contenido..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Files List / Grid Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <FolderOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No hay archivos en esta sección</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Crea un documento de texto, una hoja de cálculo o sube archivos para comenzar a utilizarlos de inmediato.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear mi primer archivo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredItems.map((item) => {
              const isSheet = item.tool === 'sheets' || item.fileExtension === 'csv';
              const isCode = item.fileExtension === 'json' || item.fileExtension === 'js';

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenFile(item)}
                  className="group p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between cursor-pointer space-y-3 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSheet
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isCode
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {isSheet ? (
                            <Table className="w-4 h-4" />
                          ) : isCode ? (
                            <Code className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-white truncate group-hover:text-blue-300 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-400">{item.subtitle}</p>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 uppercase">
                        {item.fileExtension || (isSheet ? 'CSV' : 'TXT')}
                      </span>
                    </div>

                    {/* Snippet preview */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/50 text-[11px] text-slate-300 font-mono line-clamp-3 leading-relaxed break-all">
                      {item.contentSnippet || item.content || 'Sin contenido previo...'}
                    </div>
                  </div>

                  {/* Card bottom actions */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[10px]">{item.date}</span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDownloadFile(item)}
                        title="Descargar archivo a mi computadora/móvil"
                        className="p-1.5 rounded-lg hover:bg-blue-600/20 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          const text = item.content || item.contentSnippet || item.title;
                          navigator.clipboard.writeText(text);
                          showToast('Contenido copiado al portapapeles');
                        }}
                        title="Copiar contenido"
                        className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteItem(item.id)}
                        title="Eliminar archivo"
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
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

      {/* CREATE FILE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Crear Nuevo Archivo</h3>
                  <p className="text-[11px] text-slate-400">El archivo se guardará y podrá ser descargado</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-3.5">
              {/* Type selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tipo de Archivo</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFileType('doc')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      newFileType === 'doc'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-[11px] font-semibold">Texto / Nota (.md/.txt)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewFileType('sheet')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      newFileType === 'sheet'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Table className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] font-semibold">Tabla / CSV (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewFileType('code')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      newFileType === 'code'
                        ? 'bg-amber-600/20 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Code className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-semibold">Código / JSON (.json)</span>
                  </button>
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nombre del Archivo</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder={
                    newFileType === 'sheet'
                      ? 'ej. Presupuesto_Mensual.csv'
                      : newFileType === 'code'
                      ? 'ej. Configuracion.json'
                      : 'ej. Notas_Reunion.txt'
                  }
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Initial content */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Contenido Inicial</label>
                <textarea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Escribe aquí el contenido del archivo..."
                  rows={5}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-95 text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  Guardar y Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE FILE EDITOR / VIEWER MODAL */}
      {activeFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl flex flex-col space-y-4 text-white overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="font-bold text-sm md:text-base text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none px-1"
                  />
                  <p className="text-[11px] text-slate-400 px-1">
                    {activeFile.fileExtension?.toUpperCase()} • {editContent.length} caracteres
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDownloadFile(activeFile)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Descargar archivo a tu equipo"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Descargar</span>
                </button>

                <button
                  onClick={handleSaveFileChanges}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>

                <button
                  onClick={() => setActiveFile(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-2xl border border-slate-800/80 p-3 overflow-hidden">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Escribe o edita el contenido del archivo aquí..."
                className="w-full h-full bg-transparent text-xs md:text-sm text-slate-200 font-mono resize-none focus:outline-none leading-relaxed selection:bg-blue-600/40"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 shrink-0">
              <div className="flex items-center gap-2 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Archivo guardado localmente de forma privada</span>
              </div>

              {onShareToChat && (
                <button
                  onClick={() => {
                    onShareToChat(`📄 Compartido desde Workspace: **${activeFile.title}**\n\n${editContent.slice(0, 300)}...`);
                    setActiveFile(null);
                    showToast('Contenido enviado al chat activo');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar al chat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
