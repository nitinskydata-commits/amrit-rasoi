const mongoose = require('mongoose');
const MONGO_URI = "mongodb://127.0.0.1:27017/amrit_rasoi";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const User = require('../server/models/User');
    
    console.log('🔵 Fixing admin@sbmi.com user role...');
    const result = await User.updateOne(
      { email: 'admin@sbmi.com' },
      { 
        $set: { 
          role: 'admin',
          sellerStatus: 'none',
          isSuperAdmin: true
        } 
      }
    );
    
    console.log('🟢 Update result:', result);
    
    // Check if there are other users to verify
    const adminUser = await User.findOne({ email: 'admin@sbmi.com' });
    console.log('🟢 Admin User current details:', {
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      sellerStatus: adminUser.sellerStatus
    });

    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
