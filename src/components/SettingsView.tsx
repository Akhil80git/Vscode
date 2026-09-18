import React from 'react';
import { EditorSettings, Theme } from '../types';
import { Palette, Type, Sliders, Key, Shield, Check } from 'lucide-react';

interface SettingsViewProps {
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  githubToken?: string;
  onSetGitHubToken: (t: string) => void;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  githubToken,
  onSetGitHubToken,
  themeClasses,
}) => {
  const themes: { id: Theme; label: string; previewColor: string }[] = [
    { id: 'vs-dark', label: 'Dark+ (default dark)', previewColor: '#1e1e1e' },
    { id: 'vs-light', label: 'Light+ (default light)', previewColor: '#ffffff' },
    { id: 'github-dark', label: 'GitHub Dark', previewColor: '#0d1117' },
    { id: 'dracula', label: 'Dracula Official', previewColor: '#282a36' },
    { id: 'monokai', label: 'Monokai', previewColor: '#272822' },
    { id: 'one-dark-pro', label: 'One Dark Pro', previewColor: '#282c34' },
  ];

  return (
    <div id="settings-panel" className="h-full flex flex-col select-none overflow-hidden">
      <div className={`p-3 border-b ${themeClasses.border} shrink-0`}>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Settings
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin space-y-5 text-xs">
        {/* Color Theme Section */}
        <div>
          <label className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            <span>Workbench: Color Theme</span>
          </label>
          <div className="space-y-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => onUpdateSettings({ theme: t.id })}
                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between border transition-colors ${
                  settings.theme === t.id
                    ? 'border-blue-500 bg-blue-500/10 text-white font-medium'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: t.previewColor }}
                  />
                  <span>{t.label}</span>
                </div>
                {settings.theme === t.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Editor Font Size */}
        <div>
          <label className="text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>Editor: Font Size ({settings.fontSize}px)</span>
          </label>
          <div className="flex items-center gap-3 mt-1.5">
            <input
              type="range"
              min={11}
              max={22}
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              className="flex-1 accent-blue-500"
            />
            <span className="font-mono text-slate-400 w-8">{settings.fontSize}px</span>
          </div>
        </div>

        {/* Tab Size */}
        <div>
          <label className="text-slate-300 font-semibold mb-1 block">
            Editor: Tab Size
          </label>
          <div className="flex gap-2 mt-1">
            {[2, 4, 8].map((size) => (
              <button
                key={size}
                onClick={() => onUpdateSettings({ tabSize: size })}
                className={`px-3 py-1 rounded border text-xs ${
                  settings.tabSize === size
                    ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {size} spaces
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-slate-300 font-semibold flex items-center gap-1.5 mb-2">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Editor Controls</span>
          </label>

          <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
            <span className="text-slate-300">Minimap</span>
            <input
              type="checkbox"
              checked={settings.minimap}
              onChange={(e) => onUpdateSettings({ minimap: e.target.checked })}
              className="accent-blue-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
            <span className="text-slate-300">Word Wrap</span>
            <input
              type="checkbox"
              checked={settings.wordWrap === 'on'}
              onChange={(e) =>
                onUpdateSettings({ wordWrap: e.target.checked ? 'on' : 'off' })
              }
              className="accent-blue-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
            <span className="text-slate-300">Line Numbers</span>
            <input
              type="checkbox"
              checked={settings.lineNumbers === 'on'}
              onChange={(e) =>
                onUpdateSettings({ lineNumbers: e.target.checked ? 'on' : 'off' })
              }
              className="accent-blue-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
            <span className="text-slate-300">Bracket Pair Colorization</span>
            <input
              type="checkbox"
              checked={settings.bracketPairColorization}
              onChange={(e) =>
                onUpdateSettings({ bracketPairColorization: e.target.checked })
              }
              className="accent-blue-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
            <span className="text-slate-300">Auto Save on Blur</span>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => onUpdateSettings({ autoSave: e.target.checked })}
              className="accent-blue-500 rounded"
            />
          </label>
        </div>

        {/* GitHub Token Config */}
        <div className="pt-2 border-t border-slate-800">
          <label className="text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-sky-400" />
            <span>GitHub Personal Access Token</span>
          </label>
          <input
            type="password"
            placeholder="ghp_..."
            value={githubToken || ''}
            onChange={(e) => onSetGitHubToken(e.target.value)}
            className="w-full mt-1.5 bg-slate-900 text-slate-100 p-2 text-xs rounded border border-slate-700 focus:border-blue-500 outline-none font-mono"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Stored locally in browser session to authenticate GitHub API requests.
          </p>
        </div>
      </div>
    </div>
  );
};
