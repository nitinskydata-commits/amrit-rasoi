const mongoose = require('mongoose');
const User = require('../server/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: 'config/config.env' });

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const admins = await User.find({ role: 'admin' });
        if (admins.length > 0) {
            console.log('🔒 Found Admin User(s):');
            admins.forEach(admin => {
                console.log(` - ${admin.email} (Role: ${admin.role})`);
            });
        } else {
            console.log('❌ No Admin users found in the database.');
        }

        process.exit();
    } catch (error) {
        console.error('❌ Error checking database:', error.message);
        process.exit(1);
    }
};

checkAdmin();
