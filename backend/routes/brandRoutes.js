const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

const {
  getAllBrands,
  getAllBrandsAdmin,
  getBrandDetails,
  createBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/brandController');

// Public routes
router.get('/brands', getAllBrands);
router.get('/brand/:id', getBrandDetails);

// Admin routes
router.get('/admin/brands', isAuthenticatedUser, authorizeRoles('admin'), getAllBrandsAdmin);
router.post('/admin/brand/new', isAuthenticatedUser, authorizeRoles('admin'), createBrand);
router.put('/admin/brand/:id', isAuthenticatedUser, authorizeRoles('admin'), updateBrand);
router.delete('/admin/brand/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteBrand);

module.exports = router;
