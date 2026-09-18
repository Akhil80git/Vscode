import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FileItem,
  TabItem,
  ActiveView,
  BottomPanelTab,
  TerminalLine,
  GitState,
  EditorSettings,
  Theme,
  GitCommit,
  Project,
} from './types';
import {
  findFileByPath,
  updateFileInTree,
  addFileToTree,
  deleteFileFromTree,
  renameItemInTree,
  exportWorkspaceAsZip,
} from './utils/workspaceUtils';
import { cloneGitHubRepository, fetchFileContent, parseGitHubUrl } from './utils/githubService';
import { getAppThemeClasses } from './utils/monacoThemes';
import {
  loadAllProjects,
  saveAllProjects,
  saveProject,
  createNewProject,
  getActiveProjectId,
  setActiveProjectId,
  deleteProjectFromStorage,
  renameProjectInStorage,
} from './utils/storage';
import { TitleBar } from './components/TitleBar';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { EditorArea } from './components/EditorArea';
import { BottomPanel } from './components/BottomPanel';
import { StatusBar } from './components/StatusBar';
import { CommandPalette, CommandItem } from './components/CommandPalette';
import { GitHubCloneModal } from './components/GitHubCloneModal';
import { ProjectModal } from './components/ProjectModal';

export default function App() {
  // Load saved projects from LocalStorage
  const [projects, setProjects] = useState<Project[]>(() => loadAllProjects());
  const [activeProjectId, setActiveId] = useState<string>(() => {
    const savedId = getActiveProjectId();
    const existing = loadAllProjects();
    if (savedId && existing.some((p) => p.id === savedId)) {
      return savedId;
    }
    return existing[0]?.id || '';
  });

  // Active Project object
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  // Workspace files tree (from active project)
  const [files, setFiles] = useState<FileItem[]>(() => currentProject?.files || []);

  // Tabs (from active project)
  const [openTabs, setOpenTabs] = useState<TabItem[]>(() => currentProject?.openTabs || []);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(
    () => currentProject?.activeTabPath || (currentProject?.files?.[0]?.path ?? null)
  );

  // Sidebar & Views
  const [activeView, setActiveView] = useState<ActiveView>('explorer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(270);

  // Bottom Panel & Terminal
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>('terminal');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'Visual Studio Code Web [Clean Multi-Project Workspace]',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-2',
      type: 'output',
      text: `✓ Active project: "${currentProject?.name}". All changes auto-saved in LocalStorage.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Git state
  const [gitState, setGitState] = useState<GitState>({
    repoName: currentProject?.name || 'my-project',
    repoUrl: '',
    currentBranch: 'main',
    branches: ['main'],
    stagedFiles: [],
    unstagedFiles: [],
    isCloning: false,
    cloneProgress: '',
    githubToken: '',
    commits: [
      {
        id: 'c-1',
        hash: 'a1b2c3d',
        message: `Initial commit for project: ${currentProject?.name}`,
        author: 'developer',
        date: 'Just now',
        filesCount: currentProject?.files?.length || 0,
      },
    ],
  });

  // Settings
  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'vs-dark',
    fontSize: 14,
    tabSize: 2,
    minimap: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    bracketPairColorization: true,
    autoSave: true,
    fontFamily: `'Fira Code', monospace`,
  });

  // Cursor position
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Modals & Diff & Preview
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isGitHubCloneModalOpen, setIsGitHubCloneModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [diffFile, setDiffFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const themeClasses = useMemo(() => getAppThemeClasses(settings.theme), [settings.theme]);

  // Active File object
  const activeFile = useMemo(() => {
    if (!activeTabPath) return null;
    return findFileByPath(files, activeTabPath);
  }, [files, activeTabPath]);

  // AUTO-SAVE to LocalStorage whenever active project state updates
  useEffect(() => {
    if (!currentProject) return;

    const updated: Project = {
      ...currentProject,
      files,
      openTabs,
      activeTabPath,
      updatedAt: new Date().toISOString(),
    };

    saveProject(updated);

    // Update in-memory projects list
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, [files, openTabs, activeTabPath]);

  // Switch Active Project handler
  const handleSelectProject = useCallback((id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    setActiveId(id);
    setActiveProjectId(id);
    setFiles(target.files);
    setOpenTabs(target.openTabs);
    setActiveTabPath(target.activeTabPath || (target.files[0]?.path ?? null));
    setIsDiffOpen(false);

    setGitState((prev) => ({
      ...prev,
      repoName: target.name,
      currentBranch: target.gitState?.currentBranch || 'main',
      branches: target.gitState?.branches || ['main'],
      commits: target.gitState?.commits || [],
      stagedFiles: [],
      unstagedFiles: [],
    }));

    setTerminalLines((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        type: 'system',
        text: `Switched workspace to project "${target.name}" (${target.files.length} items loaded from LocalStorage).`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [projects]);

  // Create New Project
  const handleCreateProject = (name: string, template: 'blank' | 'web') => {
    const newProj = createNewProject(name, template);
    const updatedList = [...projects, newProj];
    setProjects(updatedList);
    saveAllProjects(updatedList);
    handleSelectProject(newProj.id);
  };

  // Rename Project
  const handleRenameProject = (id: string, newName: string) => {
    const updated = renameProjectInStorage(id, newName);
    setProjects(updated);
    if (activeProjectId === id) {
      setGitState((prev) => ({ ...prev, repoName: newName }));
    }
  };

  // Delete Project
  const handleDeleteProject = (id: string) => {
    const remaining = deleteProjectFromStorage(id);
    setProjects(remaining);
    if (activeProjectId === id && remaining.length > 0) {
      handleSelectProject(remaining[0].id);
    }
  };

  // Modified files for Git tracking
  const modifiedFiles = useMemo(() => {
    const list: FileItem[] = [];
    function scan(items: FileItem[]) {
      for (const item of items) {
        if (item.type === 'file') {
          if (item.isModified || (item.originalContent !== undefined && item.content !== item.originalContent)) {
            list.push(item);
          }
        }
        if (item.children) scan(item.children);
      }
    }
    scan(files);
    return list;
  }, [files]);

  // Open file handler
  const handleOpenFile = useCallback(
    async (file: FileItem) => {
      // If cloned from GitHub and not loaded yet, fetch on demand
      if (!file.isLoaded && file.path && gitState.owner) {
        try {
          const content = await fetchFileContent(
            gitState.owner,
            gitState.repoName,
            gitState.currentBranch,
            file.path,
            gitState.githubToken
          );
          setFiles((prev) =>
            updateFileInTree(prev, file.path, (item) => ({
              ...item,
              content,
              originalContent: content,
              isLoaded: true,
            }))
          );
        } catch (e) {
          console.error('Failed to load file content', e);
        }
      }

      // Add to open tabs if not already present
      setOpenTabs((prev) => {
        if (!prev.some((t) => t.path === file.path)) {
          return [
            ...prev,
            {
              id: file.path,
              path: file.path,
              name: file.name,
              language: file.language || 'plaintext',
              isModified: file.isModified,
            },
          ];
        }
        return prev;
      });

      setActiveTabPath(file.path);
      setIsDiffOpen(false);
    },
    [gitState.owner, gitState.repoName, gitState.currentBranch, gitState.githubToken]
  );

  const handleOpenFileAndJump = useCallback(
    (file: FileItem, _line: number) => {
      handleOpenFile(file);
    },
    [handleOpenFile]
  );

  const handleCloseTab = (path: string) => {
    setOpenTabs((prev) => {
      const filtered = prev.filter((t) => t.path !== path);
      if (activeTabPath === path) {
        const nextActive = filtered.length > 0 ? filtered[filtered.length - 1].path : null;
        setActiveTabPath(nextActive);
      }
      return filtered;
    });
  };

  // Content change in Monaco
  const handleContentChange = (newContent: string) => {
    if (!activeTabPath) return;

    setFiles((prev) =>
      updateFileInTree(prev, activeTabPath, (item) => {
        const isModified = item.originalContent !== undefined ? item.originalContent !== newContent : true;
        return {
          ...item,
          content: newContent,
          isModified,
        };
      })
    );

    setOpenTabs((prev) =>
      prev.map((t) => (t.path === activeTabPath ? { ...t, isModified: true } : t))
    );
  };

  // Toggle folders in explorer
  const handleToggleFolder = (path: string) => {
    setFiles((prev) =>
      updateFileInTree(prev, path, (item) => ({
        ...item,
        isOpen: !item.isOpen,
      }))
    );
  };

  // Create file
  const handleCreateFile = (parentPath: string | null, name: string) => {
    const { newTree, createdItem } = addFileToTree(files, parentPath, name, 'file');
    setFiles(newTree);
    handleOpenFile(createdItem);
  };

  // Create folder
  const handleCreateFolder = (parentPath: string | null, name: string) => {
    const { newTree } = addFileToTree(files, parentPath, name, 'folder');
    setFiles(newTree);
  };

  // Delete file
  const handleDeleteFile = (path: string) => {
    setFiles((prev) => deleteFileFromTree(prev, path));
    handleCloseTab(path);
  };

  // Rename file
  const handleRenameFile = (oldPath: string, newName: string) => {
    const { newTree, newPath } = renameItemInTree(files, oldPath, newName);
    setFiles(newTree);
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === oldPath ? { ...t, path: newPath, name: newName } : t))
    );
    if (activeTabPath === oldPath) {
      setActiveTabPath(newPath);
    }
  };

  // Save current file
  const handleSaveFile = () => {
    if (!activeTabPath) return;
    setFiles((prev) =>
      updateFileInTree(prev, activeTabPath, (item) => ({
        ...item,
        originalContent: item.content,
        isModified: false,
      }))
    );
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === activeTabPath ? { ...t, isModified: false } : t))
    );

    setTerminalLines((prev) => [
      ...prev,
      {
        id: `save-${Date.now()}`,
        type: 'output',
        text: `[File System] Saved: ${activeTabPath} (Saved to LocalStorage)`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Format Code (Prettier)
  const handleFormatCode = () => {
    if (!activeFile || !activeFile.content) return;
    try {
      if (activeFile.language === 'json') {
        const formatted = JSON.stringify(JSON.parse(activeFile.content), null, settings.tabSize);
        handleContentChange(formatted);
      } else {
        const lines = activeFile.content.split('\n').map((l) => l.trimEnd()).join('\n');
        handleContentChange(lines);
      }
      setTerminalLines((prev) => [
        ...prev,
        {
          id: `fmt-${Date.now()}`,
          type: 'success',
          text: `[Prettier] Formatted ${activeFile.name} successfully.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch {
      // ignore
    }
  };

  // Git staging & commits
  const handleStageFile = (path: string) => {
    setGitState((prev) => ({
      ...prev,
      stagedFiles: prev.stagedFiles.includes(path) ? prev.stagedFiles : [...prev.stagedFiles, path],
    }));
  };

  const handleUnstageFile = (path: string) => {
    setGitState((prev) => ({
      ...prev,
      stagedFiles: prev.stagedFiles.filter((p) => p !== path),
    }));
  };

  const handleStageAll = () => {
    setGitState((prev) => ({
      ...prev,
      stagedFiles: modifiedFiles.map((f) => f.path),
    }));
  };

  const handleUnstageAll = () => {
    setGitState((prev) => ({
      ...prev,
      stagedFiles: [],
    }));
  };

  const handleDiscardChange = (file: FileItem) => {
    setFiles((prev) =>
      updateFileInTree(prev, file.path, (item) => ({
        ...item,
        content: item.originalContent ?? '',
        isModified: false,
      }))
    );
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === file.path ? { ...t, isModified: false } : t))
    );
    handleUnstageFile(file.path);
  };

  const handleCommit = (message: string) => {
    const committedPaths = gitState.stagedFiles.length > 0
      ? gitState.stagedFiles
      : modifiedFiles.map((f) => f.path);

    if (committedPaths.length === 0) return;

    setFiles((prev) => {
      let updated = prev;
      for (const path of committedPaths) {
        updated = updateFileInTree(updated, path, (item) => ({
          ...item,
          originalContent: item.content,
          isModified: false,
        }));
      }
      return updated;
    });

    const newCommit: GitCommit = {
      id: `commit-${Date.now()}`,
      hash: Math.random().toString(16).substring(2, 9),
      message,
      author: 'developer',
      date: 'Just now',
      filesCount: committedPaths.length,
    };

    setGitState((prev) => ({
      ...prev,
      stagedFiles: [],
      commits: [newCommit, ...prev.commits],
    }));

    setTerminalLines((prev) => [
      ...prev,
      {
        id: `commit-${Date.now()}`,
        type: 'success',
        text: `[${gitState.currentBranch} ${newCommit.hash}] ${message} (${committedPaths.length} files committed)`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleOpenDiff = (file: FileItem) => {
    setDiffFile(file);
    setIsDiffOpen(true);
  };

  // GitHub Clone Implementation
  const handleCloneRepo = async (input: string, branch?: string, token?: string) => {
    const parsed = parseGitHubUrl(input);
    if (!parsed) {
      throw new Error(`Invalid GitHub URL or repository format. Please use "owner/repo" or "https://github.com/owner/repo"`);
    }

    setGitState((prev) => ({
      ...prev,
      isCloning: true,
      cloneProgress: `Connecting to GitHub repository ${parsed.owner}/${parsed.repo}...`,
    }));

    try {
      const res = await cloneGitHubRepository(
        parsed.owner,
        parsed.repo,
        branch || '',
        token || gitState.githubToken,
        (progress) => {
          setGitState((prev) => ({ ...prev, cloneProgress: progress }));
        }
      );

      // Create a dedicated project for the cloned repo
      const clonedProject: Project = {
        id: `proj-github-${Date.now()}`,
        name: parsed.repo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: res.files,
        openTabs: [],
        activeTabPath: null,
      };

      const firstFile = res.files.find((f) => f.type === 'file') ||
        res.files.find((f) => f.children && f.children.length > 0)?.children?.[0];

      if (firstFile) {
        clonedProject.openTabs = [
          {
            id: firstFile.path,
            path: firstFile.path,
            name: firstFile.name,
            language: firstFile.language || 'plaintext',
          },
        ];
        clonedProject.activeTabPath = firstFile.path;
      }

      const updatedProjects = [...projects, clonedProject];
      setProjects(updatedProjects);
      saveAllProjects(updatedProjects);

      setActiveId(clonedProject.id);
      setActiveProjectId(clonedProject.id);
      setFiles(res.files);
      setOpenTabs(clonedProject.openTabs);
      setActiveTabPath(clonedProject.activeTabPath);

      setGitState((prev) => ({
        ...prev,
        repoName: parsed.repo,
        owner: parsed.owner,
        repoUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
        currentBranch: res.defaultBranch,
        branches: res.branches,
        stagedFiles: [],
        unstagedFiles: [],
        isCloning: false,
        cloneProgress: 'Cloned successfully!',
        commits: [
          {
            id: `clone-${Date.now()}`,
            hash: 'HEAD',
            message: `Cloned from GitHub: ${parsed.owner}/${parsed.repo} (${res.defaultBranch})`,
            author: parsed.owner,
            date: 'Just now',
            filesCount: res.files.length,
          },
        ],
      }));

      setTerminalLines((prev) => [
        ...prev,
        {
          id: `clone-success-${Date.now()}`,
          type: 'success',
          text: `✓ Cloned https://github.com/${parsed.owner}/${parsed.repo} into project "${parsed.repo}" with ${res.files.length} items. Saved in LocalStorage.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      setGitState((prev) => ({
        ...prev,
        isCloning: false,
        cloneProgress: '',
      }));
      throw err;
    }
  };

  // Terminal commands
  const handleExecuteCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    const args = cmd.split(' ');
    const root = args[0].toLowerCase();

    setTerminalLines((prev) => [
      ...prev,
      {
        id: `input-${Date.now()}`,
        type: 'input',
        text: cmd,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    if (cmd === 'clear') {
      setTerminalLines([]);
      return;
    }

    if (cmd === 'help') {
      setTerminalLines((prev) => [
        ...prev,
        {
          id: `help-${Date.now()}`,
          type: 'output',
          text: `Available commands:
  • git clone <url|owner/repo>   : Clone repository from GitHub
  • git status                  : Show working tree and modified files
  • git commit -m "<message>"   : Commit changes to local Git
  • git branch                  : List branches
  • git checkout <branch>       : Switch branch
  • npm run dev / npm start     : Start Live Preview server
  • ls / dir                    : List files in project
  • cat <filename>              : Print file content
  • touch <filename>            : Create a new file
  • mkdir <folder>              : Create a new directory
  • clear                       : Clear terminal buffer`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      return;
    }

    if (root === 'git') {
      const sub = args[1]?.toLowerCase();
      if (sub === 'status') {
        const text = `On branch ${gitState.currentBranch}
${
  modifiedFiles.length === 0
    ? 'nothing to commit, working tree clean'
    : `Changes not staged for commit:\n  (use "git commit -m <msg>" to commit)\n` +
      modifiedFiles.map((f) => `\tmodified:   ${f.path}`).join('\n')
}`;
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `status-${Date.now()}`,
            type: 'output',
            text,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return;
      }

      if (sub === 'clone') {
        const repo = args[2];
        if (!repo) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `err-${Date.now()}`, type: 'error', text: 'Usage: git clone <owner/repo or url>', timestamp: '' },
          ]);
          return;
        }

        try {
          await handleCloneRepo(repo);
        } catch (err: unknown) {
          setTerminalLines((prev) => [
            ...prev,
            {
              id: `clone-err-${Date.now()}`,
              type: 'error',
              text: `fatal: ${err instanceof Error ? err.message : 'Clone failed'}`,
              timestamp: '',
            },
          ]);
        }
        return;
      }

      if (sub === 'commit') {
        const match = cmd.match(/-m\s+["'](.*)["']/);
        const msg = match ? match[1] : args.slice(2).join(' ') || 'Update files';
        handleCommit(msg);
        return;
      }
    }

    if (root === 'npm' && (args[1] === 'run' || args[1] === 'start')) {
      setIsPreviewOpen(true);
      setTerminalLines((prev) => [
        ...prev,
        {
          id: `npm-${Date.now()}`,
          type: 'success',
          text: `[Live Server] Server running at http://localhost:5500/index.html (Live Preview opened)`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      return;
    }

    if (root === 'ls' || root === 'dir') {
      const names = files.length === 0
        ? '(Empty project)'
        : files.map((f) => (f.type === 'folder' ? `${f.name}/` : f.name)).join('   ');
      setTerminalLines((prev) => [
        ...prev,
        { id: `ls-${Date.now()}`, type: 'output', text: names, timestamp: '' },
      ]);
      return;
    }

    if (root === 'cat') {
      const target = args[1];
      const found = target ? findFileByPath(files, target) : null;
      if (!found) {
        setTerminalLines((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, type: 'error', text: `cat: ${target}: No such file`, timestamp: '' },
        ]);
      } else {
        setTerminalLines((prev) => [
          ...prev,
          { id: `cat-${Date.now()}`, type: 'output', text: found.content || '(empty file)', timestamp: '' },
        ]);
      }
      return;
    }

    if (root === 'touch') {
      const filename = args[1];
      if (filename) {
        handleCreateFile(null, filename);
        setTerminalLines((prev) => [
          ...prev,
          { id: `touch-${Date.now()}`, type: 'success', text: `Created file: ${filename}`, timestamp: '' },
        ]);
      }
      return;
    }

    if (root === 'mkdir') {
      const foldername = args[1];
      if (foldername) {
        handleCreateFolder(null, foldername);
        setTerminalLines((prev) => [
          ...prev,
          { id: `mkdir-${Date.now()}`, type: 'success', text: `Created directory: ${foldername}`, timestamp: '' },
        ]);
      }
      return;
    }

    setTerminalLines((prev) => [
      ...prev,
      {
        id: `unknown-${Date.now()}`,
        type: 'error',
        text: `bash: ${root}: command not found. Type "help" to see available commands.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && !e.shiftKey) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && e.shiftKey) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'j' || e.key === '`')) {
        e.preventDefault();
        setIsBottomPanelOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTabPath, files]);

  // Command palette commands
  const commandPaletteList: CommandItem[] = [
    {
      id: 'open-projects',
      title: 'Projects: Switch / Manage Projects (Saved in LocalStorage)',
      category: 'Projects',
      action: () => setIsProjectModalOpen(true),
    },
    {
      id: 'clone-github',
      title: 'Git: Clone Repository from GitHub',
      category: 'GitHub',
      shortcut: 'Ctrl+Shift+G',
      action: () => setIsGitHubCloneModalOpen(true),
    },
    {
      id: 'toggle-preview',
      title: 'View: Toggle Live Server Preview (Split / Full)',
      category: 'View',
      action: () => setIsPreviewOpen((prev) => !prev),
    },
    {
      id: 'theme-dark',
      title: 'Preferences: Color Theme (Dark+)',
      category: 'Preferences',
      action: () => setSettings((s) => ({ ...s, theme: 'vs-dark' })),
    },
    {
      id: 'theme-light',
      title: 'Preferences: Color Theme (Light+)',
      category: 'Preferences',
      action: () => setSettings((s) => ({ ...s, theme: 'vs-light' })),
    },
    {
      id: 'format-doc',
      title: 'Format Document (Prettier)',
      category: 'Editor',
      shortcut: 'Shift+Alt+F',
      action: handleFormatCode,
    },
    {
      id: 'toggle-terminal',
      title: 'View: Toggle Integrated Terminal',
      category: 'View',
      shortcut: 'Ctrl+`',
      action: () => setIsBottomPanelOpen((prev) => !prev),
    },
    {
      id: 'export-zip',
      title: 'File: Download Project as ZIP',
      category: 'File',
      action: () => exportWorkspaceAsZip(files, currentProject?.name || 'my-project'),
    },
  ];

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans ${themeClasses.bgApp}`}>
      {/* Top Title Bar with Projects Button */}
      <TitleBar
        projectName={currentProject?.name || 'My Project'}
        repoName={gitState.repoName}
        currentBranch={gitState.currentBranch}
        theme={settings.theme}
        onSelectTheme={(t) => setSettings((s) => ({ ...s, theme: t }))}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenGitHubModal={() => setIsGitHubCloneModalOpen(true)}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onExportZip={() => exportWorkspaceAsZip(files, currentProject?.name || 'my-project')}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleBottomPanel={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
        onTogglePreview={() => setIsPreviewOpen(!isPreviewOpen)}
        onToggleSplitDiff={() => {
          if (isDiffOpen) {
            setIsDiffOpen(false);
          } else if (activeFile) {
            handleOpenDiff(activeFile);
          }
        }}
        isPreviewOpen={isPreviewOpen}
        isDiffOpen={isDiffOpen}
        activeFilePath={activeTabPath ?? undefined}
        onNewFile={() => handleCreateFile(null, 'untitled.txt')}
        onNewFolder={() => handleCreateFolder(null, 'new-folder')}
        onSaveFile={handleSaveFile}
        onFormatCode={handleFormatCode}
        themeClasses={themeClasses}
      />

      {/* Main Workspace (Activity Bar + Sidebar + Editor Area) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Activity Bar */}
        <ActivityBar
          activeView={activeView}
          onSelectView={(v) => setActiveView(v)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          changesCount={modifiedFiles.length}
          themeClasses={themeClasses}
        />

        {/* Primary Sidebar */}
        <Sidebar
          activeView={activeView}
          isOpen={isSidebarOpen}
          width={sidebarWidth}
          files={files}
          repoName={currentProject?.name || 'my-project'}
          activeFilePath={activeTabPath ?? undefined}
          gitState={gitState}
          modifiedFiles={modifiedFiles}
          settings={settings}
          onOpenFile={handleOpenFile}
          onOpenFileAndJump={handleOpenFileAndJump}
          onToggleFolder={handleToggleFolder}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
          onExportZip={() => exportWorkspaceAsZip(files, currentProject?.name || 'my-project')}
          onCommit={handleCommit}
          onOpenDiff={handleOpenDiff}
          onDiscardChange={handleDiscardChange}
          onStageFile={handleStageFile}
          onUnstageFile={handleUnstageFile}
          onStageAll={handleStageAll}
          onUnstageAll={handleUnstageAll}
          onSwitchBranch={(b) => setGitState((prev) => ({ ...prev, currentBranch: b }))}
          onCloneRepo={handleCloneRepo}
          onSetGitHubToken={(tok) => setGitState((prev) => ({ ...prev, githubToken: tok }))}
          onUpdateSettings={(newS) => setSettings((s) => ({ ...s, ...newS }))}
          themeClasses={themeClasses}
        />

        {/* Center: Editor Area + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <EditorArea
            openTabs={openTabs}
            activeTabPath={activeTabPath}
            activeFile={activeFile}
            files={files}
            settings={settings}
            isDiffOpen={isDiffOpen}
            diffFile={diffFile}
            isPreviewOpen={isPreviewOpen}
            onSelectTab={(path) => {
              setActiveTabPath(path);
              setIsDiffOpen(false);
            }}
            onCloseTab={handleCloseTab}
            onContentChange={handleContentChange}
            onCursorChange={(line, col) => setCursorPos({ line, col })}
            onSaveFile={handleSaveFile}
            onCloseDiff={() => setIsDiffOpen(false)}
            onTogglePreview={() => setIsPreviewOpen(!isPreviewOpen)}
            themeClasses={themeClasses}
          />

          {/* Bottom Panel (Terminal, Problems, Output, Git History) */}
          <BottomPanel
            isOpen={isBottomPanelOpen}
            activeTab={bottomPanelTab}
            onSelectTab={(tab) => setBottomPanelTab(tab)}
            onClose={() => setIsBottomPanelOpen(false)}
            terminalLines={terminalLines}
            onExecuteCommand={handleExecuteCommand}
            onClearTerminal={() => setTerminalLines([])}
            commits={gitState.commits}
            currentBranch={gitState.currentBranch}
            repoName={currentProject?.name || 'my-project'}
            themeClasses={themeClasses}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        gitState={gitState}
        modifiedCount={modifiedFiles.length}
        cursorLine={cursorPos.line}
        cursorCol={cursorPos.col}
        tabSize={settings.tabSize}
        activeLanguage={activeFile?.language}
        onSelectLanguage={(lang) => {
          if (activeTabPath) {
            setFiles((prev) =>
              updateFileInTree(prev, activeTabPath, (item) => ({ ...item, language: lang }))
            );
          }
        }}
        onOpenGitHubModal={() => setIsGitHubCloneModalOpen(true)}
        onToggleBottomPanel={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
        themeClasses={themeClasses}
      />

      {/* Quick Open / Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        files={files}
        onOpenFile={handleOpenFile}
        commands={commandPaletteList}
        themeClasses={themeClasses}
      />

      {/* Dedicated GitHub Clone Modal */}
      <GitHubCloneModal
        isOpen={isGitHubCloneModalOpen}
        onClose={() => setIsGitHubCloneModalOpen(false)}
        gitState={gitState}
        onCloneRepo={handleCloneRepo}
        onSetGitHubToken={(tok) => setGitState((prev) => ({ ...prev, githubToken: tok }))}
        themeClasses={themeClasses}
      />

      {/* Projects Manager Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onExportProjectZip={(proj) => exportWorkspaceAsZip(proj.files, proj.name)}
        themeClasses={themeClasses}
      />
    </div>
  );
}
