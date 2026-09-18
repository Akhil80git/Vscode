import React, { useState } from 'react';
import {
  GitBranch,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCheck,
  Bell,
  Code2,
  Radio,
  Github,
} from 'lucide-react';
import { GitState } from '../types';

interface StatusBarProps {
  gitState: GitState;
  modifiedCount: number;
  cursorLine: number;
  cursorCol: number;
  tabSize: number;
  activeLanguage?: string;
  onSelectLanguage?: (lang: string) => void;
  onOpenGitHubModal: () => void;
  onToggleBottomPanel: () => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

const LANGUAGES = [
  'typescript',
  'javascript',
  'html',
  'css',
  'json',
  'markdown',
  'python',
  'rust',
  'go',
  'sql',
  'shell',
];

export const StatusBar: React.FC<StatusBarProps> = ({
  gitState,
  modifiedCount,
  cursorLine,
  cursorCol,
  tabSize,
  activeLanguage,
  onSelectLanguage,
  onOpenGitHubModal,
  onToggleBottomPanel,
  themeClasses,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <footer
      id="vscode-statusbar"
      className={`h-6 px-2 flex items-center justify-between select-none text-[11px] ${themeClasses.bgStatusBar} text-white shrink-0 z-30 font-sans`}
    >
      {/* Left side */}
      <div className="flex items-center space-x-1">
        {/* Remote badge (VS Code blue/purple corner) */}
        <button
          onClick={onOpenGitHubModal}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-black/20 transition-colors font-medium"
          title="Connected GitHub Repository"
        >
          <Github className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {gitState.repoName ? gitState.repoName.split('/')[1] || gitState.repoName : 'GitHub'}
          </span>
        </button>

        {/* Branch and Sync */}
        <button
          onClick={onOpenGitHubModal}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-black/20 transition-colors"
          title={`Git Branch: ${gitState.currentBranch}`}
        >
          <GitBranch className="w-3 h-3" />
          <span>{gitState.currentBranch}*</span>
          <RefreshCw className="w-2.5 h-2.5 ml-0.5 opacity-80" />
          {modifiedCount > 0 && <span className="text-[10px] font-bold">+{modifiedCount}</span>}
        </button>

        {/* Errors & Warnings */}
        <button
          onClick={onToggleBottomPanel}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-black/20 transition-colors text-white/90"
          title="Workspace Diagnostics"
        >
          <AlertCircle className="w-3 h-3" />
          <span>0</span>
          <AlertTriangle className="w-3 h-3 ml-1" />
          <span>0</span>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-1">
        {/* Cursor Position */}
        <span className="hidden sm:inline-block px-2 py-0.5">
          Ln {cursorLine}, Col {cursorCol}
        </span>

        {/* Tab Size */}
        <span className="hidden md:inline-block px-2 py-0.5">Spaces: {tabSize}</span>

        {/* Encoding */}
        <span className="hidden lg:inline-block px-2 py-0.5">UTF-8</span>

        {/* Line Endings */}
        <span className="hidden lg:inline-block px-2 py-0.5">LF</span>

        {/* Language Mode Picker */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="px-2 py-0.5 rounded hover:bg-black/20 transition-colors capitalize font-medium"
            title="Select Language Mode"
          >
            {activeLanguage || 'Plain Text'}
          </button>

          {showLangMenu && (
            <div className="absolute right-0 bottom-full mb-1 w-40 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 text-slate-200 z-50">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                Select Language Mode
              </div>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    onSelectLanguage?.(lang);
                    setShowLangMenu(false);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white capitalize transition-colors text-xs"
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prettier */}
        <span
          className="flex items-center gap-0.5 px-2 py-0.5 rounded hover:bg-black/20 transition-colors cursor-pointer"
          title="Prettier formatting ready"
        >
          <CheckCheck className="w-3 h-3" />
          <span className="hidden sm:inline">Prettier</span>
        </span>

        {/* Notifications */}
        <button
          onClick={onToggleBottomPanel}
          className="p-1 rounded hover:bg-black/20 transition-colors"
          title="Notifications"
        >
          <Bell className="w-3 h-3" />
        </button>
      </div>
    </footer>
  );
};
