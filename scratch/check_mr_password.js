const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const MONGO_URI = "mongodb://127.0.0.1:27017/amrit_rasoi";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    const User = require('../server/models/User');
    
    const mr = await User.findOne({ email: 'mr@gmail.com' }).select('+password');
    if (!mr) {
      console.log('❌ User mr@gmail.com not found!');
      process.exit(1);
    }
    
    console.log('🟢 User mr@gmail.com found:');
    console.log('  Name:', mr.name);
    console.log('  Role:', mr.role);
    console.log('  sellerStatus:', mr.sellerStatus);
    console.log('  Password hash exists:', !!mr.password);
    
    // Test common passwords
    const passwords = ['12345678', 'password', '123456', 'admin123', 'mr12345', 'test1234', 'mr@123', '1234567890'];
    for (const pwd of passwords) {
      const match = await bcrypt.compare(pwd, mr.password);
      if (match) {
        console.log('✅ Correct password found:', pwd);
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
