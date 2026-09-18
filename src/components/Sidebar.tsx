import React from 'react';
import { ActiveView, FileItem, GitState, EditorSettings, Theme } from '../types';
import { FileExplorerView } from './FileExplorerView';
import { SearchView } from './SearchView';
import { SourceControlView } from './SourceControlView';
import { GitHubManagerView } from './GitHubManagerView';
import { ExtensionsView } from './ExtensionsView';
import { SettingsView } from './SettingsView';

interface SidebarProps {
  activeView: ActiveView;
  isOpen: boolean;
  width: number;
  files: FileItem[];
  repoName: string;
  activeFilePath?: string;
  gitState: GitState;
  modifiedFiles: FileItem[];
  settings: EditorSettings;
  onOpenFile: (file: FileItem) => void;
  onOpenFileAndJump: (file: FileItem, line: number) => void;
  onToggleFolder: (path: string) => void;
  onCreateFile: (parent: string | null, name: string) => void;
  onCreateFolder: (parent: string | null, name: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (path: string, newName: string) => void;
  onExportZip: () => void;
  onCommit: (message: string) => void;
  onOpenDiff: (file: FileItem) => void;
  onDiscardChange: (file: FileItem) => void;
  onStageFile: (path: string) => void;
  onUnstageFile: (path: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onSwitchBranch: (branch: string) => void;
  onCloneRepo: (url: string, branch?: string, token?: string) => Promise<void>;
  onSetGitHubToken: (token: string) => void;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  isOpen,
  width,
  files,
  repoName,
  activeFilePath,
  gitState,
  modifiedFiles,
  settings,
  onOpenFile,
  onOpenFileAndJump,
  onToggleFolder,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onExportZip,
  onCommit,
  onOpenDiff,
  onDiscardChange,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onUnstageAll,
  onSwitchBranch,
  onCloneRepo,
  onSetGitHubToken,
  onUpdateSettings,
  themeClasses,
}) => {
  if (!isOpen) return null;

  return (
    <aside
      id="vscode-primary-sidebar"
      style={{ width: `${width}px` }}
      className={`h-full shrink-0 flex flex-col border-r ${themeClasses.bgSidebar} ${themeClasses.border} overflow-hidden transition-[width] duration-75 relative z-10`}
    >
      {activeView === 'explorer' && (
        <FileExplorerView
          files={files}
          repoName={repoName}
          activeFilePath={activeFilePath}
          onOpenFile={onOpenFile}
          onToggleFolder={onToggleFolder}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onDeleteFile={onDeleteFile}
          onRenameFile={onRenameFile}
          onExportZip={onExportZip}
          themeClasses={themeClasses}
        />
      )}

      {activeView === 'search' && (
        <SearchView
          files={files}
          onOpenFileAndJump={onOpenFileAndJump}
          themeClasses={themeClasses}
        />
      )}

      {activeView === 'git' && (
        <SourceControlView
          gitState={gitState}
          modifiedFiles={modifiedFiles}
          onCommit={onCommit}
          onOpenDiff={onOpenDiff}
          onDiscardChange={onDiscardChange}
          onStageFile={onStageFile}
          onUnstageFile={onUnstageFile}
          onStageAll={onStageAll}
          onUnstageAll={onUnstageAll}
          onSwitchBranch={onSwitchBranch}
          themeClasses={themeClasses}
        />
      )}

      {activeView === 'clone' && (
        <GitHubManagerView
          gitState={gitState}
          onCloneRepo={onCloneRepo}
          onSetGitHubToken={onSetGitHubToken}
          onExportZip={onExportZip}
          themeClasses={themeClasses}
        />
      )}

      {activeView === 'extensions' && <ExtensionsView themeClasses={themeClasses} />}

      {activeView === 'settings' && (
        <SettingsView
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          githubToken={gitState.githubToken}
          onSetGitHubToken={onSetGitHubToken}
          themeClasses={themeClasses}
        />
      )}
    </aside>
  );
};
