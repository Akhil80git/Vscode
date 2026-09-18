import React, { useRef, useEffect } from 'react';
import Editor, { DiffEditor, Monaco } from '@monaco-editor/react';
import {
  X,
  Circle,
  Code2,
  ChevronRight,
  Eye,
  Columns,
  Maximize2,
  Sparkles,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import { TabItem, FileItem, EditorSettings, Theme } from '../types';
import { getFileIcon } from '../utils/fileIcons';
import { defineMonacoThemes, getMonacoThemeName } from '../utils/monacoThemes';

interface EditorAreaProps {
  openTabs: TabItem[];
  activeTabPath: string | null;
  activeFile: FileItem | null;
  settings: EditorSettings;
  isDiffOpen: boolean;
  diffFile: FileItem | null;
  isPreviewOpen: boolean;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onContentChange: (newContent: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onSaveFile: () => void;
  onCloseDiff: () => void;
  onTogglePreview: () => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  openTabs,
  activeTabPath,
  activeFile,
  settings,
  isDiffOpen,
  diffFile,
  isPreviewOpen,
  onSelectTab,
  onCloseTab,
  onContentChange,
  onCursorChange,
  onSaveFile,
  onCloseDiff,
  onTogglePreview,
  themeClasses,
}) => {
  const editorRef = useRef<any>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const handleEditorWillMount = (monaco: Monaco) => {
    defineMonacoThemes(monaco);
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Track cursor changes
    editor.onDidChangeCursorPosition((e: any) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });

    // Add Ctrl+S save action
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveFile();
    });
  };

  // Build live web preview HTML if user wants to run/preview
  const generatePreviewSrcDoc = () => {
    if (!activeFile) return '<html><body><h3 style="color:#888;font-family:sans-serif;padding:20px;">Open a file to preview</h3></body></html>';

    if (activeFile.language === 'html') {
      return activeFile.content || '';
    }

    if (activeFile.language === 'markdown') {
      return `
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #24292f; line-height: 1.6; }
              pre { background: #f6f8fa; padding: 12px; border-radius: 6px; }
              code { font-family: monospace; }
              h1, h2, h3 { border-bottom: 1px solid #d0d7de; padding-bottom: 6px; }
            </style>
          </head>
          <body>
            <div>${(activeFile.content || '')
              .replace(/^# (.*$)/gim, '<h1>$1</h1>')
              .replace(/^## (.*$)/gim, '<h2>$1</h2>')
              .replace(/^### (.*$)/gim, '<h3>$1</h3>')
              .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
              .replace(/\*(.*)\*/gim, '<i>$1</i>')
              .replace(/\n/gim, '<br/>')}</div>
          </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        </head>
        <body class="bg-slate-900 text-slate-100 p-6 font-sans">
          <div id="root">
            <div class="max-w-md mx-auto p-4 bg-slate-800 rounded-xl border border-slate-700">
              <h2 class="text-lg font-bold text-sky-400 mb-2">${activeFile.name}</h2>
              <p class="text-sm text-slate-400 mb-4">Previewing active document content:</p>
              <pre class="bg-slate-950 p-3 rounded text-xs overflow-x-auto text-emerald-400 font-mono">${(activeFile.content || '').slice(0, 1000)}</pre>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const breadcrumbs = activeFile ? activeFile.path.split('/') : [];

  return (
    <div id="vscode-editor-area" className={`h-full flex-1 flex flex-col min-w-0 ${themeClasses.bgEditor}`}>
      {/* Tab Bar */}
      <div
        id="vscode-tabs-bar"
        className={`h-9 flex items-center overflow-x-auto select-none border-b ${themeClasses.border} ${themeClasses.bgTabs} scrollbar-none shrink-0`}
      >
        {openTabs.map((tab) => {
          const isActive = tab.path === activeTabPath && !isDiffOpen;
          return (
            <div
              key={tab.path}
              id={`tab-${tab.path.replace(/[^a-zA-Z0-9_-]/g, '-')}`}
              onClick={() => {
                if (isDiffOpen) onCloseDiff();
                onSelectTab(tab.path);
              }}
              className={`group h-full flex items-center gap-2 px-3 border-r ${themeClasses.border} cursor-pointer text-xs transition-colors shrink-0 max-w-[200px] ${
                isActive
                  ? `${themeClasses.bgActiveTab} text-white font-medium border-t-2 border-t-blue-500`
                  : `hover:bg-white/5 ${themeClasses.textSecondary}`
              }`}
            >
              {getFileIcon(tab.name, false)}
              <span className="truncate">{tab.name}</span>

              {/* Dirty dot or Close 'x' button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.path);
                }}
                className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 ml-1 transition-colors"
                title="Close (Ctrl+W)"
              >
                {tab.isModified ? (
                  <span className="group-hover:hidden">
                    <Circle className="w-2 h-2 fill-current text-white" />
                  </span>
                ) : null}
                <span className={tab.isModified ? 'hidden group-hover:block' : 'block'}>
                  <X className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          );
        })}

        {/* Git Diff Tab Header if active */}
        {isDiffOpen && diffFile && (
          <div
            className={`h-full flex items-center gap-2 px-3 border-r ${themeClasses.border} ${themeClasses.bgActiveTab} text-white font-medium border-t-2 border-t-sky-400 text-xs shrink-0`}
          >
            <Columns className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate">{diffFile.name} (Working Tree Diff)</span>
            <button
              onClick={onCloseDiff}
              className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Preview Tab Header if active */}
        {isPreviewOpen && (
          <div
            className={`h-full flex items-center gap-2 px-3 border-r ${themeClasses.border} bg-white/10 text-emerald-400 font-medium border-t-2 border-t-emerald-500 text-xs shrink-0`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Web Live Preview</span>
            <button
              onClick={onTogglePreview}
              className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumbs Bar */}
      {activeFile && !isDiffOpen && (
        <div
          className={`h-6 px-4 flex items-center gap-1 text-[11px] select-none border-b ${themeClasses.border} ${themeClasses.textSecondary} bg-white/2 shrink-0`}
        >
          {breadcrumbs.map((segment, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
              <span
                className={`truncate ${
                  idx === breadcrumbs.length - 1 ? 'text-slate-200 font-medium' : 'hover:underline cursor-pointer'
                }`}
              >
                {segment}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Main Content Area: Editor, Diff, or Preview */}
      <div className="flex-1 min-h-0 relative">
        {/* Diff Mode */}
        {isDiffOpen && diffFile ? (
          <div className="h-full w-full">
            <DiffEditor
              height="100%"
              original={diffFile.originalContent ?? ''}
              modified={diffFile.content ?? ''}
              language={diffFile.language || 'plaintext'}
              theme={getMonacoThemeName(settings.theme)}
              options={{
                readOnly: false,
                renderSideBySide: true,
                fontSize: settings.fontSize,
                minimap: { enabled: settings.minimap },
                wordWrap: settings.wordWrap,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
              beforeMount={handleEditorWillMount}
            />
          </div>
        ) : isPreviewOpen ? (
          /* Live Web Preview Mode */
          <div className="h-full w-full flex flex-col bg-slate-950">
            <div className="h-8 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Web Application Preview</span>
              </div>
              <button
                onClick={() => {
                  if (previewIframeRef.current) {
                    previewIframeRef.current.srcdoc = generatePreviewSrcDoc();
                  }
                }}
                className="p-1 hover:text-white rounded hover:bg-white/10"
                title="Reload Preview"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <iframe
              ref={previewIframeRef}
              srcDoc={generatePreviewSrcDoc()}
              title="Application Preview"
              sandbox="allow-scripts"
              className="flex-1 w-full h-full border-0 bg-white"
            />
          </div>
        ) : activeFile ? (
          /* Standard Monaco Editor Mode */
          <div className="h-full w-full">
            <Editor
              height="100%"
              path={activeFile.path}
              language={activeFile.language || 'plaintext'}
              value={activeFile.content ?? ''}
              theme={getMonacoThemeName(settings.theme)}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorDidMount}
              onChange={(val) => onContentChange(val ?? '')}
              options={{
                fontSize: settings.fontSize,
                tabSize: settings.tabSize,
                minimap: { enabled: settings.minimap },
                wordWrap: settings.wordWrap,
                lineNumbers: settings.lineNumbers,
                bracketPairColorization: { enabled: settings.bracketPairColorization },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontFamily: `'Fira Code', 'JetBrains Mono', Consolas, 'Courier New', monospace`,
                fontLigatures: true,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                quickSuggestions: true,
                renderLineHighlight: 'all',
              }}
            />
          </div>
        ) : (
          /* No active file empty state */
          <div className="h-full w-full flex flex-col items-center justify-center p-8 select-none text-center">
            <Code2 className="w-16 h-16 text-slate-600 mb-4 stroke-1" />
            <h2 className="text-xl font-bold text-slate-300 mb-2">VS Code Web & GitHub Studio</h2>
            <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
              Open a file from the Explorer or clone any GitHub repository to start coding with Monaco Editor.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md w-full text-xs text-slate-400">
              <div className="p-3 bg-white/5 rounded border border-white/10 text-left">
                <div className="font-semibold text-slate-200 mb-1">Quick Open</div>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Ctrl+P</kbd>
              </div>
              <div className="p-3 bg-white/5 rounded border border-white/10 text-left">
                <div className="font-semibold text-slate-200 mb-1">Command Palette</div>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Ctrl+Shift+P</kbd>
              </div>
              <div className="p-3 bg-white/5 rounded border border-white/10 text-left">
                <div className="font-semibold text-slate-200 mb-1">Toggle Terminal</div>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Ctrl+`</kbd>
              </div>
              <div className="p-3 bg-white/5 rounded border border-white/10 text-left">
                <div className="font-semibold text-slate-200 mb-1">Save Document</div>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Ctrl+S</kbd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
