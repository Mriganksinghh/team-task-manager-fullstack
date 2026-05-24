/**
 * Project Routes
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/project.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.use(protect);

router.get('/', getProjects);
router.get('/:id', getProjectById);

router.post(
  '/',
  authorize('admin'),
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  validate,
  createProject
);

router.put('/:id', authorize('admin'), updateProject);
router.delete('/:id', authorize('admin'), deleteProject);

module.exports = router;
