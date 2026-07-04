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
    console.log('✅ Logged in. Token retrieved.');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('🔵 Requesting /api/v1/admin/sellers...');
    const res = await axios.get(`${API_BASE}/admin/sellers`, { headers });
    console.log('🟢 Response status:', res.status);
    console.log('🟢 Response body sellers count:', res.data.sellers?.length);
    console.log('🟢 Sellers list:', JSON.stringify(res.data.sellers, null, 2));

  } catch (err) {
    console.error('❌ Request failed:', err.response ? {
      status: err.response.status,
      data: err.response.data
    } : err.message);
  }
}

run();
