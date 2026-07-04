const mongoose = require('mongoose');
const path = require('path');
const User = require('../server/models/User');
const Product = require('../server/models/Product');
const SiteBadge = require('../server/models/SiteBadge');
const Testimonial = require('../server/models/Testimonial');
const Order = require('../server/models/Order');

require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/amrit_rasoi';

const seedData = async () => {
  try {
    console.log(`🔌 Connecting to MongoDB: ${dbUri}`);
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected successfully!');

    // Clear existing collections
    console.log('🧹 Clearing old data...');
    await Product.deleteMany({});
    await SiteBadge.deleteMany({});
    await Testimonial.deleteMany({});
    await Order.deleteMany({});
    await User.deleteMany({ 
      $or: [
        { email: { $in: ['admin@sbmi.com', 'agent@sbmi.com', 'customer@sbmi.com'] } },
        { phone: { $in: ['9876543210', '9999888877', '9000110022', '9900000001', '9900000002', '9900000003'] } }
      ]
    });

    console.log('👥 Seeding Users...');
    
    // 1. Admin
    const admin = await User.create({
      name: 'SBMI Admin',
      email: 'admin@sbmi.com',
      phone: '9900000001',
      password: 'admin123',
      role: 'admin',
      isSuperAdmin: true
    });
    console.log('   - Seeded Admin: admin@sbmi.com / admin123');

    // 2. Delivery Boy
    const agent = await User.create({
      name: 'Ramesh Kumar',
      email: 'agent@sbmi.com',
      phone: '9900000002',
      password: 'admin123',
      role: 'delivery_boy',
      branchName: 'Noida Central Hub',
      permissions: {
        manageProducts: false,
        manageOrders: true,
        manageReviews: false,
        manageNewsletters: false,
        manageInventory: false
      }
    });
    console.log('   - Seeded Agent: agent@sbmi.com / admin123');

    // 3. Customer
    const customer = await User.create({
      name: 'Rohan Sharma',
      email: 'customer@sbmi.com',
      phone: '9900000003',
      password: 'password123',
      role: 'user'
    });
    console.log('   - Seeded Customer: customer@sbmi.com / password123');

    console.log('📦 Seeding Products...');

    const productsData = [
      {
        name: 'Premium Cardamom',
        description: 'Premium grade large green cardamom pods with rich aroma and intense sweet-spicy flavour.',
        price: 399,
        mrp: 499,
        stock: 80,
        category: 'Spices',
        subcategory: 'Whole Spices',
        brand: 'Amrit Rasoi',
        images: [{ publicId: 'cardamom', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600' }],
        isFeatured: true,
        inTodaysDeal: true,
        inNewArrivals: true,
        ratings: 5.0,
        numOfReviews: 1
      },
      {
        name: 'Organic Turmeric Powder',
        description: '100% pure organic ground turmeric with high curcumin content, ground cold to retain medicinal values.',
        price: 189,
        mrp: 249,
        stock: 120,
        category: 'Powders',
        subcategory: 'Ground Spices',
        brand: 'Amrit Rasoi',
        images: [{ publicId: 'turmeric', url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=600' }],
        isFeatured: true,
        inTodaysDeal: false,
        inNewArrivals: true,
        ratings: 4.8,
        numOfReviews: 1
      },
      {
        name: 'Whole Cumin Seeds',
        description: 'Highly aromatic sun-dried whole cumin seeds (Jeera) sourced from Rajasthan farms.',
        price: 149,
        mrp: 199,
        stock: 200,
        category: 'Spices',
        subcategory: 'Whole Spices',
        brand: 'Amrit Rasoi',
        images: [{ publicId: 'cumin', url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&q=80&w=600' }],
        isFeatured: false,
        inTodaysDeal: true,
        inNewArrivals: false,
        ratings: 4.5,
        numOfReviews: 1
      },
      {
        name: 'Gourmet Garam Masala',
        description: 'An authentic royal blend of 15 premium spices roasted and ground to perfection.',
        price: 249,
        mrp: 299,
        stock: 90,
        category: 'Blends',
        subcategory: 'Spice Blends',
        brand: 'Amrit Rasoi',
        images: [{ publicId: 'garam_masala', url: 'https://images.unsplash.com/photo-1532336414038-cf190733eb37?auto=format&fit=crop&q=80&w=600' }],
        isFeatured: true,
        inTodaysDeal: true,
        inNewArrivals: false,
        ratings: 4.9,
        numOfReviews: 1
      },
      {
        name: 'Organic Kashmiri Chili',
        description: 'Finely ground bright red Kashmiri chili powder known for its rich color and mild heat.',
        price: 220,
        mrp: 275,
        stock: 110,
        category: 'Powders',
        subcategory: 'Ground Spices',
        brand: 'Amrit Rasoi',
        images: [{ publicId: 'chili', url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=600' }],
        isFeatured: false,
        inTodaysDeal: false,
        inNewArrivals: true,
        ratings: 4.7,
        numOfReviews: 1
      },
      {
        name: 'Organic Fennel Seeds',
        description: 'Savoury, sweet whole fennel seeds (Saunf), great as a post-meal digestif or cooking aromatic.',
        price: 130,
        mrp: 160,
        stock: 150,
        category: 'Organic',
        subcategory: 'Organic Whole',
        brand: 'Amrit Rasoi',
        images: [{ publicId: 'fennel', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600' }],
        isFeatured: true,
        inTodaysDeal: false,
        inNewArrivals: false,
        ratings: 5.0,
        numOfReviews: 0
      }
    ];

    const seededProducts = [];
    for (const prod of productsData) {
      const p = await Product.create({ ...prod, user: admin._id });
      seededProducts.push(p);
    }
    console.log(`   - Seeded ${seededProducts.length} premium products.`);

    console.log('🛡️ Seeding Trust Badges...');
    const badgesData = [
      { title: '100% Organic', emoji: '🌿', description: 'Certified grade-A organic spice farm sourcing.', order: 1, isVisible: true },
      { title: 'Easy Returns', emoji: '↻', description: '7-day return policy with doorstep pickup.', order: 2, isVisible: true },
      { title: 'Secure Payments', emoji: '🔒', description: 'Fully encrypted secure payment gateways.', order: 3, isVisible: true },
      { title: 'Express Delivery', emoji: '🚚', description: 'Same day dispatch with partner logistics.', order: 4, isVisible: true }
    ];
    await SiteBadge.insertMany(badgesData);
    console.log('   - Seeded 4 trust badges.');

    console.log('💬 Seeding Testimonials...');
    const testimonialsData = [
      { customerName: 'Aarav Mehta', rating: 5, review: 'The aroma of Garam Masala is absolutely wonderful! Ground spices here are unmatched.', productName: 'Gourmet Garam Masala', isApproved: true, isVisible: true },
      { customerName: 'Sneha Reddy', rating: 5, review: '100% pure organic cardamom, highly recommended for traditional Indian chai.', productName: 'Premium Cardamom', isApproved: true, isVisible: true },
      { customerName: 'Kabir Kapoor', rating: 4, review: 'Very fresh cumin seeds, excellent packaging and fast delivery.', productName: 'Whole Cumin Seeds', isApproved: true, isVisible: true }
    ];
    await Testimonial.insertMany(testimonialsData);
    console.log('   - Seeded 3 customer testimonials.');

    console.log('🛒 Seeding Orders for Delivery Agent...');
    const ordersData = [
      {
        shippingInfo: {
          address: 'G-12, Sector 15',
          city: 'Noida',
          state: 'Uttar Pradesh',
          pincode: '201301',
          phone: '9876543210',
          fullName: 'Aman Verma'
        },
        orderItems: [{
          name: seededProducts[0].name,
          price: seededProducts[0].price,
          quantity: 2,
          image: seededProducts[0].images[0].url,
          product: seededProducts[0]._id
        }],
        user: customer._id,
        paymentInfo: { id: 'cod_pay_01', status: 'Pending', gateway: 'COD' },
        itemsPrice: seededProducts[0].price * 2,
        taxPrice: 18,
        shippingPrice: 40,
        totalPrice: (seededProducts[0].price * 2) + 58,
        status: 'processing' // will show up in delivery Boy terminal
      },
      {
        shippingInfo: {
          address: 'B-405, Olive Apartment',
          city: 'Noida',
          state: 'Uttar Pradesh',
          pincode: '201301',
          phone: '9000110022',
          fullName: 'Sonia Das'
        },
        orderItems: [
          {
            name: seededProducts[1].name,
            price: seededProducts[1].price,
            quantity: 1,
            image: seededProducts[1].images[0].url,
            product: seededProducts[1]._id
          },
          {
            name: seededProducts[3].name,
            price: seededProducts[3].price,
            quantity: 1,
            image: seededProducts[3].images[0].url,
            product: seededProducts[3]._id
          }
        ],
        user: customer._id,
        paymentInfo: { id: 'stripe_pay_02', status: 'Succeeded', gateway: 'Stripe' },
        itemsPrice: seededProducts[1].price + seededProducts[3].price,
        taxPrice: 22,
        shippingPrice: 0,
        totalPrice: seededProducts[1].price + seededProducts[3].price + 22,
        status: 'out_for_delivery' // will show up in delivery Boy terminal
      },
      {
        shippingInfo: {
          address: 'Plot 77, Sector 62',
          city: 'Noida',
          state: 'Uttar Pradesh',
          pincode: '201301',
          phone: '8888777766',
          fullName: 'Vikram Singh'
        },
        orderItems: [{
          name: seededProducts[2].name,
          price: seededProducts[2].price,
          quantity: 3,
          image: seededProducts[2].images[0].url,
          product: seededProducts[2]._id
        }],
        user: customer._id,
        paymentInfo: { id: 'cod_pay_03', status: 'Pending', gateway: 'COD' },
        itemsPrice: seededProducts[2].price * 3,
        taxPrice: 15,
        shippingPrice: 40,
        totalPrice: (seededProducts[2].price * 3) + 55,
        status: 'processing'
      }
    ];

    for (const order of ordersData) {
      await Order.create(order);
    }
    console.log('   - Seeded 3 active orders (processing/out_for_delivery) for Noida.');

    console.log('\n🎉 RICH DATABASE SEEDING COMPLETED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING FAILED:', error);
    process.exit(1);
  }
};

seedData();
