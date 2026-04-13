const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getProducts,
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
router.get('/product/:id', getProductDetails);
router.get('/reviews', getProductReviews);

// User Routes
router.put('/review', isAuthenticatedUser, createProductReview);

// Admin Routes
router.post(
  '/admin/product/new', 
  isAuthenticatedUser, 
  authorizeRoles('admin'), 
  upload.array('images', 5),
  createProduct
);
router.put(
  '/admin/product/:id', 
  isAuthenticatedUser, 
  authorizeRoles('admin'), 
  upload.array('images', 5),
  updateProduct
);
router.delete('/admin/product/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);

module.exports = router;
