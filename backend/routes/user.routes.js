/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, getMembers } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Available to all authenticated users (for dropdowns)
router.get('/members', getMembers);

// Admin-only routes
router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
