const http = require('http');

const query = (path) => {
  http.get(`http://localhost:5002/api/v1${path}`, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`=== Path: ${path} ===`);
      console.log('Status Code:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Keys:', Object.keys(parsed));
        if (parsed.products) console.log('Products Count:', parsed.products.length);
        if (parsed.testimonials) console.log('Testimonials Count:', parsed.testimonials.length);
        if (parsed.badges) console.log('Badges Count:', parsed.badges.length);
      } catch (err) {
        console.log('Raw output:', data.slice(0, 200));
      }
    });
  }).on('error', (err) => {
    console.error(`Error querying ${path}:`, err.message);
  });
};

query('/products');
query('/testimonials');
query('/badges');
