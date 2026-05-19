module.paths.push('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/node_modules');
const mongoose = require('mongoose');

const Product = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/Product');
const Order = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/Order');
const Warehouse = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/Warehouse');
const Organization = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/Organization');
const User = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/User');
const Wishlist = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/Wishlist');

const wishlistController = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/controllers/wishlistController');
const orderController = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/controllers/orderController');
const invoiceController = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/controllers/invoiceController');

const dbUri = 'mongodb://127.0.0.1:27017/amrit_rasoi';

// Helper mock res
const makeRes = () => ({
  statusCode: 200,
  headers: {},
  setHeader(name, val) {
    this.headers[name] = val;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.data = data;
    return this;
  },
  send(body) {
    this.body = body;
    return this;
  }
});

async function runTests() {
  console.log('🔌 Connecting to database at:', dbUri);
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // Cleanup existing test records
    await Warehouse.deleteMany({ code: { $in: ['WH-TEST-MUM', 'WH-TEST-RAJ'] } });
    await Organization.deleteMany({ name: 'Test Wishlist Vendor' });
    await Product.deleteMany({ name: { $in: ['Test Masala Powder', 'Test Cumin Seeds'] } });
    await User.deleteMany({ email: 'test_wishlist_user@sbmi.org' });
    await Wishlist.deleteMany({});
    await Order.deleteMany({ invoiceNumber: /^INV-/ });

    // 1. Setup Test User
    const user = await User.create({
      name: 'Test Wishlist Customer',
      email: 'test_wishlist_user@sbmi.org',
      phone: '9999988888',
      role: 'user',
      password: 'password123'
    });

    // 2. Setup Test Org & Warehouses
    const vendor = await Organization.create({
      name: 'Test Wishlist Vendor',
      type: 'vendor',
      contactEmail: 'wishlistvendor@test.com',
      commissionRate: 10,
      address: {
        line1: 'Vendor Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      }
    });

    const whMumbai = await Warehouse.create({
      name: 'Mumbai Warehouse',
      code: 'WH-TEST-MUM',
      state: 'Maharashtra',
      city: 'Mumbai',
      capacity: 5000,
      currentLoad: 100
    });

    const whJaipur = await Warehouse.create({
      name: 'Jaipur Warehouse',
      code: 'WH-TEST-RAJ',
      state: 'Rajasthan',
      city: 'Jaipur',
      capacity: 5000,
      currentLoad: 50
    });

    // 3. Setup Test Products with specific variant sizes
    const product1 = await Product.create({
      name: 'Test Masala Powder',
      description: 'Premium spices blend',
      price: 200,
      mrp: 250,
      category: 'Masalas',
      organization: vendor._id,
      images: [{ public_id: 'img1', url: 'http://image1.jpg' }],
      stock: 100,
      variants: [{
        _id: new mongoose.Types.ObjectId(),
        label: '500g Pack',
        price: 200,
        mrp: 250,
        stock: 50,
        warehouseStock: [
          { warehouseId: whMumbai._id, warehouseCode: 'WH-TEST-MUM', stock: 30 },
          { warehouseId: whJaipur._id, warehouseCode: 'WH-TEST-RAJ', stock: 20 }
        ]
      }]
    });

    const product2 = await Product.create({
      name: 'Test Cumin Seeds',
      description: 'Whole cumin seeds',
      price: 150,
      mrp: 180,
      category: 'Seeds',
      organization: vendor._id,
      images: [{ public_id: 'img2', url: 'http://image2.jpg' }],
      stock: 100,
      variants: [{
        _id: new mongoose.Types.ObjectId(),
        label: '250g Pack',
        price: 150,
        mrp: 180,
        stock: 40,
        warehouseStock: [
          { warehouseId: whMumbai._id, warehouseCode: 'WH-TEST-MUM', stock: 20 },
          { warehouseId: whJaipur._id, warehouseCode: 'WH-TEST-RAJ', stock: 20 }
        ]
      }]
    });

    // ==========================================
    // TEST 1: Wishlist System Backend Validation
    // ==========================================
    console.log('\n💖 Running Wishlist System tests...');

    // Fetch empty wishlist
    let req = { user: { id: user._id.toString() } };
    let res = makeRes();
    await wishlistController.getWishlist(req, res);
    console.log('  Initial empty wishlist length:', res.data.wishlist.length);
    if (res.data.wishlist.length !== 0) throw new Error('Initial wishlist should be empty');

    // Add product1 to wishlist
    req = {
      user: { id: user._id.toString() },
      body: { productId: product1._id.toString() }
    };
    res = makeRes();
    await wishlistController.addToWishlist(req, res);
    console.log('  Add product1 response:', res.data.message);
    if (res.data.wishlist.length !== 1 || res.data.wishlist[0]._id.toString() !== product1._id.toString()) {
      throw new Error('Product 1 was not added to wishlist correctly');
    }

    // Add duplicate product1 to wishlist (idempotency check)
    res = makeRes();
    await wishlistController.addToWishlist(req, res);
    console.log('  Add duplicate product1 wishlist length:', res.data.wishlist.length);
    if (res.data.wishlist.length !== 1) throw new Error('Wishlist should handle duplicates gracefully');

    // Add product2 to wishlist
    req.body.productId = product2._id.toString();
    res = makeRes();
    await wishlistController.addToWishlist(req, res);
    console.log('  Add product2 wishlist length:', res.data.wishlist.length);
    if (res.data.wishlist.length !== 2) throw new Error('Product 2 was not added to wishlist');

    // Remove product1 from wishlist
    req = {
      user: { id: user._id.toString() },
      params: { productId: product1._id.toString() }
    };
    res = makeRes();
    await wishlistController.removeFromWishlist(req, res);
    console.log('  Remove product1 wishlist length:', res.data.wishlist.length);
    if (res.data.wishlist.length !== 1 || res.data.wishlist[0]._id.toString() !== product2._id.toString()) {
      throw new Error('Product 1 was not removed correctly');
    }
    console.log('✅ Wishlist System backend operations work perfectly!');

    // ==========================================
    // TEST 2: Invoice & GST Calculation Validation
    // ==========================================
    console.log('\n🧾 Running Invoice & GST Calculation tests...');

    // Case 2.1: Intra-state transaction (Ship to Maharashtra, Warehouse in Mumbai Maharashtra)
    req = {
      user: { id: user._id.toString(), role: 'user', headers: {} },
      headers: {},
      body: {
        orderItems: [
          {
            product: product1._id.toString(),
            name: product1.name,
            quantity: 2,
            price: 200,
            variantId: product1.variants[0]._id.toString(),
            variantLabel: product1.variants[0].label,
            image: 'http://image1.jpg'
          }
        ],
        shippingAddress: {
          name: 'Intrastate User',
          phone: '9876543210',
          address: '45 Gateway Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400021'
        },
        paymentInfo: {
          id: 'pay_intra_123',
          status: 'Success',
          method: 'upi'
        },
        itemsPrice: 400,
        taxPrice: 72,
        shippingPrice: 0,
        totalPrice: 400
      }
    };

    res = makeRes();
    await orderController.createOrder(req, res);
    if (!res.data.success) throw new Error('Failed to place intrastate order: ' + JSON.stringify(res.data));

    const orderIdIntra = res.data.orders[0]._id;
    const orderIntra = await Order.findById(orderIdIntra);
    
    console.log('  Intrastate Invoice Number:', orderIntra.invoiceNumber);
    if (!orderIntra.invoiceNumber.startsWith('INV-')) throw new Error('Invoice number format invalid');
    
    // Assert Intra-state GST (CGST + SGST populated, IGST 0)
    console.log('  Intrastate GST Breakdown:', orderIntra.gstBreakdown);
    if (orderIntra.gstBreakdown.igst !== 0) throw new Error('IGST must be 0 for intra-state order');
    if (orderIntra.gstBreakdown.cgst === 0 || orderIntra.gstBreakdown.sgst === 0) {
      throw new Error('CGST and SGST must be split for intra-state order');
    }

    // Case 2.2: Inter-state transaction (Ship to Rajasthan, Warehouse in Mumbai Maharashtra)
    req.body.shippingAddress.state = 'Rajasthan';
    req.body.shippingAddress.city = 'Jaipur';
    req.body.paymentInfo.id = 'pay_inter_123';
    
    res = makeRes();
    await orderController.createOrder(req, res);
    if (!res.data.success) throw new Error('Failed to place interstate order');

    const orderIdInter = res.data.orders[0]._id;
    const orderInter = await Order.findById(orderIdInter);
    
    console.log('  Interstate Invoice Number:', orderInter.invoiceNumber);
    // Assert Inter-state GST (IGST populated, CGST + SGST 0)
    console.log('  Interstate GST Breakdown:', orderInter.gstBreakdown);
    if (orderInter.gstBreakdown.cgst !== 0 || orderInter.gstBreakdown.sgst !== 0) {
      throw new Error('CGST and SGST must be 0 for inter-state order');
    }
    if (orderInter.gstBreakdown.igst === 0) throw new Error('IGST must be computed for inter-state order');

    // ==========================================
    // TEST 3: Printable HTML Invoice Retrieval
    // ==========================================
    console.log('\n🖨️ Running Printable HTML Invoice Retrieval tests...');
    
    req = {
      params: { id: orderIdIntra.toString() },
      user: { id: user._id.toString(), role: 'user' }
    };
    res = makeRes();
    await invoiceController.getOrderInvoice(req, res);

    if (res.headers['Content-Type'] !== 'text/html') throw new Error('Invoice response header must be HTML');
    if (!res.body.includes('Tax Invoice')) throw new Error('Invoice HTML must contain Tax Invoice header');
    if (!res.body.includes('INV-')) throw new Error('Invoice HTML must display invoice number');
    if (!res.body.includes('CGST')) throw new Error('Invoice HTML must display CGST breakdown');
    if (!res.body.includes('SGST')) throw new Error('Invoice HTML must display SGST breakdown');
    if (!res.body.includes('Amrit Rasoi')) throw new Error('Invoice HTML must contain branding logo text');

    console.log('✅ Printable HTML Invoice rendered and returned successfully!');
    
    // Clean up test data
    await Warehouse.deleteMany({ code: { $in: ['WH-TEST-MUM', 'WH-TEST-RAJ'] } });
    await Organization.deleteMany({ name: 'Test Wishlist Vendor' });
    await Product.deleteMany({ name: { $in: ['Test Masala Powder', 'Test Cumin Seeds'] } });
    await User.deleteMany({ email: 'test_wishlist_user@sbmi.org' });
    await Wishlist.deleteMany({});
    await Order.deleteMany({ invoiceNumber: /^INV-/ });
    console.log('\n🧹 Test database cleaned up.');

    console.log('\n🏆 ALL BACKEND TESTS PASSED FOR PHASE 2B (WISHLIST & INVOICES)!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected database.');
  }
}

runTests();
