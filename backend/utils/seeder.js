const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const connectDB = require('../config/db');

dotenv.config({ path: './config/config.env' });

connectDB();

const sampleProducts = [
  {
    name: "Red Chilli Powder",
    description: "Premium quality Kashmiri red chilli powder. Perfect for adding vibrant color and mild heat to your dishes.",
    price: 120,
    mrp: 150,
    category: "powders",
    brand: "Amrit Rasoi",
    stock: 50,
    weight: { value: 100, unit: "g" },
    images: [{
      public_id: "sample1",
      url: "https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=500"
    }],
    ratings: 4.5,
    numOfReviews: 25,
    variants: [
      { weight: "100g", price: 120, stock: 50 },
      { weight: "200g", price: 220, stock: 40 },
      { weight: "500g", price: 500, stock: 30 }
    ]
  },
  {
    name: "Turmeric Powder (Haldi)",
    description: "Pure and organic turmeric powder with high curcumin content. Known for its anti-inflammatory properties.",
    price: 80,
    mrp: 100,
    category: "powders",
    brand: "Amrit Rasoi",
    stock: 60,
    weight: { value: 100, unit: "g" },
    images: [{
      public_id: "sample2",
      url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500"
    }],
    ratings: 4.8,
    numOfReviews: 40,
    variants: [
      { weight: "100g", price: 80, stock: 60 },
      { weight: "250g", price: 180, stock: 45 },
      { weight: "500g", price: 340, stock: 35 }
    ]
  },
  {
    name: "Garam Masala",
    description: "Authentic blend of aromatic spices including cardamom, cinnamon, cloves, and black pepper.",
    price: 150,
    mrp: 180,
    category: "blends",
    brand: "Amrit Rasoi",
    stock: 40,
    weight: { value: 100, unit: "g" },
    images: [{
      public_id: "sample3",
      url: "https://images.unsplash.com/photo-1596040033229-a0b536973d7d?w=500"
    }],
    ratings: 4.7,
    numOfReviews: 35,
    variants: [
      { weight: "50g", price: 90, stock: 40 },
      { weight: "100g", price: 150, stock: 35 },
      { weight: "200g", price: 280, stock: 25 }
    ]
  },
  {
    name: "Coriander Powder (Dhaniya)",
    description: "Freshly ground coriander powder with a sweet, citrusy flavor. Perfect for curries and marinades.",
    price: 60,
    mrp: 80,
    category: "powders",
    brand: "Amrit Rasoi",
    stock: 70,
    weight: { value: 100, unit: "g" },
    images: [{
      public_id: "sample4",
      url: "https://images.unsplash.com/photo-1599909533730-f748e9657bac?w=500"
    }],
    ratings: 4.6,
    numOfReviews: 30,
    variants: [
      { weight: "100g", price: 60, stock: 70 },
      { weight: "250g", price: 140, stock: 50 },
      { weight: "500g", price: 260, stock: 40 }
    ]
  },
  {
    name: "Cumin Seeds (Jeera)",
    description: "Whole cumin seeds with earthy, warm flavor. Essential for tempering Indian dishes.",
    price: 100,
    mrp: 130,
    category: "spices",
    brand: "Amrit Rasoi",
    stock: 55,
    weight: { value: 100, unit: "g" },
    images: [{
      public_id: "sample5",
      url: "https://images.unsplash.com/photo-1596040033229-a0b536973d7d?w=500"
    }],
    ratings: 4.4,
    numOfReviews: 28,
    variants: [
      { weight: "50g", price: 60, stock: 55 },
      { weight: "100g", price: 100, stock: 45 },
      { weight: "250g", price: 230, stock: 35 }
    ]
  },
  {
    name: "Black Pepper Powder",
    description: "Premium quality black pepper powder with strong aroma and pungent flavor. Rich in antioxidants.",
    price: 180,
    mrp: 220,
    category: "powders",
    brand: "Amrit Rasoi",
    stock: 45,
    weight: { value: 100, unit: "g" },
    images: [{
      public_id: "sample6",
      url: "https://images.unsplash.com/photo-1604084849634-3b92c0a0c84e?w=500"
    }],
    ratings: 4.9,
    numOfReviews: 50,
    variants: [
      { weight: "50g", price: 100, stock: 45 },
      { weight: "100g", price: 180, stock: 40 },
      { weight: "250g", price: 420, stock: 30 }
    ]
  },
  {
    name: "Cardamom Powder (Elaichi)",
    description: "Finely ground green cardamom powder with sweet, floral aroma. Perfect for desserts and tea.",
    price: 250,
    mrp: 300,
    category: "powders",
    brand: "Amrit Rasoi",
    stock: 30,
    weight: { value: 50, unit: "g" },
    images: [{
      public_id: "sample7",
      url: "https://images.unsplash.com/photo-1599639942413-11c5b4c62d3e?w=500"
    }],
    ratings: 4.8,
    numOfReviews: 22,
    variants: [
      { weight: "25g", price: 140, stock: 30 },
      { weight: "50g", price: 250, stock: 25 },
      { weight: "100g", price: 480, stock: 20 }
    ]
  },
  {
    name: "Biryani Masala",
    description: "Special blend of aromatic spices crafted for authentic biryani. Contains saffron and exotic spices.",
    price: 200,
    mrp: 250,
    category: "blends",
    brand: "Amrit Rasoi",
    stock: 35,
    weight: { value: 100, unit: "g" },
    images: [{
      public_id: "sample8",
      url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500"
    }],
    ratings: 4.7,
    numOfReviews: 38,
    variants: [
      { weight: "50g", price: 120, stock: 35 },
      { weight: "100g", price: 200, stock: 30 },
      { weight: "200g", price: 380, stock: 25 }
    ]
  },
  {
    name: "Organic Curry Powder",
    description: "100% organic curry powder blend. No preservatives. Perfect for authentic South Indian cuisine.",
    price: 170,
    mrp: 210,
    category: "organic",
    brand: "Amrit Rasoi",
    stock: 40,
    weight: { value: 100, unit: "g" },
    images: [{
      public_id: "sample9",
      url: "https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=500"
    }],
    ratings: 4.6,
    numOfReviews: 32,
    variants: [
      { weight: "100g", price: 170, stock: 40 },
      { weight: "200g", price: 320, stock: 35 },
      { weight: "500g", price: 750, stock: 25 }
    ]
  },
  {
    name: "Chai Masala",
    description: "Traditional tea masala blend with cardamom, ginger, cinnamon, and cloves. Makes aromatic chai.",
    price: 140,
    mrp: 170,
    category: "blends",
    brand: "Amrit Rasoi",
    stock: 50,
    weight: { value: 100, unit: "g" },
    images: [{
      public_id: "sample10",
      url: "https://images.unsplash.com/photo-1597318132949-64e0d8e9a683?w=500"
    }],
    ratings: 4.9,
    numOfReviews: 45,
    variants: [
      { weight: "50g", price: 80, stock: 50 },
      { weight: "100g", price: 140, stock: 45 },
      { weight: "250g", price: 330, stock: 35 }
    ]
  }
];

const seedProducts = async () => {
  try {
    console.log('🗑️  Deleting existing products...');
    await Product.deleteMany();
    
    console.log('📦 Adding sample products...');
    await Product.insertMany(sampleProducts);
    
    console.log('✅ Sample products added successfully!');
    console.log(`📊 Total products: ${sampleProducts.length}`);
    
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedProducts();
