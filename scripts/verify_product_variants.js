const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const Product = require('../server/models/Product');

console.log('🧪 Starting Product Domain & Variant Architecture verification...');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // Clean old test objects if present
    await Product.deleteMany({ name: 'Architecture Test Apples' });

    // 1. Create a Test Product with variants and check slugify
    console.log('\n[1/3] Creating product with details and variants...');
    const testProd = await Product.create({
      name: 'Architecture Test Apples',
      price: 150,
      category: 'Grocery',
      stock: 50,
      hasVariants: true,
      variants: [
        {
          attributes: [{ name: 'Weight', value: '1kg' }],
          price: 150,
          mrp: 180,
          stock: 30,
          sku: 'SKU-APPLE-1KG'
        },
        {
          attributes: [{ name: 'Weight', value: '500g' }],
          price: 80,
          mrp: 99,
          stock: 20,
          sku: 'SKU-APPLE-500G'
        }
      ]
    });

    console.log('  Generated Product Slug:', testProd.slug);
    if (testProd.slug !== 'architecture-test-apples') {
      throw new Error(`Assertion Failed: Slug mismatch. Expected 'architecture-test-apples', got '${testProd.slug}'`);
    }
    console.log('✅ Automated slug generation verified successfully!');

    // 2. Validate Variants array data
    console.log('\n[2/3] Verifying variant fields and attributes...');
    if (testProd.variants.length !== 2) {
      throw new Error(`Assertion Failed: Variant count mismatch. Expected 2, got ${testProd.variants.length}`);
    }
    const [v1, v2] = testProd.variants;
    if (v1.sku !== 'SKU-APPLE-1KG' || v2.sku !== 'SKU-APPLE-500G') {
      throw new Error('Assertion Failed: Variant SKU assignment mismatched');
    }
    console.log('✅ Variants persisted and validated successfully!');

    // 3. Test ratings calculation math when reviews are pushed
    console.log('\n[3/3] Testing average rating calculations on review save...');
    const userId1 = new mongoose.Types.ObjectId();
    const userId2 = new mongoose.Types.ObjectId();

    testProd.reviews.push({
      user: userId1,
      name: 'Tester 1',
      rating: 4,
      title: 'Good Quality',
      comment: 'Apples were fresh.'
    });

    testProd.reviews.push({
      user: userId2,
      name: 'Tester 2',
      rating: 5,
      title: 'Amazing!',
      comment: 'Extremely sweet.'
    });

    await testProd.save();
    console.log(`  Ratings score: ${testProd.ratings} out of ${testProd.numOfReviews} reviews`);

    if (testProd.ratings !== 4.5 || testProd.numOfReviews !== 2) {
      throw new Error(`Assertion Failed: Rating calculation incorrect. Expected 4.5 rating, got ${testProd.ratings}`);
    }
    console.log('✅ Review aggregates calculated correctly!');

    console.log('\n🏆 ALL PRODUCT DOMAIN & VARIANT TESTS PASSED!');

    // Cleanup
    await Product.deleteMany({ name: 'Architecture Test Apples' });
    process.exit(0);

  } catch (error) {
    console.error('❌ Product Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testSuite();
