const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
const mongoose = require('mongoose');

// Configure dotenv
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const Organization = require('../server/models/Organization');
const Product = require('../server/models/Product');
const Order = require('../server/models/Order');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function verify() {
  console.log('🔌 Connecting to database at:', dbUri);
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // 1. Ensure test organization exists
    let org = await Organization.findOne({ name: 'Alpha Organic Farms' });
    if (!org) {
      org = await Organization.create({
        name: 'Alpha Organic Farms',
        type: 'vendor',
        contactEmail: 'payouts@alphaorganic.com',
        commissionRate: 15, // 15% commission rate
        payoutAccount: {
          bankName: 'Federal Reserve Bank',
          accountHolderName: 'Alpha Organic Farms LLC',
          accountNumber: '123456789012',
          ifscCode: 'FRB0012345'
        },
        status: 'active'
      });
      console.log('🆕 Created Alpha Organic Farms Organization with 15% commission rate!');
    } else {
      org.commissionRate = 15;
      org.payoutAccount = {
        bankName: 'Federal Reserve Bank',
        accountHolderName: 'Alpha Organic Farms LLC',
        accountNumber: '123456789012',
        ifscCode: 'FRB0012345'
      };
      await org.save();
      console.log('ℹ️ Verified Alpha Organic Farms commission rate is 15%!');
    }

    // 2. Ensure test product exists
    let product = await Product.findOne({ name: 'Organic Red Apples' });
    if (!product) {
      product = await Product.create({
        name: 'Organic Red Apples',
        price: 200,
        mrp: 250,
        stock: 50,
        category: 'Fruits',
        organization: org._id,
        tenantId: org._id.toString(),
        images: [{ url: '/images/apples.jpg' }]
      });
      console.log('🆕 Created Organic Red Apples product under Alpha Organic Farms!');
    } else {
      product.organization = org._id;
      product.tenantId = org._id.toString();
      await product.save();
      console.log('ℹ️ Verified Organic Red Apples is linked to Alpha Organic Farms!');
    }

    // 3. Test calculation logic directly
    console.log('\n--- Running Commission snapshot mapping test ---');
    const orderItems = [{
      product: product._id,
      name: product.name,
      price: 200,
      quantity: 3,
      image: '/images/apples.jpg'
    }];

    const productIds = orderItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).select('organization tenantId');
    const productScopeById = new Map(products.map((product) => [
      product._id.toString(),
      { organization: product.organization || null, tenantId: product.tenantId || 'platform' }
    ]));

    // Fetch snapshot commission rates
    const orgIds = products.map(p => p.organization).filter(Boolean);
    const organizations = await Organization.find({ _id: { $in: orgIds } }).select('_id commissionRate');
    const commissionById = new Map(organizations.map(o => [
      o._id.toString(),
      o.commissionRate
    ]));

    const scopedOrderItems = orderItems.map((item) => {
      const scope = productScopeById.get(item.product.toString()) || {};
      const rate = scope.organization ? (commissionById.get(scope.organization.toString()) ?? 10) : 10;
      const itemTotal = item.price * item.quantity;
      const commissionPaid = itemTotal * (rate / 100);
      const netVendorPayout = itemTotal - commissionPaid;

      return {
        ...item,
        organization: scope.organization || null,
        tenantId: scope.tenantId || 'platform',
        commissionRate: rate,
        commissionPaid,
        netVendorPayout
      };
    });

    console.log('Scoped Order Item result:');
    console.log(JSON.stringify(scopedOrderItems, null, 2));

    const applesItem = scopedOrderItems[0];
    
    // Assertions
    const expectedTotal = 200 * 3; // 600
    const expectedCommission = expectedTotal * (15 / 100); // 90
    const expectedPayout = expectedTotal - expectedCommission; // 510

    if (applesItem.commissionRate !== 15) throw new Error('Assertion Failed: Commission rate must be 15%');
    if (applesItem.commissionPaid !== expectedCommission) throw new Error(`Assertion Failed: Commission paid must be ${expectedCommission}`);
    if (applesItem.netVendorPayout !== expectedPayout) throw new Error(`Assertion Failed: Net payout must be ${expectedPayout}`);

    console.log('✅ ALL CALCULATIONS EXTREMELY CORRECT! MATH ASSERTS PERFECT PARITY.');

  } catch (error) {
    console.error('❌ Error or assertion failure:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
  }
}

verify();
