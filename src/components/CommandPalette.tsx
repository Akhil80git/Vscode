import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileCode,
  Sparkles,
  Command,
  Github,
  Palette,
  Terminal,
  FolderArchive,
  Eye,
  Columns,
  Play,
  Settings,
} from 'lucide-react';
import { FileItem, Theme } from '../types';
import { getFileIcon } from '../utils/fileIcons';

export interface CommandItem {
  id: string;
  title: string;
  category?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  onOpenFile: (file: FileItem) => void;
  commands: CommandItem[];
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  onOpenFile,
  commands,
  themeClasses,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isFileMode = !query.startsWith('>');
  const cleanQuery = query.startsWith('>') ? query.substring(1).trim() : query.trim();

  // Filter items
  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(cleanQuery.toLowerCase())
  );

  const flatFiles: FileItem[] = [];
  function collectFiles(items: FileItem[]) {
    for (const item of items) {
      if (item.type === 'file') flatFiles.push(item);
      if (item.children) collectFiles(item.children);
    }
  }
  collectFiles(files);

  const filteredFiles = flatFiles.filter((f) =>
    f.path.toLowerCase().includes(cleanQuery.toLowerCase())
  );

  interface PaletteListItem {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    shortcut?: string;
    action: () => void;
  }

  const listItems: PaletteListItem[] = isFileMode
    ? filteredFiles.map((f) => ({
        id: f.path,
        title: f.name,
        subtitle: f.path,
        icon: getFileIcon(f.name, false),
        shortcut: undefined,
        action: () => {
          onOpenFile(f);
          onClose();
        },
      }))
    : filteredCommands.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.category,
        icon: c.icon || <Command className="w-4 h-4 text-blue-400" />,
        shortcut: c.shortcut,
        action: () => {
          c.action();
          onClose();
        },
      }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, listItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + listItems.length) % Math.max(1, listItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (listItems[selectedIndex]) {
        listItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 z-50 p-4"
      onClick={onClose}
    >
      <div
        id="vscode-command-palette-modal"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl rounded-lg shadow-2xl border ${themeClasses.bgSidebar} ${themeClasses.border} overflow-hidden flex flex-col`}
      >
        {/* Input */}
        <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-black/30">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isFileMode
                ? 'Type to search files (type > for commands)...'
                : 'Type a command to run...'
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white text-xs outline-none placeholder:text-slate-500 font-sans"
          />
          <kbd className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-white/10 font-mono">
            ESC
          </kbd>
        </div>

        {/* Mode switcher tabs */}
        <div className="px-3 py-1 bg-white/5 border-b border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex gap-3">
            <button
              onClick={() => setQuery('')}
              className={`hover:text-white ${isFileMode ? 'text-blue-400 font-semibold' : ''}`}
            >
              Files ({filteredFiles.length})
            </button>
            <button
              onClick={() => setQuery('> ')}
              className={`hover:text-white ${!isFileMode ? 'text-blue-400 font-semibold' : ''}`}
            >
              Commands ({filteredCommands.length})
            </button>
          </div>
          <span>Use ↑ ↓ to navigate, Enter to select</span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-1.5 scrollbar-thin text-xs space-y-0.5">
          {listItems.length === 0 ? (
            <div className="p-4 text-center text-slate-500">No matching items found.</div>
          ) : (
            listItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2 rounded flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="shrink-0">{item.icon}</span>
                    <div className="truncate min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      {item.subtitle && (
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-blue-200' : 'text-slate-500'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.shortcut && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {item.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
