import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Users, LogOut, X, Zap, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-primary-400' },
  { to: '/projects',  icon: FolderKanban,    label: 'Projects',  color: 'text-violet-400' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tasks',     color: 'text-emerald-400' },
  { to: '/users',     icon: Users,           label: 'Users',     color: 'text-amber-400', adminOnly: true },
];

export default function Sidebar({ open, onClose }) {
  /* ── ALL EXISTING LOGIC UNTOUCHED ── */
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => !item.adminOnly || isAdmin);
  /* ── END EXISTING LOGIC ── */

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 w-64 flex flex-col
        bg-slate-900 border-r border-slate-800/60
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-900/40">
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">TaskFlow</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
          Menu
        </p>
        {filteredNav.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/15 text-white border border-primary-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-primary-400' : color + ' opacity-70 group-hover:opacity-100'}`}>
                  <Icon size={17} />
                </span>
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight size={13} className="text-primary-400 opacity-60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User section ─────────────────────────────────────────────────── */}
      <div className="border-t border-slate-800/60 p-3 flex-shrink-0">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mb-1 group ${
              isActive ? 'bg-slate-800' : 'hover:bg-slate-800/70'
            }`
          }
        >
          {/* Avatar with gradient ring */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize leading-tight mt-0.5">{user?.role}</p>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-400/8 transition-all duration-200 group"
        >
          <LogOut size={16} className="group-hover:rotate-12 transition-transform duration-200" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
