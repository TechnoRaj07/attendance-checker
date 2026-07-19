// ==========================================
// Database Seeder
// Seeds admin account and sample data
// ==========================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');
// Fix for Windows DNS SRV lookup issues
dns.setServers(['8.8.8.8', '8.8.4.4']);
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');
const User = require('../models/User');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_checker');
        console.log('Connected to MongoDB for seeding...');

        // Seed Admin
        const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@university.edu' });
        if (!existingAdmin) {
            await Admin.create({
                name: 'Super Admin',
                email: process.env.ADMIN_EMAIL || 'admin@university.edu',
                password: process.env.ADMIN_PASSWORD || 'Admin@123',
                role: 'superadmin',
                isActive: true
            });
            console.log('✅ Admin account created');
            console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@university.edu'}`);
            console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
        } else {
            console.log('ℹ️  Admin account already exists');
        }

        // Seed Settings
        const existingSettings = await Settings.findOne();
        if (!existingSettings) {
            await Settings.create({
                siteName: 'University Student Attendance Checker',
                minAttendancePercentage: 75,
                theme: 'cyberpunk'
            });
            console.log('✅ Default settings created');
        } else {
            console.log('ℹ️  Settings already exist');
        }

        // Seed sample users
        const existingUsers = await User.countDocuments();
        if (existingUsers === 0) {
            const sampleUsers = [
                { name: 'John Smith', email: 'john@university.edu', password: 'Student@123', role: 'student', department: 'Computer Science' },
                { name: 'Jane Doe', email: 'jane@university.edu', password: 'Student@123', role: 'student', department: 'Electronics' },
                { name: 'Prof. Kumar', email: 'kumar@university.edu', password: 'Teacher@123', role: 'teacher', department: 'Computer Science' },
                { name: 'Prof. Sharma', email: 'sharma@university.edu', password: 'Teacher@123', role: 'teacher', department: 'Mechanical' }
            ];

            for (const user of sampleUsers) {
                await User.create(user);
            }
            console.log('✅ Sample users created');
        } else {
            console.log('ℹ️  Users already exist');
        }

        console.log('\n🎉 Database seeding complete!');
        console.log('═══════════════════════════════════════');
        console.log('You can now run: npm run dev');
        console.log('═══════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Error:', error.message);
        process.exit(1);
    }
};

seedDatabase();
