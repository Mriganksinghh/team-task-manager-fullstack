import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FolderKanban, AlignLeft, Activity, Calendar, Palette, Users, Loader2 } from 'lucide-react';
import api from '../../services/api';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

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

export default function ProjectForm({ project, onSuccess, onCancel }) {
  /* ── ALL EXISTING LOGIC UNTOUCHED ── */
  const [members,       setMembers]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [selectedColor, setSelectedColor] = useState(project?.color || '#6366f1');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name:        project?.name        || '',
      description: project?.description || '',
      status:      project?.status      || 'active',
      deadline:    project?.deadline    ? project.deadline.split('T')[0] : '',
      members:     project?.members?.map((m) => m._id || m) || [],
    },
  });

  useEffect(() => {
    api.get('/users/members').then((res) => setMembers(res.data.data));
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, color: selectedColor };
      if (project) {
        await api.put('/projects/' + project._id, payload);
      } else {
        await api.post('/projects', payload);
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

      {/* Name */}
      <div>
        <FieldLabel icon={FolderKanban} required>Project name</FieldLabel>
        <input
          className={inputCls(errors.name)}
          placeholder="e.g. Website Redesign"
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-400" />
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <FieldLabel icon={AlignLeft}>Description</FieldLabel>
        <textarea
          className={inputCls(false) + ' resize-none'}
          rows={3}
          placeholder="What is this project about?"
          {...register('description')}
        />
      </div>

      {/* Status + Deadline */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={Activity}>Status</FieldLabel>
          <select className={inputCls(false)} {...register('status')}>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <FieldLabel icon={Calendar}>Deadline</FieldLabel>
          <input type="date" className={inputCls(false)} {...register('deadline')} />
        </div>
      </div>

      {/* Color picker */}
      <div>
        <FieldLabel icon={Palette}>Project color</FieldLabel>
        <div className="flex gap-2.5 flex-wrap p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl">
          {PROJECT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              title={color}
              className="w-7 h-7 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800"
              style={{
                background:  color,
                transform:   selectedColor === color ? 'scale(1.25)' : 'scale(1)',
                boxShadow:   selectedColor === color ? `0 0 0 2px #0f172a, 0 0 0 4px ${color}` : 'none',
              }}
            />
          ))}
        </div>
        {/* preview */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-3 h-3 rounded-full" style={{ background: selectedColor }} />
          <span className="text-xs text-slate-500 font-mono">{selectedColor}</span>
        </div>
      </div>

      {/* Team members */}
      <div>
        <FieldLabel icon={Users}>Team members</FieldLabel>
        <select
          multiple
          className={inputCls(false) + ' h-32'}
          {...register('members')}
        >
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-600 mt-1.5">Hold Ctrl / Cmd to select multiple members</p>
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
          {loading ? 'Saving…' : project ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
