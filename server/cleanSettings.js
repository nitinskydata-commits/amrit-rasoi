const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/amrit_rasoi').then(async () => {
  try {
    await mongoose.connection.db.collection('settings').updateOne({}, {
      $set: {
        homepageCategories: [],
        footerLinks: [],
        featureBadges: [],
        'bulkBusinessCard.isActive': false
      }
    });
    console.log('Settings cleaned successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
});
