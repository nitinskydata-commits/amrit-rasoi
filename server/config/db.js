const mongoose = require("mongoose");
const dns = require('dns');

// Force Google DNS to resolve MongoDB Atlas SRV records (fixes local network DNS issues)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/amrit_rasoi';

  try {
    console.log(`🔌 Connecting to primary database...`);
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000 // Limit wait time to 5s to fail fast and fall back
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ Primary Database Connection Failed: ${error.message}`);
    console.log(`🔌 Attempting connection to local fallback database: ${fallbackUri}`);
    try {
      const conn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`✅ MongoDB Connected (Local Fallback): ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`❌ Fallback Database Connection Failed: ${fallbackError.message}`);
      throw fallbackError;
    }
  }
};

module.exports = connectDB;