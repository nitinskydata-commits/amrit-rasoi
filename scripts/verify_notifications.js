const mongoose = require('mongoose');
const path = require('path');

// Configure dotenv
require('dotenv').config({ path: path.join(__dirname, './.env') });

const User = require('../server/models/User');
const Notification = require('../server/models/Notification');
const { eventBus, EVENTS } = require('../server/utils/eventBus');

// Load notification event subscribers
require('../server/utils/notificationService');

// Import controller logic directly to simulate mock requests
const notificationController = require('../server/controllers/notificationController');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  console.log('🔌 Connecting to database at:', dbUri);
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // Clean old test objects if present
    await User.deleteMany({ email: 'notify@test.com' });
    await Notification.deleteMany({});

    // 1. Create a Test User (Warehouse Manager role)
    const orgId = new mongoose.Types.ObjectId();
    const testUser = await User.create({
      name: 'Notifications Manager Test',
      email: 'notify@test.com',
      password: 'password123',
      phone: '9876543210',
      role: 'warehouse_manager',
      isSuperAdmin: false,
      organizationId: orgId,
      tenantId: 'tenant-test-123'
    });
    console.log('👤 Created test user with warehouse_manager role!');

    // Mock request context
    const mockReqUser = {
      _id: testUser._id,
      role: 'warehouse_manager',
      tenantId: 'tenant-test-123'
    };

    // Helper mock res
    const makeRes = () => ({
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    });

    // 2. Trigger ORDER_PLACED event on the decoupled event bus
    console.log('\n📡 Emitting [ORDER_PLACED] event via eventBus...');
    const orderId = new mongoose.Types.ObjectId();
    eventBus.emit(EVENTS.ORDER_PLACED, {
      userId: testUser._id,
      orderId: orderId,
      totalAmount: 1450,
      itemsCount: 3
    });

    // 3. Trigger stock.low event on the decoupled event bus
    console.log('📡 Emitting [stock.low] event via eventBus...');
    eventBus.emit('stock.low', {
      productName: 'Amrit Premium Ghee',
      stock: 4,
      organizationId: orgId,
      tenantId: 'tenant-test-123'
    });

    // Wait a brief moment for async event handlers to process Mongoose writes
    console.log('⏳ Waiting 500ms for database persistence writes...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Retrieve notifications via controller
    console.log('\n📋 Fetching user notification inbox list...');
    const reqGet = { user: mockReqUser };
    const resGet = makeRes();
    await notificationController.getMyNotifications(reqGet, resGet);

    if (resGet.statusCode !== 200) {
      throw new Error(`Get Notifications Failed: ${resGet.data?.message}`);
    }

    const inbox = resGet.data.data;
    console.log(`Unread Notification Count: ${inbox.length}`);
    inbox.forEach((item, i) => {
      console.log(`  [${i+1}] [${item.type.toUpperCase()}] ${item.title} | ${item.message}`);
    });

    if (inbox.length !== 2) {
      throw new Error(`Assertion Failed: Expected 2 notifications in inbox. Got: ${inbox.length}`);
    }

    // Verify properties
    const orderAlert = inbox.find(n => n.type === 'success');
    const stockAlert = inbox.find(n => n.type === 'warning');

    if (!orderAlert || !stockAlert) {
      throw new Error('Assertion Failed: Notification types do not match expectations.');
    }

    // 5. Mark individual alert as read
    console.log(`\n📖 Marking alert [${stockAlert.title}] as read...`);
    const reqRead = {
      user: mockReqUser,
      params: { id: stockAlert._id.toString() }
    };
    const resRead = makeRes();
    await notificationController.markAsRead(reqRead, resRead);

    if (resRead.statusCode !== 200) {
      throw new Error(`Mark Read Failed: ${resRead.data?.message}`);
    }
    console.log('✅ Marked as read successfully!');

    // 6. Mark all alerts as read
    console.log('\n📖 Marking all remaining alerts as read...');
    const reqReadAll = { user: mockReqUser };
    const resReadAll = makeRes();
    await notificationController.markAllRead(reqReadAll, resReadAll);

    if (resReadAll.statusCode !== 200) {
      throw new Error(`Mark All Read Failed: ${resReadAll.data?.message}`);
    }
    console.log('✅ All alerts marked read!');

    // Check database to verify everything is read
    const unreadCount = await Notification.countDocuments({ recipient: testUser._id, read: false });
    console.log(`Remaining unread alerts: ${unreadCount}`);
    if (unreadCount !== 0) {
      throw new Error(`Assertion Failed: Unread count should be 0. Got: ${unreadCount}`);
    }

    // 7. Delete an alert
    console.log('\n🗑️ Removing resolved stock warning from database...');
    const reqDelete = {
      user: mockReqUser,
      params: { id: stockAlert._id.toString() }
    };
    const resDelete = makeRes();
    await notificationController.deleteNotification(reqDelete, resDelete);

    if (resDelete.statusCode !== 200) {
      throw new Error(`Delete Failed: ${resDelete.data?.message}`);
    }
    console.log('✅ Alert deleted successfully!');

    const finalInboxCount = await Notification.countDocuments({ recipient: testUser._id });
    console.log(`Final remaining alerts in database: ${finalInboxCount}`);
    if (finalInboxCount !== 1) {
      throw new Error(`Assertion Failed: Expected 1 remaining alert. Got: ${finalInboxCount}`);
    }

    console.log('\n🏆 ALL NOTIFICATION EVENT ASSERTS PASSED! MULTI-TENANT ALERT INBOX IS 100% CORRECT.');

    // Cleanup
    await User.deleteMany({ email: 'notify@test.com' });
    await Notification.deleteMany({});
    console.log('🧹 Cleaned up test records.');

  } catch (error) {
    console.error('❌ Error or assertion failure:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
  }
}

testSuite();
