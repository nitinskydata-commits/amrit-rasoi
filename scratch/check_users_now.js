const mongoose = require('mongoose');
const MONGO_URI = "mongodb://127.0.0.1:27017/amrit_rasoi";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const User = require('../server/models/User');
    
    console.log('🔵 Fetching all users in DB...');
    const users = await User.find({});
    console.log(`🟢 Total users: ${users.length}`);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Phone: ${u.phone}, Role: ${u.role}, sellerStatus: ${u.sellerStatus}, wholesaleStatus: ${u.wholesaleStatus}`);
    });

    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
