import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Filter, CheckSquare, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import Pagination from '../components/UI/Pagination';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import TaskCard from '../components/Tasks/TaskCard';
import TaskForm from '../components/Tasks/TaskForm';

/* skeleton card */
function TaskSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800/60 border-l-2 border-l-slate-700 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-800 rounded w-full mb-1" />
      <div className="h-3 bg-slate-800 rounded w-2/3 mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-5 bg-slate-800 rounded-full w-16" />
        <div className="h-5 bg-slate-800 rounded-full w-14" />
      </div>
      <div className="flex justify-between">
        <div className="h-3 bg-slate-800 rounded w-20" />
        <div className="h-3 bg-slate-800 rounded w-14" />
      </div>
    </div>
  );
}

export default function TasksPage() {
  /* ── ALL EXISTING LOGIC UNTOUCHED ── */
  const { isAdmin } = useAuth();
  const [tasks,          setTasks]          = useState([]);
  const [pagination,     setPagination]     = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [overdueFilter,  setOverdueFilter]  = useState(false);
  const [page,           setPage]           = useState(1);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editTask,       setEditTask]       = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleteLoading,  setDeleteLoading]  = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search)         params.search   = search;
      if (statusFilter)   params.status   = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (overdueFilter)  params.overdue  = 'true';
      const res = await api.get('/tasks', { params });
      setTasks(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter, overdueFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/tasks/' + deleteTarget._id);
      toast.success('Task deleted');
      setDeleteTarget(null);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };
  /* ── END EXISTING LOGIC ── */

  const selectCls = 'bg-slate-900 border border-slate-800/60 hover:border-slate-700 text-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all appearance-none';

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="w-full bg-slate-900 border border-slate-800/60 hover:border-slate-700 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Status filter */}
        <select
          className={selectCls + ' w-full sm:w-38'}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Priority filter */}
        <select
          className={selectCls + ' w-full sm:w-38'}
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Overdue toggle */}
        <button
          onClick={() => { setOverdueFilter(!overdueFilter); setPage(1); }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
            overdueFilter
              ? 'bg-red-500/15 text-red-300 border-red-500/30 shadow-sm shadow-red-900/20'
              : 'bg-slate-900 text-slate-400 border-slate-800/60 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <Filter size={14} />
          Overdue
        </button>

        {/* New task */}
        {isAdmin && (
          <button
            onClick={() => { setEditTask(null); setModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl px-4 py-2.5 shadow-lg shadow-primary-900/30 transition-all duration-200 whitespace-nowrap active:scale-[0.98]"
          >
            <Plus size={15} />
            New Task
          </button>
        )}
      </div>

      {/* ── Task grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <TaskSkeleton key={i} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800/60 rounded-2xl">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <CheckSquare size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-300 font-semibold text-base">No tasks found</p>
          <p className="text-slate-500 text-sm mt-1">
            {overdueFilter || statusFilter || priorityFilter || search
              ? 'Try adjusting your filters.'
              : 'Create your first task to get started.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                canEdit={isAdmin}
                canDelete={isAdmin}
                onEdit={(t) => { setEditTask(t); setModalOpen(true); }}
                onDelete={(t) => setDeleteTarget(t)}
              />
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {/* Modals — unchanged */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTask ? 'Edit Task' : 'New Task'} size="lg">
        <TaskForm
          task={editTask}
          onSuccess={() => {
            setModalOpen(false);
            toast.success(editTask ? 'Task updated!' : 'Task created!');
            fetchTasks();
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Task"
        message={'Delete "' + deleteTarget?.title + '"? This action cannot be undone.'}
      />
    </div>
  );
}
