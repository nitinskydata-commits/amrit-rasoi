const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderDetails,
  getMyOrders
} = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// User Routes
router.post('/order/new', isAuthenticatedUser, createOrder);
router.get('/orders/me', isAuthenticatedUser, getMyOrders);
router.get('/order/:id', isAuthenticatedUser, getOrderDetails);

module.exports = router;
