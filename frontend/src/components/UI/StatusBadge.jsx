import React from 'react';

/* dot colors per status */
const statusConfig = {
  /* Task statuses */
  todo:          { label: 'To Do',       className: 'bg-slate-700/80 text-slate-300 border border-slate-600/40',                        dot: 'bg-slate-400' },
  'in-progress': { label: 'In Progress', className: 'bg-blue-500/15 text-blue-300 border border-blue-500/25',                           dot: 'bg-blue-400 animate-pulse' },
  completed:     { label: 'Completed',   className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',                  dot: 'bg-emerald-400' },
  /* Priority */
  low:           { label: 'Low',         className: 'bg-slate-700/80 text-slate-400 border border-slate-600/40',                        dot: 'bg-slate-400' },
  medium:        { label: 'Medium',      className: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',                        dot: 'bg-amber-400' },
  high:          { label: 'High',        className: 'bg-red-500/15 text-red-300 border border-red-500/25',                              dot: 'bg-red-400' },
  /* Project statuses */
  active:        { label: 'Active',      className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',                  dot: 'bg-emerald-400' },
  'on-hold':     { label: 'On Hold',     className: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',                        dot: 'bg-amber-400' },
  archived:      { label: 'Archived',    className: 'bg-slate-700/80 text-slate-500 border border-slate-600/40',                        dot: 'bg-slate-500' },
  /* Roles */
  admin:         { label: 'Admin',       className: 'bg-primary-500/15 text-primary-300 border border-primary-500/25',                  dot: 'bg-primary-400' },
  member:        { label: 'Member',      className: 'bg-slate-700/80 text-slate-300 border border-slate-600/40',                        dot: 'bg-slate-400' },
  /* Overdue */
  overdue:       { label: 'Overdue',     className: 'bg-red-500/15 text-red-300 border border-red-500/25',                              dot: 'bg-red-400 animate-pulse' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-slate-700/80 text-slate-300 border border-slate-600/40',
    dot: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
}
