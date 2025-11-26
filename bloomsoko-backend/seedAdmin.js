// seedAdmin.js
import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomsoko');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create initial admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@bloomsoko.com',
      password: 'admin123', // Will be hashed automatically
      role: 'admin',
      phone: '+254700000000' // Optional for admin
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully:');
    console.log('   Email: admin@bloomsoko.com');
    console.log('   Password: admin123');
    console.log('   Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();