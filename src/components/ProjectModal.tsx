import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileCode2,
  ExternalLink,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Project } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, template: 'blank' | 'web') => void;
  onRenameProject: (id: string, newName: string) => void;
  onDeleteProject: (id: string) => void;
  onExportProjectZip: (project: Project) => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onExportProjectZip,
  themeClasses,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [templateType, setTemplateType] = useState<'blank' | 'web'>('web');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), templateType);
    setNewProjectName('');
    setIsCreatingNew(false);
    onClose();
  };

  const handleRenameSubmit = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onRenameProject(id, editName.trim());
    setEditingId(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none"
      onClick={onClose}
    >
      <div
        id="project-manager-modal"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-xl shadow-2xl border ${themeClasses.bgSidebar} ${themeClasses.border} overflow-hidden flex flex-col max-h-[85vh]`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Projects Manager</h3>
              <p className="text-xs text-slate-400">
                Switch projects, create new workspaces, and manage all saved code in LocalStorage.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCreatingNew && (
              <button
                id="btn-modal-new-project"
                onClick={() => setIsCreatingNew(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create New Project Section */}
        {isCreatingNew && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-4 bg-blue-950/20 border-b border-blue-500/30 shrink-0 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Create New Project
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Project Name (e.g. ecommerce-site, blog, portfolio)
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. ecommerce-site"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Starter Template
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setTemplateType('web')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    templateType === 'web'
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-blue-400 mb-1">
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>Web App (HTML/CSS/JS)</span>
                  </div>
                  <p className="text-[11px] leading-tight text-slate-400">
                    Includes index.html, style.css & script.js with instant live preview.
                  </p>
                </div>

                <div
                  onClick={() => setTemplateType('blank')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    templateType === 'blank'
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-slate-200 mb-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Clean Blank Project</span>
                  </div>
                  <p className="text-[11px] leading-tight text-slate-400">
                    Completely clean and empty. Create your own folders & files from scratch.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newProjectName.trim()}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>Create & Open Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Saved Projects ({projects.length})
          </div>

          {projects.map((proj) => {
            const isActive = proj.id === activeProjectId;
            const isEditing = editingId === proj.id;

            return (
              <div
                key={proj.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  isActive
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleRenameSubmit(proj.id, e)}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-slate-950 text-white px-2 py-0.5 rounded border border-blue-500 text-xs font-semibold outline-none"
                        />
                        <button type="submit" className="p-1 hover:text-emerald-400 text-slate-400">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 hover:text-red-400 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="font-bold text-white text-sm truncate">{proj.name}</span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 text-[10px] font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setEditingId(proj.id);
                            setEditName(proj.name);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                          title="Rename Project"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>{proj.files.length} files / folders</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400">Saved in LocalStorage</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onExportProjectZip(proj)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title="Export Project as ZIP"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {projects.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete project "${proj.name}"?`)) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {!isActive && (
                    <button
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Switch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
