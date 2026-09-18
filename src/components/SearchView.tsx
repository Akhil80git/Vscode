import React, { useState } from 'react';
import {
  Search,
  CaseSensitive,
  WholeWord,
  Regex,
  ChevronDown,
  ChevronRight,
  FileCode,
} from 'lucide-react';
import { FileItem, SearchResult } from '../types';
import { searchFilesInTree } from '../utils/workspaceUtils';
import { getFileIcon } from '../utils/fileIcons';

interface SearchViewProps {
  files: FileItem[];
  onOpenFileAndJump: (file: FileItem, lineNumber: number) => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const SearchView: React.FC<SearchViewProps> = ({
  files,
  onOpenFileAndJump,
  themeClasses,
}) => {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({});

  const results: SearchResult[] = query.trim()
    ? searchFilesInTree(files, query, caseSensitive, matchWholeWord)
    : [];

  const totalMatches = results.reduce((acc, curr) => acc + curr.matches.length, 0);

  const toggleCollapse = (path: string) => {
    setCollapsedFiles((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div id="search-view-panel" className="h-full flex flex-col select-none overflow-hidden">
      {/* Search Header */}
      <div className={`p-3 border-b ${themeClasses.border} shrink-0 space-y-2`}>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Search
        </div>

        {/* Input & toggles */}
        <div className="relative flex items-center">
          <input
            id="search-input"
            type="text"
            placeholder="Search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 text-slate-100 pl-2.5 pr-20 py-1.5 text-xs rounded border border-slate-700 focus:border-blue-500 outline-none"
          />
          <div className="absolute right-1 flex items-center gap-0.5">
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={`p-1 rounded ${
                caseSensitive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Match Case (Alt+C)"
            >
              <CaseSensitive className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMatchWholeWord(!matchWholeWord)}
              className={`p-1 rounded ${
                matchWholeWord ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Match Whole Word (Alt+W)"
            >
              <WholeWord className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setUseRegex(!useRegex)}
              className={`p-1 rounded ${
                useRegex ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Use Regular Expression (Alt+R)"
            >
              <Regex className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {query.trim() && (
          <div className="text-[11px] text-slate-400">
            {totalMatches} results in {results.length} files
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-1 scrollbar-thin text-xs">
        {query.trim() && results.length === 0 ? (
          <div className="p-4 text-center text-slate-500">No results found.</div>
        ) : (
          results.map(({ file, matches }) => {
            const isCollapsed = collapsedFiles[file.path];
            return (
              <div key={file.path} className="mb-1">
                {/* File Header */}
                <div
                  onClick={() => toggleCollapse(file.path)}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 cursor-pointer text-slate-300"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  {getFileIcon(file.name, false)}
                  <span className="font-medium truncate flex-1">{file.name}</span>
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-full text-slate-400">
                    {matches.length}
                  </span>
                </div>

                {/* Match lines */}
                {!isCollapsed && (
                  <div className="pl-6 space-y-0.5 mt-0.5">
                    {matches.map((m, idx) => (
                      <div
                        key={idx}
                        onClick={() => onOpenFileAndJump(file, m.lineNumber)}
                        className="px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer flex items-baseline gap-2 text-slate-400 hover:text-slate-200"
                      >
                        <span className="text-[10px] text-blue-400 shrink-0 font-mono">
                          {m.lineNumber}:
                        </span>
                        <span className="truncate font-mono text-[11px]">{m.lineContent}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
