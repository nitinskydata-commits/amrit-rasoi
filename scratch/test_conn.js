const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const test = async (uri, name) => {
  try {
    console.log(`Testing ${name}...`);
    // clean URI representation for log
    const logUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`URI: ${logUri}`);
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ Success for ${name}! Connected to host: ${conn.connection.host}`);
    await mongoose.disconnect();
  } catch (err) {
    console.log(`❌ Failed for ${name}: ${err.message}`);
  }
};

async function run() {
  // Option 1: literal password admin123
  await test('mongodb+srv://Admin_SBMI:admin123@cluster0.5tdkqgd.mongodb.net/sbmi_ecommerce?retryWrites=true&w=majority&appName=Cluster0', 'Atlas admin123');

  // Option 2: password Admin@123 (URL encoded as Admin%40123)
  await test('mongodb+srv://Admin_SBMI:Admin%40123@cluster0.5tdkqgd.mongodb.net/sbmi_ecommerce?retryWrites=true&w=majority&appName=Cluster0', 'Atlas Admin%40123 (URL encoded)');

  // Option 3: literal password <Admin@123> (URL encoded as %3CAdmin%40123%3E)
  await test('mongodb+srv://Admin_SBMI:%3CAdmin%40123%3E@cluster0.5tdkqgd.mongodb.net/sbmi_ecommerce?retryWrites=true&w=majority&appName=Cluster0', 'Atlas %3CAdmin%40123%3E (URL encoded)');
  
  // Option 4: Localhost mongodb
  await test('mongodb://127.0.0.1:27017/amrit_rasoi', 'Local MongoDB');
}

run();
