import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  Search,
  Github,
  Play,
  Download,
  PanelBottom,
  PanelLeft,
  Sun,
  Moon,
  Columns,
  FolderGit2,
} from 'lucide-react';
import { Theme } from '../types';

interface TitleBarProps {
  repoName: string;
  currentBranch: string;
  theme: Theme;
  onSelectTheme: (t: Theme) => void;
  onOpenCommandPalette: () => void;
  onOpenGitHubModal: () => void;
  onExportZip: () => void;
  onToggleSidebar: () => void;
  onToggleBottomPanel: () => void;
  onTogglePreview: () => void;
  onToggleSplitDiff: () => void;
  isPreviewOpen: boolean;
  isDiffOpen: boolean;
  activeFilePath?: string;
  onNewFile: () => void;
  onNewFolder: () => void;
  onSaveFile: () => void;
  onFormatCode: () => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  repoName,
  currentBranch,
  theme,
  onSelectTheme,
  onOpenCommandPalette,
  onOpenGitHubModal,
  onExportZip,
  onToggleSidebar,
  onToggleBottomPanel,
  onTogglePreview,
  onToggleSplitDiff,
  isPreviewOpen,
  isDiffOpen,
  activeFilePath,
  onNewFile,
  onNewFolder,
  onSaveFile,
  onFormatCode,
  themeClasses,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menus: Record<string, { label: string; action: () => void; shortcut?: string; divider?: boolean }[]> = {
    File: [
      { label: 'New File', action: onNewFile, shortcut: 'Ctrl+N' },
      { label: 'New Folder', action: onNewFolder },
      { label: 'Save', action: onSaveFile, shortcut: 'Ctrl+S' },
      { label: 'divider', action: () => {}, divider: true },
      { label: 'Clone GitHub Repository...', action: onOpenGitHubModal },
      { label: 'Export Workspace as ZIP', action: onExportZip },
    ],
    Edit: [
      { label: 'Format Document', action: onFormatCode, shortcut: 'Shift+Alt+F' },
      { label: 'Command Palette...', action: onOpenCommandPalette, shortcut: 'Ctrl+Shift+P' },
    ],
    View: [
      { label: 'Toggle Primary Side Bar', action: onToggleSidebar, shortcut: 'Ctrl+B' },
      { label: 'Toggle Panel', action: onToggleBottomPanel, shortcut: 'Ctrl+J' },
      { label: isPreviewOpen ? 'Hide Web Preview' : 'Show Web Preview', action: onTogglePreview },
      { label: isDiffOpen ? 'Close Git Diff' : 'View Git Diff', action: onToggleSplitDiff },
    ],
    Terminal: [
      { label: 'Toggle Terminal Panel', action: onToggleBottomPanel, shortcut: 'Ctrl+`' },
    ],
    Help: [
      { label: 'GitHub Repository Clone Docs', action: onOpenGitHubModal },
      { label: 'Keyboard Shortcuts', action: onOpenCommandPalette, shortcut: 'Ctrl+K Ctrl+S' },
    ],
  };

  return (
    <header
      id="vscode-titlebar"
      className={`h-9 px-2 flex items-center justify-between select-none border-b ${themeClasses.bgTitlebar} ${themeClasses.border} text-xs z-30 shrink-0`}
    >
      {/* Left: Icon & Menus */}
      <div className="flex items-center gap-1.5" ref={menuRef}>
        <div className="flex items-center gap-1.5 pr-1 font-semibold text-blue-400">
          <Code2 className="w-4 h-4 text-blue-500" />
        </div>

        <div className="hidden sm:flex items-center space-x-0.5">
          {Object.keys(menus).map((menuKey) => (
            <div key={menuKey} className="relative">
              <button
                id={`menu-button-${menuKey.toLowerCase()}`}
                onClick={() => setActiveMenu(activeMenu === menuKey ? null : menuKey)}
                onMouseEnter={() => {
                  if (activeMenu) setActiveMenu(menuKey);
                }}
                className={`px-2 py-1 rounded hover:bg-white/10 ${
                  activeMenu === menuKey ? 'bg-white/15' : ''
                } ${themeClasses.textPrimary} transition-colors`}
              >
                {menuKey}
              </button>

              {activeMenu === menuKey && (
                <div
                  className={`absolute left-0 top-full mt-0.5 w-56 rounded-md shadow-2xl py-1 z-50 border ${themeClasses.bgSidebar} ${themeClasses.border}`}
                >
                  {menus[menuKey].map((item, idx) =>
                    item.divider ? (
                      <div key={idx} className={`my-1 border-t ${themeClasses.border}`} />
                    ) : (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setActiveMenu(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-blue-600 hover:text-white ${themeClasses.textPrimary} transition-colors`}
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] opacity-60 ml-4 font-mono">{item.shortcut}</span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center: Command Palette / Search Pill */}
      <div className="flex-1 max-w-md mx-2">
        <button
          id="quick-open-search"
          onClick={onOpenCommandPalette}
          className={`w-full flex items-center justify-between px-3 py-1 rounded-md text-xs border ${themeClasses.border} bg-white/5 hover:bg-white/10 ${themeClasses.textSecondary} transition-colors`}
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span className="truncate">
              {repoName} {activeFilePath ? `- ${activeFilePath.split('/').pop()}` : ''}
            </span>
          </div>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/10 border border-white/10">
            Ctrl+P
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Branch indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-slate-300">
          <FolderGit2 className="w-3 h-3 text-sky-400" />
          <span className="truncate max-w-[120px] font-mono">{currentBranch}</span>
        </div>

        {/* GitHub Clone Button */}
        <button
          id="btn-github-clone"
          onClick={onOpenGitHubModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-colors font-medium text-xs cursor-pointer"
          title="Clone any GitHub Repository"
        >
          <Github className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Clone Repo</span>
        </button>

        {/* Live Web Preview */}
        <button
          id="btn-toggle-preview"
          onClick={onTogglePreview}
          className={`p-1.5 rounded hover:bg-white/10 ${
            isPreviewOpen ? 'text-emerald-400 bg-emerald-500/10' : themeClasses.textSecondary
          } transition-colors`}
          title="Run / Preview Web Output"
        >
          <Play className="w-3.5 h-3.5" />
        </button>

        {/* Split Diff */}
        <button
          id="btn-toggle-diff"
          onClick={onToggleSplitDiff}
          className={`p-1.5 rounded hover:bg-white/10 ${
            isDiffOpen ? 'text-sky-400 bg-sky-500/10' : themeClasses.textSecondary
          } transition-colors`}
          title="Git Diff Viewer"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>

        {/* Export ZIP */}
        <button
          id="btn-export-zip"
          onClick={onExportZip}
          className={`p-1.5 rounded hover:bg-white/10 ${themeClasses.textSecondary} transition-colors`}
          title="Export Workspace as ZIP"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Theme quick switch */}
        <button
          id="btn-quick-theme"
          onClick={() => onSelectTheme(theme === 'vs-dark' ? 'vs-light' : theme === 'vs-light' ? 'github-dark' : 'vs-dark')}
          className={`p-1.5 rounded hover:bg-white/10 ${themeClasses.textSecondary} transition-colors`}
          title={`Current Theme: ${theme}`}
        >
          {theme === 'vs-light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>

        <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />

        {/* Toggle Sidebar */}
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className={`p-1.5 rounded hover:bg-white/10 ${themeClasses.textSecondary} transition-colors`}
          title="Toggle Primary Sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Bottom Panel */}
        <button
          id="btn-toggle-panel"
          onClick={onToggleBottomPanel}
          className={`p-1.5 rounded hover:bg-white/10 ${themeClasses.textSecondary} transition-colors`}
          title="Toggle Terminal Panel (Ctrl+J)"
        >
          <PanelBottom className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
