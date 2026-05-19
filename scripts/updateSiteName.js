const mongoose = require('mongoose');
const Settings = require('../server/models/Settings');
require('dotenv').config({ path: './config/config.env' });

const updateSiteName = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
    
    const settings = await Settings.findOne();
    if (settings) {
      settings.siteName = 'SBMI';
      await settings.save();
      console.log('✅ Site name updated to SBMI in database!');
    } else {
      console.log('⚠️ No settings found to update.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating site name:', error);
    process.exit(1);
  }
};

updateSiteName();
