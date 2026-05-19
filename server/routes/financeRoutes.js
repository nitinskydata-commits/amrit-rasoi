const express = require('express');
const router = express.Router();

const {
  getTransactions,
  getPayouts,
  updateBankDetails,
  requestPayout,
  processPayout
} = require('../controllers/financeController');

const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// Secure all endpoints with authentication
router.use(isAuthenticatedUser);

router.get('/transactions', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'finance_staff'), getTransactions);
router.get('/payouts', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'finance_staff'), getPayouts);
router.put('/bank-details', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin'), updateBankDetails);
router.post('/payouts/request', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin'), requestPayout);
router.post('/payouts/:id/process', authorizeRoles('admin', 'platform_admin', 'finance_staff'), processPayout);

module.exports = router;
