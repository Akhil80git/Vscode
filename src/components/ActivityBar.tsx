import React from 'react';
import {
  Files,
  Search,
  GitBranch,
  Github,
  Blocks,
  Settings,
  User,
} from 'lucide-react';
import { ActiveView } from '../types';

interface ActivityBarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  changesCount: number;
  themeClasses: ReturnType<typeof import('../utils/monacoThemes').getAppThemeClasses>;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onSelectView,
  isSidebarOpen,
  onToggleSidebar,
  changesCount,
  themeClasses,
}) => {
  const topItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'explorer',
      label: 'Explorer (Ctrl+Shift+E)',
      icon: <Files className="w-5 h-5" />,
    },
    {
      id: 'search',
      label: 'Search (Ctrl+Shift+F)',
      icon: <Search className="w-5 h-5" />,
    },
    {
      id: 'git',
      label: 'Source Control (Ctrl+Shift+G)',
      icon: <GitBranch className="w-5 h-5" />,
      badge: changesCount > 0 ? changesCount : undefined,
    },
    {
      id: 'clone',
      label: 'GitHub Repositories & Clone',
      icon: <Github className="w-5 h-5" />,
    },
    {
      id: 'extensions',
      label: 'Extensions (Ctrl+Shift+X)',
      icon: <Blocks className="w-5 h-5" />,
    },
  ];

  const handleClick = (view: ActiveView) => {
    if (activeView === view && isSidebarOpen) {
      onToggleSidebar();
    } else {
      onSelectView(view);
      if (!isSidebarOpen) {
        onToggleSidebar();
      }
    }
  };

  return (
    <div
      id="vscode-activity-bar"
      className={`w-12 shrink-0 flex flex-col justify-between items-center py-2 select-none border-r ${themeClasses.bgActivityBar} ${themeClasses.border} z-20`}
    >
      {/* Top View Icons */}
      <div className="flex flex-col items-center gap-1 w-full">
        {topItems.map((item) => {
          const isActive = activeView === item.id && isSidebarOpen;
          return (
            <button
              key={item.id}
              id={`activity-btn-${item.id}`}
              onClick={() => handleClick(item.id)}
              className={`relative w-full h-11 flex items-center justify-center transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-blue-500 rounded-r" />
              )}
              {item.icon}
              {item.badge !== undefined && (
                <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Icons: Account & Settings */}
      <div className="flex flex-col items-center gap-1 w-full">
        <button
          id="activity-btn-account"
          onClick={() => handleClick('clone')}
          className="w-full h-10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          title="Accounts / GitHub Auth"
        >
          <User className="w-5 h-5" />
        </button>

        <button
          id="activity-btn-settings"
          onClick={() => handleClick('settings')}
          className={`relative w-full h-10 flex items-center justify-center transition-colors ${
            activeView === 'settings' && isSidebarOpen
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Settings (Ctrl+,)"
        >
          {activeView === 'settings' && isSidebarOpen && (
            <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-blue-500 rounded-r" />
          )}
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
