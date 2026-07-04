const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE = "http://localhost:5002/api/v1";
const MONGO_URI = "mongodb://127.0.0.1:27017/amrit_rasoi";

async function run() {
  try {
    // Connect to database to check afterwards
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('../server/models/User');

    // 1. Create a new test user
    const email = `test_seller_${Date.now()}@test.com`;
    const phone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
    const password = 'password123';

    console.log(`🔵 Registering a new shopper user: ${email} / ${phone}...`);
    const regRes = await axios.post(`${API_BASE}/register`, {
      name: 'Test Seller applicant',
      email,
      phone,
      password
    });

    const token = regRes.data.token;
    console.log('✅ Shopper user registered successfully. Token:', token.slice(0, 15) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Submit seller application
    const payload = {
      name: 'Test Seller applicant',
      email,
      phone,
      shopName: 'Mega Tech Shop',
      shopDescription: 'Sells general electronics and tech devices',
      gstin: '07AAAAA1111A1Z1',
      pan: 'AAAAA1111A',
      bankDetails: {
        bankName: 'SBI',
        accountNumber: '111222333444',
        ifscCode: 'SBIN0001234',
        accountHolderName: 'Test Seller applicant',
        upiId: 'megatech@okaxis'
      },
      businessAddress: {
        line1: '123, Ring Road',
        line2: 'Sector 5',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      }
    };

    console.log('🔵 Submitting seller application via POST /api/v1/register/seller...');
    const applyRes = await axios.post(`${API_BASE}/register/seller`, payload, { headers });
    console.log('🟢 Apply API response:', applyRes.data);

    // 3. Verify in Database
    const dbUser = await User.findOne({ email });
    console.log('🟢 DB User after application:', {
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      sellerStatus: dbUser.sellerStatus,
      sellerProfile: dbUser.sellerProfile
    });

    // 4. Query from Admin sellers endpoint
    console.log('🔵 Logging in as admin...');
    const adminLogin = await axios.post(`${API_BASE}/login`, {
      email: 'admin@sbmi.com',
      password: 'admin123'
    });

    const adminToken = adminLogin.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    console.log('🔵 Requesting admin /sellers list...');
    const sellersRes = await axios.get(`${API_BASE}/admin/sellers`, { headers: adminHeaders });
    const match = sellersRes.data.sellers?.find(s => s.email === email);
    console.log('🟢 Found in admin sellers list:', match ? {
      name: match.name,
      email: match.email,
      sellerStatus: match.sellerStatus
    } : '❌ NOT FOUND in admin sellers list');

    // Clean up
    await User.deleteOne({ email });
    console.log('🧹 Cleaned up test user.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Test failed:', err.response ? {
      status: err.response.status,
      data: err.response.data
    } : err.message);
    process.exit(1);
  }
}

run();
