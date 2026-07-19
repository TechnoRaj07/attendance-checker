const ActivityLog = require('../models/ActivityLog');
const Admin = require('../models/Admin');

// @desc    Get failed login attempts
// @route   GET /api/security/failed-logins
exports.getFailedLogins = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const total = await ActivityLog.countDocuments({ action: 'failed_login' });
        const failedLogins = await ActivityLog.find({ action: 'failed_login' })
            .sort('-createdAt')
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: failedLogins,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get blocked IPs (admins that are locked)
// @route   GET /api/security/blocked
exports.getBlockedAccounts = async (req, res) => {
    try {
        const blocked = await Admin.find({
            $or: [
                { lockUntil: { $gt: new Date() } },
                { isActive: false }
            ]
        }).select('email failedLoginAttempts lockUntil isActive lastLogin');

        res.json({ success: true, data: blocked });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Unlock admin account
// @route   PUT /api/security/unlock/:id
exports.unlockAccount = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            { failedLoginAttempts: 0, lockUntil: null, isActive: true },
            { new: true }
        );

        if (!admin) return res.status(404).json({ success: false, error: 'Account not found.' });

        await ActivityLog.create({
            action: 'ip_unblock',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: `Unlocked account for ${admin.email}`,
            ipAddress: req.ip
        });

        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Deactivate admin account
// @route   PUT /api/security/deactivate/:id
exports.deactivateAccount = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!admin) return res.status(404).json({ success: false, error: 'Account not found.' });

        await ActivityLog.create({
            action: 'ip_block',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: `Deactivated account ${admin.email}`,
            ipAddress: req.ip
        });

        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get session/security overview
// @route   GET /api/security/overview
exports.getSecurityOverview = async (req, res) => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            failedToday,
            failedWeek,
            totalFailed,
            lockedAccounts,
            activeAdmins
        ] = await Promise.all([
            ActivityLog.countDocuments({ action: 'failed_login', createdAt: { $gte: oneDayAgo } }),
            ActivityLog.countDocuments({ action: 'failed_login', createdAt: { $gte: oneWeekAgo } }),
            ActivityLog.countDocuments({ action: 'failed_login' }),
            Admin.countDocuments({ lockUntil: { $gt: new Date() } }),
            Admin.countDocuments({ isActive: true })
        ]);

        // Most targeted emails
        const targetedEmails = await ActivityLog.aggregate([
            { $match: { action: 'failed_login', adminEmail: { $ne: '' } } },
            { $group: { _id: '$adminEmail', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Suspicious IPs (most failed login IPs)
        const suspiciousIPs = await ActivityLog.aggregate([
            { $match: { action: 'failed_login' } },
            { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                failedToday,
                failedWeek,
                totalFailed,
                lockedAccounts,
                activeAdmins,
                targetedEmails,
                suspiciousIPs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};
