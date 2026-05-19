const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const User = require('../server/models/User');
const AuditLog = require('../server/models/AuditLog');
const { writeAuditLog } = require('../server/utils/auditLogger');

console.log('🧪 Starting Audit & Compliance log mapping verification...');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // Cleanup old test data
    const orgId = new mongoose.Types.ObjectId();
    await User.deleteMany({ email: 'audit-actor@sbmi.com' });
    await AuditLog.deleteMany({ action: 'TEST_AUDIT_LOG_ENTRY' });

    // Create seed user
    const actor = await User.create({
      name: 'Audit Actor Owner',
      email: 'audit-actor@sbmi.com',
      password: 'password123',
      phone: '987' + Math.floor(1000000 + Math.random() * 9000000),
      role: 'vendor_owner',
      organizationId: orgId,
      tenantId: orgId.toString()
    });

    // Mock Request object containing actor session details
    const req = {
      user: actor,
      ip: '192.168.1.55',
      headers: {
        'user-agent': 'Chrome/Enterprise'
      }
    };

    const targetObjectId = new mongoose.Types.ObjectId();

    // 1. Write structured audit log
    console.log('\n[1/2] Simulating security configuration change write...');
    await writeAuditLog({
      req,
      action: 'TEST_AUDIT_LOG_ENTRY',
      targetModel: 'SystemSettings',
      targetId: targetObjectId,
      previousState: { mfaEnabled: false },
      newState: { mfaEnabled: true },
      metadata: { initiatedBy: 'admin-key' }
    });
    console.log('  Audit log write completed successfully.');

    // 2. Fetch and assert compliance fields
    console.log('\n[2/2] Retrieving audit log entry from database to check mappings...');
    const log = await AuditLog.findOne({ action: 'TEST_AUDIT_LOG_ENTRY', user: actor._id });
    
    if (!log) {
      throw new Error('Assertion Failed: Audit log entry was not persisted');
    }

    console.log(`  Actor Name: ${log.userName}`);
    console.log(`  Actor Role: ${log.role}`);
    console.log(`  Organization: ${log.organization}`);
    console.log(`  IP Address: ${log.ipAddress}`);
    console.log(`  User Agent: ${log.userAgent}`);
    console.log(`  Previous State: ${JSON.stringify(log.previousState)}`);
    console.log(`  New State: ${JSON.stringify(log.newState)}`);

    if (log.userName !== 'Audit Actor Owner' || log.role !== 'vendor_owner') {
      throw new Error('Assertion Failed: Actor details did not match');
    }
    if (log.ipAddress !== '192.168.1.55' || log.userAgent !== 'Chrome/Enterprise') {
      throw new Error('Assertion Failed: Transport headers were not mapped correctly');
    }
    if (log.previousState.mfaEnabled !== false || log.newState.mfaEnabled !== true) {
      throw new Error('Assertion Failed: State variables mapping failed');
    }

    console.log('✅ Audit log details fully mapped and matched security compliance rules!');

    console.log('\n🏆 ALL AUDIT & COMPLIANCE ARCHITECTURE TESTS PASSED!');

    // Cleanup
    await User.deleteMany({ email: 'audit-actor@sbmi.com' });
    await AuditLog.deleteMany({ action: 'TEST_AUDIT_LOG_ENTRY' });
    process.exit(0);

  } catch (error) {
    console.error('❌ Audit Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testSuite();
