const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const Order = require('../server/models/Order');
const AuditLog = require('../server/models/AuditLog');
const { sendDeliveryOTP, verifyDeliveryOTP } = require('../server/controllers/adminController');

console.log('🧪 Starting Shipping & Doorstep Delivery OTP handshake verification...');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    const mockUserId = new mongoose.Types.ObjectId();
    const order = await Order.create({
      user: mockUserId,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Shipped',
      itemsPrice: 400,
      taxPrice: 10,
      shippingPrice: 30,
      totalPrice: 440
    });

    console.log(`  Mock Order created: #${order._id.toString().substring(18)}`);

    // Mock Express request/response objects
    const req = {
      params: { id: order._id.toString() },
      body: {},
      headers: {
        'x-forwarded-for': '127.0.0.1'
      },
      connection: {
        remoteAddress: '127.0.0.1'
      },
      user: {
        _id: mockUserId,
        name: 'Mock Driver',
        role: 'delivery_boy'
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

    // 1. Send Delivery OTP
    console.log('\n[1/3] Triggering sendDeliveryOTP endpoint...');
    await sendDeliveryOTP(req, res);
    
    if (!res.data.success) {
      throw new Error(`Assertion Failed: sendDeliveryOTP failed: ${res.data.message}`);
    }

    const updatedOrder = await Order.findById(order._id);
    console.log(`  Saved OTP in Database: ${updatedOrder.deliveryOTP}`);
    if (!updatedOrder.deliveryOTP || updatedOrder.deliveryOTP.length !== 6) {
      throw new Error('Assertion Failed: 6-digit OTP not generated or saved');
    }
    console.log('✅ OTP code correctly saved to order document!');

    // 2. Verify with wrong OTP
    console.log('\n[2/3] Verifying delivery status rejection with invalid OTP...');
    req.body.otp = '999999'; // Incorrect OTP
    await verifyDeliveryOTP(req, res);

    if (res.statusCode !== 400 || res.data.success) {
      throw new Error('Assertion Failed: Wrong OTP should be rejected with status code 400');
    }
    console.log('✅ Invalid OTP correctly rejected!');

    // 3. Verify with correct OTP
    console.log('\n[3/3] Verifying delivery verification and payment settlement on correct OTP...');
    req.body.otp = updatedOrder.deliveryOTP;
    await verifyDeliveryOTP(req, res);

    if (!res.data.success || res.statusCode !== 200) {
      throw new Error(`Assertion Failed: Correct OTP failed: ${res.data.message}`);
    }

    const finalizedOrder = await Order.findById(order._id);
    console.log(`  Final orderStatus: ${finalizedOrder.orderStatus}`);
    console.log(`  Final paymentStatus: ${finalizedOrder.paymentStatus}`);
    console.log(`  Final deliveryOTP value (cleared): ${finalizedOrder.deliveryOTP}`);

    if (finalizedOrder.orderStatus !== 'Delivered' || finalizedOrder.paymentStatus !== 'Paid' || finalizedOrder.deliveryOTP !== null) {
      throw new Error('Assertion Failed: Order was not finalized correctly upon correct OTP verification');
    }
    console.log('✅ Doorstep verification handshake completed successfully!');

    console.log('\n🏆 ALL LOGISTICS OTP HANDSHAKE TESTS PASSED!');

    // Cleanup
    await Order.deleteMany({ user: mockUserId });
    await AuditLog.deleteMany({ targetId: order._id });
    process.exit(0);

  } catch (error) {
    console.error('❌ Logistics OTP Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testSuite();
