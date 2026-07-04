const mongoose = require('mongoose');
const MONGO_URI = "mongodb://127.0.0.1:27017/amrit_rasoi";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const User = require('../server/models/User');
    
    console.log('\n--- Checking all users in database ---');
    const allUsers = await User.find({});
    console.log(`Total users in DB: ${allUsers.length}`);

    console.log('\n--- Users where sellerStatus !== none ---');
    const query1 = { sellerStatus: { $ne: 'none' } };
    const sellers1 = await User.find(query1);
    console.log(`Count using { sellerStatus: { $ne: 'none' } }: ${sellers1.length}`);
    sellers1.forEach(u => {
      console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, sellerStatus: ${u.sellerStatus}`);
    });

    console.log('\n--- Users where sellerStatus is pending ---');
    const pendingSellers = await User.find({ sellerStatus: 'pending' });
    console.log(`Count: ${pendingSellers.length}`);
    pendingSellers.forEach(u => {
      console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, sellerStatus: ${u.sellerStatus}`);
    });

    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
