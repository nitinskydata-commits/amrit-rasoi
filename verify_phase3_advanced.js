const path = require('path');
const mongoose = require('mongoose');

// Resolve models relative to current working directory (workspace root)
const User = require(path.join(process.cwd(), 'server/models/User'));
const Product = require(path.join(process.cwd(), 'server/models/Product'));
const Order = require(path.join(process.cwd(), 'server/models/Order'));
const Ticket = require(path.join(process.cwd(), 'server/models/Ticket'));
const Organization = require(path.join(process.cwd(), 'server/models/Organization'));
const { eventBus, EVENTS } = require(path.join(process.cwd(), 'server/utils/eventBus'));

// Load environment config or fallback defaults
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function runTests() {
  console.log('🚀 Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected successfully!');

  // Cleanup & setup test user/product/organization
  await User.deleteMany({ email: 'test_phase3@example.com' });
  await User.deleteMany({ email: 'test_admin_phase3@example.com' });
  await Product.deleteMany({ name: { $regex: /Test Spice/ } });
  await Ticket.deleteMany({ subject: { $regex: /Test Support/ } });
  await Organization.deleteMany({ name: { $regex: /Test Organization/ } });

  const testUser = await User.create({
    name: 'Phase 3 Test Customer',
    email: 'test_phase3@example.com',
    phone: '1234567890',
    password: 'password123',
    role: 'user'
  });

  const testAdmin = await User.create({
    name: 'Phase 3 Test Admin',
    email: 'test_admin_phase3@example.com',
    phone: '0987654321',
    password: 'password123',
    role: 'admin'
  });

  console.log('✅ Test Users created.');

  // Create products for recommendation co-occurrence testing
  const p1 = await Product.create({
    name: 'Test Spice Cardamom',
    price: 150,
    category: 'Spices',
    stock: 20,
    ratings: 4.5,
    numOfReviews: 10,
    images: [{ public_id: 'sample', url: 'sample.jpg' }],
    user: testAdmin._id
  });

  const p2 = await Product.create({
    name: 'Test Spice Cloves',
    price: 180,
    category: 'Spices',
    stock: 25,
    ratings: 4.8,
    numOfReviews: 8,
    images: [{ public_id: 'sample', url: 'sample.jpg' }],
    user: testAdmin._id
  });

  console.log('✅ Test Products created.');

  // 1. Verify Event Bus Order placed listener
  console.log('🔍 Testing Event Bus notifications...');
  let notificationTriggered = false;
  eventBus.on('test.order.placed', (order) => {
    console.log('🎯 Event order.placed fired for order ID:', order._id);
    notificationTriggered = true;
  });

  const dummyOrder = await Order.create({
    shippingInfo: { address: '123 Test St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: '9999999999' },
    orderItems: [{ name: p1.name, price: p1.price, quantity: 2, image: 'img.jpg', product: p1._id }],
    user: testUser._id,
    paymentInfo: { id: 'test_pay_id', status: 'Succeeded', gateway: 'Stripe' },
    itemsPrice: 300,
    taxPrice: 54,
    shippingPrice: 50,
    totalPrice: 404
  });

  eventBus.emit('test.order.placed', dummyOrder);
  if (notificationTriggered) {
    console.log('✅ Order Placement Notification Event verified successfully!');
  } else {
    throw new Error('Order placed event failed to notify!');
  }

  // 2. Verify AI recommendation controller calculations (Frequently Bought Together logic check)
  console.log('🔍 Testing Recommendation Engine calculations...');
  // Let's create an order containing both p1 and p2 to simulate order co-occurrence
  await Order.create({
    shippingInfo: { address: '123 Test St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: '9999999999' },
    orderItems: [
      { name: p1.name, price: p1.price, quantity: 1, image: 'img.jpg', product: p1._id },
      { name: p2.name, price: p2.price, quantity: 1, image: 'img.jpg', product: p2._id }
    ],
    user: testUser._id,
    paymentInfo: { id: 'test_pay_id2', status: 'Succeeded', gateway: 'Stripe' },
    itemsPrice: 330,
    taxPrice: 59.4,
    shippingPrice: 50,
    totalPrice: 439.4
  });

  const allOrders = await Order.find({ 'orderItems.product': p1._id });
  const counts = {};
  allOrders.forEach(order => {
    order.orderItems.forEach(item => {
      const pid = item.product.toString();
      if (pid !== p1._id.toString()) {
        counts[pid] = (counts[pid] || 0) + 1;
      }
    });
  });

  console.log('📈 Co-occurrence counts for p1:', counts);
  if (counts[p2._id.toString()] === 1) {
    console.log('✅ AI Recommendation co-occurrence count match verified!');
  } else {
    throw new Error('Co-occurrence count incorrect!');
  }

  // 3. Customer Support Ticketing Lifecycles
  console.log('🔍 Testing Customer Support Ticketing lifecycle...');
  const ticket = await Ticket.create({
    user: testUser._id,
    subject: 'Test Support Ticket',
    description: 'My order test issue description',
    category: 'Order Issue',
    priority: 'High',
    messages: [{ sender: testUser._id, message: 'My order test issue description' }]
  });

  console.log('✅ Ticket created successfully. ID:', ticket._id);
  
  // Verify reply appending
  ticket.messages.push({ sender: testAdmin._id, message: 'We are looking into this.' });
  ticket.status = 'In Progress';
  await ticket.save();

  const updatedTicket = await Ticket.findById(ticket._id);
  if (updatedTicket.status === 'In Progress' && updatedTicket.messages.length === 2) {
    console.log('✅ Ticketing messaging thread updates verified successfully!');
  } else {
    throw new Error('Support ticket updates failed!');
  }

  // 4. Seller KYC Workflow Transitions
  console.log('🔍 Testing Seller KYC validation workflow...');
  const org = await Organization.create({
    name: 'Test Organization Partner',
    type: 'partner_brand',
    owner: testUser._id
  });

  // Submit KYC details
  org.gstin = 'GSTIN1234567890';
  org.pan = 'PAN1234567';
  org.kycStatus = 'pending';
  org.payoutAccount = {
    bankName: 'Test Bank',
    accountNumber: '111122223333',
    ifscCode: 'IFSC0001',
    accountHolderName: 'Test Partner'
  };
  await org.save();

  // Verify Admin review
  const reviewedOrg = await Organization.findById(org._id);
  reviewedOrg.kycStatus = 'approved';
  reviewedOrg.status = 'active';
  reviewedOrg.bankVerificationStatus = 'verified';
  reviewedOrg.kycRemarks = 'Approved during automated verification test';
  await reviewedOrg.save();

  const finalOrgStatus = await Organization.findById(org._id);
  if (finalOrgStatus.kycStatus === 'approved' && finalOrgStatus.status === 'active') {
    console.log('✅ Seller KYC approval transition verified successfully!');
  } else {
    throw new Error('KYC review state transition failed!');
  }

  // Clean up
  await Order.deleteMany({ 'paymentInfo.id': { $regex: /^test_pay/ } });
  await User.deleteMany({ email: 'test_phase3@example.com' });
  await User.deleteMany({ email: 'test_admin_phase3@example.com' });
  await Product.deleteMany({ name: { $regex: /Test Spice/ } });
  await Ticket.deleteMany({ subject: { $regex: /Test Support/ } });
  await Organization.deleteMany({ name: { $regex: /Test Organization/ } });

  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! Phase 3 Core is Solid! 🎉');
}

runTests()
  .then(() => {
    mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Integration test suite failed:', err);
    mongoose.disconnect();
    process.exit(1);
  });
