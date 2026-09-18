import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  AlertTriangle,
  FileText,
  History,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  CornerDownLeft,
  ChevronRight,
  GitCommit as GitCommitIcon,
} from 'lucide-react';
import { BottomPanelTab, TerminalLine, GitCommit, FileItem } from '../types';

interface BottomPanelProps {
  isOpen: boolean;
  activeTab: BottomPanelTab;
  onSelectTab: (tab: BottomPanelTab) => void;
  onClose: () => void;
  terminalLines: TerminalLine[];
  onExecuteCommand: (cmd: string) => void;
  onClearTerminal: () => void;
  commits: GitCommit[];
  currentBranch: string;
  repoName: string;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  isOpen,
  activeTab,
  onSelectTab,
  onClose,
  terminalLines,
  onExecuteCommand,
  onClearTerminal,
  commits,
  currentBranch,
  repoName,
  themeClasses,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines, activeTab]);

  if (!isOpen) return null;

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onExecuteCommand(commandInput.trim());
    setCommandInput('');
  };

  const tabs: { id: BottomPanelTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <TerminalIcon className="w-3.5 h-3.5" />,
    },
    {
      id: 'problems',
      label: 'Problems',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      badge: 0,
    },
    {
      id: 'output',
      label: 'Output',
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: 'git-history',
      label: 'Git History',
      icon: <History className="w-3.5 h-3.5" />,
      badge: commits.length,
    },
  ];

  return (
    <div
      id="vscode-bottom-panel"
      className={`border-t ${themeClasses.bgPanel} ${themeClasses.border} flex flex-col select-none transition-all duration-150 z-20 ${
        isMaximized ? 'h-[75vh]' : 'h-64'
      }`}
    >
      {/* Panel Tab Header */}
      <div className={`h-8 px-3 flex items-center justify-between border-b ${themeClasses.border} shrink-0`}>
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`panel-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
                  isActive
                    ? 'text-white font-medium bg-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-full font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-slate-400">
          {activeTab === 'terminal' && (
            <button
              onClick={onClearTerminal}
              className="p-1 hover:text-white rounded hover:bg-white/10"
              title="Clear Terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:text-white rounded hover:bg-white/10"
            title={isMaximized ? 'Restore Size' : 'Maximize Panel'}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1 hover:text-white rounded hover:bg-white/10"
            title="Close Panel (Ctrl+J)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* TERMINAL */}
        {activeTab === 'terminal' && (
          <div
            className="h-full flex flex-col bg-black/40 font-mono text-xs p-3 overflow-y-auto scrollbar-thin"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="space-y-1 text-slate-300">
              <div className="text-slate-500 mb-2">
                VS Code Integrated Terminal • Type <span className="text-sky-400">help</span> for commands, or <span className="text-sky-400">git clone &lt;repo&gt;</span>
              </div>

              {terminalLines.map((line) => (
                <div
                  key={line.id}
                  className={`leading-relaxed whitespace-pre-wrap break-all ${
                    line.type === 'input'
                      ? 'text-white flex items-center gap-2'
                      : line.type === 'error'
                      ? 'text-rose-400 font-semibold'
                      : line.type === 'success'
                      ? 'text-emerald-400'
                      : line.type === 'system'
                      ? 'text-sky-400'
                      : 'text-slate-300'
                  }`}
                >
                  {line.type === 'input' ? (
                    <>
                      <span className="text-emerald-400 font-bold shrink-0">➜</span>
                      <span className="text-blue-400 font-bold shrink-0">[{currentBranch}]</span>
                      <span>{line.text}</span>
                    </>
                  ) : (
                    line.text
                  )}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Input Line */}
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 mt-2 shrink-0">
              <span className="text-emerald-400 font-bold">➜</span>
              <span className="text-blue-400 font-bold">[{currentBranch}]</span>
              <input
                ref={inputRef}
                id="terminal-input"
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type command (e.g. git status, npm run dev, help)..."
                className="flex-1 bg-transparent text-white outline-none border-none font-mono text-xs placeholder:text-slate-600"
              />
              <button type="submit" className="hidden">
                Run
              </button>
            </form>
          </div>
        )}

        {/* PROBLEMS */}
        {activeTab === 'problems' && (
          <div className="h-full p-4 overflow-y-auto text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <span>✓ No problems have been detected in the workspace so far.</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Syntax errors and typescript warnings will be reported here automatically.
            </p>
          </div>
        )}

        {/* OUTPUT */}
        {activeTab === 'output' && (
          <div className="h-full p-3 font-mono text-xs text-slate-300 overflow-y-auto scrollbar-thin space-y-1">
            <div className="text-slate-500">[Studio] VS Code Web IDE initialized.</div>
            <div className="text-slate-500">[Workspace] Active repository: {repoName}</div>
            <div className="text-slate-500">[Branch] Checked out: {currentBranch}</div>
            <div className="text-emerald-400">[Build] TypeScript compiler ready. Monaco worker active.</div>
          </div>
        )}

        {/* GIT HISTORY */}
        {activeTab === 'git-history' && (
          <div className="h-full p-3 overflow-y-auto scrollbar-thin text-xs space-y-2">
            <div className="text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span>Commit Graph & Timeline</span>
            </div>
            {commits.map((c) => (
              <div
                key={c.id}
                className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <GitCommitIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">{c.message}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>{c.author}</span>
                    <span>•</span>
                    <span>{c.date}</span>
                    <span>•</span>
                    <span>{c.filesCount} files changed</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-sky-400 shrink-0">
                  {c.hash}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
