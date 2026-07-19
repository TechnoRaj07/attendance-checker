const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'admin_login', 'admin_logout',
            'record_view', 'record_create', 'record_edit', 'record_delete', 'record_approve', 'record_reject',
            'visitor_view', 'visitor_delete', 'visitor_archive',
            'message_read', 'message_reply', 'message_delete', 'message_archive',
            'user_create', 'user_edit', 'user_delete', 'user_suspend', 'user_activate',
            'settings_change', 'password_change',
            'report_download', 'export_data',
            'backup_create', 'backup_restore',
            'ip_block', 'ip_unblock',
            'failed_login'
        ]
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    adminEmail: {
        type: String,
        default: ''
    },
    details: {
        type: String,
        default: ''
    },
    targetId: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

activityLogSchema.index({ action: 1 });
activityLogSchema.index({ adminId: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
