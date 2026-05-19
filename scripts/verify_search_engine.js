const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const Product = require('../server/models/Product');
const { getProducts, getSearchSuggestions } = require('../server/controllers/productController');

console.log('🧪 Starting Advanced Search Engine verification...');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // Cleanup old test data
    await Product.deleteMany({ name: { $in: ['Search Test Orange', 'Search Test Lemon'] } });

    // Create seed products
    const p1 = await Product.create({
      name: 'Search Test Orange',
      price: 120,
      category: 'Organic',
      stock: 40,
      brand: 'SunGrow',
      tags: ['citrus', 'vitamin-c']
    });

    const p2 = await Product.create({
      name: 'Search Test Lemon',
      price: 80,
      category: 'Grocery',
      stock: 0,
      brand: 'YellowPure',
      hasVariants: true,
      variants: [
        {
          attributes: [{ name: 'Size', value: 'Medium' }],
          price: 80,
          mrp: 90,
          stock: 15,
          sku: 'SKU-LEMON-MED'
        }
      ]
    });

    // Mock Express request/response objects
    const req = { query: {} };
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

    // 1. Test Autocomplete suggestions
    console.log('\n[1/3] Testing real-time autocomplete suggestions (q = Search)...');
    req.query = { q: 'Search' };
    await getSearchSuggestions(req, res);

    if (!res.data.success || res.data.suggestions.length < 2) {
      throw new Error(`Assertion Failed: Suggestions did not return newly created test items`);
    }
    console.log(`  Autocomplete returned: ${res.data.suggestions.map(s => s.name).join(', ')}`);
    console.log('✅ Real-time Autocomplete suggestions verified successfully!');

    // 2. Test Advanced query matching (keyword search)
    console.log('\n[2/3] Testing multi-variable query filters (keyword, category)...');
    req.query = { keyword: 'orange', category: 'Organic' };
    await getProducts(req, res);

    if (!res.data.success || res.data.products.length !== 1 || res.data.products[0].name !== 'Search Test Orange') {
      throw new Error(`Assertion Failed: Advanced search query matching failed`);
    }
    console.log(`  Keyword 'orange' returned: ${res.data.products[0].name}`);
    console.log('✅ Keyword and category query matching verified successfully!');

    // 3. Test Stock and Variant attributes matching
    console.log('\n[3/3] Testing stock availability and SKU matching...');
    req.query = { keyword: 'SKU-LEMON-MED', stock: 'inStock' };
    await getProducts(req, res);

    if (!res.data.success || res.data.products.length !== 1 || res.data.products[0].name !== 'Search Test Lemon') {
      throw new Error(`Assertion Failed: SKU matching failed`);
    }
    console.log(`  SKU query returned: ${res.data.products[0].name} (Stock: ${res.data.products[0].variants[0].stock})`);
    console.log('✅ Variant attribute & stock matching verified successfully!');

    console.log('\n🏆 ALL SEARCH ENGINE ARCHITECTURE TESTS PASSED!');

    // Cleanup
    await Product.deleteMany({ name: { $in: ['Search Test Orange', 'Search Test Lemon'] } });
    process.exit(0);

  } catch (error) {
    console.error('❌ Search Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testSuite();
