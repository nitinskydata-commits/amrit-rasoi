const mongoose = require('mongoose');
const MONGO_URI = "mongodb://127.0.0.1:27017/amrit_rasoi";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const { getSalesAnalytics, getInventoryAnalytics, getDemandForecasts } = require('../server/controllers/analyticsController');
    
    // Mock req and res objects
    const req = {
      user: {
        id: "mock_id",
        role: "admin"
      }
    };
    
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        console.log(`[STATUS ${this.statusCode || 200}]`, data);
      }
    };

    console.log('\n--- Testing getSalesAnalytics ---');
    try {
      await getSalesAnalytics(req, res);
    } catch (e) {
      console.error('❌ Sales failed:', e);
    }

    console.log('\n--- Testing getInventoryAnalytics ---');
    try {
      await getInventoryAnalytics(req, res);
    } catch (e) {
      console.error('❌ Inventory failed:', e);
    }

    console.log('\n--- Testing getDemandForecasts ---');
    try {
      await getDemandForecasts(req, res);
    } catch (e) {
      console.error('❌ Forecast failed:', e);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
