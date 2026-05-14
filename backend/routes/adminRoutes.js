const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { isCloudinaryConfigured } = require('../config/cloudinary');

// Import Controllers
const {
  getDashboardStats,
  getAllProductsAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getAllOrdersAdmin,
  updateOrderStatus,
  processRefund,
  deleteOrder,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deleteUser,
  getAllReviews,
  deleteReview,
  getSalesAnalytics
} = require('../controllers/adminController');

const {
  createProduct,
  updateProduct
} = require('../controllers/productController');

const {
  getSettings,
  updateSettings,
  changeAdminPassword
} = require('../controllers/settingsController');

// Models for inline administration (Testimonials, Newsletters, Badges)
const Testimonial = require('../models/Testimonial');
const Newsletter = require('../models/Newsletter');
const SiteBadge = require('../models/SiteBadge');

// 🛡️ All routes below are protected and require 'admin' role
router.use(isAuthenticatedUser);
router.use(authorizeRoles('admin'));

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/analytics/sales', getSalesAnalytics);

// Products Management
router.get('/products', getAllProductsAdmin);
router.post('/product/new', upload.array('images', 5), createProduct); // ✅ FIXED from getAllProductsAdmin
router.put('/product/:id', upload.array('images', 5), updateProduct); // ✅ FIXED - Use productController for image updates
router.delete('/product/:id', deleteProductAdmin);

// Orders Management
router.get('/orders', getAllOrdersAdmin);
router.put('/order/:id', updateOrderStatus);
router.put('/order/:id/refund', processRefund);
router.delete('/order/:id', deleteOrder);

// Users Management
router.get('/users', getAllUsers);
router.get('/user/:id', getSingleUser);
router.put('/user/:id', updateUserRole);
router.delete('/user/:id', deleteUser);

// Reviews Management
router.get('/reviews', getAllReviews);
router.delete('/review/:id', deleteReview);

// Testimonials Management (Unified)
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json({ success: true, testimonials });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/testimonials', upload.single('customerImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.customerImage = { url: req.file.path, publicId: req.file.filename };
    const testimonial = await Testimonial.create(data);
    res.status(201).json({ success: true, testimonial });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.put('/testimonials/:id', upload.single('customerImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.customerImage = { url: req.file.path, publicId: req.file.filename };
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, testimonial });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.delete('/testimonials/:id', async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

// Newsletter Management (Unified)
router.get('/newsletter', async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ subscribedAt: -1 });
    const stats = {
      total: subscribers.length,
      active: subscribers.filter(s => s.isActive).length,
      inactive: subscribers.filter(s => !s.isActive).length
    };
    res.json({ success: true, subscribers, stats });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/newsletter/:id', async (req, res) => {
  await Newsletter.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

// ==================== BADGE MANAGEMENT (Admin Hub) ====================
router.get('/badges', async (req, res) => {
  try {
    const badges = await SiteBadge.find().sort({ order: 1 });
    res.json({ success: true, badges });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/badges', upload.single('icon'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.icon = { 
        url: isCloudinaryConfigured ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`, 
        public_id: req.file.filename 
      };
    }
    const badge = await SiteBadge.create(data);
    res.status(201).json({ success: true, badge });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.put('/badges/:id', upload.single('icon'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.icon = { 
        url: isCloudinaryConfigured ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`, 
        public_id: req.file.filename 
      };
    }
    const badge = await SiteBadge.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, badge });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.delete('/badges/:id', async (req, res) => {
  try {
    const badge = await SiteBadge.findByIdAndDelete(req.params.id);
    if (!badge) return res.status(404).json({ success: false, message: 'Badge not found' });
    res.json({ success: true, message: 'Badge deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Site Settings
router.get('/settings', getSettings); // ✅ FIXED from updateSettings
router.put('/settings', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favIcon', maxCount: 1 }
]), updateSettings);

router.put('/change-password', changeAdminPassword);

module.exports = router;
