const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all users
// @route   GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.role = role;
        if (status) query.status = status;

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .sort('-createdAt')
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: users,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Create user
// @route   POST /api/users
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, department, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Email already exists.' });
        }

        const user = await User.create({ name, email, password, role, department, phone });

        await ActivityLog.create({
            action: 'user_create',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: `Created user ${name} (${email}) with role ${role || 'student'}`,
            ipAddress: req.ip
        });

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, department, phone, status } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role, department, phone, status },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        await ActivityLog.create({
            action: 'user_edit',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: `Updated user ${user.name}`,
            targetId: user._id.toString(),
            ipAddress: req.ip
        });

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        await ActivityLog.create({
            action: 'user_delete',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: `Deleted user ${user.name} (${user.email})`,
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Suspend user
// @route   PUT /api/users/:id/suspend
exports.suspendUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status: 'suspended' },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        await ActivityLog.create({
            action: 'user_suspend',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: `Suspended user ${user.name}`,
            ipAddress: req.ip
        });

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Activate user
// @route   PUT /api/users/:id/activate
exports.activateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status: 'active' },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        await ActivityLog.create({
            action: 'user_activate',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: `Activated user ${user.name}`,
            ipAddress: req.ip
        });

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Reset user password
// @route   PUT /api/users/:id/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        user.password = newPassword;
        await user.save();

        await ActivityLog.create({
            action: 'user_edit',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: `Reset password for user ${user.name}`,
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Password reset successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};
