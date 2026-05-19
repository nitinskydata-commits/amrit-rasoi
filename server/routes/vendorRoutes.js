const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { getVendorDashboardStats, getVendorPayoutLedgers } = require('../controllers/vendorController');

// All vendor routes require authentication and vendor/partner owner roles
router.use(isAuthenticatedUser);
router.use(authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin'));

router.get('/dashboard-stats', getVendorDashboardStats);
router.get('/payout-ledgers', getVendorPayoutLedgers);

module.exports = router;
