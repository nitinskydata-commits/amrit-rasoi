const axios = require('axios');
const API_BASE = "http://localhost:5002/api/v1";

async function run() {
  try {
    console.log('🔵 Logging in as admin...');
    const loginRes = await axios.post(`${API_BASE}/login`, {
      email: 'admin@sbmi.com',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('✅ Logged in.');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('🔵 Fetching /admin/sellers...');
    const res = await axios.get(`${API_BASE}/admin/sellers`, { headers });
    console.log('🟢 API returned sellers count:', res.data.sellers?.length);
    res.data.sellers.forEach(s => {
      console.log(`- Name: ${s.name}, Email: ${s.email}, Status: ${s.sellerStatus}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();
