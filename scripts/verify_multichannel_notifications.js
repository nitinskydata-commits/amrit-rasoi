const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const User = require('../server/models/User');
const Notification = require('../server/models/Notification');
const { broadcastToRole } = require('../server/utils/notificationService');

console.log('🧪 Starting Multichannel Notification Engine verification...');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // Clean old data
    await User.deleteMany({ email: { $in: ['alert-test-user@sbmi.com'] } });
    await Notification.deleteMany({ title: '🚨 System Alert Check' });

    // 1. Create a Warehouse Manager user
    console.log('\n[1/3] Creating user with warehouse_manager role...');
    const orgId = new mongoose.Types.ObjectId();
    const user = await User.create({
      name: 'Alert Test Warehouse Operator',
      email: 'alert-test-user@sbmi.com',
      password: 'password123',
      phone: '9876' + Math.floor(100000 + Math.random() * 900000),
      role: 'warehouse_manager',
      organizationId: orgId,
      tenantId: orgId.toString()
    });
    console.log(`  Created User: ${user._id} (Org: ${orgId})`);

    // 2. Trigger role-based broadcast
    console.log('\n[2/3] Broadcasting alert to role: warehouse_manager and Org...');
    const result = await broadcastToRole('warehouse_manager', {
      title: '🚨 System Alert Check',
      message: 'This is a test notification for the warehouse manager',
      type: 'warning',
      organization: orgId,
      tenantId: orgId.toString()
    }, orgId);

    console.log(`  Broadcast successfully created ${result.length} notifications.`);
    if (result.length !== 1) {
      throw new Error(`Assertion Failed: Broadcast should target exactly 1 user, got ${result.length}`);
    }

    // 3. Verify database persistence
    console.log('\n[3/3] Querying notifications collection for confirmation...');
    const persistentAlert = await Notification.findOne({ recipient: user._id, title: '🚨 System Alert Check' });
    if (!persistentAlert) {
      throw new Error('Assertion Failed: Notification was not persisted in database');
    }
    console.log(`  Found Notification in DB: [${persistentAlert.title}] - ${persistentAlert.message}`);
    console.log('✅ DB persistence and mapping confirmed!');

    console.log('\n🏆 ALL MULTICHANNEL NOTIFICATION TESTS PASSED!');

    // Cleanup
    await User.deleteMany({ email: { $in: ['alert-test-user@sbmi.com'] } });
    await Notification.deleteMany({ title: '🚨 System Alert Check' });
    process.exit(0);

  } catch (error) {
    console.error('❌ Notification Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testSuite();
