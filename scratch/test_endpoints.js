const axios = require('axios');

const API_BASE = "http://localhost:5002/api/v1";

async function run() {
  try {
    console.log('🔵 Attempting Login...');
    const loginRes = await axios.post(`${API_BASE}/login`, {
      email: 'admin@sbmi.com',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('✅ Logged in successfully. Token:', token.slice(0, 15) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n🔵 Requesting /analytics/sales...');
    const salesRes = await axios.get(`${API_BASE}/analytics/sales`, { headers });
    console.log('🟢 Sales success:', salesRes.data.success, 'Items count:', salesRes.data.data?.length);

    console.log('\n🔵 Requesting /analytics/inventory...');
    const invRes = await axios.get(`${API_BASE}/analytics/inventory`, { headers });
    console.log('🟢 Inventory success:', invRes.data.success, 'Items count:', invRes.data.data?.length);

    console.log('\n🔵 Requesting /analytics/forecasts...');
    const foreRes = await axios.get(`${API_BASE}/analytics/forecasts`, { headers });
    console.log('🟢 Forecasts success:', foreRes.data.success, 'Items count:', foreRes.data.data?.length);

  } catch (err) {
    console.error('❌ Request failed:', err.response ? {
      status: err.response.status,
      data: err.response.data
    } : err.message);
  }
}

run();
