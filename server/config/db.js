const mongoose = require("mongoose");
const dns = require('dns');

// Force Google DNS to resolve MongoDB Atlas SRV records (fixes local network DNS issues)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    throw error;
  }
};

module.exports = connectDB;