const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

const seedAdmin = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'admin@sbmi.com';
        const password = 'Admin@123'; // Temporary password

        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            console.log(`ℹ️ Admin user already exists: ${email}`);
            console.log('🔄 Updating role to admin and marking as super-admin just in case...');
            existingAdmin.role = 'admin';
            existingAdmin.isSuperAdmin = true;
            await existingAdmin.save();
            console.log('✅ Admin verified.');
        } else {
            console.log(`📝 Creating new Admin: ${email}`);
            await User.create({
                name: 'SBMI Super Admin',
                email,
                phone: '+91 xxxxx xxxxx',
                password,
                role: 'admin',
                isSuperAdmin: true
            });
            console.log('✅ Admin user created successfully.');
        }

        console.log('\n' + '='.repeat(50));
        console.log('LOGIN CREDENTIALS:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('='.repeat(50) + '\n');

        process.exit();
    } catch (error) {
        console.error('❌ Seeder error:', error.message);
        process.exit(1);
    }
};

seedAdmin();
