import React, { useState } from 'react';
import {
  Github,
  GitBranch,
  Download,
  Key,
  ExternalLink,
  Star,
  GitFork,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { GitState } from '../types';
import { POPULAR_GITHUB_REPOS, parseGitHubUrl } from '../utils/githubService';

interface GitHubManagerViewProps {
  gitState: GitState;
  onCloneRepo: (repoUrlOrShorthand: string, branch?: string, token?: string) => Promise<void>;
  onSetGitHubToken: (token: string) => void;
  onExportZip: () => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const GitHubManagerView: React.FC<GitHubManagerViewProps> = ({
  gitState,
  onCloneRepo,
  onSetGitHubToken,
  onExportZip,
  themeClasses,
}) => {
  const [repoInput, setRepoInput] = useState('');
  const [branchInput, setBranchInput] = useState('');
  const [tokenInput, setTokenInput] = useState(gitState.githubToken || '');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCloneSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    if (!repoInput.trim()) {
      setErrorMsg('Please enter a GitHub repository URL or owner/repo.');
      return;
    }

    try {
      await onCloneRepo(repoInput.trim(), branchInput.trim() || undefined, tokenInput.trim() || undefined);
      setRepoInput('');
      setBranchInput('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to clone repository.');
    }
  };

  const handleQuickClone = async (repoName: string) => {
    setErrorMsg(null);
    setRepoInput(repoName);
    try {
      await onCloneRepo(repoName, undefined, tokenInput.trim() || undefined);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to clone repository.');
    }
  };

  return (
    <div id="github-manager-panel" className="h-full flex flex-col select-none overflow-hidden">
      {/* Header */}
      <div className={`p-3 border-b ${themeClasses.border} shrink-0 space-y-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-white" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              GitHub Studio
            </span>
          </div>
          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className={`p-1 rounded hover:bg-white/10 ${
              tokenInput ? 'text-emerald-400' : 'text-slate-400'
            } transition-colors`}
            title="Configure GitHub Personal Access Token"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Token config fold */}
        {showTokenInput && (
          <div className="p-2.5 bg-slate-900 rounded border border-slate-700 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-medium text-[11px]">
              <span>Personal Access Token (PAT)</span>
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 text-[10px]"
              >
                Create <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                onSetGitHubToken(e.target.value);
              }}
              className="w-full bg-slate-950 text-white px-2 py-1 rounded border border-slate-700 text-xs outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Allows cloning private repositories and boosts rate limit to 5,000 req/hr.
            </p>
          </div>
        )}

        {/* Clone Form */}
        <form onSubmit={handleCloneSubmit} className="space-y-2">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Clone from GitHub
            </label>
            <input
              id="github-repo-input"
              type="text"
              placeholder="e.g. facebook/react or full URL"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              disabled={gitState.isCloning}
              className="w-full bg-slate-900 text-slate-100 px-2.5 py-1.5 text-xs rounded border border-slate-700 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Branch (optional, e.g. main)"
              value={branchInput}
              onChange={(e) => setBranchInput(e.target.value)}
              disabled={gitState.isCloning}
              className="w-1/2 bg-slate-900 text-slate-100 px-2 py-1 text-xs rounded border border-slate-700 focus:border-blue-500 outline-none"
            />
            <button
              id="btn-submit-clone"
              type="submit"
              disabled={gitState.isCloning || !repoInput.trim()}
              className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {gitState.isCloning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cloning...</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-3.5 h-3.5" />
                  <span>Clone Repo</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Cloning status progress */}
        {gitState.isCloning && (
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded text-xs space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching from GitHub...</span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono truncate">
              {gitState.cloneProgress || 'Connecting to GitHub API...'}
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded text-xs flex items-start gap-2 text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <p className="text-[11px] leading-relaxed">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Content scrollable: Current connected repo & 1-click popular repos */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin space-y-4 text-xs">
        {/* Active Repo Card */}
        {gitState.repoUrl && (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Repo</span>
              <a
                href={gitState.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="font-semibold text-white text-sm truncate flex items-center gap-1.5">
              <Github className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{gitState.repoName}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                {gitState.currentBranch}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Connected
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={onExportZip}
                className="w-full py-1.5 px-2.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-slate-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Cloned Repo as ZIP</span>
              </button>
            </div>
          </div>
        )}

        {/* 1-Click Popular Repos to Clone */}
        <div>
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Popular Repos to Clone</span>
          </div>

          <div className="space-y-1.5">
            {POPULAR_GITHUB_REPOS.map((item) => (
              <div
                key={item.name}
                onClick={() => handleQuickClone(item.name)}
                className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-blue-400 group-hover:text-blue-300 truncate">
                    {item.name}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {item.stars}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="px-1.5 py-0.5 rounded bg-white/5">{item.lang}</span>
                  <span className="text-blue-400 group-hover:underline">Clone & Open →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
