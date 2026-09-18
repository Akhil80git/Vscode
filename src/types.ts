export type Theme = 'vs-dark' | 'vs-light' | 'monokai' | 'dracula' | 'one-dark-pro' | 'github-dark';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  originalContent?: string;
  language?: string;
  isModified?: boolean;
  isOpen?: boolean;
  children?: FileItem[];
  parentPath?: string;
  isLoaded?: boolean;
  downloadUrl?: string;
  sha?: string;
  size?: number;
}

export interface TabItem {
  id: string;
  path: string;
  name: string;
  language: string;
  isModified?: boolean;
}

export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  filesCount: number;
}

export interface GitState {
  currentBranch: string;
  branches: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
  commits: GitCommit[];
  repoName: string;
  repoUrl: string;
  isCloning: boolean;
  cloneProgress: string;
  githubToken?: string;
  owner?: string;
}

export type ActiveView = 'explorer' | 'search' | 'git' | 'clone' | 'extensions' | 'settings';
export type BottomPanelTab = 'terminal' | 'problems' | 'output' | 'git-history';

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  text: string;
  timestamp: string;
}

export interface EditorSettings {
  theme: Theme;
  fontSize: number;
  tabSize: number;
  minimap: boolean;
  wordWrap: 'on' | 'off';
  lineNumbers: 'on' | 'off';
  autoSave: boolean;
  bracketPairColorization: boolean;
  fontFamily: string;
}

export interface SearchResult {
  file: FileItem;
  matches: {
    lineNumber: number;
    lineContent: string;
    matchIndex: number;
    matchLength: number;
  }[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  files: FileItem[];
  openTabs: TabItem[];
  activeTabPath: string | null;
  gitState?: {
    currentBranch: string;
    branches: string[];
    commits: GitCommit[];
    repoUrl?: string;
  };
}

