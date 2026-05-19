const Product = require('../models/Product');
const Order = require('../models/Order');
const Organization = require('../models/Organization');

// @desc    Get Vendor Scoped Dashboard Statistics
// @route   GET /api/v1/vendor/dashboard-stats
// @access  Private (Vendor Owner, Partner Admin)
exports.getVendorDashboardStats = async (req, res) => {
  try {
    const orgId = req.user.organizationId || req.user.organization;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Active organization boundary not established for this user session.'
      });
    }

    // 1. Total Products Count
    const totalProducts = await Product.countDocuments({ organization: orgId });

    // 2. Orders containing vendor items
    const orders = await Order.find({ 'orderItems.organization': orgId });
    const totalOrders = orders.length;

    // 3. Compute itemized financial metrics
    let totalRevenue = 0;
    let totalCommissionPaid = 0;
    let netPayout = 0;
    const ordersByStatusMap = {};

    orders.forEach(order => {
      // Order Status Breakdown
      ordersByStatusMap[order.orderStatus] = (ordersByStatusMap[order.orderStatus] || 0) + 1;

      order.orderItems.forEach(item => {
        if (item.organization && item.organization.toString() === orgId.toString()) {
          const itemTotal = item.price * item.quantity;
          totalRevenue += itemTotal;
          totalCommissionPaid += item.commissionPaid || (itemTotal * (item.commissionRate / 100 || 0.1));
          netPayout += item.netVendorPayout || (itemTotal - (itemTotal * (item.commissionRate / 100 || 0.1)));
        }
      });
    });

    const averageOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    // 4. Low stock alert items (scoped to vendor)
    const lowStockProducts = await Product.find({
      organization: orgId,
      $or: [
        { stock: { $lt: 10 } },
        { 'variants.stock': { $lt: 10 } }
      ]
    }).select('name stock variants');

    // 5. Recent orders list
    const recentOrders = orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(order => {
        // Filter out order items not belonging to this vendor
        const vendorItems = order.orderItems.filter(
          item => item.organization && item.organization.toString() === orgId.toString()
        );
        const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
          _id: order._id,
          createdAt: order.createdAt,
          orderStatus: order.orderStatus,
          customerName: order.shippingAddress?.name || order.user?.name || 'Customer',
          vendorItemsCount: vendorItems.length,
          vendorTotal
        };
      });

    const ordersByStatus = Object.entries(ordersByStatusMap).map(([status, count]) => ({
      _id: status,
      count
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue,
        totalCommissionPaid,
        netPayout,
        averageOrderValue,
        lowStockProducts,
        recentOrders,
        ordersByStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Vendor Payout & Order Ledgers
// @route   GET /api/v1/vendor/payout-ledgers
// @access  Private (Vendor Owner, Partner Admin)
exports.getVendorPayoutLedgers = async (req, res) => {
  try {
    const orgId = req.user.organizationId || req.user.organization;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Active organization boundary not established for this user session.'
      });
    }

    const org = await Organization.findById(orgId).select('name commissionRate payoutAccount');
    const orders = await Order.find({
      'orderItems.organization': orgId,
      orderStatus: 'Delivered'
    }).sort({ createdAt: -1 });

    const payoutLedgers = orders.map(order => {
      let orderRevenue = 0;
      let orderCommission = 0;
      let orderPayout = 0;

      const items = order.orderItems
        .filter(item => item.organization && item.organization.toString() === orgId.toString())
        .map(item => {
          const itemTotal = item.price * item.quantity;
          const commission = item.commissionPaid || (itemTotal * (item.commissionRate / 100 || 0.1));
          const payout = item.netVendorPayout || (itemTotal - commission);

          orderRevenue += itemTotal;
          orderCommission += commission;
          orderPayout += payout;

          return {
            productId: item.product,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            commissionRate: item.commissionRate,
            commissionPaid: commission,
            netVendorPayout: payout
          };
        });

      return {
        orderId: order._id,
        deliveredAt: order.deliveredAt || order.createdAt,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        orderRevenue,
        orderCommission,
        orderPayout,
        items
      };
    });

    res.status(200).json({
      success: true,
      organization: org,
      count: payoutLedgers.length,
      payoutLedgers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
