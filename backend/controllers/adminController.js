const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');

// ==================== DASHBOARD STATS ====================

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Revenue calculations
    const orders = await Order.find({ 'paymentInfo.status': 'paid' });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });
    
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          'paymentInfo.status': 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);
    
    // Low stock products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .select('name stock')
      .limit(10);
    
    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
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
    
    const query = {};
    
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
    
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 });
    
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
      order.orderStatus = orderStatus;
      
      if (orderStatus === 'Delivered') {
        order.deliveredAt = Date.now();
      }
    }
    
    if (trackingId) order.trackingId = trackingId;
    
    await order.save();
    
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
    
    order.refundStatus = refundStatus;
    order.refundedAmount = refundedAmount || order.totalPrice;
    order.refundReason = refundReason;
    order.refundTransactionId = refundTransactionId;
    
    if (refundStatus === 'Completed') {
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
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
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
    const reviews = await Review.find()
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
