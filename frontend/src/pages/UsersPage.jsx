import React, { useEffect, useState, useCallback } from 'react';
import { Search, UserCheck, UserX, Shield, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/UI/StatusBadge';
import Pagination from '../components/UI/Pagination';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ConfirmDialog from '../components/UI/ConfirmDialog';

/* avatar gradient by index */
const AVATAR_GRADIENTS = [
  'from-primary-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-cyan-600',
];

function UserRowSkeleton() {
  return (
    <tr className="border-b border-slate-800/60">
      {[1,2,3,4,5].map((i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-slate-800 rounded animate-pulse" style={{ width: i === 1 ? '60%' : '40%' }} />
        </td>
      ))}
    </tr>
  );
}

export default function UsersPage() {
  /* ── ALL EXISTING LOGIC UNTOUCHED ── */
  const { user: currentUser } = useAuth();
  const [users,         setUsers]         = useState([]);
  const [pagination,    setPagination]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [roleFilter,    setRoleFilter]    = useState('');
  const [page,          setPage]          = useState(1);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const res = await api.get('/users', { params });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleRole = async (user) => {
    try {
      const newRole = user.role === 'admin' ? 'member' : 'admin';
      await api.put('/users/' + user._id, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.put('/users/' + user._id, { isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/users/' + deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };
  /* ── END EXISTING LOGIC ── */

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="w-full bg-slate-900 border border-slate-800/60 hover:border-slate-700 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="bg-slate-900 border border-slate-800/60 hover:border-slate-700 text-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all appearance-none w-full sm:w-40"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/80">
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-5 py-3.5">
                  User
                </th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-5 py-3.5">
                  Role
                </th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-5 py-3.5">
                  Status
                </th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-5 py-3.5">
                  Joined
                </th>
                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-5 py-3.5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <UserRowSkeleton key={i} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center">
                        <Users size={24} className="text-slate-600" />
                      </div>
                      <p className="text-slate-400 font-medium">No users found</p>
                      <p className="text-slate-600 text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* User cell */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md`}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                            {user.name}
                            {user._id === currentUser._id && (
                              <span className="text-[10px] font-medium text-primary-400 bg-primary-400/10 border border-primary-400/20 px-1.5 py-0.5 rounded-full">
                                you
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.role} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        user.isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                          : 'bg-slate-700/80 text-slate-400 border-slate-600/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user._id !== currentUser._id && (
                          <>
                            <button
                              onClick={() => toggleRole(user)}
                              title={user.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-400/10 transition-all"
                            >
                              <Shield size={14} />
                            </button>
                            <button
                              onClick={() => toggleActive(user)}
                              title={user.isActive ? 'Deactivate user' : 'Activate user'}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-all"
                            >
                              {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(user)}
                              title="Delete user"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination inside card */}
        {!loading && users.length > 0 && (
          <div className="px-5 pb-4">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete User"
        message={'Delete user "' + deleteTarget?.name + '"? This action cannot be undone.'}
      />
    </div>
  );
}
