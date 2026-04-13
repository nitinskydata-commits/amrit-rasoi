const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderDetails,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// User Routes
router.post('/order/new', isAuthenticatedUser, createOrder);
router.get('/orders/me', isAuthenticatedUser, getMyOrders);
router.get('/order/:id', isAuthenticatedUser, getOrderDetails);

// Admin Routes
router.get('/admin/orders', isAuthenticatedUser, authorizeRoles('admin'), getAllOrders);
router.put('/admin/order/:id', isAuthenticatedUser, authorizeRoles('admin'), updateOrderStatus);
router.delete('/admin/order/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteOrder);

module.exports = router;
