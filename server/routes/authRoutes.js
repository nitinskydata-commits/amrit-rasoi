const express = require('express');
const router = express.Router();
const {
  register,
  login,
  sendOTP,
  verifyOTP,
  getUserProfile,
  updateProfile,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  registerDeliveryBoy,
  registerSeller,
  getSellerStatus,
  submitPaymentGateway,
  registerWholesale
} = require('../controllers/authController');
const { isAuthenticatedUser } = require('../middleware/auth');

// Public Routes
router.post('/register', register);
router.post('/register/delivery-boy', registerDeliveryBoy);
router.post('/register/seller', registerSeller);
router.post('/register/wholesale', registerWholesale);
router.post('/login', login);
router.get('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});
router.post('/otp/send', sendOTP);
router.post('/otp/verify', verifyOTP);

// Protected Routes
router.get('/me', isAuthenticatedUser, getUserProfile);
router.put('/me/update', isAuthenticatedUser, updateProfile);
router.get('/seller/status', isAuthenticatedUser, getSellerStatus);
router.post('/seller/payment-setup', isAuthenticatedUser, submitPaymentGateway);

// Address Routes (support both plural and singular routes)
router.get('/addresses', isAuthenticatedUser, getAddresses);
router.post('/addresses', isAuthenticatedUser, addAddress);
router.put('/addresses/:id', isAuthenticatedUser, updateAddress);
router.delete('/addresses/:id', isAuthenticatedUser, deleteAddress);
router.put('/addresses/:id/default', isAuthenticatedUser, setDefaultAddress);

router.get('/address', isAuthenticatedUser, getAddresses);
router.post('/address', isAuthenticatedUser, addAddress);
router.put('/address/:id', isAuthenticatedUser, updateAddress);
router.delete('/address/:id', isAuthenticatedUser, deleteAddress);
router.put('/address/:id/default', isAuthenticatedUser, setDefaultAddress);

module.exports = router;

