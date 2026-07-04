const axios = require('axios');
const API_BASE = "http://localhost:5002/api/v1";

async function run() {
  try {
    // Step 1: Login as mr@gmail.com
    console.log('🔵 Logging in as mr@gmail.com...');
    let loginRes;
    try {
      loginRes = await axios.post(`${API_BASE}/login`, {
        email: 'mr@gmail.com',
        password: '12345678'
      });
      console.log('✅ Logged in successfully.');
    } catch (e) {
      console.log('❌ Login failed with password 12345678:', e.response?.data?.message);
      console.log('🔵 Trying password "password"...');
      try {
        loginRes = await axios.post(`${API_BASE}/login`, {
          email: 'mr@gmail.com',
          password: 'password'
        });
        console.log('✅ Logged in with "password".');
      } catch (e2) {
        console.log('❌ Login failed:', e2.response?.data?.message);
        console.log('🔵 Skipping login, trying unauthenticated application...');
        loginRes = null;
      }
    }

    const token = loginRes?.data?.token;
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    console.log('\n🔵 Submitting seller application...');
    const payload = {
      name: 'Mr Test',
      email: 'mr@gmail.com',
      phone: '1234567890',
      shopName: 'Test Shop',
      shopDescription: 'Test shop description',
      gstin: 'TESTGSTIN123',
      pan: 'TESTPAN123',
      bankDetails: {
        bankName: 'SBI',
        accountNumber: '123456789',
        ifscCode: 'SBIN0001234',
        accountHolderName: 'Mr Test',
        upiId: ''
      },
      businessAddress: {
        line1: '123 Test Street',
        line2: '',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001'
      }
    };

    const res = await axios.post(`${API_BASE}/register/seller`, payload, config);
    console.log('✅ Application submitted:', res.data.message || res.data);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error submitting application:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();
