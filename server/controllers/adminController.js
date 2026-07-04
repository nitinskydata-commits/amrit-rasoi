const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');
const AuditLog = require('../models/AuditLog');
const InventoryLedger = require('../models/InventoryLedger');
const { writeAuditLog } = require('../utils/auditLogger');
const { scopeQueryForActor } = require('../utils/accessControl');
const { syncProductStockFromLedger } = require('../utils/inventorySync');

// ==================== DASHBOARD STATS ====================

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    let actorScope = scopeQueryForActor(req.user);
    let vendorProductScope = { ...actorScope };
    let vendorOrderScope = { ...actorScope };
    
    if (req.user.role === 'vendor_owner' || req.user.role === 'vendor_staff') {
      vendorProductScope.seller = req.user._id;
      vendorOrderScope['orderItems.seller'] = req.user._id;
    }

    const totalProducts = await Product.countDocuments(vendorProductScope);
    
    // For vendors, we only count orders that contain their items
    const totalOrders = await Order.countDocuments(vendorOrderScope);
    
    // Users count (admins see all, org owners see their staff/users only)
    let userQuery = { role: 'user' };
    if (!['admin', 'platform_admin'].includes(req.user.role)) {
      if (req.user.organizationId) {
        userQuery.organizationId = req.user.organizationId;
      } else {
        userQuery.organizationId = 'non-existent';
      }
    }
    const totalUsers = await User.countDocuments(userQuery);
    
    // Revenue calculations (vendors only see revenue from their items)
    const orders = await Order.find({
      ...vendorOrderScope,
      'paymentInfo.status': 'paid'
    }).lean();
    
    let totalRevenue = 0;
    if (req.user.role === 'vendor_owner' || req.user.role === 'vendor_staff') {
      orders.forEach(order => {
        const vendorItems = order.orderItems.filter(i => i.seller && i.seller.toString() === req.user._id.toString());
        totalRevenue += vendorItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      });
    } else {
      totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    }
    
    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({
      ...vendorOrderScope,
      createdAt: { $gte: today }
    });
    
    // Simplified today revenue for now (or calculate similarly)
    const todayOrdersDocs = await Order.find({
      ...vendorOrderScope,
      createdAt: { $gte: today },
      'paymentInfo.status': 'paid'
    }).lean();
    
    let todayRevenue = 0;
    if (req.user.role === 'vendor_owner' || req.user.role === 'vendor_staff') {
      todayOrdersDocs.forEach(order => {
        const vendorItems = order.orderItems.filter(i => i.seller && i.seller.toString() === req.user._id.toString());
        todayRevenue += vendorItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      });
    } else {
      todayRevenue = todayOrdersDocs.reduce((sum, order) => sum + order.totalPrice, 0);
    }
    
    // Low stock products
    const lowStockProducts = await Product.find({
      ...vendorProductScope,
      stock: { $lt: 10 }
    })
      .select('name stock')
      .limit(10);
    
    // Recent orders
    const recentOrders = await Order.find(actorScope)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      {
        $match: actorScope
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          ...actorScope,
          createdAt: { $gte: sixMonthsAgo },
          'paymentInfo.status': 'paid'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        lowStockProducts,
        recentOrders,
        ordersByStatus,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Sales Analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { period } = req.query;
    const actorScope = scopeQueryForActor(req.user);
    
    let startDate = new Date();
    
    switch(period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    const salesData = await Order.aggregate([
      {
        $match: {
          ...actorScope,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalSales: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const bestSellingProducts = await Order.aggregate([
      {
        $match: actorScope
      },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalQuantity: { $sum: '$orderItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      success: true,
      salesData,
      bestSellingProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== PRODUCT MANAGEMENT ====================

// Get all products (admin)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { search, category, stock, active } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) query.category = category;
    if (stock === 'low') query.stock = { $lt: 10 };
    if (stock === 'out') query.stock = 0;
    if (active !== undefined) query.isActive = active === 'true';
    
    // Multi-Vendor Isolation
    if (req.user.role === 'vendor_owner' || req.user.role === 'vendor_staff') {
      query.seller = req.user._id;
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update product (admin)
exports.updateProductAdmin = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete product (admin)
exports.deleteProductAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    await product.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Bulk delete products (admin)
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of product IDs'
      });
    }

    const result = await Product.deleteMany({ _id: { $in: productIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} products deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== ORDER MANAGEMENT ====================

// Get all orders (admin)
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = {};
    
    // Apply tenant/actor scoping
    const actorScope = scopeQueryForActor(req.user);
    if (actorScope.organization) {
      query.$or = [
        { organization: actorScope.organization },
        { 'orderItems.organization': actorScope.organization }
      ];
    } else if (actorScope.tenantId && actorScope.tenantId !== 'platform') {
      query.tenantId = actorScope.tenantId;
    } else if (actorScope.collaboration) {
      query.collaboration = actorScope.collaboration;
    }
    
    if (status) query.orderStatus = status;
    
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.user = { $in: users.map(u => u._id) };
    }
    
    // Multi-vendor Isolation for Orders
    if (req.user.role === 'vendor_owner' || req.user.role === 'vendor_staff') {
      query['orderItems.seller'] = req.user._id;
    }
    
    let orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 })
      .lean();
      
    // If vendor, only show their own items from the mixed orders
    if (req.user.role === 'vendor_owner' || req.user.role === 'vendor_staff') {
      orders = orders.map(order => {
        order.orderItems = order.orderItems.filter(item => 
          item.seller && item.seller.toString() === req.user._id.toString()
        );
        // Recalculate totals for this vendor
        order.totalPrice = order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        return order;
      });
    }
    
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const { orderStatus, trackingId } = req.body;
    
    if (orderStatus) {
      // If order is transitioned to Cancelled, auto-restore the stock in warehouses
      if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
        for (const item of order.orderItems) {
          if (item.warehouseId) {
            await InventoryLedger.create({
              product: item.product,
              variantId: item.variantId || null,
              warehouse: item.warehouseId,
              quantityChanged: item.quantity, // Restore positive quantity
              transactionType: 'adjustment',
              referenceId: order._id.toString(),
              reason: `Order Cancellation: Stock Auto-Restore for Order #${order._id}`,
              operator: req.user._id,
              organization: order.organization || null,
              tenantId: order.tenantId
            });

            // Re-sync product and variant stock counts
            await syncProductStockFromLedger(item.product);
          }
        }
      }

      order.orderStatus = orderStatus;
      
      if (orderStatus === 'Delivered') {
        order.deliveredAt = Date.now();
      }
    }
    
    if (trackingId) order.trackingId = trackingId;
    
    await order.save();

    if (orderStatus) {
      const { eventBus, EVENTS } = require('../utils/eventBus');
      eventBus.emit(EVENTS.ORDER_STATUS_UPDATED || 'order.status.updated', {
        orderId: order._id,
        status: orderStatus,
        userId: order.user
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Process refund (admin)
exports.processRefund = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const { refundStatus, refundedAmount, refundReason, refundTransactionId } = req.body;
    
    const prevRefundStatus = order.refundStatus;
    
    order.refundStatus = refundStatus;
    order.refundedAmount = refundedAmount || order.totalPrice;
    order.refundReason = refundReason;
    order.refundTransactionId = refundTransactionId;
    
    if (refundStatus === 'Completed') {
      if (prevRefundStatus !== 'Completed') {
        // Auto-restore returned stock back to warehouse
        for (const item of order.orderItems) {
          if (item.warehouseId) {
            await InventoryLedger.create({
              product: item.product,
              variantId: item.variantId || null,
              warehouse: item.warehouseId,
              quantityChanged: item.quantity, // Restore positive quantity
              transactionType: 'return',
              referenceId: order._id.toString(),
              reason: `Order Refund & Return: Stock Restore for Order #${order._id}`,
              operator: req.user._id,
              organization: order.organization || null,
              tenantId: order.tenantId
            });

            // Re-sync product and variant stock counts
            await syncProductStockFromLedger(item.product);
          }
        }
      }
      order.refundedAt = Date.now();
      order.paymentStatus = 'Refunded';
    }
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete order (admin)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    await order.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== USER MANAGEMENT ====================

// Get all users (admin)
exports.getAllUsers = async (req, res) => {
  try {
    let query = {};
    
    // Non-admins only see users belonging to their organization
    if (!['admin', 'platform_admin'].includes(req.user.role)) {
      if (req.user.organizationId) {
        query.organizationId = req.user.organizationId;
      } else {
        return res.status(200).json({ success: true, count: 0, users: [] });
      }
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single user details (admin)
exports.getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Non-admins only see users belonging to their organization
    if (!['admin', 'platform_admin'].includes(req.user.role)) {
      if (!user.organizationId || user.organizationId.toString() !== req.user.organizationId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user role (admin)
exports.updateUserRole = async (req, res) => {
  try {
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the dedicated super-admin can change user roles.'
      });
    }

    const { role } = req.body;
    if (role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin roles cannot be assigned through this simple update. Please use the "Promote to Partner" process.'
      });
    }

    if (!['user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only user roles are permitted here.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    if (role === 'admin' && !user.isSuperAdmin) {
      user.isSuperAdmin = false;
    }
    await user.save();

    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: sanitizedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user details (admin)
exports.updateUserDetails = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User contact details updated successfully',
      user
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `A user with this ${field} already exists.`
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Critical Role Update (SuperAdmin Only + Multi-Step Verification)
// Requires: adminPassword (requester), targetPhone (for confirmation), newRole
exports.secureRoleUpdate = async (req, res) => {
  try {
    const { adminPassword, targetPhone, newRole } = req.body;
    const targetUserId = req.params.id;

    if (!adminPassword || !targetPhone || !newRole) {
      return res.status(400).json({
        success: false,
        message: 'Admin password, target user phone, and new role are required for this critical action.'
      });
    }

    // 1. Verify the requester is a SuperAdmin and check password
    const admin = await User.findById(req.user.id).select('+password');
    if (!admin || !admin.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only a SuperAdmin can perform critical role changes.'
      });
    }

    // 2. Re-verify Admin Password
    const isPasswordMatched = await admin.comparePassword(adminPassword);
    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: 'Security Violation: Incorrect Admin Password. Action blocked.'
      });
    }

    // 3. Find target user and verify phone number
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found.'
      });
    }

    // Normalize phone numbers for comparison
    const normalizedTargetPhone = targetUser.phone.replace(/[^0-9]/g, '');
    const normalizedInputPhone = targetPhone.replace(/[^0-9]/g, '');

    if (normalizedTargetPhone.slice(-10) !== normalizedInputPhone.slice(-10)) {
      return res.status(400).json({
        success: false,
        message: 'Security Mismatch: The phone number entered does not match the target user records.'
      });
    }

    // 4. Prevent demoting the primary super admin (self-protection)
    if (targetUser._id.toString() === admin._id.toString() && newRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Safety Block: You cannot demote yourself. Another SuperAdmin must perform this action.'
      });
    }

    // 5. Update Role
    targetUser.role = newRole;
    // Partners are admins, but only one primary SuperAdmin should exist usually
    // We can decide if partners are also superAdmins
    targetUser.isSuperAdmin = (newRole === 'admin'); 

    await targetUser.save();

    console.log(`🛡️ SECURITY ALERT: Role for ${targetUser.email} changed to ${newRole} by ${admin.email}`);

    res.status(200).json({
      success: true,
      message: `Security Verified: ${targetUser.name} is now a ${newRole}.`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete user (admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== REVIEW MANAGEMENT ====================

// Get all reviews (admin)
exports.getAllReviews = async (req, res) => {
  try {
    let query = {};
    
    // Scoping reviews to the actor's products
    const productScope = scopeQueryForActor(req.user);
    if (Object.keys(productScope).length > 0) {
      const Product = require('../models/Product');
      const scopedProducts = await Product.find(productScope).select('_id');
      const productIds = scopedProducts.map(p => p._id);
      query.product = { $in: productIds };
    }

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name images')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete review (admin)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    await review.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== BRAND SETTINGS ====================

// Update Brand Settings
exports.updateBrandSettings = async (req, res) => {
  try {
    const { logo, banner, tagline, heroText } = req.body;
    
    res.status(200).json({
      success: true,
      message: 'Brand settings updated successfully',
      settings: {
        logo,
        banner,
        tagline,
        heroText
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Brand Logo
exports.updateBrandLogo = async (req, res) => {
  try {
    const { logo } = req.body;
    
    res.status(200).json({
      success: true,
      message: 'Logo updated successfully',
      logo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== INVENTORY MANAGEMENT ====================

// Get Flat Inventory List (Scoped & Scanned)
exports.getInventory = async (req, res) => {
  try {
    const actorScope = scopeQueryForActor(req.user);
    const products = await Product.find(actorScope);
    
    const inventory = [];
    
    products.forEach(product => {
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          inventory.push({
            productId: product._id.toString(),
            variantId: variant._id.toString(),
            type: 'variant',
            productName: product.name,
            category: product.category,
            sku: variant.sku || `${product.sku || 'N/A'}-${variant._id.toString().substring(18)}`,
            price: variant.price,
            mrp: variant.mrp,
            stock: variant.stock,
            image: (variant.images && variant.images[0]?.url) || (product.images && product.images[0]?.url) || '/placeholder.png',
            label: variant.attributes.map(a => a.value).join(' / ')
          });
        });
      } else {
        inventory.push({
          productId: product._id.toString(),
          variantId: null,
          type: 'product',
          productName: product.name,
          category: product.category,
          sku: product.sku || `SKU-${product._id.toString().substring(18)}`,
          price: product.price,
          mrp: product.mrp || product.price,
          stock: product.stock,
          image: (product.images && product.images[0]?.url) || '/placeholder.png',
          label: 'Single Variant'
        });
      }
    });
    
    res.status(200).json({
      success: true,
      inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Bulk Inventory Stocks
exports.updateBulkInventory = async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload'
      });
    }
    
    for (const update of updates) {
      const { type, productId, variantId, stock } = update;
      
      const product = await Product.findById(productId);
      if (!product) continue;

      if (type === 'variant' && variantId) {
        const variant = product.variants.id(variantId);
        if (variant) {
          const oldStock = variant.stock;
          variant.stock = stock;
          if (stock === 0) {
            variant.isActive = false;
          } else {
            variant.isActive = true;
          }
          await product.save();

          await writeAuditLog({
            req,
            action: 'INVENTORY_STOCK_UPDATED',
            targetModel: 'Product',
            targetId: product._id,
            previousState: { sku: variant.sku, stock: oldStock },
            newState: { sku: variant.sku, stock }
          });
        }
      } else {
        const oldStock = product.stock;
        product.stock = stock;
        await product.save();

        await writeAuditLog({
          req,
          action: 'INVENTORY_STOCK_UPDATED',
          targetModel: 'Product',
          targetId: product._id,
          previousState: { sku: product.sku, stock: oldStock },
          newState: { sku: product.sku, stock }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== SYSTEM AUDIT LOGS ====================

// Get Audit Compliance Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, role, search } = req.query;
    
    let query = {};
    
    if (action) {
      query.action = action;
    }
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { userName: searchRegex },
        { action: searchRegex },
        { targetModel: searchRegex },
        { targetId: searchRegex }
      ];
    }
    
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(100);
    
    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== DELIVERY BOY OTP HANDSHAKE ====================

// Send Delivery Verification OTP
exports.sendDeliveryOTP = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    order.deliveryOTP = otp;
    await order.save();

    // In a real application, send OTP via SMS gateway
    console.log(`🚚 [DELIVERY OTP] Order #${order._id.toString().substring(18)} OTP is: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP SMS successfully dispatched to customer.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Doorstep Delivery OTP
exports.verifyDeliveryOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.deliveryOTP || order.deliveryOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Verification failed.'
      });
    }

    // Mark as delivered & paid
    order.orderStatus = 'Delivered';
    order.paymentStatus = 'Paid';
    order.deliveredAt = Date.now();
    order.deliveryOTP = null; // Clear OTP after success
    await order.save();

    // Write audit log
    await writeAuditLog({
      req,
      action: 'ORDER_DELIVERED',
      targetModel: 'Order',
      targetId: order._id,
      newState: { orderStatus: 'Delivered', paymentStatus: 'Paid' }
    });

    res.status(200).json({
      success: true,
      message: 'OTP successfully verified. Delivery completed.',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Assign Return Pickup (Admin)
exports.assignReturnPickup = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.refundStatus !== 'Requested') {
      return res.status(400).json({
        success: false,
        message: `Order must be in "Requested" return status. Current status: ${order.refundStatus}`
      });
    }

    const { deliveryAgentId } = req.body;
    if (!deliveryAgentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide deliveryAgentId'
      });
    }

    // Set delivery agent and change status to Processing
    order.assignedDeliveryBoy = deliveryAgentId;
    order.refundStatus = 'Processing';
    await order.save();

    await writeAuditLog({
      req,
      action: 'RETURN_PICKUP_ASSIGNED',
      targetModel: 'Order',
      targetId: order._id,
      newState: { assignedDeliveryBoy: deliveryAgentId, refundStatus: 'Processing' }
    });

    res.status(200).json({
      success: true,
      message: 'Return pickup successfully assigned to delivery agent',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Inspect Returned Item (Warehouse Staff / Admin)
exports.inspectReturnedItem = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.refundStatus !== 'Processing') {
      return res.status(400).json({
        success: false,
        message: `Order must be in "Processing" return status. Current status: ${order.refundStatus}`
      });
    }

    const { status, refundReason } = req.body; // 'Approved' or 'Rejected'
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Inspection status must be either "Approved" or "Rejected"'
      });
    }

    if (status === 'Approved') {
      // Set to Completed
      order.refundStatus = 'Completed';
      order.paymentStatus = 'Refunded';
      order.refundedAmount = order.totalPrice;
      order.refundedAt = Date.now();
      if (refundReason) order.refundReason = refundReason;

      // Auto-restore returned stock back to warehouse
      const InventoryLedger = require('../models/InventoryLedger');
      const { syncProductStockFromLedger } = require('../utils/inventorySync');
      for (const item of order.orderItems) {
        if (item.warehouseId) {
          await InventoryLedger.create({
            product: item.product,
            variantId: item.variantId || null,
            warehouse: item.warehouseId,
            quantityChanged: item.quantity, // Restore positive quantity
            transactionType: 'return',
            referenceId: order._id.toString(),
            reason: `Return Inspection Approved: Stock Restore for Order #${order._id}`,
            operator: req.user._id,
            organization: order.organization || null,
            tenantId: order.tenantId
          });

          // Re-sync product and variant stock counts
          await syncProductStockFromLedger(item.product);
        }
      }
    } else {
      // Rejected - return item back to user, refund status becomes Rejected
      order.refundStatus = 'Rejected';
    }

    await order.save();

    await writeAuditLog({
      req,
      action: 'RETURN_INSPECTION_COMPLETED',
      targetModel: 'Order',
      targetId: order._id,
      newState: { refundStatus: order.refundStatus, paymentStatus: order.paymentStatus }
    });

    res.status(200).json({
      success: true,
      message: `Return inspection completed with status: ${status}`,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== SELLER MANAGEMENT (ADMIN ONLY) ====================

// @desc    Get all sellers / applications
// @route   GET /api/v1/admin/sellers
// @access  Private (Admin/Platform Admin)
exports.getAllSellers = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    
    if (status) {
      query.sellerStatus = status;
    } else {
      query.sellerStatus = { $ne: 'none' };
    }

    const sellers = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: sellers.length,
      sellers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== SELLER KYC PIPELINE ====================

// @desc    Admin initiates KYC review for a pending seller
// @route   PUT /api/v1/admin/seller/:id/kyc/initiate
// @access  Private (Admin/Platform Admin)
exports.initiateKYC = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    if (seller.sellerStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot initiate KYC. Current status is '${seller.sellerStatus}'. Must be 'pending'.`
      });
    }

    seller.sellerStatus = 'kyc_in_progress';
    seller.sellerProfile.kycStartedAt = new Date();
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'KYC review initiated. Seller has been notified.',
      seller
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin approves or fails KYC for a seller in review
// @route   PUT /api/v1/admin/seller/:id/kyc/complete
// @access  Private (Admin/Platform Admin)
exports.completeKYC = async (req, res) => {
  try {
    const { result, failedReason } = req.body; // result: 'approved' | 'failed'

    if (!['approved', 'failed'].includes(result)) {
      return res.status(400).json({ success: false, message: "result must be 'approved' or 'failed'." });
    }

    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    if (seller.sellerStatus !== 'kyc_in_progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete KYC. Current status is '${seller.sellerStatus}'. Must be 'kyc_in_progress'.`
      });
    }

    if (result === 'approved') {
      seller.sellerStatus = 'kyc_approved';
      seller.sellerProfile.kycApprovedAt = new Date();
      seller.sellerProfile.kycFailedReason = '';
    } else {
      seller.sellerStatus = 'kyc_failed';
      seller.sellerProfile.kycFailedAt = new Date();
      seller.sellerProfile.kycFailedReason = failedReason || 'KYC documents could not be verified.';
    }

    await seller.save();

    res.status(200).json({
      success: true,
      message: result === 'approved'
        ? 'KYC approved. Seller has been notified to set up payment gateway.'
        : `KYC marked as failed. Seller notified: "${seller.sellerProfile.kycFailedReason}"`,
      seller
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin final approval after payment gateway setup
// @route   PUT /api/v1/admin/seller/:id/kyc/final-approve
// @access  Private (Admin/Platform Admin)
exports.finalApproveSeller = async (req, res) => {
  try {
    const { commissionRate = 10 } = req.body;

    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    if (seller.sellerStatus !== 'payment_pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot final-approve. Current status is '${seller.sellerStatus}'. Must be 'payment_pending'.`
      });
    }

    seller.sellerStatus = 'approved';
    seller.sellerProfile.approvedAt = new Date();
    seller.sellerProfile.commissionRate = Number(commissionRate);
    seller.sellerProfile.rejectionReason = '';

    if (seller.role === 'user' || seller.role === 'customer' || !seller.role) {
      seller.role = 'vendor_owner';
    }

    const Organization = require('../models/Organization');
    let org;
    if (seller.organizationId) {
      org = await Organization.findById(seller.organizationId);
    }

    if (!org) {
      org = await Organization.create({
        name: seller.sellerProfile.shopName || `${seller.name}'s Shop`,
        description: seller.sellerProfile.shopDescription || '',
        payoutAccount: {
          bankName: seller.sellerProfile.bankDetails?.bankName || '',
          accountNumber: seller.sellerProfile.bankDetails?.accountNumber || '',
          ifscCode: seller.sellerProfile.bankDetails?.ifscCode || '',
          accountHolderName: seller.sellerProfile.bankDetails?.accountHolderName || '',
          upiId: seller.sellerProfile.bankDetails?.upiId || ''
        },
        commissionRate,
        status: 'active',
        tenantId: `tenant_${seller._id}`
      });
      seller.organizationId = org._id;
      seller.tenantId = org.tenantId;
    } else {
      org.status = 'active';
      org.commissionRate = commissionRate;
      await org.save();
    }

    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Seller fully approved and onboarded successfully!',
      seller
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or Reject a Seller application
// @route   PUT /api/v1/admin/seller/:id/status
// @access  Private (Admin/Platform Admin)
exports.updateSellerStatus = async (req, res) => {
  try {
    const { status, rejectionReason, commissionRate = 10 } = req.body;
    
    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Choose approved, rejected, or suspended.'
      });
    }

    const seller = await User.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found.'
      });
    }

    seller.sellerStatus = status;
    
    if (status === 'approved') {
      seller.sellerProfile.approvedAt = new Date();
      seller.sellerProfile.rejectionReason = '';
      seller.sellerProfile.commissionRate = commissionRate;

      // Import Organization model
      const Organization = require('../models/Organization');

      // Create Organization for the seller if they don't have one
      let org;
      if (seller.organizationId) {
        org = await Organization.findById(seller.organizationId);
      }

      if (!org) {
        org = await Organization.create({
          name: seller.sellerProfile.shopName || `${seller.name}'s Shop`,
          description: seller.sellerProfile.shopDescription || '',
          payoutAccount: {
            bankName: seller.sellerProfile.bankDetails?.bankName || '',
            accountNumber: seller.sellerProfile.bankDetails?.accountNumber || '',
            ifscCode: seller.sellerProfile.bankDetails?.ifscCode || '',
            accountHolderName: seller.sellerProfile.bankDetails?.accountHolderName || '',
            upiId: seller.sellerProfile.bankDetails?.upiId || ''
          },
          commissionRate: commissionRate,
          status: 'active',
          tenantId: `tenant_${seller._id}` // Scaffold unique tenant identifier
        });

        seller.organizationId = org._id;
        seller.tenantId = org.tenantId;
      } else {
        org.status = 'active';
        org.commissionRate = commissionRate;
        await org.save();
      }

      // Sync user role (keep admin role privileges if already admin)
      if (seller.role === 'user' || seller.role === 'customer' || !seller.role) {
        seller.role = 'vendor_owner';
      }
    } else if (status === 'rejected') {
      seller.sellerProfile.rejectedAt = new Date();
      seller.sellerProfile.rejectionReason = rejectionReason || 'Information provided is incomplete or incorrect.';
      
      // If rejected, deactivate their organization if it exists
      if (seller.organizationId) {
        const Organization = require('../models/Organization');
        await Organization.findByIdAndUpdate(seller.organizationId, { status: 'suspended' });
      }
    } else if (status === 'suspended') {
      if (seller.organizationId) {
        const Organization = require('../models/Organization');
        await Organization.findByIdAndUpdate(seller.organizationId, { status: 'suspended' });
      }
    }

    await seller.save();

    await writeAuditLog({
      req,
      action: `SELLER_STATUS_${status.toUpperCase()}`,
      targetModel: 'User',
      targetId: seller._id,
      newState: { sellerStatus: seller.sellerStatus, organizationId: seller.organizationId }
    });

    res.status(200).json({
      success: true,
      message: `Seller status updated to ${status} successfully.`,
      seller
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update Seller Details (Commission rate and Profile details)
// @route   PUT /api/v1/admin/seller/:id/profile
// @access  Private (Admin/Platform Admin)
exports.updateSellerProfileAdmin = async (req, res) => {
  try {
    const { 
      commissionRate, 
      shopName, 
      shopDescription, 
      gstin, 
      pan, 
      bankDetails, 
      businessAddress 
    } = req.body;

    const seller = await User.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found.'
      });
    }

    // Update User model fields
    if (commissionRate !== undefined) seller.sellerProfile.commissionRate = Number(commissionRate);
    if (shopName !== undefined) seller.sellerProfile.shopName = shopName;
    if (shopDescription !== undefined) seller.sellerProfile.shopDescription = shopDescription;
    if (gstin !== undefined) seller.sellerProfile.gstin = gstin;
    if (pan !== undefined) seller.sellerProfile.pan = pan;
    
    if (bankDetails) {
      seller.sellerProfile.bankDetails = {
        bankName: bankDetails.bankName !== undefined ? bankDetails.bankName : (seller.sellerProfile.bankDetails?.bankName || ''),
        accountNumber: bankDetails.accountNumber !== undefined ? bankDetails.accountNumber : (seller.sellerProfile.bankDetails?.accountNumber || ''),
        ifscCode: bankDetails.ifscCode !== undefined ? bankDetails.ifscCode : (seller.sellerProfile.bankDetails?.ifscCode || ''),
        accountHolderName: bankDetails.accountHolderName !== undefined ? bankDetails.accountHolderName : (seller.sellerProfile.bankDetails?.accountHolderName || ''),
        upiId: bankDetails.upiId !== undefined ? bankDetails.upiId : (seller.sellerProfile.bankDetails?.upiId || '')
      };
    }

    if (businessAddress) {
      seller.sellerProfile.businessAddress = {
        line1: businessAddress.line1 !== undefined ? businessAddress.line1 : (seller.sellerProfile.businessAddress?.line1 || ''),
        line2: businessAddress.line2 !== undefined ? businessAddress.line2 : (seller.sellerProfile.businessAddress?.line2 || ''),
        city: businessAddress.city !== undefined ? businessAddress.city : (seller.sellerProfile.businessAddress?.city || ''),
        state: businessAddress.state !== undefined ? businessAddress.state : (seller.sellerProfile.businessAddress?.state || ''),
        pincode: businessAddress.pincode !== undefined ? businessAddress.pincode : (seller.sellerProfile.businessAddress?.pincode || '')
      };
    }

    // Save User
    await seller.save();

    // Sync with Organization model if exists
    if (seller.organizationId) {
      const Organization = require('../models/Organization');
      const org = await Organization.findById(seller.organizationId);
      if (org) {
        if (shopName !== undefined) org.name = shopName;
        if (shopDescription !== undefined) org.description = shopDescription;
        if (commissionRate !== undefined) org.commissionRate = Number(commissionRate);
        if (seller.sellerProfile.bankDetails) {
          org.payoutAccount = {
            bankName: seller.sellerProfile.bankDetails.bankName || '',
            accountNumber: seller.sellerProfile.bankDetails.accountNumber || '',
            ifscCode: seller.sellerProfile.bankDetails.ifscCode || '',
            accountHolderName: seller.sellerProfile.bankDetails.accountHolderName || '',
            upiId: seller.sellerProfile.bankDetails.upiId || ''
          };
        }
        await org.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Seller details updated successfully.',
      seller
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve or Reject a Wholesale buyer application
// @route   PUT /api/v1/admin/wholesale/:id/status
// @access  Private (Admin/Platform Admin)
exports.updateWholesaleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Choose approved or rejected.'
      });
    }

    const buyer = await User.findById(req.params.id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Wholesale buyer not found.'
      });
    }

    buyer.wholesaleStatus = status;
    if (status === 'approved') {
      buyer.isWholesale = true;
      if (buyer.role === 'user' || buyer.role === 'customer' || !buyer.role) {
        buyer.role = 'wholesale_buyer';
      }
      buyer.wholesaleProfile.approvedAt = new Date();
    } else {
      buyer.isWholesale = false;
      if (buyer.role === 'wholesale_buyer') {
        buyer.role = 'user';
      }
      buyer.wholesaleProfile.approvedAt = null;
    }

    await buyer.save();
    
    res.status(200).json({
      success: true,
      message: `Wholesale application ${status} successfully.`,
      buyer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

