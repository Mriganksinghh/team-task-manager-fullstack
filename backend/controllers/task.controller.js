/**
 * Task Controller
 * CRUD operations for tasks
 */

const Task = require('../models/Task');
const Project = require('../models/Project');

/**
 * @desc    Get tasks (with filters, search, pagination)
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      project,
      status,
      priority,
      assignedTo,
      search,
      overdue,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Members only see tasks assigned to them or in their projects
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({
        $or: [{ members: req.user._id }, { createdBy: req.user._id }],
      }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      query.$or = [{ assignedTo: req.user._id }, { project: { $in: projectIds } }];
    }

    if (project) query.project = project;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Filter overdue tasks
    if (overdue === 'true') {
      query.deadline = { $lt: new Date() };
      query.status = { $ne: 'completed' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('project', 'name color')
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name color members')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a task
 * @route   POST /api/tasks
 * @access  Private/Admin
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignedTo, status, priority, deadline, tags } = req.body;

    // Verify project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      status: status || 'todo',
      priority: priority || 'medium',
      deadline: deadline || null,
      tags: tags || [],
      createdBy: req.user._id,
    });

    await task.populate('project', 'name color');
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ success: true, message: 'Task created.', data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Members can only update status of tasks assigned to them
    if (req.user.role !== 'admin') {
      const allowedFields = ['status'];
      const requestedFields = Object.keys(req.body);
      const hasDisallowedFields = requestedFields.some((f) => !allowedFields.includes(f));

      if (hasDisallowedFields) {
        return res.status(403).json({
          success: false,
          message: 'Members can only update task status.',
        });
      }

      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you.',
        });
      }
    }

    const { title, description, assignedTo, status, priority, deadline, tags } = req.body;

    // Apply updates
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (tags !== undefined) task.tags = tags;

    await task.save();

    await task.populate('project', 'name color');
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email');

    res.json({ success: true, message: 'Task updated.', data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private/Admin
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
