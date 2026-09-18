import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  RotateCw,
  FolderArchive,
  Trash2,
  Edit2,
  MoreVertical,
} from 'lucide-react';
import { FileItem } from '../types';
import { getFileIcon } from '../utils/fileIcons';

interface FileExplorerViewProps {
  files: FileItem[];
  repoName: string;
  activeFilePath?: string;
  onOpenFile: (file: FileItem) => void;
  onToggleFolder: (path: string) => void;
  onCreateFile: (parentPath: string | null, name: string) => void;
  onCreateFolder: (parentPath: string | null, name: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (path: string, newName: string) => void;
  onExportZip: () => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const FileExplorerView: React.FC<FileExplorerViewProps> = ({
  files,
  repoName,
  activeFilePath,
  onOpenFile,
  onToggleFolder,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onExportZip,
  themeClasses,
}) => {
  const [isCreating, setIsCreating] = useState<{ parentPath: string | null; type: 'file' | 'folder' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenuPath, setContextMenuPath] = useState<string | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !isCreating) return;
    if (isCreating.type === 'file') {
      onCreateFile(isCreating.parentPath, newItemName.trim());
    } else {
      onCreateFolder(isCreating.parentPath, newItemName.trim());
    }
    setIsCreating(null);
    setNewItemName('');
  };

  const handleRenameSubmit = (path: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim()) return;
    onRenameFile(path, renameValue.trim());
    setRenamingPath(null);
    setRenameValue('');
  };

  const renderItem = (item: FileItem, depth: number = 0) => {
    const isFolder = item.type === 'folder';
    const isActive = item.path === activeFilePath;
    const isEditing = renamingPath === item.path;

    return (
      <div key={item.id} className="select-none text-xs">
        <div
          id={`file-tree-item-${item.path.replace(/[^a-zA-Z0-9_-]/g, '-')}`}
          className={`group flex items-center justify-between py-1 px-2 cursor-pointer transition-colors ${
            isActive
              ? 'bg-blue-600/25 text-white font-medium'
              : 'hover:bg-white/5 text-slate-300'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              onToggleFolder(item.path);
            } else {
              onOpenFile(item);
            }
          }}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
            {isFolder ? (
              item.isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )
            ) : (
              <span className="w-3.5" />
            )}

            {getFileIcon(item.name, isFolder, item.isOpen)}

            {isEditing ? (
              <form onSubmit={(e) => handleRenameSubmit(item.path, e)} className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => setRenamingPath(null)}
                  className="w-full bg-slate-800 text-white px-1 py-0.5 border border-blue-500 rounded outline-none text-xs"
                />
              </form>
            ) : (
              <span className="truncate">{item.name}</span>
            )}
          </div>

          {/* Indicators & Actions */}
          <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
            {item.isModified && !isEditing && (
              <span className="text-[10px] text-amber-400 font-bold px-1" title="Modified">
                M
              </span>
            )}

            <div className="hidden group-hover:flex items-center gap-0.5 text-slate-400">
              {isFolder && (
                <>
                  <button
                    onClick={() => {
                      setIsCreating({ parentPath: item.path, type: 'file' });
                      setNewItemName('');
                    }}
                    className="p-0.5 hover:text-white hover:bg-white/10 rounded"
                    title="New File Inside"
                  >
                    <FilePlus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating({ parentPath: item.path, type: 'folder' });
                      setNewItemName('');
                    }}
                    className="p-0.5 hover:text-white hover:bg-white/10 rounded"
                    title="New Folder Inside"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setRenamingPath(item.path);
                  setRenameValue(item.name);
                }}
                className="p-0.5 hover:text-white hover:bg-white/10 rounded"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>

              <button
                onClick={() => onDeleteFile(item.path)}
                className="p-0.5 hover:text-red-400 hover:bg-white/10 rounded"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Nested creation input */}
        {isCreating && isCreating.parentPath === item.path && (
          <form
            onSubmit={handleCreateSubmit}
            className="py-1 px-2 flex items-center gap-1.5"
            style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
          >
            {isCreating.type === 'folder' ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <span className="w-3.5" />
            )}
            {getFileIcon(newItemName || 'temp', isCreating.type === 'folder', false)}
            <input
              type="text"
              autoFocus
              placeholder={isCreating.type === 'file' ? 'filename.ts' : 'folder-name'}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onBlur={() => setIsCreating(null)}
              className="flex-1 bg-slate-800 text-white px-1.5 py-0.5 border border-blue-500 rounded outline-none text-xs"
            />
          </form>
        )}

        {/* Children folders / files */}
        {isFolder && item.isOpen && item.children && (
          <div>{item.children.map((child) => renderItem(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div id="file-explorer-panel" className="h-full flex flex-col select-none overflow-hidden">
      {/* Explorer Header */}
      <div className={`px-3 py-2 flex items-center justify-between border-b ${themeClasses.border} shrink-0`}>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
          {repoName || 'Explorer'}
        </span>
        <div className="flex items-center gap-1 text-slate-400">
          <button
            id="explorer-new-file-btn"
            onClick={() => {
              setIsCreating({ parentPath: null, type: 'file' });
              setNewItemName('');
            }}
            className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            id="explorer-new-folder-btn"
            onClick={() => {
              setIsCreating({ parentPath: null, type: 'folder' });
              setNewItemName('');
            }}
            className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            id="explorer-zip-btn"
            onClick={onExportZip}
            className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Download Workspace as ZIP"
          >
            <FolderArchive className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Root creation input */}
      {isCreating && isCreating.parentPath === null && (
        <form onSubmit={handleCreateSubmit} className="py-1 px-3 flex items-center gap-1.5 shrink-0 bg-white/5">
          {isCreating.type === 'folder' ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <span className="w-3.5" />
          )}
          {getFileIcon(newItemName || 'temp', isCreating.type === 'folder', false)}
          <input
            type="text"
            autoFocus
            placeholder={isCreating.type === 'file' ? 'filename.ts' : 'folder-name'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onBlur={() => setIsCreating(null)}
            className="flex-1 bg-slate-800 text-white px-1.5 py-0.5 border border-blue-500 rounded outline-none text-xs"
          />
        </form>
      )}

      {/* Files Tree */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {files.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs">
            No files in workspace.
            <div className="mt-2">
              <button
                onClick={() => setIsCreating({ parentPath: null, type: 'file' })}
                className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30"
              >
                Create File
              </button>
            </div>
          </div>
        ) : (
          files.map((item) => renderItem(item, 0))
        )}
      </div>
    </div>
  );
};
