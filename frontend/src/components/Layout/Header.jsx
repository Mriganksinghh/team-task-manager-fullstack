import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const pageMeta = {
  '/dashboard': { title: 'Dashboard',       sub: 'Overview of your workspace' },
  '/projects':  { title: 'Projects',        sub: 'Manage and track your projects' },
  '/tasks':     { title: 'Tasks',           sub: 'All tasks across projects' },
  '/users':     { title: 'User Management', sub: 'Manage team members and roles' },
  '/profile':   { title: 'Profile',         sub: 'Your account settings' },
};

export default function Header({ onMenuClick }) {
  /* ── ALL EXISTING LOGIC UNTOUCHED ── */
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const meta =
    Object.entries(pageMeta).find(([path]) => location.pathname.startsWith(path))?.[1] ||
    { title: 'TaskFlow', sub: '' };
  /* ── END EXISTING LOGIC ── */

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-10">

      {/* Left — hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Page title + breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <span>TaskFlow</span>
          <ChevronRight size={12} />
          <span className="text-slate-300 font-medium">{meta.title}</span>
        </div>
        <h1 className="sm:hidden text-base font-semibold text-white">{meta.title}</h1>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5">

        {/* Notification bell */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* notification dot */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary-500 rounded-full ring-2 ring-slate-900" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-800 mx-1" />

        {/* User avatar + name */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-all group"
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight group-hover:text-white transition-colors">
              {user?.name}
            </p>
            <p className="text-[10px] text-slate-500 capitalize leading-tight">{user?.role}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
