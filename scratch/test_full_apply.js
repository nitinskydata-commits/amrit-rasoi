const axios = require('axios');
const API_BASE = "http://localhost:5002/api/v1";

async function run() {
  try {
    // Step 1: Login as mr@gmail.com
    console.log('🔵 Logging in as mr@gmail.com...');
    const loginRes = await axios.post(`${API_BASE}/login`, {
      email: 'mr@gmail.com',
      password: '123456'
    });
    const token = loginRes.data.token;
    console.log('✅ Logged in. Token obtained.');

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Submit seller application WITH token
    console.log('\n🔵 Submitting seller application with token...');
    const payload = {
      name: 'Mr Test',
      email: 'mr@gmail.com',
      phone: '1234567890',
      shopName: 'Mr Test Shop',
      shopDescription: 'A test shop for Mr',
      gstin: 'TESTGSTIN1234',
      pan: 'ABCDE1234F',
      bankDetails: {
        bankName: 'SBI',
        accountNumber: '123456789012',
        ifscCode: 'SBIN0001234',
        accountHolderName: 'Mr Test',
        upiId: 'mr@upi'
      },
      businessAddress: {
        line1: '123 Test Street',
        line2: 'Near Park',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001'
      }
    };

    const res = await axios.post(`${API_BASE}/register/seller`, payload, { headers });
    console.log('✅ Application submitted successfully!');
    console.log('   Message:', res.data.message);

    // Step 3: Verify in admin sellers list
    console.log('\n🔵 Logging in as admin to verify...');
    const adminLogin = await axios.post(`${API_BASE}/login`, {
      email: 'admin@sbmi.com',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const sellersRes = await axios.get(`${API_BASE}/admin/sellers`, { headers: adminHeaders });
    console.log('🟢 Admin sellers list count:', sellersRes.data.sellers?.length);
    const pending = sellersRes.data.sellers?.filter(s => s.sellerStatus === 'pending');
    console.log('🟢 Pending applications:', pending?.length);
    pending?.forEach(s => {
      console.log(`  - ${s.name} (${s.email}) → Status: ${s.sellerStatus}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();
