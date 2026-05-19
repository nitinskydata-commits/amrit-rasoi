const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const Product = require('../server/models/Product');
const Organization = require('../server/models/Organization');

console.log('🧪 Starting Scaling Architecture & Shard-Key Index verification...');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // 1. Verify Product Shard Indexes
    console.log('\n[1/2] Verifying Product collection compound indexes...');
    const productIndexes = await Product.collection.indexes();
    console.log('  Found Product Indexes:');
    productIndexes.forEach(idx => {
      console.log(`    - Name: ${idx.name}, Keys: ${JSON.stringify(idx.key)}`);
    });

    // Check if index on tenantId exists
    const hasProductTenantIdx = productIndexes.some(idx => idx.key.tenantId !== undefined);
    const hasProductOrgIdx = productIndexes.some(idx => idx.key.organization !== undefined);

    if (!hasProductTenantIdx || !hasProductOrgIdx) {
      throw new Error('Assertion Failed: Product collection does not have tenantId/organization indexes');
    }
    console.log('✅ Product shard and tenancy indexes confirmed!');

    // 2. Verify Organization Tenant Indexes
    console.log('\n[2/2] Verifying Organization collection indexes...');
    const orgIndexes = await Organization.collection.indexes();
    console.log('  Found Organization Indexes:');
    orgIndexes.forEach(idx => {
      console.log(`    - Name: ${idx.name}, Keys: ${JSON.stringify(idx.key)}`);
    });

    const hasOrgTenantIdx = orgIndexes.some(idx => idx.key.tenantId !== undefined);
    if (!hasOrgTenantIdx) {
      throw new Error('Assertion Failed: Organization collection does not have tenantId index');
    }
    console.log('✅ Organization tenant indexes confirmed!');

    console.log('\n🏆 ALL SCALING & SHARDING DATABASE INDEX TESTS PASSED!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Scaling Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testSuite();
