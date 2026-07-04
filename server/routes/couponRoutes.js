const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

const {
  getAllCoupons,
  getCoupon,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getActiveCoupons
} = require('../controllers/couponController');

// Public routes
router.post('/coupon/validate', validateCoupon);
router.get('/coupons', getActiveCoupons);

// Admin routes
router.get('/admin/coupons', isAuthenticatedUser, authorizeRoles('admin'), getAllCoupons);
router.get('/admin/coupon/:id', isAuthenticatedUser, authorizeRoles('admin'), getCoupon);
router.post('/admin/coupon/new', isAuthenticatedUser, authorizeRoles('admin'), createCoupon);
router.put('/admin/coupon/:id', isAuthenticatedUser, authorizeRoles('admin'), updateCoupon);
router.delete('/admin/coupon/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteCoupon);

module.exports = router;
