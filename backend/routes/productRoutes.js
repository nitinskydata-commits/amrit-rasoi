const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getProducts,
  getSearchSuggestions,
  getProductDetails,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductReviews
} = require('../controllers/productController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// Public Routes
router.get('/products', getProducts);
router.get('/products/suggestions', getSearchSuggestions);
router.get('/product/:id', getProductDetails);
router.get('/reviews', getProductReviews);

// User Routes
router.put('/review', isAuthenticatedUser, createProductReview);

// Admin Routes (Moved to adminRoutes.js)

module.exports = router;
