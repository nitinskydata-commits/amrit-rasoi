const Order = require('../models/Order');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const InventoryLedger = require('../models/InventoryLedger');

// @desc    Get sales timeline analytics (past 30 days)
// @route   GET /api/v1/analytics/sales
// @access  Private
exports.getSalesAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const matchQuery = {
      createdAt: { $gte: thirtyDaysAgo },
      paymentStatus: { $in: ['Paid', 'Pending'] }
    };

    // Filter by organization if vendor
    if (!['admin', 'platform_admin'].includes(req.user.role)) {
      matchQuery.organization = req.user.organizationId || req.user.organization;
    }

    const salesData = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSales: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build timeline mapping to ensure contiguous days (past 30 days)
    const analyticsMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      analyticsMap[dateStr] = { date: dateStr, sales: 0, count: 0 };
    }

    salesData.forEach(item => {
      if (analyticsMap[item._id]) {
        analyticsMap[item._id].sales = parseFloat(item.totalSales.toFixed(2));
        analyticsMap[item._id].count = item.orderCount;
      }
    });

    const chartData = Object.values(analyticsMap);

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get inventory allocation & capacity analytics across warehouses
// @route   GET /api/v1/analytics/inventory
// @access  Private
exports.getInventoryAnalytics = async (req, res) => {
  try {
    const matchQuery = {};
    if (!['admin', 'platform_admin'].includes(req.user.role)) {
      matchQuery.organization = req.user.organizationId || req.user.organization;
    }

    const warehouses = await Warehouse.find(matchQuery);

    const warehouseData = [];
    for (const w of warehouses) {
      // Aggregate dynamic stock from InventoryLedger
      const ledgers = await InventoryLedger.find({ warehouse: w._id });
      const currentStock = ledgers.reduce((sum, item) => sum + item.quantityChanged, 0);

      const fillPercent = w.capacity > 0 ? parseFloat(((currentStock / w.capacity) * 100).toFixed(1)) : 0;
      
      warehouseData.push({
        id: w._id,
        name: w.name,
        capacity: w.capacity,
        currentStock,
        fillPercent,
        status: w.status
      });
    }

    res.status(200).json({
      success: true,
      data: warehouseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get AI-driven demand forecasts and depletion estimations
// @route   GET /api/v1/analytics/forecasts
// @access  Private
exports.getDemandForecasts = async (req, res) => {
  try {
    const matchQuery = {};
    if (!['admin', 'platform_admin'].includes(req.user.role)) {
      matchQuery.organization = req.user.organizationId || req.user.organization;
    }

    const products = await Product.find(matchQuery);
    const forecasts = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const prod of products) {
      // Aggregate sales of this product in the last 30 days
      const orders = await Order.find({
        createdAt: { $gte: thirtyDaysAgo },
        "orderItems.product": prod._id,
        paymentStatus: { $in: ['Paid', 'Pending'] }
      });

      // Group sales by day index (0 = 30 days ago, 29 = today)
      const dailySales = new Array(30).fill(0);
      orders.forEach(ord => {
        const diffTime = Math.abs(new Date() - new Date(ord.createdAt));
        const diffDays = Math.min(29, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        const index = 29 - diffDays; // map to timeline order
        
        const item = ord.orderItems.find(i => i.product && i.product.toString() === prod._id.toString());
        if (item && index >= 0 && index < 30) {
          dailySales[index] += item.quantity;
        }
      });

      // --- Linear Regression (Trend Slope Math) ---
      // x = Day indexes [0..29], y = dailySales[0..29]
      const n = 30;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += dailySales[i];
        sumXY += i * dailySales[i];
        sumXX += i * i;
      }
      
      // Calculate Slope (m)
      const denominator = (n * sumXX) - (sumX * sumX);
      const slope = denominator !== 0 ? ((n * sumXY) - (sumX * sumY)) / denominator : 0;
      const intercept = (sumY - (slope * sumX)) / n;

      // Calculate Standard Deviation (sigma) for Safety Stock
      const meanSales = sumY / n;
      const variance = dailySales.reduce((sum, val) => sum + Math.pow(val - meanSales, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      // Z-Score for 90% confidence = 1.65 (Safety Stock threshold)
      const safetyStock = parseFloat((1.65 * stdDev).toFixed(2));

      // Calculate predicted velocity including trend extrapolation
      const baseVelocity = meanSales;
      const forecastedDailyVelocity = parseFloat(Math.max(0.01, baseVelocity + (slope * 15)).toFixed(3));
      
      const currentStock = prod.stock || 0;
      let daysToDepletion = 999;
      if (forecastedDailyVelocity > 0.01) {
        daysToDepletion = parseFloat((currentStock / forecastedDailyVelocity).toFixed(1));
      }

      let status = 'SAFE';
      // Restocking trigger based on predicted depletion days
      if (daysToDepletion <= 5) {
        status = 'CRITICAL';
      } else if (daysToDepletion <= 14) {
        status = 'WARNING';
      }

      // Recommended restock = Forecasted velocity for next 30 days + Safety Stock margin - Current inventory
      const recommendedRestock = Math.max(0, Math.ceil((forecastedDailyVelocity * 30) + safetyStock - currentStock));

      const restockDate = new Date();
      if (daysToDepletion !== 999) {
        restockDate.setDate(restockDate.getDate() + Math.min(daysToDepletion, 90));
      }

      forecasts.push({
        productId: prod._id,
        name: prod.name,
        currentStock,
        dailyVelocity: baseVelocity,
        trendSlope: parseFloat(slope.toFixed(4)),
        safetyStock,
        daysToDepletion: daysToDepletion === 999 ? 'No active sales' : daysToDepletion,
        status,
        recommendedRestock,
        targetRestockDate: daysToDepletion === 999 ? 'N/A' : restockDate.toISOString().split('T')[0]
      });
    }

    res.status(200).json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
