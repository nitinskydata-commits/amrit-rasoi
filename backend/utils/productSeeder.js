const mongoose = require('mongoose');
const Product = require('../models/Product');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

const sampleProducts = [
  {
    name: 'Premium Kashmiri Saffron',
    description: 'Authentic Kashmiri saffron threads, hand-picked from the finest crocus flowers. Known for its vibrant color, aroma, and medicinal properties.',
    price: 2500,
    originalPrice: 3000,
    mrp: 3200,
    variants: [
      { weight: '1g', price: 2500, mrp: 3200, stock: 50 },
      { weight: '2g', price: 4800, mrp: 6000, stock: 30 },
      { weight: '5g', price: 11000, mrp: 14000, stock: 15 }
    ],
    category: 'Spices',
    brand: 'Amrit Rasoi',
    stock: 95,
    unit: 'g',
    codAllowed: true,
    isRefundable: true,
    images: [
      { publicId: 'saffron1', url: '/uploads/saffron-placeholder.jpg' },
      { publicId: 'saffron2', url: '/uploads/saffron-placeholder.jpg' }
    ]
  },
  {
    name: 'Organic Turmeric Powder',
    description: 'Pure organic turmeric powder sourced from certified organic farms. Rich in curcumin with anti-inflammatory properties.',
    price: 180,
    originalPrice: 220,
    mrp: 250,
    variants: [
      { weight: '100g', price: 180, mrp: 250, stock: 200 },
      { weight: '500g', price: 850, mrp: 1100, stock: 150 },
      { weight: '1kg', price: 1600, mrp: 2000, stock: 100 }
    ],
    category: 'Powders',
    brand: 'Amrit Rasoi',
    stock: 450,
    unit: 'g',
    codAllowed: true,
    isRefundable: true,
    images: [
      { publicId: 'turmeric1', url: '/uploads/turmeric-placeholder.jpg' }
    ]
  },
  {
    name: 'Garam Masala Blend',
    description: 'Traditional Indian spice blend perfect for curries, vegetables, and meat dishes. Made with 12 premium spices.',
    price: 120,
    originalPrice: 150,
    mrp: 180,
    variants: [
      { weight: '50g', price: 120, mrp: 180, stock: 300 },
      { weight: '100g', price: 220, mrp: 300, stock: 250 },
      { weight: '250g', price: 500, mrp: 650, stock: 150 }
    ],
    category: 'Blends',
    brand: 'Amrit Rasoi',
    stock: 700,
    unit: 'g',
    codAllowed: true,
    isRefundable: true,
    images: [
      { publicId: 'garam-masala1', url: '/uploads/garam-masala-placeholder.jpg' }
    ]
  },
  {
    name: 'Cardamom Pods (Green)',
    description: 'Premium green cardamom pods from the hills of Kerala. Whole pods with intense aroma and flavor.',
    price: 450,
    originalPrice: 550,
    mrp: 650,
    variants: [
      { weight: '50g', price: 450, mrp: 650, stock: 100 },
      { weight: '100g', price: 850, mrp: 1200, stock: 80 },
      { weight: '250g', price: 2000, mrp: 2800, stock: 40 }
    ],
    category: 'Spices',
    brand: 'Amrit Rasoi',
    stock: 220,
    unit: 'g',
    codAllowed: true,
    isRefundable: true,
    images: [
      { publicId: 'cardamom1', url: '/uploads/cardamom-placeholder.jpg' }
    ]
  },
  {
    name: 'Cumin Seeds (Jeera)',
    description: 'High-quality cumin seeds with strong aroma. Essential spice for Indian cooking.',
    price: 95,
    originalPrice: 120,
    mrp: 150,
    variants: [
      { weight: '100g', price: 95, mrp: 150, stock: 400 },
      { weight: '500g', price: 450, mrp: 650, stock: 200 },
      { weight: '1kg', price: 850, mrp: 1200, stock: 150 }
    ],
    category: 'Seeds',
    brand: 'Amrit Rasoi',
    stock: 750,
    unit: 'g',
    codAllowed: true,
    isRefundable: true,
    images: [
      { publicId: 'cumin1', url: '/uploads/cumin-placeholder.jpg' }
    ]
  },
  {
    name: 'Red Chili Powder',
    description: 'Premium red chili powder made from the finest Kashmiri chilies. Perfect balance of heat and flavor.',
    price: 140,
    originalPrice: 180,
    mrp: 220,
    variants: [
      { weight: '100g', price: 140, mrp: 220, stock: 300 },
      { weight: '500g', price: 650, mrp: 900, stock: 200 },
      { weight: '1kg', price: 1200, mrp: 1600, stock: 100 }
    ],
    category: 'Powders',
    brand: 'Amrit Rasoi',
    stock: 600,
    unit: 'g',
    codAllowed: true,
    isRefundable: true,
    images: [
      { publicId: 'chili1', url: '/uploads/chili-placeholder.jpg' }
    ]
  },
  {
    name: 'Coriander Powder',
    description: 'Fresh coriander powder ground from premium coriander seeds. Essential for authentic Indian cuisine.',
    price: 85,
    originalPrice: 110,
    mrp: 140,
    variants: [
      { weight: '100g', price: 85, mrp: 140, stock: 350 },
      { weight: '500g', price: 400, mrp: 550, stock: 180 },
      { weight: '1kg', price: 750, mrp: 1000, stock: 120 }
    ],
    category: 'Powders',
    brand: 'Amrit Rasoi',
    stock: 650,
    unit: 'g',
    codAllowed: true,
    isRefundable: true,
    images: [
      { publicId: 'coriander1', url: '/uploads/coriander-placeholder.jpg' }
    ]
  },
  {
    name: 'Black Pepper (Whole)',
    description: 'Premium black peppercorns from Kerala. Known as "King of Spices" for its bold flavor.',
    price: 160,
    originalPrice: 200,
    mrp: 250,
    variants: [
      { weight: '50g', price: 160, mrp: 250, stock: 250 },
      { weight: '100g', price: 300, mrp: 450, stock: 200 },
      { weight: '250g', price: 700, mrp: 1000, stock: 100 }
    ],
    category: 'Spices',
    brand: 'Amrit Rasoi',
    stock: 550,
    unit: 'g',
    codAllowed: true,
    isRefundable: true,
    images: [
      { publicId: 'pepper1', url: '/uploads/pepper-placeholder.jpg' }
    ]
  }
];

const seedProducts = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existingProducts = await Product.countDocuments();
    console.log(`📊 Found ${existingProducts} existing products`);

    if (existingProducts === 0) {
      console.log('📝 Seeding sample products...');
      await Product.insertMany(sampleProducts);
      console.log(`✅ Successfully seeded ${sampleProducts.length} products`);
    } else {
      console.log('ℹ️ Products already exist, skipping seeding');
    }

    console.log('\n' + '='.repeat(50));
    console.log('SAMPLE PRODUCTS SEEDED SUCCESSFULLY!');
    console.log('You can now browse products on the website.');
    console.log('='.repeat(50) + '\n');

    process.exit();
  } catch (error) {
    console.error('❌ Seeder error:', error.message);
    process.exit(1);
  }
};

seedProducts();