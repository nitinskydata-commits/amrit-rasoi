const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './config/config.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const createAdmin = async () => {
  await connectDB();
  
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@sbmi.com' });
    
    if (adminExists) {
      // Update existing user to admin and keep super-admin privileges
      adminExists.role = 'admin';
      adminExists.isSuperAdmin = true;
      await adminExists.save();
      console.log('✅ Existing user updated to admin (super-admin)');
    } else {
      // Create new admin user
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@sbmi.com',
        password: 'admin123',
        phone: '9876543210',
        role: 'admin',
        isSuperAdmin: true
      });
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('\n🔐 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@sbmi.com');
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
