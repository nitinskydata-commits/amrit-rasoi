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
  setDefaultAddress
} = require('../controllers/authController');
const { isAuthenticatedUser } = require('../middleware/auth');

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/otp/send', sendOTP);
router.post('/otp/verify', verifyOTP);

// Protected Routes
router.get('/me', isAuthenticatedUser, getUserProfile);
router.put('/me/update', isAuthenticatedUser, updateProfile);

// Address Routes
router.get('/addresses', isAuthenticatedUser, getAddresses);
router.post('/addresses', isAuthenticatedUser, addAddress);
router.put('/addresses/:id', isAuthenticatedUser, updateAddress);
router.delete('/addresses/:id', isAuthenticatedUser, deleteAddress);
router.put('/addresses/:id/default', isAuthenticatedUser, setDefaultAddress);

module.exports = router;
