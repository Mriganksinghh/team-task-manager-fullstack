import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Type, AlignLeft, FolderKanban, User, Activity, Flag, Calendar, Loader2 } from 'lucide-react';
import api from '../../services/api';

/* shared input class */
const inputCls = (hasError) =>
  `w-full bg-slate-800/60 border text-slate-100 rounded-xl px-3.5 py-2.5 text-sm
   placeholder-slate-600 focus:outline-none focus:ring-2 transition-all duration-200
   ${hasError
     ? 'border-red-500/50 focus:ring-red-500/30'
     : 'border-slate-700/60 hover:border-slate-600 focus:ring-primary-500/40 focus:border-primary-500/50'}`;

function FieldLabel({ icon: Icon, children, required }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
      {Icon && <Icon size={11} className="text-slate-500" />}
      {children}
      {required && <span className="text-primary-400 ml-0.5">*</span>}
    </label>
  );
}

export default function TaskForm({ task, projectId, onSuccess, onCancel }) {
  /* ── ALL EXISTING LOGIC UNTOUCHED ── */
  const [members,  setMembers]  = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title:      task?.title      || '',
      description:task?.description|| '',
      project:    task?.project?._id || task?.project || projectId || '',
      assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
      status:     task?.status     || 'todo',
      priority:   task?.priority   || 'medium',
      deadline:   task?.deadline   ? task.deadline.split('T')[0] : '',
    },
  });

  useEffect(() => {
    Promise.all([
      api.get('/users/members'),
      !projectId ? api.get('/projects', { params: { limit: 100 } }) : Promise.resolve(null),
    ]).then(([membersRes, projectsRes]) => {
      setMembers(membersRes.data.data);
      if (projectsRes) setProjects(projectsRes.data.data);
    });
  }, [projectId]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (task) {
        await api.put('/tasks/' + task._id, data);
      } else {
        await api.post('/tasks', data);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  /* ── END EXISTING LOGIC ── */

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Title */}
      <div>
        <FieldLabel icon={Type} required>Task title</FieldLabel>
        <input
          className={inputCls(errors.title)}
          placeholder="e.g. Design landing page hero section"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && (
          <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-400" />
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <FieldLabel icon={AlignLeft}>Description</FieldLabel>
        <textarea
          className={inputCls(false) + ' resize-none'}
          rows={3}
          placeholder="Add more context about this task…"
          {...register('description')}
        />
      </div>

      {/* Project (only when no projectId) */}
      {!projectId && (
        <div>
          <FieldLabel icon={FolderKanban} required>Project</FieldLabel>
          <select
            className={inputCls(errors.project)}
            {...register('project', { required: 'Project is required' })}
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          {errors.project && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-400" />
              {errors.project.message}
            </p>
          )}
        </div>
      )}

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={Activity}>Status</FieldLabel>
          <select className={inputCls(false)} {...register('status')}>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <FieldLabel icon={Flag}>Priority</FieldLabel>
          <select className={inputCls(false)} {...register('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Assign to + Deadline */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={User}>Assign to</FieldLabel>
          <select className={inputCls(false)} {...register('assignedTo')}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel icon={Calendar}>Deadline</FieldLabel>
          <input type="date" className={inputCls(false)} {...register('deadline')} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm rounded-xl py-2.5 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl py-2.5 shadow-lg shadow-primary-900/30 hover:shadow-primary-800/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Saving…' : task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
