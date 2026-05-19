const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { requirePermissions } = require('../middleware/enterpriseAccess');

const {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  setOrganizationStatus,
  getOrganizationAnalytics,
  deleteOrganization
} = require('../controllers/organizationController');

// All organization routes require authentication
router.use(isAuthenticatedUser);

// Platform admins can manage all organizations
// Org owners can view/edit their own
router.get(
  '/',
  authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'franchise_manager', 'regional_manager'),
  getAllOrganizations
);

router.post(
  '/',
  authorizeRoles('admin', 'platform_admin'),
  createOrganization
);

router.get(
  '/:id',
  authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'franchise_manager', 'regional_manager'),
  getOrganizationById
);

router.put(
  '/:id',
  authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'franchise_manager'),
  updateOrganization
);

router.put(
  '/:id/status',
  authorizeRoles('admin', 'platform_admin'),
  setOrganizationStatus
);

router.get(
  '/:id/analytics',
  authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'franchise_manager'),
  getOrganizationAnalytics
);

router.delete(
  '/:id',
  authorizeRoles('admin', 'platform_admin'),
  deleteOrganization
);

module.exports = router;
