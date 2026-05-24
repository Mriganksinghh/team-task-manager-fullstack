import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Edit2, Trash2, Users, CheckSquare, Calendar, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import StatusBadge from '../components/UI/StatusBadge';
import Pagination from '../components/UI/Pagination';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ProjectForm from '../components/Projects/ProjectForm';

/* skeleton card */
function ProjectSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 animate-pulse">
      <div className="h-1 w-full bg-slate-800 rounded-full mb-4" />
      <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-800 rounded w-full mb-1" />
      <div className="h-3 bg-slate-800 rounded w-2/3 mb-4" />
      <div className="flex gap-2">
        <div className="h-3 bg-slate-800 rounded w-16" />
        <div className="h-3 bg-slate-800 rounded w-16" />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  /* ── ALL EXISTING LOGIC UNTOUCHED ── */
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();
  const [projects,      setProjects]      = useState([]);
  const [pagination,    setPagination]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [page,          setPage]          = useState(1);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editProject,   setEditProject]   = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/projects', { params });
      setProjects(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/projects/' + deleteTarget._id);
      toast.success('Project deleted');
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to delete project');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreate = () => { setEditProject(null); setModalOpen(true); };
  const openEdit   = (e, p) => { e.stopPropagation(); setEditProject(p); setModalOpen(true); };
  /* ── END EXISTING LOGIC ── */

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="w-full bg-slate-900 border border-slate-800/60 hover:border-slate-700 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            className="bg-slate-900 border border-slate-800/60 hover:border-slate-700 text-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all appearance-none w-full sm:w-44"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl px-4 py-2.5 shadow-lg shadow-primary-900/30 transition-all duration-200 whitespace-nowrap active:scale-[0.98]"
          >
            <Plus size={15} />
            New Project
          </button>
        )}
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800/60 rounded-2xl">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <FolderKanban size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-300 font-semibold text-base">No projects found</p>
          <p className="text-slate-500 text-sm mt-1 text-center max-w-xs">
            {isAdmin
              ? 'Create your first project to start organising your team\'s work.'
              : 'You haven\'t been added to any projects yet.'}
          </p>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="mt-5 flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-all"
            >
              <Plus size={14} /> Create project
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate('/projects/' + project._id)}
                className="group relative bg-slate-900 border border-slate-800/60 rounded-2xl p-5 cursor-pointer hover:border-slate-700 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              >
                {/* color accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: project.color }}
                />
                {/* subtle color glow */}
                <div
                  className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-5 blur-2xl"
                  style={{ background: project.color }}
                />

                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                      style={{ background: project.color + '25', border: `1px solid ${project.color}40` }}
                    >
                      <FolderKanban size={14} style={{ color: project.color }} />
                    </div>
                    <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors line-clamp-1 text-sm">
                      {project.name}
                    </h3>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {project.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 rounded-lg">
                    <CheckSquare size={11} className="text-slate-400" />
                    {project.taskCounts?.total || 0} tasks
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 rounded-lg">
                    <Users size={11} className="text-slate-400" />
                    {project.members?.length || 0}
                  </span>
                  {project.deadline && (
                    <span className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 rounded-lg">
                      <Calendar size={11} className="text-slate-400" />
                      {format(new Date(project.deadline), 'MMM d')}
                    </span>
                  )}
                </div>

                {/* Task progress bar */}
                {project.taskCounts?.total > 0 && (
                  <div className="mb-4">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: Math.round((project.taskCounts.completed / project.taskCounts.total) * 100) + '%',
                          background: project.color,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {project.taskCounts.completed}/{project.taskCounts.total} completed
                    </p>
                  </div>
                )}

                {/* Footer — avatars + actions */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 4).map((m) => (
                      <div
                        key={m._id}
                        title={m.name}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                      >
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {project.members?.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-300 font-medium">
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEdit(e, project)}
                        title="Edit project"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                        title="Delete project"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {/* Modals — unchanged */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProject ? 'Edit Project' : 'New Project'} size="lg">
        <ProjectForm
          project={editProject}
          onSuccess={() => {
            setModalOpen(false);
            toast.success(editProject ? 'Project updated!' : 'Project created!');
            fetchProjects();
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Project"
        message={'Delete "' + deleteTarget?.name + '"? This will also delete all its tasks. This action cannot be undone.'}
      />
    </div>
  );
}
