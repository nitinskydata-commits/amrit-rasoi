const mongoose = require('mongoose');
const User = require('../server/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

const restoreAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/amrit_rasoi');
        console.log('Connected to MongoDB');

        const email = 'admin@sbmi.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('Admin user not found. Creating a new one...');
            await User.create({
                name: 'SBMI Admin',
                email: email,
                phone: '9876543210',
                password: 'admin123',
                role: 'admin',
                isSuperAdmin: true
            });
            console.log('✅ Admin user created: admin@sbmi.com / admin123');
        } else {
            console.log(`Found user: ${user.email} with current role: ${user.role}`);
            user.role = 'admin';
            user.isSuperAdmin = true;
            user.password = 'admin123'; // Resetting password to be sure
            await user.save();
            console.log('✅ Admin role and password restored: admin@sbmi.com / admin123');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

restoreAdmin();
