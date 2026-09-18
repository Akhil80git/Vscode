import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from './types';
import { INITIAL_WORKSPACE_FILES } from './data/initialWorkspace';
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
import { TitleBar } from './components/TitleBar';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { EditorArea } from './components/EditorArea';
import { BottomPanel } from './components/BottomPanel';
import { StatusBar } from './components/StatusBar';
import { CommandPalette, CommandItem } from './components/CommandPalette';
import { GitHubCloneModal } from './components/GitHubCloneModal';

export default function App() {
  // Workspace files tree
  const [files, setFiles] = useState<FileItem[]>(INITIAL_WORKSPACE_FILES);

  // Tabs
  const [openTabs, setOpenTabs] = useState<TabItem[]>([
    { id: 'README.md', path: 'README.md', name: 'README.md', language: 'markdown' },
    { id: 'src/App.tsx', path: 'src/App.tsx', name: 'App.tsx', language: 'typescript' },
  ]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>('README.md');

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
      text: 'Visual Studio Code [Web Studio with Monaco Editor]',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-2',
      type: 'output',
      text: '🐙 GitHub Integration ready: type "git clone <url>" or click "Clone Repo" in topbar.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Git state
  const [gitState, setGitState] = useState<GitState>({
    repoName: 'my-awesome-app',
    repoUrl: 'https://github.com/example/my-awesome-app',
    currentBranch: 'main',
    branches: ['main', 'feature/new-ui'],
    stagedFiles: [],
    unstagedFiles: [],
    isCloning: false,
    cloneProgress: '',
    githubToken: '',
    commits: [
      {
        id: 'c-1',
        hash: 'a7b3c29',
        message: 'Initial commit: React 19 + TypeScript + Monaco Editor template',
        author: 'akhil-coder',
        date: 'Just now',
        filesCount: 6,
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
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [diffFile, setDiffFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const themeClasses = useMemo(() => getAppThemeClasses(settings.theme), [settings.theme]);

  // Active File object
  const activeFile = useMemo(() => {
    if (!activeTabPath) return null;
    return findFileByPath(files, activeTabPath);
  }, [files, activeTabPath]);

  // Modified files for Git tracking
  const modifiedFiles = useMemo(() => {
    const list: FileItem[] = [];
    function scan(items: FileItem[]) {
      for (const item of items) {
        if (item.type === 'file') {
          // File is modified if content != originalContent
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

  // Open file handler (handles on-demand fetching for cloned repos!)
  const handleOpenFile = useCallback(
    async (file: FileItem) => {
      // If file isn't loaded yet from GitHub, load it on demand
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

      // Add to open tabs if not present
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

    // Update tab dirty indicator
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
        text: `[File System] Saved: ${activeTabPath}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Format Code (simulate Prettier action)
  const handleFormatCode = () => {
    if (!activeFile || !activeFile.content) return;
    try {
      if (activeFile.language === 'json') {
        const formatted = JSON.stringify(JSON.parse(activeFile.content), null, settings.tabSize);
        handleContentChange(formatted);
      } else {
        // Normal trim formatting
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

  // Git actions
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

    // Reset originalContent to current content for committed files
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
      author: 'akhil-coder',
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
        text: `[${gitState.currentBranch} ${newCommit.hash}] ${message} (${committedPaths.length} files changed)`,
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

      setFiles(res.files);
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

      // Find first file (like README.md or package.json) to open
      const firstFile = res.files.find((f) => f.type === 'file') ||
        res.files.find((f) => f.children && f.children.length > 0)?.children?.[0];

      if (firstFile) {
        setOpenTabs([
          {
            id: firstFile.path,
            path: firstFile.path,
            name: firstFile.name,
            language: firstFile.language || 'plaintext',
          },
        ]);
        setActiveTabPath(firstFile.path);
      } else {
        setOpenTabs([]);
        setActiveTabPath(null);
      }

      setTerminalLines((prev) => [
        ...prev,
        {
          id: `clone-success-${Date.now()}`,
          type: 'success',
          text: `✓ Cloned https://github.com/${parsed.owner}/${parsed.repo} [${res.defaultBranch}] into workspace with ${res.files.length} items.`,
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

  // Terminal command executor
  const handleExecuteCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    const args = cmd.split(' ');
    const root = args[0].toLowerCase();

    // Echo input line
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
  • git clone <url|owner/repo>   : Clone any repository from GitHub
  • git status                  : Show working tree and modified files
  • git commit -m "<message>"   : Commit staged/modified changes
  • git branch                  : List branches
  • git checkout <branch>       : Switch branch
  • npm run dev / npm start     : Simulate running dev server
  • npm test                    : Run workspace unit tests
  • node <filename>             : Execute JavaScript/TypeScript
  • ls / dir                    : List files in root directory
  • cat <filename>              : Print file content to terminal
  • mkdir <folder>              : Create a new folder
  • touch <filename>            : Create a new file
  • clear                       : Clear terminal buffer`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      return;
    }

    // GIT commands
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

      if (sub === 'branch') {
        const text = gitState.branches
          .map((b) => (b === gitState.currentBranch ? `* \x1b[32m${b}\x1b[0m` : `  ${b}`))
          .join('\n');
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `branch-${Date.now()}`,
            type: 'output',
            text,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return;
      }

      if (sub === 'checkout') {
        const target = args[2];
        if (!target) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `err-${Date.now()}`, type: 'error', text: 'fatal: specify a branch name', timestamp: '' },
          ]);
          return;
        }
        setGitState((prev) => ({
          ...prev,
          currentBranch: target,
          branches: prev.branches.includes(target) ? prev.branches : [...prev.branches, target],
        }));
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `co-${Date.now()}`,
            type: 'success',
            text: `Switched to branch '${target}'`,
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

        setTerminalLines((prev) => [
          ...prev,
          { id: `cloning-${Date.now()}`, type: 'system', text: `Cloning into '${repo}'...`, timestamp: '' },
        ]);

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

    // NPM commands
    if (root === 'npm') {
      if (args[1] === 'run' && (args[2] === 'dev' || args[2] === 'start')) {
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `npm-${Date.now()}`,
            type: 'system',
            text: `> vite --host 0.0.0.0 --port 3000\n\n  VITE v5.2.0  ready in 180 ms\n\n  ➜  Local:   http://localhost:3000/\n  ➜  Network: use --host to expose`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setIsPreviewOpen(true);
        return;
      }

      if (args[1] === 'test') {
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `test-${Date.now()}`,
            type: 'success',
            text: `✓ test/math.test.ts (2 tests passed)\n✓ test/app.test.ts (1 test passed)\n\nTest Files  2 passed (2)\n     Tests  3 passed (3)\n  Duration  412ms`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return;
      }
    }

    // File commands
    if (root === 'ls' || root === 'dir') {
      const names = files.map((f) => (f.type === 'folder' ? `${f.name}/` : f.name)).join('   ');
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

    // Default unknown command
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
      // Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && !e.shiftKey) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      // Ctrl+Shift+P / Cmd+Shift+P
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && e.shiftKey) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      // Ctrl+B (Toggle Sidebar)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      // Ctrl+J or Ctrl+` (Toggle Terminal)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'j' || e.key === '`')) {
        e.preventDefault();
        setIsBottomPanelOpen((prev) => !prev);
      }
      // Ctrl+S (Save)
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
      id: 'clone-github',
      title: 'Git: Clone Repository from GitHub',
      category: 'GitHub',
      shortcut: 'Ctrl+Shift+G',
      action: () => setIsGitHubCloneModalOpen(true),
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
      id: 'theme-github',
      title: 'Preferences: Color Theme (GitHub Dark)',
      category: 'Preferences',
      action: () => setSettings((s) => ({ ...s, theme: 'github-dark' })),
    },
    {
      id: 'theme-dracula',
      title: 'Preferences: Color Theme (Dracula)',
      category: 'Preferences',
      action: () => setSettings((s) => ({ ...s, theme: 'dracula' })),
    },
    {
      id: 'theme-monokai',
      title: 'Preferences: Color Theme (Monokai)',
      category: 'Preferences',
      action: () => setSettings((s) => ({ ...s, theme: 'monokai' })),
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
      id: 'toggle-preview',
      title: 'View: Toggle Web Live Preview',
      category: 'View',
      action: () => setIsPreviewOpen((prev) => !prev),
    },
    {
      id: 'toggle-minimap',
      title: 'View: Toggle Minimap',
      category: 'View',
      action: () => setSettings((s) => ({ ...s, minimap: !s.minimap })),
    },
    {
      id: 'export-zip',
      title: 'File: Download Workspace as ZIP',
      category: 'File',
      action: () => exportWorkspaceAsZip(files, gitState.repoName),
    },
  ];

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans ${themeClasses.bgApp}`}>
      {/* Top Title Bar */}
      <TitleBar
        repoName={gitState.repoName}
        currentBranch={gitState.currentBranch}
        theme={settings.theme}
        onSelectTheme={(t) => setSettings((s) => ({ ...s, theme: t }))}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenGitHubModal={() => setIsGitHubCloneModalOpen(true)}
        onExportZip={() => exportWorkspaceAsZip(files, gitState.repoName)}
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
        onNewFile={() => handleCreateFile(null, 'untitled.ts')}
        onNewFolder={() => handleCreateFolder(null, 'new-folder')}
        onSaveFile={handleSaveFile}
        onFormatCode={handleFormatCode}
        themeClasses={themeClasses}
      />

      {/* Main Workspace (Activity Bar + Sidebar + Editor + Bottom Panel) */}
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
          repoName={gitState.repoName}
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
          onExportZip={() => exportWorkspaceAsZip(files, gitState.repoName)}
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
            repoName={gitState.repoName}
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
    </div>
  );
}
