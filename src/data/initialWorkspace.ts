import { FileItem } from '../types';

export const INITIAL_WORKSPACE_FILES: FileItem[] = [
  {
    id: 'f-readme',
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    language: 'markdown',
    isLoaded: true,
    content: `# 🚀 VS Code Web & GitHub Studio

A browser-based, high-fidelity development environment powered by the **Monaco Editor** (the official editor engine behind Visual Studio Code).

## ✨ Features
- **Full Monaco Editor**: Multi-tab code editor with syntax highlighting, IntelliSense autocomplete, bracket pair colorization, minimap, and formatting.
- **🐙 Full GitHub Integration**: Clone any public or private GitHub repository instantly (\`owner/repo\` or full GitHub URL), switch branches, and view file trees.
- **🌳 Complete File Explorer**: Create files & folders, rename, delete, and download as ZIP.
- **🔎 Global Workspace Search**: Instant search across all workspace files with case-sensitivity, regex, and line jump.
- **🌿 Source Control & Diff Editor**: Real Git-style staging, visual side-by-side Git Diff view, commit messages, and commit history.
- **💻 Interactive Terminal**: Virtual bash shell supporting \`git clone\`, \`git status\`, \`git commit\`, \`npm run dev\`, \`node\`, \`ls\`, \`cat\`, \`clear\`, and more.
- **⚡ Command Palette**: \`Ctrl+Shift+P\` / \`Cmd+Shift+P\` or \`Ctrl+P\` quick file picker.
- **🎨 Multi-Theme Support**: VS Code Dark+, VS Code Light, Monokai, Dracula, One Dark Pro, and GitHub Dark.

---
### 💡 Try It Now:
1. Open the **GitHub tab** in the left Activity Bar or click **Clone Repo** in the top bar.
2. Enter any GitHub repository (e.g. \`shadcn-ui/ui\` or \`facebook/react\`) to clone it directly into this editor!
3. Open the **Terminal** below to run bash commands like \`help\` or \`git status\`.
`,
  },
  {
    id: 'f-pkg',
    name: 'package.json',
    path: 'package.json',
    type: 'file',
    language: 'json',
    isLoaded: true,
    content: `{
  "name": "my-awesome-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.546.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
`,
  },
  {
    id: 'f-tsconfig',
    name: 'tsconfig.json',
    path: 'tsconfig.json',
    type: 'file',
    language: 'json',
    isLoaded: true,
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "skipLibCheck": true
  },
  "include": ["src"]
}
`,
  },
  {
    id: 'folder-src',
    name: 'src',
    path: 'src',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'f-main',
        name: 'main.tsx',
        path: 'src/main.tsx',
        type: 'file',
        language: 'typescript',
        isLoaded: true,
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      },
      {
        id: 'f-app',
        name: 'App.tsx',
        path: 'src/App.tsx',
        type: 'file',
        language: 'typescript',
        isLoaded: true,
        content: `import React, { useState } from 'react';
import { Header } from './components/Header';
import { calculateStats } from './utils/math';

export default function App() {
  const [count, setCount] = useState(0);
  const stats = calculateStats([12, 24, 48, count]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <Header title="Welcome to VS Code Web Studio" />
      <div className="mt-8 p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl max-w-md w-full text-center">
        <p className="text-slate-400 text-sm mb-4">
          Edit <code className="text-sky-400 font-mono">src/App.tsx</code> and save to see instant changes.
        </p>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 font-medium rounded-lg transition-colors cursor-pointer"
        >
          Clicked {count} times
        </button>
        <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500">
          Computed Sum: {stats.sum} | Average: {stats.average}
        </div>
      </div>
    </div>
  );
}
`,
      },
      {
        id: 'f-css',
        name: 'index.css',
        path: 'src/index.css',
        type: 'file',
        language: 'css',
        isLoaded: true,
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #0d1117;
  color: #f0f6fc;
}
`,
      },
      {
        id: 'folder-components',
        name: 'components',
        path: 'src/components',
        type: 'folder',
        isOpen: true,
        children: [
          {
            id: 'f-header',
            name: 'Header.tsx',
            path: 'src/components/Header.tsx',
            type: 'file',
            language: 'typescript',
            isLoaded: true,
            content: `import React from 'react';
import { Sparkles, Code2 } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Monaco Editor Web IDE</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
        <Code2 className="w-8 h-8 text-blue-500" />
        {title}
      </h1>
    </header>
  );
};
`,
          },
        ],
      },
      {
        id: 'folder-utils',
        name: 'utils',
        path: 'src/utils',
        type: 'folder',
        isOpen: true,
        children: [
          {
            id: 'f-math',
            name: 'math.ts',
            path: 'src/utils/math.ts',
            type: 'file',
            language: 'typescript',
            isLoaded: true,
            content: `export interface StatsResult {
  sum: number;
  average: number;
  min: number;
  max: number;
}

export function calculateStats(numbers: number[]): StatsResult {
  if (numbers.length === 0) {
    return { sum: 0, average: 0, min: 0, max: 0 };
  }

  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  const average = Number((sum / numbers.length).toFixed(2));
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  return { sum, average, min, max };
}
`,
          },
        ],
      },
    ],
  },
];
