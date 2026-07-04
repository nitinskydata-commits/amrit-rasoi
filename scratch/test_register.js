const mongoose = require('mongoose');
const MONGO_URI = "mongodb://127.0.0.1:27017/amrit_rasoi";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to DB');
    const User = require('../server/models/User');

    const testPayload = {
      name: "Test Seller",
      email: "test.seller2@company.com", // Unique email
      phone: "9999999992",             // Unique phone
      password: "password123",
      role: 'vendor_owner',
      sellerStatus: 'pending',
      sellerProfile: {
        shopName: "Test Shop",
        shopDescription: "Test Description",
        gstin: "123456789012345",
        pan: "ABCDE1234F",
        businessAddress: {
          line1: "Line 1",
          city: "City",
          state: "State",
          pincode: "123456"
        },
        appliedAt: new Date()
      },
      permissions: {
        manageProducts: true,
        manageOrders: true,
        manageReviews: true,
        manageInventory: true,
        manageNewsletters: false
      }
    };

    try {
      // Clear existing test user if any
      await User.deleteOne({ email: testPayload.email });
      await User.deleteOne({ phone: testPayload.phone });

      const user = await User.create(testPayload);
      console.log('✅ Seller created successfully:', user.email);
    } catch (error) {
      console.error('❌ Mongoose User.create error:', error);
    } finally {
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
