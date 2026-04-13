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
router.get('/settings', getSettings);  // ✅ CHANGED from '/' to '/settings'

// Admin routes
router.put(
  '/admin/settings',  // ✅ CHANGED from '/' to '/admin/settings'
  isAuthenticatedUser, 
  authorizeRoles('admin'), 
  upload.single('logo'),
  updateSettings
);

router.put(
  '/settings/change-password',  // ✅ CHANGED from '/change-password' to '/settings/change-password'
  isAuthenticatedUser,
  authorizeRoles('admin'),
  changeAdminPassword
);

module.exports = router;
