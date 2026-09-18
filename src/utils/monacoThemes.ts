import type { Monaco } from '@monaco-editor/react';
import { Theme } from '../types';

export function defineMonacoThemes(monaco: Monaco) {
  // One Dark Pro
  monaco.editor.defineTheme('one-dark-pro', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'string', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'type', foreground: 'e5c07b' },
      { token: 'function', foreground: '61afef' },
      { token: 'variable', foreground: 'e06c75' },
    ],
    colors: {
      'editor.background': '#282c34',
      'editor.foreground': '#abb2bf',
      'editor.lineHighlightBackground': '#2c313a',
      'editorCursor.foreground': '#528bff',
      'editorWhitespace.foreground': '#3b4048',
      'editorIndentGuide.background': '#3b4048',
      'editorIndentGuide.activeBackground': '#c8c8c8',
      'editor.selectionBackground': '#3e4451',
    },
  });

  // Dracula
  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'type', foreground: '8be9fd' },
      { token: 'function', foreground: '50fa7b' },
      { token: 'variable', foreground: 'f8f8f2' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#44475a',
      'editorCursor.foreground': '#f8f8f0',
      'editor.selectionBackground': '#44475a',
    },
  });

  // Monokai
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9ef' },
      { token: 'function', foreground: 'a6e22e' },
      { token: 'variable', foreground: 'f8f8f2' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#3e3d32',
      'editorCursor.foreground': '#f8f8f0',
      'editor.selectionBackground': '#49483e',
    },
  });

  // GitHub Dark
  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'c9d1d9' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editorCursor.foreground': '#58a6ff',
      'editor.selectionBackground': '#1f242c',
    },
  });
}

export function getMonacoThemeName(theme: Theme): string {
  switch (theme) {
    case 'vs-light':
      return 'vs';
    case 'vs-dark':
      return 'vs-dark';
    case 'monokai':
      return 'monokai';
    case 'dracula':
      return 'dracula';
    case 'one-dark-pro':
      return 'one-dark-pro';
    case 'github-dark':
      return 'github-dark';
    default:
      return 'vs-dark';
  }
}

export function getAppThemeClasses(theme: Theme): {
  bgApp: string;
  bgTitlebar: string;
  bgActivityBar: string;
  bgSidebar: string;
  bgEditor: string;
  bgTabs: string;
  bgActiveTab: string;
  bgPanel: string;
  bgStatusBar: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
} {
  if (theme === 'vs-light') {
    return {
      bgApp: 'bg-[#f3f3f3]',
      bgTitlebar: 'bg-[#dddddd]',
      bgActivityBar: 'bg-[#2c2c2c]',
      bgSidebar: 'bg-[#f3f3f3]',
      bgEditor: 'bg-[#ffffff]',
      bgTabs: 'bg-[#ececec]',
      bgActiveTab: 'bg-[#ffffff]',
      bgPanel: 'bg-[#f3f3f3]',
      bgStatusBar: 'bg-[#007acc]',
      border: 'border-[#e0e0e0]',
      textPrimary: 'text-[#1e1e1e]',
      textSecondary: 'text-[#616161]',
      textMuted: 'text-[#888888]',
      accent: 'text-[#007acc]',
    };
  }

  if (theme === 'monokai') {
    return {
      bgApp: 'bg-[#1e1f1c]',
      bgTitlebar: 'bg-[#191a17]',
      bgActivityBar: 'bg-[#141412]',
      bgSidebar: 'bg-[#1e1f1c]',
      bgEditor: 'bg-[#272822]',
      bgTabs: 'bg-[#191a17]',
      bgActiveTab: 'bg-[#272822]',
      bgPanel: 'bg-[#1e1f1c]',
      bgStatusBar: 'bg-[#75715e]',
      border: 'border-[#33342e]',
      textPrimary: 'text-[#f8f8f2]',
      textSecondary: 'text-[#a6a69c]',
      textMuted: 'text-[#75715e]',
      accent: 'text-[#a6e22e]',
    };
  }

  if (theme === 'dracula') {
    return {
      bgApp: 'bg-[#21222c]',
      bgTitlebar: 'bg-[#191a21]',
      bgActivityBar: 'bg-[#191a21]',
      bgSidebar: 'bg-[#21222c]',
      bgEditor: 'bg-[#282a36]',
      bgTabs: 'bg-[#191a21]',
      bgActiveTab: 'bg-[#282a36]',
      bgPanel: 'bg-[#21222c]',
      bgStatusBar: 'bg-[#6272a4]',
      border: 'border-[#343746]',
      textPrimary: 'text-[#f8f8f2]',
      textSecondary: 'text-[#bd93f9]',
      textMuted: 'text-[#6272a4]',
      accent: 'text-[#ff79c6]',
    };
  }

  if (theme === 'github-dark') {
    return {
      bgApp: 'bg-[#090d13]',
      bgTitlebar: 'bg-[#010409]',
      bgActivityBar: 'bg-[#010409]',
      bgSidebar: 'bg-[#0d1117]',
      bgEditor: 'bg-[#0d1117]',
      bgTabs: 'bg-[#010409]',
      bgActiveTab: 'bg-[#0d1117]',
      bgPanel: 'bg-[#0d1117]',
      bgStatusBar: 'bg-[#1f6feb]',
      border: 'border-[#30363d]',
      textPrimary: 'text-[#c9d1d9]',
      textSecondary: 'text-[#8b949e]',
      textMuted: 'text-[#484f58]',
      accent: 'text-[#58a6ff]',
    };
  }

  // vs-dark (Default VS Code)
  return {
    bgApp: 'bg-[#181818]',
    bgTitlebar: 'bg-[#1f1f1f]',
    bgActivityBar: 'bg-[#181818]',
    bgSidebar: 'bg-[#181818]',
    bgEditor: 'bg-[#1f1f1f]',
    bgTabs: 'bg-[#181818]',
    bgActiveTab: 'bg-[#1f1f1f]',
    bgPanel: 'bg-[#181818]',
    bgStatusBar: 'bg-[#007acc]',
    border: 'border-[#2b2b2b]',
    textPrimary: 'text-[#cccccc]',
    textSecondary: 'text-[#969696]',
    textMuted: 'text-[#6c6c6c]',
    accent: 'text-[#007acc]',
  };
}
