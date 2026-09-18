import React, { useRef, useEffect, useState } from 'react';
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
  Smartphone,
  Tablet,
  Monitor,
  Radio,
  SplitSquareVertical,
} from 'lucide-react';
import { TabItem, FileItem, EditorSettings, Theme } from '../types';
import { getFileIcon } from '../utils/fileIcons';
import { defineMonacoThemes, getMonacoThemeName } from '../utils/monacoThemes';
import { buildLivePreviewDoc } from '../utils/previewBuilder';

interface EditorAreaProps {
  openTabs: TabItem[];
  activeTabPath: string | null;
  activeFile: FileItem | null;
  files: FileItem[];
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
  files,
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
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewSplit, setIsPreviewSplit] = useState(true); // default side-by-side like VS Code Live Server

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

  const previewHtml = React.useMemo(() => {
    return buildLivePreviewDoc(files, activeTabPath ?? undefined);
  }, [files, activeTabPath]);

  const breadcrumbs = activeFile ? activeFile.path.split('/') : [];

  const deviceWidthClass =
    previewDevice === 'mobile'
      ? 'max-w-[375px]'
      : previewDevice === 'tablet'
      ? 'max-w-[768px]'
      : 'w-full';

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
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/20 ml-1 text-slate-400 hover:text-white"
              >
                {tab.isModified ? (
                  <Circle className="w-2 h-2 fill-white text-white group-hover:hidden" />
                ) : null}
                <X className={`w-3 h-3 ${tab.isModified ? 'hidden group-hover:block' : 'block'}`} />
              </button>
            </div>
          );
        })}

        {isDiffOpen && diffFile && (
          <div
            className={`h-full flex items-center gap-2 px-3 border-r ${themeClasses.border} text-xs ${themeClasses.bgActiveTab} text-sky-400 font-medium border-t-2 border-t-sky-500`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="truncate">Diff: {diffFile.name}</span>
            <button
              onClick={onCloseDiff}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/20 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Tab Bar Right Controls */}
        <div className="ml-auto flex items-center pr-2 gap-1 shrink-0">
          <button
            onClick={onTogglePreview}
            className={`p-1.5 rounded hover:bg-white/10 ${
              isPreviewOpen ? 'text-emerald-400 bg-emerald-500/10' : themeClasses.textSecondary
            } transition-colors`}
            title={isPreviewOpen ? 'Close Live Server Preview' : 'Open Live Server Preview'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar */}
      {activeFile && !isDiffOpen && (
        <div
          id="vscode-breadcrumbs"
          className={`h-6 px-3 flex items-center gap-1 text-[11px] select-none border-b ${themeClasses.border} ${themeClasses.bgTabs} ${themeClasses.textSecondary} shrink-0`}
        >
          {breadcrumbs.map((part, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />}
              <span className={`hover:text-white truncate ${index === breadcrumbs.length - 1 ? 'text-slate-200' : ''}`}>
                {part}
              </span>
            </React.Fragment>
          ))}

          {activeFile.isModified && (
            <span className="ml-2 text-[10px] text-amber-400 font-mono">• Modified</span>
          )}
        </div>
      )}

      {/* Center Main Stage (Editor + Split Preview if active) */}
      <div className="flex-1 min-h-0 relative flex overflow-hidden">
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
        ) : (
          /* Normal Editor Area + Split/Full Live Preview */
          <div className="h-full w-full flex min-h-0">
            {/* Editor Pane */}
            {(!isPreviewOpen || isPreviewSplit) && (
              <div className={`h-full ${isPreviewOpen && isPreviewSplit ? 'w-1/2 border-r ' + themeClasses.border : 'w-full'}`}>
                {activeFile ? (
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
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center p-8 select-none text-center">
                    <Code2 className="w-16 h-16 text-slate-600 mb-4 stroke-1" />
                    <h2 className="text-xl font-bold text-slate-300 mb-2">Clean Workspace</h2>
                    <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                      Create or select a file to start coding. Click "Projects" in the top bar to switch or create projects.
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
                        <div className="font-semibold text-slate-200 mb-1">Live Server Preview</div>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Top Bar Play</kbd>
                      </div>
                      <div className="p-3 bg-white/5 rounded border border-white/10 text-left">
                        <div className="font-semibold text-slate-200 mb-1">Save Project</div>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Ctrl+S</kbd>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VS Code Style Live Server Preview Pane */}
            {isPreviewOpen && (
              <div
                id="vscode-live-preview-pane"
                className={`h-full flex flex-col bg-slate-950 ${
                  isPreviewSplit ? 'w-1/2' : 'w-full'
                }`}
              >
                {/* Live Preview Browser Address Bar */}
                <div className="h-9 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE SERVER: 5500
                    </span>
                    <div className="hidden sm:flex items-center px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono truncate">
                      http://localhost:5500/index.html
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Responsive Device Switcher */}
                    <div className="flex items-center bg-slate-950 rounded p-0.5 border border-slate-800">
                      <button
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1 rounded ${
                          previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Desktop View"
                      >
                        <Monitor className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setPreviewDevice('tablet')}
                        className={`p-1 rounded ${
                          previewDevice === 'tablet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Tablet View"
                      >
                        <Tablet className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1 rounded ${
                          previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Mobile View"
                      >
                        <Smartphone className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Split View Toggle */}
                    <button
                      onClick={() => setIsPreviewSplit(!isPreviewSplit)}
                      className={`p-1.5 rounded hover:bg-white/10 ${
                        isPreviewSplit ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                      }`}
                      title={isPreviewSplit ? 'Maximize Preview' : 'Split Side-by-Side with Editor'}
                    >
                      <SplitSquareVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Reload Button */}
                    <button
                      onClick={() => {
                        if (previewIframeRef.current) {
                          previewIframeRef.current.srcdoc = previewHtml;
                        }
                      }}
                      className="p-1.5 hover:text-white rounded hover:bg-white/10 text-slate-400"
                      title="Reload Live Preview"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Close Preview */}
                    <button
                      onClick={onTogglePreview}
                      className="p-1.5 hover:text-white rounded hover:bg-white/10 text-slate-400"
                      title="Close Preview"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* IFrame Stage */}
                <div className="flex-1 w-full h-full overflow-auto bg-slate-900/60 flex items-center justify-center p-2">
                  <div className={`h-full transition-all duration-200 shadow-2xl rounded-md overflow-hidden bg-white ${deviceWidthClass}`}>
                    <iframe
                      ref={previewIframeRef}
                      srcDoc={previewHtml}
                      title="VS Code Live Preview"
                      sandbox="allow-scripts allow-modals"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
