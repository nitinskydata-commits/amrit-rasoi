const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const Order = require('../server/models/Order');
const Warehouse = require('../server/models/Warehouse');
const Product = require('../server/models/Product');
const InventoryLedger = require('../server/models/InventoryLedger');
const { getSalesAnalytics, getInventoryAnalytics, getDemandForecasts } = require('../server/controllers/analyticsController');

console.log('🧪 Starting Analytics & Forecasting Pipeline verification...');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    const User = require('../server/models/User');
    // Cleanup old test data
    const orgId = new mongoose.Types.ObjectId();
    await Order.deleteMany({ 'orderItems.name': 'Forecasting Apple Seed' });
    await Warehouse.deleteMany({ name: 'Forecasting Analytics Warehouse' });
    await Product.deleteMany({ name: 'Forecasting Apple Seed' });
    await InventoryLedger.deleteMany({ reason: 'Analytics Test Seed' });
    await User.deleteMany({ email: 'analytics-test-user@sbmi.com' });

    const mockUserObj = await User.create({
      name: 'Analytics Test User',
      email: 'analytics-test-user@sbmi.com',
      password: 'password123',
      phone: '987' + Math.floor(1000000 + Math.random() * 9000000),
      role: 'user'
    });

    // Seed mock data
    const p1 = await Product.create({
      name: 'Forecasting Apple Seed',
      price: 100,
      stock: 10,
      category: 'Grocery',
      organization: orgId,
      tenantId: orgId.toString()
    });

    const w1 = await Warehouse.create({
      name: 'Forecasting Analytics Warehouse',
      code: 'WH-ANALYTICS-TEST',
      capacity: 50,
      status: 'active',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: '123 Main Road',
      organization: orgId,
      tenantId: orgId.toString()
    });

    await InventoryLedger.create({
      product: p1._id,
      warehouse: w1._id,
      quantityChanged: 25,
      transactionType: 'intake',
      reason: 'Analytics Test Seed',
      organization: orgId,
      tenantId: orgId.toString()
    });

    // Create 30 orders over past 30 days to check sales aggregates & velocity
    console.log('\n[1/3] Seeding sales history to calculate daily velocity...');
    const orderItems = [{
      product: p1._id,
      name: p1.name,
      price: 100,
      quantity: 3,
      organization: orgId,
      tenantId: orgId.toString()
    }];

    for (let i = 0; i < 5; i++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - i * 3);
      await Order.create({
        user: mockUserObj._id,
        orderItems,
        totalPrice: 300,
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        organization: orgId,
        tenantId: orgId.toString(),
        createdAt: orderDate
      });
    }

    // Mock request/response objects
    const req = {
      user: {
        role: 'vendor_owner',
        organizationId: orgId,
        organization: orgId
      }
    };

    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    };

    // 1. Test sales analytics timeline output
    console.log('\nTesting getSalesAnalytics pipeline aggregates...');
    await getSalesAnalytics(req, res);
    if (!res.data.success || !Array.isArray(res.data.data) || res.data.data.length !== 30) {
      throw new Error(`Assertion Failed: Sales timeline did not return contiguous 30 days`);
    }
    const salesTotal = res.data.data.reduce((sum, d) => sum + d.sales, 0);
    console.log(`  Contiguous days returned: ${res.data.data.length} days. Total Aggregated Sales: ₹${salesTotal}`);
    if (salesTotal !== 1500) {
      throw new Error(`Assertion Failed: Expected total sales to be 1500, got ${salesTotal}`);
    }
    console.log('✅ Sales timeline aggregates verified successfully!');

    // 2. Test inventory allocation analytics
    console.log('\nTesting getInventoryAnalytics allocation & capacity...');
    await getInventoryAnalytics(req, res);
    if (!res.data.success || res.data.data.length !== 1) {
      throw new Error(`Assertion Failed: Expected 1 warehouse in output`);
    }
    const whInfo = res.data.data[0];
    console.log(`  Warehouse Capacity: ${whInfo.capacity}, Current Stock: ${whInfo.currentStock}, Fill: ${whInfo.fillPercent}%`);
    if (whInfo.currentStock !== 25 || whInfo.fillPercent !== 50) {
      throw new Error(`Assertion Failed: Expected currentStock=25, fillPercent=50`);
    }
    console.log('✅ Inventory capacity allocation math verified successfully!');

    // 3. Test predictive demand forecasting & depletion math
    console.log('\nTesting getDemandForecasts AI velocity depletion estimates...');
    await getDemandForecasts(req, res);
    if (!res.data.success || res.data.data.length !== 1) {
      throw new Error(`Assertion Failed: Expected 1 product forecast entry`);
    }
    const fc = res.data.data[0];
    console.log(`  Product: ${fc.name}`);
    console.log(`  Daily Sales Velocity: ${fc.dailyVelocity} units/day`);
    console.log(`  Trend Slope Coefficient: ${fc.trendSlope}`);
    console.log(`  Calculated Safety Stock: ${fc.safetyStock} units`);
    console.log(`  Days to Depletion: ${fc.daysToDepletion} days`);
    console.log(`  Replenishment Recommendation: Restock ${fc.recommendedRestock} units`);
    console.log(`  Stock Alert Status: ${fc.status}`);

    if (fc.dailyVelocity !== 0.5) {
      throw new Error(`Assertion Failed: Expected daily velocity of 0.5 (15 units sold / 30 days)`);
    }
    if (fc.trendSlope === undefined || fc.safetyStock === undefined || fc.recommendedRestock === undefined) {
      throw new Error(`Assertion Failed: AI regression constants or safety stock parameters were not returned`);
    }
    console.log('✅ AI Predictive velocity depletion math verified successfully!');

    console.log('\n🏆 ALL ANALYTICS & FORECASTING TESTS PASSED!');

    // Cleanup
    await Order.deleteMany({ 'orderItems.name': 'Forecasting Apple Seed' });
    await Warehouse.deleteMany({ name: 'Forecasting Analytics Warehouse' });
    await Product.deleteMany({ name: 'Forecasting Apple Seed' });
    await InventoryLedger.deleteMany({ reason: 'Analytics Test Seed' });
    await User.deleteMany({ email: 'analytics-test-user@sbmi.com' });
    process.exit(0);

  } catch (error) {
    console.error('❌ Analytics Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testSuite();
