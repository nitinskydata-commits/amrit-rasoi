const mongoose = require('mongoose');
const path = require('path');

// Configure dotenv
require('dotenv').config({ path: path.join(__dirname, './.env') });

const Organization = require('../server/models/Organization');
const Product = require('../server/models/Product');
const Warehouse = require('../server/models/Warehouse');
const InventoryLedger = require('../server/models/InventoryLedger');
const User = require('../server/models/User');

// Import controller logic directly to simulate mock requests
const warehouseController = require('../server/controllers/warehouseController');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  console.log('🔌 Connecting to database at:', dbUri);
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // Clean old test objects if present
    await Warehouse.deleteMany({ code: { $in: ['WH-TEST-MUM', 'WH-TEST-PNE'] } });
    await Organization.deleteMany({ name: 'Logistics Test Co' });
    await Product.deleteMany({ name: { $in: ['Logistics Test Apples', 'Logistics Test Oranges'] } });
    await InventoryLedger.deleteMany({});

    // 1. Create Test Organization
    const org = await Organization.create({
      name: 'Logistics Test Co',
      type: 'vendor',
      contactEmail: 'logistics@test.com',
      commissionRate: 12
    });
    console.log('🏢 Created test Organization!');

    // 2. Create Test Product
    const product = await Product.create({
      name: 'Logistics Test Apples',
      price: 150,
      mrp: 180,
      stock: 0,
      category: 'Organic',
      organization: org._id,
      tenantId: org._id.toString()
    });
    const product2 = await Product.create({
      name: 'Logistics Test Oranges',
      price: 120,
      mrp: 140,
      stock: 0,
      category: 'Organic',
      organization: org._id,
      tenantId: org._id.toString()
    });
    console.log('🍎 Created test Products with 0 stock!');

    // Mock request context
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      role: 'admin',
      isSuperAdmin: true,
      tenantId: org._id.toString(),
      organizationId: org._id
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

    // 3. Create two Warehouses (Mumbai directly, Pune via controller to test auto-code generation)
    const mumbaiHub = await Warehouse.create({
      name: 'Mumbai Central Hub',
      code: 'WH-TEST-MUM',
      address: 'Sector 5, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      capacity: 5000,
      organization: org._id,
      tenantId: org._id.toString()
    });

    const reqCreatePune = {
      user: mockUser,
      body: {
        name: 'Pune Distribution Point',
        address: 'Wakad Road, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        capacity: 2000,
        organization: org._id
      }
    };
    const resCreatePune = makeRes();
    await warehouseController.createWarehouse(reqCreatePune, resCreatePune);
    if (resCreatePune.statusCode !== 201) {
      throw new Error(`Pune Hub creation failed: ${resCreatePune.data?.message}`);
    }
    const puneHub = resCreatePune.data.data;
    console.log(`📦 Created Warehouses: Mumbai and Pune! (Pune Auto-Generated Code: ${puneHub.code})`);

    // 4. Perform stock intake: 100 units into Mumbai Central
    console.log('\n📥 Injecting 100 units of Apples and 50 units of Oranges into Mumbai Central via bulk intake list...');
    const reqIntake = {
      user: mockUser,
      body: {
        warehouseId: mumbaiHub._id,
        reason: 'Initial production intake',
        products: [
          { productId: 'Logistics Test Apples', quantity: 100 },
          { productId: 'Logistics Test Oranges', quantity: 50 }
        ]
      }
    };
    const resIntake = makeRes();
    await warehouseController.intakeStock(reqIntake, resIntake);
    
    if (resIntake.statusCode !== 200) {
      throw new Error(`Intake Failed: ${resIntake.data?.message}`);
    }
    console.log('✅ Bulk intake complete!');

    // Assertions
    const prodAfterIntake = await Product.findById(product._id);
    const prod2AfterIntake = await Product.findById(product2._id);
    console.log(`Product Apples total catalog stock count: ${prodAfterIntake.stock}`);
    console.log(`Product Oranges total catalog stock count: ${prod2AfterIntake.stock}`);
    if (prodAfterIntake.stock !== 100) throw new Error('Assertion Failed: Aggregated catalog stock must be 100!');
    if (prod2AfterIntake.stock !== 50) throw new Error('Assertion Failed: Oranges catalog stock must be 50!');

    // 5. Transfer 40 units from Mumbai to Pune
    console.log('\n🚛 Transferring 40 units from Mumbai Central to Pune...');
    const reqTransfer = {
      user: mockUser,
      body: {
        productId: product._id,
        fromWarehouseId: mumbaiHub._id,
        toWarehouseId: puneHub._id,
        quantity: 40,
        reason: 'Relocating to Pune store'
      }
    };
    const resTransfer = makeRes();
    await warehouseController.transferStock(reqTransfer, resTransfer);

    if (resTransfer.statusCode !== 200) {
      throw new Error(`Transfer Failed: ${resTransfer.data?.message}`);
    }
    console.log('✅ Transfer complete!');

    // Assertions after transfer
    const reqMumbStock = { params: { id: mumbaiHub._id.toString() }, user: mockUser };
    const resMumbStock = makeRes();
    await warehouseController.getWarehouseStock(reqMumbStock, resMumbStock);

    const reqPuneStock = { params: { id: puneHub._id.toString() }, user: mockUser };
    const resPuneStock = makeRes();
    await warehouseController.getWarehouseStock(reqPuneStock, resPuneStock);

    const mumbaiStockCount = resMumbStock.data?.data?.[0]?.stock || 0;
    const puneStockCount = resPuneStock.data?.data?.[0]?.stock || 0;

    console.log(`Mumbai Hub stock: ${mumbaiStockCount}`);
    console.log(`Pune Hub stock: ${puneStockCount}`);

    if (mumbaiStockCount !== 60) throw new Error(`Assertion Failed: Mumbai stock must be 60. Got: ${mumbaiStockCount}`);
    if (puneStockCount !== 40) throw new Error(`Assertion Failed: Pune stock must be 40. Got: ${puneStockCount}`);

    const prodAfterTransfer = await Product.findById(product._id);
    console.log(`Unified Product catalog stock count: ${prodAfterTransfer.stock}`);
    if (prodAfterTransfer.stock !== 100) throw new Error('Assertion Failed: Aggregate count must remain 100!');

    console.log('\n📋 Fetching and verifying inventory ledger history...');
    const reqLedger = { user: mockUser };
    const resLedger = makeRes();
    
    // Direct diagnostic queries
    const allRawLedgers = await InventoryLedger.find({});
    console.log(`Diagnostic: Raw entries in DB: ${allRawLedgers.length}`);
    if (allRawLedgers.length > 0) {
      console.log('Sample Raw Ledger entry:', JSON.stringify(allRawLedgers[0], null, 2));
    }
    
    const { scopeQueryForActor: testScope } = require('../server/utils/accessControl');
    console.log('Diagnostic: scopeQueryForActor(mockUser) result:', JSON.stringify(testScope(mockUser), null, 2));

    await warehouseController.getStockLedger(reqLedger, resLedger);

    console.log('Diagnostic: resLedger.data response is:', JSON.stringify(resLedger.data, null, 2));
    const ledgerEntries = resLedger.data?.data || [];
    console.log(`Ledger entry count: ${ledgerEntries.length}`);
    ledgerEntries.forEach((entry, i) => {
      console.log(`  [${i+1}] ${entry.transactionType}: ${entry.quantityChanged} units (${entry.reason})`);
    });

    if (ledgerEntries.length !== 4) throw new Error(`Assertion Failed: Expected 4 ledger records, found: ${ledgerEntries.length}`);

    console.log('\n🏆 ALL LOGISTICS ASSERTS PASSED! MULTI-LOCATION MATH IS 100% CORRECT.');

    // Cleanup
    await Warehouse.deleteMany({ code: { $in: ['WH-TEST-MUM', 'WH-TEST-PNE'] } });
    await Organization.deleteMany({ name: 'Logistics Test Co' });
    await Product.deleteMany({ name: { $in: ['Logistics Test Apples', 'Logistics Test Oranges'] } });
    await InventoryLedger.deleteMany({ product: { $in: [product._id, product2._id] } });
    console.log('🧹 Cleaned up test records.');

  } catch (error) {
    console.error('❌ Error or assertion failure:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
  }
}

testSuite();
