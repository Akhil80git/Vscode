import React from 'react';
import {
  FileCode,
  FileText,
  FileJson,
  FileImage,
  Folder,
  FolderOpen,
  File,
  Code2,
  FileType,
  Database,
  Terminal,
  Settings,
  GitBranch,
} from 'lucide-react';

export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const filename = path.split('/').pop()?.toLowerCase();

  if (filename === 'package.json' || filename === 'tsconfig.json') return 'json';
  if (filename === 'dockerfile') return 'dockerfile';
  if (filename?.startsWith('.env')) return 'ini';

  switch (ext) {
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'jsx':
      return 'javascript';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
    case 'sass':
      return 'scss';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'py':
      return 'python';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'hpp':
      return 'cpp';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'xml':
    case 'svg':
      return 'xml';
    case 'sh':
    case 'bash':
      return 'shell';
    default:
      return 'plaintext';
  }
}

export function getFileIcon(filename: string, isFolder: boolean, isOpen?: boolean): React.ReactNode {
  if (isFolder) {
    return isOpen ? (
      <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
    ) : (
      <Folder className="w-4 h-4 text-sky-400 shrink-0" />
    );
  }

  const lower = filename.toLowerCase();
  const ext = lower.split('.').pop();

  if (lower === 'package.json') {
    return <FileJson className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (lower === 'tsconfig.json' || lower.includes('config')) {
    return <Settings className="w-4 h-4 text-blue-400 shrink-0" />;
  }
  if (lower.startsWith('.git')) {
    return <GitBranch className="w-4 h-4 text-orange-400 shrink-0" />;
  }
  if (lower.endsWith('.sql')) {
    return <Database className="w-4 h-4 text-amber-400 shrink-0" />;
  }

  switch (ext) {
    case 'ts':
      return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
    case 'tsx':
      return <Code2 className="w-4 h-4 text-sky-400 shrink-0" />;
    case 'js':
    case 'mjs':
      return <FileCode className="w-4 h-4 text-amber-300 shrink-0" />;
    case 'jsx':
      return <Code2 className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-400 shrink-0" />;
    case 'html':
      return <FileType className="w-4 h-4 text-orange-500 shrink-0" />;
    case 'css':
    case 'scss':
      return <FileType className="w-4 h-4 text-indigo-400 shrink-0" />;
    case 'md':
      return <FileText className="w-4 h-4 text-slate-300 shrink-0" />;
    case 'svg':
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
      return <FileImage className="w-4 h-4 text-purple-400 shrink-0" />;
    case 'sh':
    case 'bash':
      return <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'py':
      return <FileCode className="w-4 h-4 text-green-400 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  }
}
