module.paths.push('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/node_modules');
const mongoose = require('mongoose');

const Product = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/Product');
const Order = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/Order');
const Warehouse = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/Warehouse');
const Organization = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/Organization');
const User = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/User');
const Wishlist = require('c:/Users/LENOVO/OneDrive/Documents/VS/amrit-rasoi/server/models/Wishlist');

const dbUri = 'mongodb://127.0.0.1:27017/amrit_rasoi';

async function runTests() {
  console.log('🔌 Connecting...');
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected.');

    console.log('🧹 Cleaning test data...');
    await Warehouse.deleteMany({ code: { $in: ['WH-TEST-MUM', 'WH-TEST-RAJ'] } });
    await Organization.deleteMany({ name: 'Test Wishlist Vendor' });
    await Product.deleteMany({ name: { $in: ['Test Masala Powder', 'Test Cumin Seeds'] } });
    await User.deleteMany({ email: 'test_wishlist_user@sbmi.org' });
    await Wishlist.deleteMany({});
    await Order.deleteMany({ invoiceNumber: /^INV-/ });
    console.log('✅ Clean up done.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
