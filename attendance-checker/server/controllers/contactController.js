const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');

// @desc    Submit contact message
// @route   POST /api/contact
exports.submitMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, subject, and message are required.'
            });
        }

        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address.'
            });
        }

        const newMessage = await Message.create({
            name,
            email,
            phone: phone || '',
            subject,
            message,
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully! We will get back to you soon.',
            data: newMessage
        });

    } catch (error) {
        console.error('Contact Error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get all messages
// @route   GET /api/contact/messages
exports.getMessages = async (req, res) => {
    try {
        const { page = 1, limit = 20, filter = 'all', search = '' } = req.query;

        const query = {};

        if (filter === 'unread') query.isRead = false;
        else if (filter === 'starred') query.isStarred = true;
        else if (filter === 'archived') query.isArchived = true;
        else query.isArchived = false;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Message.countDocuments(query);
        const messages = await Message.find(query)
            .sort('-createdAt')
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: messages,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Mark message as read
// @route   PUT /api/contact/:id/read
exports.markRead = async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found.' });
        }

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Toggle star message
// @route   PUT /api/contact/:id/star
exports.toggleStar = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found.' });
        }

        message.isStarred = !message.isStarred;
        await message.save();

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Archive message
// @route   PUT /api/contact/:id/archive
exports.archiveMessage = async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { isArchived: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found.' });
        }

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Reply to message
// @route   PUT /api/contact/:id/reply
exports.replyMessage = async (req, res) => {
    try {
        const { reply } = req.body;

        if (!reply) {
            return res.status(400).json({ success: false, error: 'Reply content is required.' });
        }

        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { reply, repliedAt: new Date(), isRead: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found.' });
        }

        if (req.admin) {
            await ActivityLog.create({
                action: 'message_reply',
                adminId: req.admin._id,
                adminEmail: req.admin.email,
                details: `Replied to message from ${message.name}`,
                targetId: message._id.toString(),
                ipAddress: req.ip
            });
        }

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Delete message
// @route   DELETE /api/contact/:id
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found.' });
        }

        if (req.admin) {
            await ActivityLog.create({
                action: 'message_delete',
                adminId: req.admin._id,
                adminEmail: req.admin.email,
                details: `Deleted message from ${message.name}`,
                ipAddress: req.ip
            });
        }

        res.json({ success: true, message: 'Message deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};
