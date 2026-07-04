const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

const {
  getAllAdsAdmin,
  getActiveAdsByPosition,
  getAdDetails,
  createAd,
  updateAd,
  deleteAd,
  toggleAdStatus,
  trackAdClick,
  trackAdImpression,
  getAdAnalytics
} = require('../controllers/advertisementController');

const upload = require('../middleware/upload');

// Public routes
router.get('/ads/:position', getActiveAdsByPosition);
router.post('/ad/:id/click', trackAdClick);
router.post('/ad/:id/impression', trackAdImpression);

// Admin routes
router.get('/admin/ads', isAuthenticatedUser, authorizeRoles('admin'), getAllAdsAdmin);
router.get('/admin/ad/:id', isAuthenticatedUser, authorizeRoles('admin'), getAdDetails);
router.post('/admin/ad/new', isAuthenticatedUser, authorizeRoles('admin'), upload.single('image'), createAd);
router.put('/admin/ad/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.single('image'), updateAd);
router.put('/admin/ad/:id/toggle', isAuthenticatedUser, authorizeRoles('admin'), toggleAdStatus);
router.get('/admin/ad/:id/analytics', isAuthenticatedUser, authorizeRoles('admin'), getAdAnalytics);
router.delete('/admin/ad/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteAd);

module.exports = router;
