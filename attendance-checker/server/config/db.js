// ==========================================
// MongoDB Connection Configuration
// ==========================================

const mongoose = require('mongoose');
const dns = require('dns');
// Fix for Windows DNS SRV lookup issues
dns.setServers(['8.8.8.8', '8.8.4.4']);
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_checker');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });

    } catch (error) {
        console.error('MongoDB Connection Failed:', error.message);
        console.log('Server will continue without database. Some features may not work.');
    }
};

module.exports = connectDB;
