const Order = require('../models/Order');
const { eventBus, EVENTS } = require('../utils/eventBus');

// Process Card Payment (Stripe Mock)
// Route: POST /api/v1/payment/process
exports.processStripePayment = async (req, res) => {
  try {
    const { amount, paymentMethodId } = req.body;

    // Simulate standard Stripe gateway latency & approval response
    const clientSecret = `pi_mock_${Math.random().toString(36).substring(2, 15)}`;
    const chargeId = `ch_mock_${Math.random().toString(36).substring(2, 15)}`;

    res.status(200).json({
      success: true,
      clientSecret,
      chargeId,
      status: 'succeeded'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create Razorpay Order (Razorpay Mock)
// Route: POST /api/v1/payment/razorpay/order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const razorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 15)}`;

    res.status(200).json({
      success: true,
      id: razorpayOrderId,
      amount: amount * 100, // in paise
      currency: 'INR'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Razorpay Checksum Signature (Razorpay Verification Mock)
// Route: POST /api/v1/payment/razorpay/verify
exports.verifyRazorpaySignature = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // In a real application, we would check signature validity using crypto
    // For this simulation, we check presence of ids and approve
    if (!razorpay_payment_id || !razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment references'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
