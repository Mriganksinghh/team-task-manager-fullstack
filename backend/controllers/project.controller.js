/**
 * Project Controller
 * CRUD operations for projects
 */

const Project = require('../models/Project');
const Task = require('../models/Task');

/**
 * @desc    Get all projects (admin sees all, member sees assigned)
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const query = {};

    // Members only see projects they're part of
    if (req.user.role !== 'admin') {
      query.$or = [{ members: req.user._id }, { createdBy: req.user._id }];
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('createdBy', 'name email avatar')
        .populate('members', 'name email avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(query),
    ]);

    // Attach task counts to each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const counts = { total: 0, todo: 0, 'in-progress': 0, completed: 0 };
        taskCounts.forEach(({ _id, count }) => {
          counts[_id] = count;
          counts.total += count;
        });
        return { ...project.toObject(), taskCounts: counts };
      })
    );

    res.json({
      success: true,
      data: projectsWithCounts,
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
 * @desc    Get single project with tasks
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check access for members
    if (
      req.user.role !== 'admin' &&
      !project.members.some((m) => m._id.toString() === req.user._id.toString()) &&
      project.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a project
 * @route   POST /api/projects
 * @access  Private/Admin
 */
const createProject = async (req, res, next) => {
  try {
    const { name, description, members, deadline, color, status } = req.body;

    const project = await Project.create({
      name,
      description,
      members: members || [],
      deadline,
      color,
      status,
      createdBy: req.user._id,
    });

    await project.populate('createdBy', 'name email avatar');
    await project.populate('members', 'name email avatar role');

    res.status(201).json({ success: true, message: 'Project created.', data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private/Admin
 */
const updateProject = async (req, res, next) => {
  try {
    const { name, description, members, deadline, color, status } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, members, deadline, color, status },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.json({ success: true, message: 'Project updated.', data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a project and its tasks
 * @route   DELETE /api/projects/:id
 * @access  Private/Admin
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Delete all tasks belonging to this project
    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project and its tasks deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };
