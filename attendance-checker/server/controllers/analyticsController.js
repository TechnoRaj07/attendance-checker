const Attendance = require('../models/Attendance');
const Visitor = require('../models/Visitor');
const Message = require('../models/Message');

// @desc    Get analytics data for charts
// @route   GET /api/analytics
exports.getAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Daily visitors (last 30 days)
        const dailyVisitors = await Visitor.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Monthly visitors (last 12 months)
        const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const monthlyVisitors = await Visitor.aggregate([
            { $match: { date: { $gte: twelveMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Attendance trends (last 30 days)
        const attendanceTrends = await Attendance.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    total: { $sum: 1 },
                    avgPercentage: { $avg: '$overallAttendance.percentage' },
                    passed: {
                        $sum: { $cond: [{ $eq: ['$overallAttendance.status', 'PASS'] }, 1, 0] }
                    },
                    short: {
                        $sum: { $cond: [{ $eq: ['$overallAttendance.status', 'SHORT'] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Pass vs Short overall
        const passShort = await Attendance.aggregate([
            {
                $group: {
                    _id: '$overallAttendance.status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Students by year
        const byYear = await Attendance.aggregate([
            { $group: { _id: '$student.year', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Students by department
        const byDepartment = await Attendance.aggregate([
            { $group: { _id: '$student.department', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Device usage
        const deviceUsage = await Visitor.aggregate([
            { $group: { _id: '$device', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Browser usage
        const browserUsage = await Visitor.aggregate([
            { $group: { _id: '$browser', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Country visitors
        const countryVisitors = await Visitor.aggregate([
            { $match: { country: { $ne: '' } } },
            { $group: { _id: '$country', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Subject performance (top failed subjects)
        const subjectPerformance = await Attendance.aggregate([
            { $unwind: '$subjects' },
            {
                $group: {
                    _id: '$subjects.subjectName',
                    avgPercentage: { $avg: '$subjects.percentage' },
                    totalStudents: { $sum: 1 },
                    failedStudents: {
                        $sum: { $cond: [{ $eq: ['$subjects.status', 'SHORT'] }, 1, 0] }
                    }
                }
            },
            { $sort: { avgPercentage: 1 } },
            { $limit: 10 }
        ]);

        // Hourly activity heatmap data
        const hourlyActivity = await Visitor.aggregate([
            {
                $group: {
                    _id: {
                        day: { $dayOfWeek: '$date' },
                        hour: { $hour: '$date' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.day': 1, '_id.hour': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                dailyVisitors,
                monthlyVisitors,
                attendanceTrends,
                passShort,
                byYear,
                byDepartment,
                deviceUsage,
                browserUsage,
                countryVisitors,
                subjectPerformance,
                hourlyActivity
            }
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get real-time counters
// @route   GET /api/analytics/realtime
exports.getRealtime = async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [onlineUsers, todayChecks, todayVisitors] = await Promise.all([
            Visitor.countDocuments({ loginTime: { $gte: fiveMinutesAgo } }),
            Attendance.countDocuments({ createdAt: { $gte: todayStart } }),
            Visitor.countDocuments({ date: { $gte: todayStart } })
        ]);

        res.json({
            success: true,
            data: { onlineUsers, todayChecks, todayVisitors }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};
