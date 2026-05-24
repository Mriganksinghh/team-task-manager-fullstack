/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/stats', getStats);

module.exports = router;
