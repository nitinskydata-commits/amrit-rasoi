const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const { scopePartnerCatalog } = require('../middleware/partnerScope');
const { attachAccessScope, requireRoleAssignmentAuthority } = require('../middleware/enterpriseAccess');
const upload = require('../middleware/upload');
const { isCloudinaryConfigured } = require('../config/cloudinary');

// Import Controllers
const {
  getDashboardStats,
  getAllProductsAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  bulkDeleteProducts,
  getAllOrdersAdmin,
  updateOrderStatus,
  processRefund,
  deleteOrder, sendDeliveryOTP, verifyDeliveryOTP,
  assignReturnPickup, inspectReturnedItem,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  updateUserDetails,
  secureRoleUpdate,
  deleteUser,
  getAllReviews,
  deleteReview,
  getSalesAnalytics,
  getInventory,
  updateBulkInventory,
  getAuditLogs
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

const {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getAllCollaborations
} = require('../controllers/staffController');

const {
  verifySecurityVault,
  updateAdminCredentials
} = require('../controllers/securityController');

// Models for inline administration (Testimonials, Newsletters, Badges)
const Testimonial = require('../models/Testimonial');
const Newsletter = require('../models/Newsletter');
const SiteBadge = require('../models/SiteBadge');

// 🛡️ All routes below are protected and require authenticated users
router.use(isAuthenticatedUser);
router.use(attachAccessScope);
router.use(authorizeRoles(
  'admin',
  'platform_admin',
  'staff',
  'partner_admin',
  'vendor_owner',
  'vendor_staff',
  'inventory_manager',
  'order_manager',
  'warehouse_manager',
  'warehouse_staff',
  'delivery_agent',
  'delivery_boy',
  'finance_staff',
  'support_staff',
  'marketing_manager',
  'moderator',
  'regional_manager',
  'franchise_manager',
  'branch_manager'
));

// Dashboard & Analytics (Accessible by all authorized administrators)
router.get('/dashboard', getDashboardStats);
router.get('/analytics/sales', authorizeRoles('admin', 'platform_admin'), getSalesAnalytics);

// Products Management (Scoped & Permission Guarded)
router.get('/products', scopePartnerCatalog, authorizePermissions('manageProducts', 'manageInventory'), getAllProductsAdmin);
router.post('/product/new', authorizePermissions('manageProducts'), upload.any(), createProduct);
router.put('/product/:id', authorizePermissions('manageProducts'), upload.any(), updateProduct);
router.delete('/product/:id', authorizePermissions('manageProducts'), deleteProductAdmin);
router.post('/products/bulk-delete', authorizePermissions('manageProducts'), bulkDeleteProducts);

// Inventory Management (Scoped & Permission Guarded)
router.get('/inventory', scopePartnerCatalog, authorizePermissions('manageInventory'), getInventory);
router.put('/inventory/bulk', scopePartnerCatalog, authorizePermissions('manageInventory'), updateBulkInventory);

// Orders Management (Super Admin & Authorized Staff only)
router.get('/orders', authorizePermissions('manageOrders'), getAllOrdersAdmin);
router.put('/order/:id', authorizePermissions('manageOrders'), updateOrderStatus);
router.put('/order/:id/refund', authorizePermissions('manageOrders'), processRefund);
router.delete('/order/:id', authorizePermissions('manageOrders'), deleteOrder);
router.post('/order/:id/send-delivery-otp', authorizePermissions('manageOrders'), sendDeliveryOTP);
router.post('/order/:id/verify-delivery', authorizePermissions('manageOrders'), verifyDeliveryOTP);
router.put('/order/:id/return/pickup', authorizePermissions('manageOrders'), assignReturnPickup);
router.put('/order/:id/return/inspect', authorizePermissions('manageOrders'), inspectReturnedItem);

// Users Management (Super Admin only)
router.get('/users', authorizeRoles('admin', 'platform_admin'), getAllUsers);
router.get('/user/:id', authorizeRoles('admin', 'platform_admin'), getSingleUser);
router.put('/user/secure-role-update/:id', authorizeRoles('admin'), secureRoleUpdate);
router.put('/user/:id', authorizeRoles('admin', 'platform_admin'), updateUserRole);
router.put('/user/:id/details', authorizeRoles('admin', 'platform_admin'), updateUserDetails);
router.delete('/user/:id', authorizeRoles('admin', 'platform_admin'), deleteUser);
// Staff & Collaboration Partner Management (Super Admin only)
router.get('/staff', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'warehouse_manager', 'regional_manager', 'branch_manager'), getAllStaff);
router.post('/staff', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'warehouse_manager', 'regional_manager', 'branch_manager'), requireRoleAssignmentAuthority(), createStaff);
router.put('/staff/:id', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'warehouse_manager', 'regional_manager', 'branch_manager'), requireRoleAssignmentAuthority(), updateStaff);
router.delete('/staff/:id', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'warehouse_manager', 'regional_manager', 'branch_manager'), deleteStaff);
router.get('/staff/collaborations', authorizeRoles('admin', 'platform_admin'), getAllCollaborations);

// 🔐 Super Admin 6-Layer Security Authentication Vault (Super Admin only)
router.post('/security/verify', authorizeRoles('admin'), verifySecurityVault);
router.put('/security/update', authorizeRoles('admin'), updateAdminCredentials);

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

// System Audit Logs
router.get('/audit-logs', isAuthenticatedUser, authorizeRoles('admin', 'platform_admin'), getAuditLogs);

module.exports = router;
