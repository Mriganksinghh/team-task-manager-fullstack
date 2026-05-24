import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Calendar, Edit2, CheckSquare, Clock, Circle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import StatusBadge from '../components/UI/StatusBadge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import TaskCard from '../components/Tasks/TaskCard';
import TaskForm from '../components/Tasks/TaskForm';
import ProjectForm from '../components/Projects/ProjectForm';

/* ── column config — same keys as before ─────────────────────────────────── */
const COLUMNS = [
  { key: 'todo',        label: 'To Do',       icon: Circle,      accent: 'border-slate-600',   countBg: 'bg-slate-800 text-slate-400' },
  { key: 'in-progress', label: 'In Progress', icon: Clock,       accent: 'border-blue-500/50', countBg: 'bg-blue-500/15 text-blue-300' },
  { key: 'completed',   label: 'Completed',   icon: CheckSquare, accent: 'border-emerald-500/50', countBg: 'bg-emerald-500/15 text-emerald-300' },
];

export default function ProjectDetailPage() {
  /* ── ALL EXISTING LOGIC UNTOUCHED ── */
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { isAdmin } = useAuth();
  const [project,        setProject]        = useState(null);
  const [tasks,          setTasks]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [taskModalOpen,  setTaskModalOpen]  = useState(false);
  const [editTask,       setEditTask]       = useState(null);
  const [editProjectOpen,setEditProjectOpen]= useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleteLoading,  setDeleteLoading]  = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get('/projects/' + id),
        api.get('/tasks', { params: { project: id, limit: 100 } }),
      ]);
      setProject(projectRes.data.data);
      setTasks(tasksRes.data.data);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteTask = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/tasks/' + deleteTarget._id);
      toast.success('Task deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key);
    return acc;
  }, {});
  /* ── END EXISTING LOGIC ── */

  const completedPct = tasks.length
    ? Math.round((tasksByStatus['completed'].length / tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ── Project header ───────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 overflow-hidden relative">
        {/* color accent top bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: project.color }} />
        {/* glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-5 blur-3xl" style={{ background: project.color }} />

        <div className="relative flex items-start gap-4">
          {/* back button */}
          <button
            onClick={() => navigate('/projects')}
            className="mt-1 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex-shrink-0"
          >
            <ArrowLeft size={17} />
          </button>

          {/* project info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: project.color + '20', border: `1px solid ${project.color}40` }}
              >
                <span style={{ color: project.color }} className="text-base font-bold">
                  {project.name.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{project.name}</h2>
              <StatusBadge status={project.status} />
            </div>

            {project.description && (
              <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-2xl">
                {project.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-lg">
                <Users size={11} />
                {project.members?.length} members
              </span>
              {project.deadline && (
                <span className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-lg">
                  <Calendar size={11} />
                  Due {format(new Date(project.deadline), 'MMM d, yyyy')}
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-lg">
                <CheckSquare size={11} />
                {tasks.length} tasks
              </span>
            </div>

            {/* progress bar */}
            {tasks.length > 0 && (
              <div className="mt-4 max-w-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-300">{completedPct}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: completedPct + '%', background: project.color }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* action buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={() => setEditProjectOpen(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium rounded-xl px-3.5 py-2 transition-all"
              >
                <Edit2 size={14} /> Edit
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => { setEditTask(null); setTaskModalOpen(true); }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl px-3.5 py-2 shadow-lg shadow-primary-900/30 transition-all active:scale-[0.98]"
              >
                <Plus size={14} /> Add Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Kanban board ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const ColIcon = col.icon;
          const colTasks = tasksByStatus[col.key] || [];
          return (
            <div
              key={col.key}
              className={`bg-slate-900/60 border border-slate-800/60 border-t-2 ${col.accent} rounded-2xl p-4`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ColIcon size={14} className="text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-200">{col.label}</h3>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.countBg}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 border-2 border-dashed border-slate-800 rounded-xl">
                    <ColIcon size={20} className="text-slate-700" />
                    <p className="text-xs text-slate-600">No tasks here</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      canEdit={isAdmin}
                      canDelete={isAdmin}
                      onEdit={(t) => { setEditTask(t); setTaskModalOpen(true); }}
                      onDelete={(t) => setDeleteTarget(t)}
                    />
                  ))
                )}
              </div>

              {/* Add task shortcut */}
              {isAdmin && (
                <button
                  onClick={() => { setEditTask(null); setTaskModalOpen(true); }}
                  className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 border border-dashed border-slate-800 hover:border-slate-700 transition-all"
                >
                  <Plus size={12} /> Add task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals — unchanged */}
      <Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title={editTask ? 'Edit Task' : 'New Task'} size="lg">
        <TaskForm
          task={editTask}
          projectId={id}
          onSuccess={() => {
            setTaskModalOpen(false);
            toast.success(editTask ? 'Task updated!' : 'Task created!');
            fetchData();
          }}
          onCancel={() => setTaskModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={editProjectOpen} onClose={() => setEditProjectOpen(false)} title="Edit Project" size="lg">
        <ProjectForm
          project={project}
          onSuccess={() => {
            setEditProjectOpen(false);
            toast.success('Project updated!');
            fetchData();
          }}
          onCancel={() => setEditProjectOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTask}
        loading={deleteLoading}
        title="Delete Task"
        message={'Delete "' + deleteTarget?.title + '"? This action cannot be undone.'}
      />
    </div>
  );
}
