import React, { useState } from 'react';
import { Blocks, Search, Check, Download, Star, ShieldCheck } from 'lucide-react';

interface ExtensionItem {
  id: string;
  name: string;
  publisher: string;
  description: string;
  downloads: string;
  rating: number;
  installed: boolean;
  iconBg: string;
}

const INITIAL_EXTENSIONS: ExtensionItem[] = [
  {
    id: 'prettier',
    name: 'Prettier - Code formatter',
    publisher: 'Prettier',
    description: 'Code formatter using prettier for JS, TS, HTML, CSS, Markdown and JSON.',
    downloads: '45.2M',
    rating: 4.8,
    installed: true,
    iconBg: 'bg-emerald-600',
  },
  {
    id: 'eslint',
    name: 'ESLint',
    publisher: 'Microsoft',
    description: 'Integrates ESLint JavaScript into VS Code.',
    downloads: '38.9M',
    rating: 4.7,
    installed: true,
    iconBg: 'bg-indigo-600',
  },
  {
    id: 'gitlens',
    name: 'GitLens — Git supercharged',
    publisher: 'GitKraken',
    description: 'Supercharge Git within VS Code — Visualize code authorship at a glance.',
    downloads: '31.1M',
    rating: 4.9,
    installed: true,
    iconBg: 'bg-sky-600',
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS IntelliSense',
    publisher: 'Tailwind Labs',
    description: 'Intelligent Tailwind CSS tooling for VS Code.',
    downloads: '15.4M',
    rating: 4.9,
    installed: true,
    iconBg: 'bg-teal-600',
  },
  {
    id: 'python',
    name: 'Python',
    publisher: 'Microsoft',
    description: 'Python language support with extension access to pylance and debugging.',
    downloads: '110M',
    rating: 4.6,
    installed: false,
    iconBg: 'bg-amber-600',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    publisher: 'GitHub',
    description: 'Your AI pair programmer built for VS Code.',
    downloads: '20.5M',
    rating: 4.8,
    installed: true,
    iconBg: 'bg-purple-600',
  },
];

interface ExtensionsViewProps {
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const ExtensionsView: React.FC<ExtensionsViewProps> = ({ themeClasses }) => {
  const [extensions, setExtensions] = useState<ExtensionItem[]>(INITIAL_EXTENSIONS);
  const [search, setSearch] = useState('');

  const toggleInstall = (id: string) => {
    setExtensions((prev) =>
      prev.map((ext) => (ext.id === id ? { ...ext, installed: !ext.installed } : ext))
    );
  };

  const filtered = extensions.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.publisher.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="extensions-panel" className="h-full flex flex-col select-none overflow-hidden">
      {/* Header */}
      <div className={`p-3 border-b ${themeClasses.border} shrink-0 space-y-2`}>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Extensions: Marketplace
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search Extensions in Marketplace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 text-slate-100 pl-2.5 pr-2 py-1.5 text-xs rounded border border-slate-700 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Extension List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin space-y-2 text-xs">
        {filtered.map((ext) => (
          <div
            key={ext.id}
            className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors flex gap-2.5"
          >
            <div
              className={`w-9 h-9 rounded flex items-center justify-center text-white font-bold text-sm shrink-0 ${ext.iconBg}`}
            >
              {ext.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 truncate">{ext.name}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">{ext.publisher}</div>
              <p className="text-[11px] text-slate-400 line-clamp-2 my-1 leading-tight">
                {ext.description}
              </p>

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-0.5">
                    <Download className="w-3 h-3" /> {ext.downloads}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {ext.rating}
                  </span>
                </div>

                <button
                  onClick={() => toggleInstall(ext.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    ext.installed
                      ? 'bg-white/10 hover:bg-white/15 text-slate-300'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {ext.installed ? 'Disable' : 'Install'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
