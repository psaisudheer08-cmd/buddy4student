import React from 'react';
import {
  LayoutDashboard,
  Target,
  CalendarDays,
  GraduationCap,
  FolderGit2,
  Award,
  FileText,
  Globe,
  UserCircle,
  Settings,
  LogOut,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  className?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  className = '',
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Study Goals', icon: Target },
    { id: 'study', label: 'Study Sessions', icon: CalendarDays },
    { id: 'skills', label: 'Skills', icon: GraduationCap },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'cv', label: 'CV Builder', icon: FileText },
    { id: 'portfolio', label: 'Portfolio', icon: Globe },
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLogout = async () => {
    if (onCloseMobile) onCloseMobile();
    await logout();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 select-none border-r border-slate-200 dark:border-slate-800 transition-colors duration-150">
      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Student Portal
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all text-left cursor-pointer group ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border-l-4 border-blue-600 dark:border-blue-500 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}

        {/* Theme Switcher */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-colors text-left cursor-pointer group"
            title={isDark ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
          >
            <div className="flex items-center gap-3">
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500 group-hover:-rotate-12 transition-transform" />
              )}
              <span>{isDark ? 'Bright Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {isDark ? 'Dark' : 'Bright'}
            </span>
          </button>
        </div>

        {/* Logout Item */}
        <div className="pt-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400 rounded-xl transition-colors text-left cursor-pointer group"
          >
            <LogOut className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-red-600 dark:group-hover:text-red-400 shrink-0 transition-colors" />
            <span className="truncate">Logout</span>
          </button>
        </div>
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate font-medium">buddy4students Private Space</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar: Occupies full viewport height under header */}
      <aside
        className={`hidden lg:flex fixed top-16 left-0 bottom-0 w-64 flex-col bg-white dark:bg-slate-900 z-30 ${className}`}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl h-full animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
