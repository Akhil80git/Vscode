import React, { useState } from 'react';
import {
  Github,
  X,
  FolderDown,
  Loader2,
  AlertCircle,
  Key,
  ExternalLink,
  Sparkles,
  Star,
} from 'lucide-react';
import { GitState } from '../types';
import { POPULAR_GITHUB_REPOS } from '../utils/githubService';

interface GitHubCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  gitState: GitState;
  onCloneRepo: (url: string, branch?: string, token?: string) => Promise<void>;
  onSetGitHubToken: (token: string) => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const GitHubCloneModal: React.FC<GitHubCloneModalProps> = ({
  isOpen,
  onClose,
  gitState,
  onCloneRepo,
  onSetGitHubToken,
  themeClasses,
}) => {
  const [repoInput, setRepoInput] = useState('');
  const [branchInput, setBranchInput] = useState('');
  const [tokenInput, setTokenInput] = useState(gitState.githubToken || '');
  const [showToken, setShowToken] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!repoInput.trim()) {
      setErrorMsg('Please specify a GitHub repository.');
      return;
    }

    setErrorMsg(null);
    try {
      await onCloneRepo(repoInput.trim(), branchInput.trim() || undefined, tokenInput.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Clone failed');
    }
  };

  const handleQuick = async (name: string) => {
    setRepoInput(name);
    setErrorMsg(null);
    try {
      await onCloneRepo(name, undefined, tokenInput.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Clone failed');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none"
      onClick={onClose}
    >
      <div
        id="github-clone-modal"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-xl shadow-2xl border ${themeClasses.bgSidebar} ${themeClasses.border} overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-white">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Clone GitHub Repository</h3>
              <p className="text-xs text-slate-400">
                Clone any public or private repository directly into VS Code Web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              GitHub Repository URL or Owner/Repo
            </label>
            <input
              id="modal-repo-input"
              type="text"
              autoFocus
              placeholder="e.g. facebook/react or https://github.com/shadcn-ui/ui"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              disabled={gitState.isCloning}
              className="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Branch (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. main or master"
                value={branchInput}
                onChange={(e) => setBranchInput(e.target.value)}
                disabled={gitState.isCloning}
                className="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none text-xs"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">GitHub PAT</label>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-blue-400 hover:underline text-[11px]"
                >
                  {showToken ? 'Hide' : 'Configure'}
                </button>
              </div>
              <input
                type="password"
                placeholder="Optional token"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  onSetGitHubToken(e.target.value);
                }}
                disabled={gitState.isCloning}
                className="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none text-xs font-mono"
              />
            </div>
          </div>

          {gitState.isCloning && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-1.5">
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading Repository Trees...</span>
              </div>
              <p className="text-slate-300 font-mono text-[11px] truncate">
                {gitState.cloneProgress}
              </p>
            </div>
          )}

          {/* Quick presets */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or 1-Click Clone Top Open-Source Projects:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_GITHUB_REPOS.slice(0, 4).map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => handleQuick(r.name)}
                  disabled={gitState.isCloning}
                  className="p-2 text-left rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="font-semibold text-blue-400 truncate">{r.name}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{r.lang}</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-mono">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {r.stars}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={gitState.isCloning || !repoInput.trim()}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              {gitState.isCloning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cloning...</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-4 h-4" />
                  <span>Clone into Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
