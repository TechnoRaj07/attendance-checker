const Visitor = require('../models/Visitor');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all visitors
// @route   GET /api/visitors
exports.getVisitors = async (req, res) => {
    try {
        const {
            page = 1, limit = 20, sort = '-date', search = '',
            device = '', browser = '', country = '', archived = 'false'
        } = req.query;

        const query = { isArchived: archived === 'true' };

        if (search) {
            query.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { ipAddress: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { visitorId: { $regex: search, $options: 'i' } }
            ];
        }

        if (device) query.device = device;
        if (browser) query.browser = browser;
        if (country) query.country = { $regex: country, $options: 'i' };

        const total = await Visitor.countDocuments(query);
        const visitors = await Visitor.find(query)
            .sort(sort)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: visitors,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get visitor by ID
// @route   GET /api/visitors/:id
exports.getVisitorById = async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id);
        if (!visitor) return res.status(404).json({ success: false, error: 'Visitor not found.' });
        res.json({ success: true, data: visitor });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Delete visitor
// @route   DELETE /api/visitors/:id
exports.deleteVisitor = async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndDelete(req.params.id);
        if (!visitor) return res.status(404).json({ success: false, error: 'Visitor not found.' });

        if (req.admin) {
            await ActivityLog.create({
                action: 'visitor_delete',
                adminId: req.admin._id,
                adminEmail: req.admin.email,
                details: `Deleted visitor ${visitor.visitorId}`,
                ipAddress: req.ip
            });
        }

        res.json({ success: true, message: 'Visitor deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Bulk delete visitors
// @route   POST /api/visitors/bulk-delete
exports.bulkDelete = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: 'Please provide visitor IDs.' });
        }

        const result = await Visitor.deleteMany({ _id: { $in: ids } });

        if (req.admin) {
            await ActivityLog.create({
                action: 'visitor_delete',
                adminId: req.admin._id,
                adminEmail: req.admin.email,
                details: `Bulk deleted ${result.deletedCount} visitors`,
                ipAddress: req.ip
            });
        }

        res.json({ success: true, message: `${result.deletedCount} visitors deleted.` });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Archive visitor
// @route   PUT /api/visitors/:id/archive
exports.archiveVisitor = async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndUpdate(
            req.params.id,
            { isArchived: true },
            { new: true }
        );

        if (!visitor) return res.status(404).json({ success: false, error: 'Visitor not found.' });

        if (req.admin) {
            await ActivityLog.create({
                action: 'visitor_archive',
                adminId: req.admin._id,
                adminEmail: req.admin.email,
                details: `Archived visitor ${visitor.visitorId}`,
                ipAddress: req.ip
            });
        }

        res.json({ success: true, data: visitor });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Restore archived visitor
// @route   PUT /api/visitors/:id/restore
exports.restoreVisitor = async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndUpdate(
            req.params.id,
            { isArchived: false },
            { new: true }
        );

        if (!visitor) return res.status(404).json({ success: false, error: 'Visitor not found.' });
        res.json({ success: true, data: visitor });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};
