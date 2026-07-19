const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs
// @route   GET /api/logs
exports.getLogs = async (req, res) => {
    try {
        const {
            page = 1, limit = 50, action = '', search = '',
            startDate = '', endDate = ''
        } = req.query;

        const query = {};

        if (action) query.action = action;
        if (search) {
            query.$or = [
                { adminEmail: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } },
                { ipAddress: { $regex: search, $options: 'i' } }
            ];
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const total = await ActivityLog.countDocuments(query);
        const logs = await ActivityLog.find(query)
            .sort('-createdAt')
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: logs,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get log actions summary
// @route   GET /api/logs/summary
exports.getLogSummary = async (req, res) => {
    try {
        const summary = await ActivityLog.aggregate([
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const totalLogs = await ActivityLog.countDocuments();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayLogs = await ActivityLog.countDocuments({ createdAt: { $gte: todayStart } });

        res.json({
            success: true,
            data: { summary, totalLogs, todayLogs }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Delete old logs
// @route   DELETE /api/logs/old
exports.deleteOldLogs = async (req, res) => {
    try {
        const { days = 90 } = req.body;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const result = await ActivityLog.deleteMany({ createdAt: { $lt: cutoff } });

        await ActivityLog.create({
            action: 'settings_change',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: `Deleted ${result.deletedCount} logs older than ${days} days`,
            ipAddress: req.ip
        });

        res.json({ success: true, message: `${result.deletedCount} old logs deleted.` });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};
