import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  CheckSquare, Clock, AlertCircle, FolderKanban,
  Users, TrendingUp, ArrowUpRight,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import StatusBadge from '../components/UI/StatusBadge';

/* ── unchanged constants ─────────────────────────────────────────────────── */
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };

/* ── upgraded StatCard — same props, new look ────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, sub, trend }) {
  return (
    <div className="group relative bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* glow blob */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl ${color}`} />

      <div className="relative flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color} shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            <ArrowUpRight size={11} />
            {trend}%
          </span>
        )}
      </div>

      <div className="relative mt-4">
        <p className="text-3xl font-bold text-white tracking-tight">{value ?? '—'}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
        {sub && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── section heading helper ──────────────────────────────────────────────── */
function SectionTitle({ children, sub }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-200">{children}</h3>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  /* ── ALL EXISTING LOGIC UNTOUCHED ── */
  const { isAdmin } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data)   return <p className="text-slate-400">Failed to load dashboard.</p>;

  const { taskStats, projectCount, userCount, completionTrend, priorityStats, recentTasks } = data;

  const pieData = [
    { name: 'To Do',       value: taskStats.todo,           color: '#64748b' },
    { name: 'In Progress', value: taskStats['in-progress'], color: '#6366f1' },
    { name: 'Completed',   value: taskStats.completed,      color: '#22c55e' },
  ].filter((d) => d.value > 0);

  const priorityChartData = priorityStats.map((p) => ({
    name:  p._id.charAt(0).toUpperCase() + p._id.slice(1),
    count: p.count,
    fill:  PRIORITY_COLORS[p._id] || '#6b7280',
  }));
  /* ── END EXISTING LOGIC ── */

  const completionPct = taskStats.total
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── Welcome banner ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary-600/20 via-violet-600/10 to-transparent border border-primary-500/20 rounded-2xl px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Good to see you! 👋</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Here's what's happening across your workspace today.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live data
        </div>
      </div>

      {/* ── Primary stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={CheckSquare} label="Total Tasks"  value={taskStats.total}
          color="bg-primary-600"
        />
        <StatCard
          icon={TrendingUp}  label="Completed"    value={taskStats.completed}
          color="bg-emerald-600"
          sub={completionPct + '% completion rate'}
          trend={completionPct}
        />
        <StatCard
          icon={Clock}       label="In Progress"  value={taskStats['in-progress']}
          color="bg-blue-600"
        />
        <StatCard
          icon={AlertCircle} label="Overdue"      value={taskStats.overdue}
          color="bg-red-600"
        />
      </div>

      {/* ── Secondary stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Projects"     value={projectCount}       color="bg-violet-600" />
        {isAdmin && <StatCard icon={Users} label="Team Members" value={userCount}     color="bg-orange-600" />}
        <StatCard icon={CheckSquare}  label="To Do"        value={taskStats.todo}     color="bg-slate-600" />
      </div>

      {/* ── Progress bar ───────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">Overall Progress</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {taskStats.completed} of {taskStats.total} tasks completed
            </p>
          </div>
          <span className="text-2xl font-bold text-white">{completionPct}%</span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: completionPct + '%' }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            To Do: {taskStats.todo}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            In Progress: {taskStats['in-progress']}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Done: {taskStats.completed}
          </span>
          {taskStats.overdue > 0 && (
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Overdue: {taskStats.overdue}
            </span>
          )}
        </div>
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Completion trend — lg:col-span-2 unchanged */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 lg:col-span-2">
          <SectionTitle sub="Tasks marked complete per day">
            Task Completions — Last 7 Days
          </SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={completionTrend}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#475569', fontSize: 11 }}
                tickFormatter={(d) => format(new Date(d), 'MMM d')}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 11 }}
                allowDecimals={false}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#a5b4fc' }}
                labelFormatter={(d) => format(new Date(d), 'MMM d, yyyy')}
                cursor={{ stroke: '#334155', strokeWidth: 1 }}
              />
              <Area
                type="monotone" dataKey="count"
                stroke="#6366f1" fill="url(#colorCount)"
                strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }}
                activeDot={{ r: 5, fill: '#818cf8' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task distribution pie */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
          <SectionTitle sub="By current status">Task Distribution</SectionTitle>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={52} outerRadius={80}
                  paddingAngle={4} dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 12 }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <CheckSquare size={28} className="text-slate-700" />
              <p className="text-slate-500 text-sm">No tasks yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Priority chart + Recent tasks ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Priority bar chart */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
          <SectionTitle sub="Distribution by priority level">Tasks by Priority</SectionTitle>
          {priorityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityChartData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#475569', fontSize: 12 }}
                  allowDecimals={false}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 12 }}
                  itemStyle={{ color: '#94a3b8' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <BarChart size={28} className="text-slate-700" />
              <p className="text-slate-500 text-sm">No data</p>
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 lg:col-span-2">
          <SectionTitle sub="Latest activity in your workspace">Recent Tasks</SectionTitle>
          {recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CheckSquare size={32} className="text-slate-700" />
              <p className="text-slate-500 text-sm font-medium">No tasks yet</p>
              <p className="text-slate-600 text-xs">Create a project and add your first task.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center gap-3 p-3 bg-slate-800/40 hover:bg-slate-800/70 border border-transparent hover:border-slate-700/50 rounded-xl transition-all duration-150 group"
                >
                  {/* project color dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-slate-800"
                    style={{ background: task.project?.color || '#6366f1', ringColor: task.project?.color || '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{task.project?.name}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
