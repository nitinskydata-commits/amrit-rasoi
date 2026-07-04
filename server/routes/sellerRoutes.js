const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, isApprovedSeller } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  getSellerDashboard,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerOrders,
  updateSellerOrderItemStatus,
  getSellerEarnings,
  getSellerProfile,
  updateSellerProfile
} = require('../controllers/sellerController');

// All seller routes are protected and require the seller to be logged in and approved
router.use(isAuthenticatedUser);
router.use(isApprovedSeller);

// Dashboard stats
router.get('/dashboard', getSellerDashboard);

// Products scoped to seller
router.get('/products', getSellerProducts);
router.post('/product/new', upload.any(), createSellerProduct);
router.put('/product/:id', upload.any(), updateSellerProduct);
router.delete('/product/:id', deleteSellerProduct);

// Orders scoped to seller's items
router.get('/orders', getSellerOrders);
router.put('/order/:id/item-status', updateSellerOrderItemStatus);

// Earnings and payout details
router.get('/earnings', getSellerEarnings);

// Seller shop profile
router.get('/profile', getSellerProfile);
router.put('/profile', updateSellerProfile);

module.exports = router;
