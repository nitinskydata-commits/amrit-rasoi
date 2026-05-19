const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderDetails,
  getMyOrders,
  requestReturn
} = require('../controllers/orderController');
const { getOrderInvoice } = require('../controllers/invoiceController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// User Routes
router.post('/order/new', isAuthenticatedUser, createOrder);
router.get('/orders/me', isAuthenticatedUser, getMyOrders);
router.get('/order/:id', isAuthenticatedUser, getOrderDetails);
router.get('/order/:id/invoice', isAuthenticatedUser, getOrderInvoice);
router.post('/order/:id/return', isAuthenticatedUser, requestReturn);

module.exports = router;
