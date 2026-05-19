const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

const {
  getAllCollaborations,
  getActiveCollaborations,
  getCollaborationDetails,
  createCollaboration,
  updateCollaboration,
  addProductToCollaboration,
  removeProductFromCollaboration,
  deleteCollaboration,
  calculateCollaborationRevenue
} = require('../controllers/collaborationController');

// Public routes
router.get('/collaborations/active', getActiveCollaborations);
router.get('/collaboration/:id', getCollaborationDetails);

// Admin routes
router.get('/admin/collaborations', isAuthenticatedUser, authorizeRoles('admin'), getAllCollaborations);
router.post('/admin/collaboration/new', isAuthenticatedUser, authorizeRoles('admin'), createCollaboration);
router.put('/admin/collaboration/:id', isAuthenticatedUser, authorizeRoles('admin'), updateCollaboration);
router.post('/admin/collaboration/:id/add-product', isAuthenticatedUser, authorizeRoles('admin'), addProductToCollaboration);
router.post('/admin/collaboration/:id/remove-product', isAuthenticatedUser, authorizeRoles('admin'), removeProductFromCollaboration);
router.get('/admin/collaboration/:id/revenue', isAuthenticatedUser, authorizeRoles('admin'), calculateCollaborationRevenue);
router.delete('/admin/collaboration/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteCollaboration);

module.exports = router;
