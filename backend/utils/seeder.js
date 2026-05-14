const User = require('../models/User');

/**
 * Seed a default super admin user if none exists
 */
const seedAdmin = async () => {
    try {
        const email = 'admin@sbmi.com';
        const adminExists = await User.findOne({ email });
        
        if (!adminExists) {
            console.log('📝 SEEDING: Creating default admin user...');
            await User.create({
                name: 'SBMI Admin',
                email: email,
                phone: '+91 xxxxx xxxxx',
                password: 'Admin@123',
                role: 'admin',
                isSuperAdmin: true
            });
            console.log('✅ SEEDING: Admin user created successfully.');
        } else {
            console.log('ℹ️ SEEDING: Admin user already exists.');
        }
    } catch (error) {
        console.error('❌ SEEDING ERROR:', error.message);
    }
};

module.exports = seedAdmin;
