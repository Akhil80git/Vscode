import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit as GitCommitIcon,
  Check,
  Plus,
  Minus,
  RotateCcw,
  GitPullRequest,
  ArrowUp,
  Columns,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { GitState, FileItem } from '../types';
import { getFileIcon } from '../utils/fileIcons';

interface SourceControlViewProps {
  gitState: GitState;
  modifiedFiles: FileItem[];
  onCommit: (message: string) => void;
  onOpenDiff: (file: FileItem) => void;
  onDiscardChange: (file: FileItem) => void;
  onStageFile: (path: string) => void;
  onUnstageFile: (path: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onSwitchBranch: (branch: string) => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const SourceControlView: React.FC<SourceControlViewProps> = ({
  gitState,
  modifiedFiles,
  onCommit,
  onOpenDiff,
  onDiscardChange,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onUnstageAll,
  onSwitchBranch,
  themeClasses,
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [stagedCollapsed, setStagedCollapsed] = useState(false);
  const [changesCollapsed, setChangesCollapsed] = useState(false);

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    onCommit(commitMessage.trim());
    setCommitMessage('');
  };

  const stagedList = modifiedFiles.filter((f) => gitState.stagedFiles.includes(f.path));
  const unstagedList = modifiedFiles.filter((f) => !gitState.stagedFiles.includes(f.path));

  return (
    <div id="source-control-panel" className="h-full flex flex-col select-none overflow-hidden">
      {/* Header with branch switcher */}
      <div className={`p-3 border-b ${themeClasses.border} shrink-0 space-y-2`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Source Control
          </span>
          <div className="relative">
            <button
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-xs text-sky-400 border border-white/10"
              title="Switch Git Branch"
            >
              <GitBranch className="w-3 h-3" />
              <span className="max-w-[90px] truncate">{gitState.currentBranch}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isBranchMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-1 w-48 rounded shadow-2xl py-1 z-50 border ${themeClasses.bgSidebar} ${themeClasses.border}`}
              >
                <div className="px-3 py-1 text-[10px] uppercase text-slate-500 font-bold">
                  Branches
                </div>
                {gitState.branches.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      onSwitchBranch(b);
                      setIsBranchMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-600 hover:text-white ${
                      b === gitState.currentBranch ? 'text-sky-400 font-medium' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{b}</span>
                    {b === gitState.currentBranch && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Commit Message Box */}
        <form onSubmit={handleCommitSubmit} className="space-y-1.5">
          <div className="relative">
            <textarea
              id="git-commit-message-input"
              rows={2}
              placeholder="Message (Ctrl+Enter to commit)"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleCommitSubmit(e);
                }
              }}
              className="w-full bg-slate-900 text-slate-100 p-2 text-xs rounded border border-slate-700 focus:border-blue-500 outline-none resize-none placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-git-commit"
              type="submit"
              disabled={!commitMessage.trim() || modifiedFiles.length === 0}
              className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Commit</span>
            </button>

            <button
              type="button"
              onClick={onStageAll}
              disabled={unstagedList.length === 0}
              className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 transition-colors"
              title="Stage All Changes"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Changes list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin text-xs py-1">
        {/* Staged Changes */}
        {stagedList.length > 0 && (
          <div className="mb-2">
            <div
              onClick={() => setStagedCollapsed(!stagedCollapsed)}
              className="flex items-center justify-between px-3 py-1 hover:bg-white/5 cursor-pointer text-slate-400 group"
            >
              <div className="flex items-center gap-1">
                {stagedCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span className="font-bold uppercase text-[10px] tracking-wider text-slate-300">
                  Staged Changes
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 rounded-full font-mono">
                  {stagedList.length}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnstageAll();
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white"
                title="Unstage All"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>

            {!stagedCollapsed &&
              stagedList.map((file) => (
                <div
                  key={file.path}
                  className="group flex items-center justify-between py-1 px-3 hover:bg-white/5 cursor-pointer text-slate-300"
                  onClick={() => onOpenDiff(file)}
                >
                  <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                    {getFileIcon(file.name, false)}
                    <span className="truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-500 truncate">{file.path}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-bold text-emerald-400">A</span>
                    <button
                      onClick={() => onUnstageFile(file.path)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white"
                      title="Unstage"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onOpenDiff(file)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-sky-400"
                      title="Open Diff"
                    >
                      <Columns className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Changes (Unstaged) */}
        <div>
          <div
            onClick={() => setChangesCollapsed(!changesCollapsed)}
            className="flex items-center justify-between px-3 py-1 hover:bg-white/5 cursor-pointer text-slate-400 group"
          >
            <div className="flex items-center gap-1">
              {changesCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span className="font-bold uppercase text-[10px] tracking-wider text-slate-300">
                Changes
              </span>
              <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 rounded-full font-mono">
                {unstagedList.length}
              </span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStageAll();
                }}
                className="p-0.5 hover:text-white"
                title="Stage All"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {!changesCollapsed &&
            (unstagedList.length === 0 ? (
              <div className="px-6 py-3 text-slate-500 text-xs">
                No changes detected in workspace.
              </div>
            ) : (
              unstagedList.map((file) => (
                <div
                  key={file.path}
                  className="group flex items-center justify-between py-1 px-3 hover:bg-white/5 cursor-pointer text-slate-300"
                  onClick={() => onOpenDiff(file)}
                >
                  <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                    {getFileIcon(file.name, false)}
                    <span className="truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-500 truncate">{file.path}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-bold text-amber-400">M</span>
                    <button
                      onClick={() => onStageFile(file.path)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white"
                      title="Stage Changes"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDiscardChange(file)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400"
                      title="Discard Changes"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onOpenDiff(file)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-sky-400"
                      title="Open Diff"
                    >
                      <Columns className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            ))}
        </div>
      </div>
    </div>
  );
};
