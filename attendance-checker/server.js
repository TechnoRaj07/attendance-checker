// ==========================================
// University Student Attendance Checker
// Main Server Entry Point
// ==========================================

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./server/config/db');
const fs = require('fs');

const app = express();

// ==========================================
// Connect to MongoDB
// ==========================================
connectDB();

// ==========================================
// Create required directories
// ==========================================
const dirs = ['reports', 'uploads', 'logs', 'public'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// ==========================================
// Security Middleware
// ==========================================
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(mongoSanitize());

// ==========================================
// Rate Limiting
// ==========================================
const generalLimiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again after 15 minutes.' }
});

app.use('/api/', generalLimiter);
app.use('/api/admin/login', authLimiter);

// ==========================================
// Body Parsing
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// Logging
// ==========================================
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'logs', 'access.log'),
    { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));

// ==========================================
// Static Files
// ==========================================
app.use(express.static(path.join(__dirname, 'client')));
app.use('/reports', express.static(path.join(__dirname, 'reports')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// Visitor Tracking Middleware
// ==========================================
const visitorTracker = require('./server/middleware/visitorTracker');
app.use(visitorTracker);

// ==========================================
// API Routes
// ==========================================
app.use('/api/attendance', require('./server/routes/attendance'));
app.use('/api/admin', require('./server/routes/admin'));
app.use('/api/contact', require('./server/routes/contact'));
app.use('/api/visitors', require('./server/routes/visitor'));
app.use('/api/analytics', require('./server/routes/analytics'));
app.use('/api/users', require('./server/routes/user'));
app.use('/api/logs', require('./server/routes/logs'));
app.use('/api/security', require('./server/routes/security'));
app.use('/api/export', require('./server/routes/export'));

// ==========================================
// Page Routes
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'contact.html'));
});

app.get('/check-attendance', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'check-attendance.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin', 'dashboard.html'));
});

app.get('/admin/records', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin', 'records.html'));
});

app.get('/admin/visitors', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin', 'visitors.html'));
});

app.get('/admin/messages', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin', 'messages.html'));
});

app.get('/admin/users', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin', 'users.html'));
});

app.get('/admin/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin', 'settings.html'));
});

app.get('/admin/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin', 'analytics.html'));
});

app.get('/admin/logs', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin', 'logs.html'));
});

app.get('/admin/security', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin', 'security.html'));
});

app.get('/admin/backup', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'admin', 'backup.html'));
});

// ==========================================
// 404 Handler
// ==========================================
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'client', 'pages', 'index.html'));
});

// ==========================================
// Error Handler
// ==========================================
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

// ==========================================
// Start Server
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════╗
    ║   University Student Attendance Checker      ║
    ║   Server running on port ${PORT}                ║
    ║   http://localhost:${PORT}                      ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}               ║
    ╚══════════════════════════════════════════════╝
    `);
});

module.exports = app;
