const dns = require('dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'config/config.env' });

// Set DNS to Google
dns.setServers(['8.8.8.8', '8.8.4.4']);

const testConnection = async () => {
    const uri = process.env.MONGO_URI;
    console.log(`🔍 Attempting connection to Atlas via Google DNS...`);
    console.log(`URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`); // Mask password

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ SUCCESS: Connected to MongoDB using Google DNS!');
        process.exit(0);
    } catch (error) {
        console.error('❌ FAILURE: Still cannot connect to MongoDB.');
        console.error(`Error: ${error.message}`);
        
        // Try to resolve SRV manually
        console.log('\n🔍 Debugging SRV resolution...');
        const host = uri.split('@')[1].split('/')[0].split('?')[0];
        dns.resolveSrv(`_mongodb._tcp.${host}`, (err, addresses) => {
            if (err) {
                console.error(`❌ SRV Resolution Error: ${err.message}`);
            } else {
                console.log('✅ SRV Resolved to:', addresses);
            }
            process.exit(1);
        });
    }
};

testConnection();
