const express = require('express');
const router = express.Router();
const {
  submitKYC,
  getKYCDetails,
  reviewKYC
} = require('../controllers/kycController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.route('/kyc')
  .post(isAuthenticatedUser, submitKYC)
  .get(isAuthenticatedUser, getKYCDetails);

router.route('/admin/kyc/:orgId/review')
  .put(isAuthenticatedUser, authorizeRoles('admin', 'platform_admin'), reviewKYC);

module.exports = router;
