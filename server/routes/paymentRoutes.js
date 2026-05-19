const express = require('express');
const router = express.Router();
const {
  processStripePayment,
  createRazorpayOrder,
  verifyRazorpaySignature
} = require('../controllers/paymentController');
const { isAuthenticatedUser } = require('../middleware/auth');

router.post('/payment/process', isAuthenticatedUser, processStripePayment);
router.post('/payment/razorpay/order', isAuthenticatedUser, createRazorpayOrder);
router.post('/payment/razorpay/verify', isAuthenticatedUser, verifyRazorpaySignature);

module.exports = router;
