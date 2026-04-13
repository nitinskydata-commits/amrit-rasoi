const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// Import Controllers
const {
  getDashboardStats,
  getAllProductsAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getAllOrdersAdmin,
  updateOrderStatus,
  processRefund,
  deleteOrder,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deleteUser,
  getAllReviews,
  deleteReview,
  getSalesAnalytics,
  updateBrandSettings,
  updateBrandLogo
} = require('../controllers/adminController');

// Dashboard
router.get('/dashboard', isAuthenticatedUser, authorizeRoles('admin'), getDashboardStats);
router.get('/analytics/sales', isAuthenticatedUser, authorizeRoles('admin'), getSalesAnalytics);

// Products Management
router.get('/products', isAuthenticatedUser, authorizeRoles('admin'), getAllProductsAdmin);
router.put('/product/:id', isAuthenticatedUser, authorizeRoles('admin'), updateProductAdmin);
router.delete('/product/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteProductAdmin);

// Orders Management
router.get('/orders', isAuthenticatedUser, authorizeRoles('admin'), getAllOrdersAdmin);
router.put('/order/:id', isAuthenticatedUser, authorizeRoles('admin'), updateOrderStatus);
router.put('/order/:id/refund', isAuthenticatedUser, authorizeRoles('admin'), processRefund);
router.delete('/order/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteOrder);

// Users Management
router.get('/users', isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);
router.get('/user/:id', isAuthenticatedUser, authorizeRoles('admin'), getSingleUser);
router.put('/user/:id', isAuthenticatedUser, authorizeRoles('admin'), updateUserRole);
router.delete('/user/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteUser);

// Reviews Management
router.get('/reviews', isAuthenticatedUser, authorizeRoles('admin'), getAllReviews);
router.delete('/review/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteReview);

// Brand Settings
router.put('/settings/brand', isAuthenticatedUser, authorizeRoles('admin'), updateBrandSettings);
router.put('/settings/logo', isAuthenticatedUser, authorizeRoles('admin'), updateBrandLogo);

module.exports = router;
