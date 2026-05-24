import React from 'react';
import { Calendar, User, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { format, isPast } from 'date-fns';
import StatusBadge from '../UI/StatusBadge';

export default function TaskCard({ task, onEdit, onDelete, canEdit, canDelete }) {
  /* ── ALL EXISTING LOGIC UNTOUCHED ── */
  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== 'completed';
  /* ── END EXISTING LOGIC ── */

  /* priority left-border color */
  const priorityBorder = {
    high:   'border-l-red-500',
    medium: 'border-l-amber-500',
    low:    'border-l-slate-600',
  }[task.priority] || 'border-l-slate-700';

  return (
    <div
      className={`
        group relative bg-slate-900 border border-slate-800/60 border-l-2 ${priorityBorder}
        rounded-xl p-4 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20
        hover:-translate-y-0.5 transition-all duration-200
      `}
    >
      {/* overdue warning strip */}
      {isOverdue && (
        <div className="absolute top-0 right-0 flex items-center gap-1 bg-red-500/10 border-b border-l border-red-500/20 text-red-400 text-[10px] font-medium px-2 py-0.5 rounded-bl-lg rounded-tr-xl">
          <AlertTriangle size={9} />
          Overdue
        </div>
      )}

      {/* Title + action buttons */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-slate-100 text-sm line-clamp-2 flex-1 leading-snug">
          {task.title}
        </h4>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
          {canEdit && (
            <button
              onClick={() => onEdit(task)}
              title="Edit task"
              className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
            >
              <Edit2 size={12} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(task)}
              title="Delete task"
              className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <StatusBadge status={task.status} />
        <StatusBadge status={task.priority} />
      </div>

      {/* Footer — assignee + deadline */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          {task.assignedTo ? (
            <>
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {task.assignedTo.name?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[90px] text-slate-400">{task.assignedTo.name}</span>
            </>
          ) : (
            <span className="flex items-center gap-1 text-slate-600">
              <User size={11} />
              Unassigned
            </span>
          )}
        </div>

        {task.deadline && (
          <div className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
            <Calendar size={11} />
            {format(new Date(task.deadline), 'MMM d')}
          </div>
        )}
      </div>

      {/* Project tag */}
      {task.project && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: task.project.color || '#6366f1' }}
          />
          <span className="text-[11px] text-slate-500 truncate">{task.project.name}</span>
        </div>
      )}
    </div>
  );
}
