const mongoose = require('mongoose');
const MONGO_URI = "mongodb://127.0.0.1:27017/amrit_rasoi";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected successfully to DB!');
    
    // Check if the User schema has any validation issues
    const User = require('../server/models/User');
    
    // Find one user just to test query
    const user = await User.findOne({});
    console.log('✅ Query check user count/existence:', user ? `Found: ${user.email}` : 'No users in DB');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
