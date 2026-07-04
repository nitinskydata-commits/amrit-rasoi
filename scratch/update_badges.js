const mongoose = require('mongoose');
const MONGO_URI = "mongodb://127.0.0.1:27017/amrit_rasoi";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to database');
    const SiteBadge = require('../server/models/SiteBadge'); // Adjust path
    
    // Find the badge
    const badge = await SiteBadge.findOne({ title: '100% Organic' });
    if (badge) {
      badge.title = '100% Original';
      badge.emoji = '🛡️';
      badge.description = 'Certified genuine products directly sourced from verified sellers.';
      await badge.save();
      console.log('✅ Trust badge successfully updated to "100% Original"!');
    } else {
      console.log('❌ Badge "100% Organic" not found. Checking all badges...');
      const all = await SiteBadge.find({});
      console.log('Current Badges in DB:', all.map(b => b.title));
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
