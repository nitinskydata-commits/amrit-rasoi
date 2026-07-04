const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

const {
  getSettings,
  updateSettings,
  changeAdminPassword
} = require('../controllers/settingsController');

// Public routes
router.get('/settings', getSettings);

// Admin routes (Moved to adminRoutes.js)

module.exports = router;
