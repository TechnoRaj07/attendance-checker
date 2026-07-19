const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');
const Settings = require('../models/Settings');
const { generateToken } = require('../middleware/auth');

// @desc    Admin Login
// @route   POST /api/admin/login
exports.login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password.'
            });
        }

        const admin = await Admin.findOne({ email }).select('+password');

        if (!admin) {
            await ActivityLog.create({
                action: 'failed_login',
                details: `Failed login attempt for email: ${email}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            return res.status(401).json({
                success: false,
                error: 'Invalid email or password.'
            });
        }

        // Check if account is locked
        if (admin.isLocked()) {
            return res.status(423).json({
                success: false,
                error: 'Account is locked. Please try again later.'
            });
        }

        const isMatch = await admin.comparePassword(password);

        if (!isMatch) {
            admin.failedLoginAttempts += 1;

            // Lock account after 5 failed attempts
            if (admin.failedLoginAttempts >= 5) {
                admin.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            }

            admin.loginHistory.push({
                ipAddress: req.ip,
                browser: req.headers['user-agent'],
                device: 'Unknown',
                success: false
            });

            await admin.save();

            await ActivityLog.create({
                action: 'failed_login',
                adminEmail: email,
                details: `Failed login attempt (${admin.failedLoginAttempts} total)`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            return res.status(401).json({
                success: false,
                error: 'Invalid email or password.'
            });
        }

        // Reset failed attempts on successful login
        admin.failedLoginAttempts = 0;
        admin.lockUntil = null;
        admin.lastLogin = new Date();
        admin.loginHistory.push({
            date: new Date(),
            ipAddress: req.ip,
            browser: req.headers['user-agent'],
            device: 'Web',
            success: true
        });

        // Keep only last 50 login history entries
        if (admin.loginHistory.length > 50) {
            admin.loginHistory = admin.loginHistory.slice(-50);
        }

        await admin.save();

        const token = generateToken(admin._id, admin.role);

        await ActivityLog.create({
            action: 'admin_login',
            adminId: admin._id,
            adminEmail: admin.email,
            details: 'Admin logged in successfully',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            data: {
                token,
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    avatar: admin.avatar,
                    lastLogin: admin.lastLogin
                }
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, error: 'Server error during login.' });
    }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
exports.getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, avatar } = req.body;
        const admin = await Admin.findByIdAndUpdate(
            req.adminId,
            { name, email, avatar },
            { new: true, runValidators: true }
        );

        await ActivityLog.create({
            action: 'settings_change',
            adminId: req.adminId,
            adminEmail: admin.email,
            details: 'Updated admin profile',
            ipAddress: req.ip
        });

        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Change password
// @route   PUT /api/admin/change-password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Please provide current and new password.'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters.'
            });
        }

        const admin = await Admin.findById(req.adminId).select('+password');
        const isMatch = await admin.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect.'
            });
        }

        admin.password = newPassword;
        await admin.save();

        await ActivityLog.create({
            action: 'password_change',
            adminId: req.adminId,
            adminEmail: admin.email,
            details: 'Admin changed password',
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Admin Logout (log activity)
// @route   POST /api/admin/logout
exports.logout = async (req, res) => {
    try {
        await ActivityLog.create({
            action: 'admin_logout',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: 'Admin logged out',
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get settings
// @route   GET /api/admin/settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Update settings
// @route   PUT /api/admin/settings
exports.updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create(req.body);
        } else {
            Object.assign(settings, req.body);
            await settings.save();
        }

        await ActivityLog.create({
            action: 'settings_change',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: 'Updated application settings',
            ipAddress: req.ip
        });

        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get dashboard overview stats
// @route   GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
    try {
        const Attendance = require('../models/Attendance');
        const Visitor = require('../models/Visitor');
        const Message = require('../models/Message');
        const User = require('../models/User');

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalAttendance,
            passedCount,
            shortCount,
            todayVisitors,
            weeklyVisitors,
            monthlyVisitors,
            totalVisitors,
            totalMessages,
            unreadMessages,
            totalUsers,
            totalAdmins
        ] = await Promise.all([
            Attendance.countDocuments(),
            Attendance.countDocuments({ 'overallAttendance.status': 'PASS' }),
            Attendance.countDocuments({ 'overallAttendance.status': 'SHORT' }),
            Visitor.countDocuments({ date: { $gte: todayStart } }),
            Visitor.countDocuments({ date: { $gte: weekStart } }),
            Visitor.countDocuments({ date: { $gte: monthStart } }),
            Visitor.countDocuments(),
            Message.countDocuments(),
            Message.countDocuments({ isRead: false }),
            User.countDocuments(),
            Admin.countDocuments()
        ]);

        // System stats
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();

        res.json({
            success: true,
            data: {
                attendance: { total: totalAttendance, passed: passedCount, short: shortCount },
                visitors: {
                    today: todayVisitors,
                    weekly: weeklyVisitors,
                    monthly: monthlyVisitors,
                    total: totalVisitors
                },
                messages: { total: totalMessages, unread: unreadMessages },
                users: { total: totalUsers, admins: totalAdmins },
                system: {
                    status: 'Online',
                    uptime: Math.floor(uptime),
                    memory: {
                        used: Math.round(memUsage.heapUsed / 1024 / 1024),
                        total: Math.round(memUsage.heapTotal / 1024 / 1024),
                        rss: Math.round(memUsage.rss / 1024 / 1024)
                    },
                    nodeVersion: process.version,
                    platform: process.platform
                }
            }
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};
