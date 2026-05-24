/**
 * Task Routes
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getTasks, getTaskById, createTask, updateTask, deleteTask } = require('../controllers/task.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTaskById);

router.post(
  '/',
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  validate,
  createTask
);

router.put('/:id', updateTask); // Members can update status; admin can update all fields
router.delete('/:id', authorize('admin'), deleteTask);

module.exports = router;
