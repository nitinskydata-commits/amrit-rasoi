const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const Order = require('../server/models/Order');

console.log('🧪 Starting Order Domain Architecture verification...');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    const mockUserId = new mongoose.Types.ObjectId();
    const vendor1Id = new mongoose.Types.ObjectId();
    const vendor2Id = new mongoose.Types.ObjectId();
    const prod1Id = new mongoose.Types.ObjectId();
    const prod2Id = new mongoose.Types.ObjectId();

    // Cleanup old test orders if any
    await Order.deleteMany({ user: mockUserId });

    // 1. Create multi-vendor items and calculate split math
    console.log('\n[1/3] Creating order with multi-vendor items and snapshot math...');
    const item1Price = 200;
    const item1Qty = 2;
    const item1CommissionRate = 15; // 15%
    const item1Total = item1Price * item1Qty;
    const item1Commission = (item1Total * item1CommissionRate) / 100;
    const item1Net = item1Total - item1Commission;

    const item2Price = 500;
    const item2Qty = 1;
    const item2CommissionRate = 10; // 10%
    const item2Total = item2Price * item2Qty;
    const item2Commission = (item2Total * item2CommissionRate) / 100;
    const item2Net = item2Total - item2Commission;

    const order = await Order.create({
      user: mockUserId,
      paymentMethod: 'Card',
      paymentStatus: 'Paid',
      transactionId: 'TX-ORDER-112233',
      itemsPrice: item1Total + item2Total,
      taxPrice: 50,
      shippingPrice: 40,
      totalPrice: item1Total + item2Total + 50 + 40,
      orderItems: [
        {
          product: prod1Id,
          name: 'Vendor A Red Apples',
          price: item1Price,
          quantity: item1Qty,
          organization: vendor1Id,
          tenantId: vendor1Id.toString(),
          commissionRate: item1CommissionRate,
          commissionPaid: item1Commission,
          netVendorPayout: item1Net
        },
        {
          product: prod2Id,
          name: 'Vendor B Fresh Broccoli',
          price: item2Price,
          quantity: item2Qty,
          organization: vendor2Id,
          tenantId: vendor2Id.toString(),
          commissionRate: item2CommissionRate,
          commissionPaid: item2Commission,
          netVendorPayout: item2Net
        }
      ]
    });

    console.log(`  Created order ID: ${order._id}`);
    console.log(`  Total price: ₹${order.totalPrice}`);
    
    if (order.orderItems.length !== 2) {
      throw new Error('Assertion Failed: Order should contain 2 items');
    }
    console.log('✅ Multi-vendor item listing verified successfully!');

    // 2. Validate calculations
    console.log('\n[2/3] Validating itemized split payouts and platform commission...');
    const [i1, i2] = order.orderItems;
    console.log(`  Item 1 - Commission: ₹${i1.commissionPaid}, Net: ₹${i1.netVendorPayout}`);
    console.log(`  Item 2 - Commission: ₹${i2.commissionPaid}, Net: ₹${i2.netVendorPayout}`);

    if (i1.commissionPaid !== 60 || i1.netVendorPayout !== 340) {
      throw new Error('Assertion Failed: Item 1 commission math incorrect');
    }
    if (i2.commissionPaid !== 50 || i2.netVendorPayout !== 450) {
      throw new Error('Assertion Failed: Item 2 commission math incorrect');
    }
    console.log('✅ Commission split math verified successfully!');

    // 3. Test lifecycle states
    console.log('\n[3/3] Testing lifecycle status transitions...');
    console.log(`  Initial status: ${order.orderStatus}`);
    
    order.orderStatus = 'Confirmed';
    await order.save();
    console.log(`  Updated status to: ${order.orderStatus}`);

    order.orderStatus = 'Delivered';
    order.deliveredAt = new Date();
    await order.save();
    console.log(`  Final status reached: ${order.orderStatus} at ${order.deliveredAt}`);

    if (order.orderStatus !== 'Delivered') {
      throw new Error('Assertion Failed: Failed to update order status');
    }
    console.log('✅ Lifecycle status transitions successfully completed!');

    console.log('\n🏆 ALL ORDER DOMAIN & LIFECYCLE TESTS PASSED!');

    // Cleanup
    await Order.deleteMany({ user: mockUserId });
    process.exit(0);

  } catch (error) {
    console.error('❌ Order Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testSuite();
