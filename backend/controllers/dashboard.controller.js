/**
 * Dashboard Controller
 * Aggregated stats for the dashboard
 */

const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const now = new Date();

    let taskQuery = {};
    let projectQuery = {};

    if (!isAdmin) {
      // Members see only their assigned tasks and their projects
      taskQuery.assignedTo = req.user._id;
      projectQuery.$or = [{ members: req.user._id }, { createdBy: req.user._id }];
    }

    // ── Task stats ────────────────────────────────────────────────────────────
    const [taskStats, overdueCount, projectCount, userCount] = await Promise.all([
      Task.aggregate([
        { $match: taskQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Task.countDocuments({
        ...taskQuery,
        deadline: { $lt: now },
        status: { $ne: 'completed' },
      }),
      Project.countDocuments(projectQuery),
      isAdmin ? User.countDocuments({ isActive: true }) : Promise.resolve(null),
    ]);

    // Normalize task stats
    const stats = { total: 0, todo: 0, 'in-progress': 0, completed: 0, overdue: overdueCount };
    taskStats.forEach(({ _id, count }) => {
      stats[_id] = count;
      stats.total += count;
    });

    // ── Task completion trend (last 7 days) ───────────────────────────────────
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const completionTrend = await Task.aggregate([
      {
        $match: {
          ...taskQuery,
          completedAt: { $gte: sevenDaysAgo },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0
    const trendMap = {};
    completionTrend.forEach(({ _id, count }) => (trendMap[_id] = count));
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trend.push({ date: key, count: trendMap[key] || 0 });
    }

    // ── Tasks by priority ─────────────────────────────────────────────────────
    const priorityStats = await Task.aggregate([
      { $match: taskQuery },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // ── Recent tasks ──────────────────────────────────────────────────────────
    const recentTasks = await Task.find(taskQuery)
      .populate('project', 'name color')
      .populate('assignedTo', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        taskStats: stats,
        projectCount,
        userCount,
        completionTrend: trend,
        priorityStats,
        recentTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
