const http = require('http');

http.get('http://localhost:5002/api/v1/health', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', JSON.stringify(JSON.parse(data), null, 2));
  });
}).on('error', (err) => {
  console.error('Error fetching health:', err.message);
});
