const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        default: 'University Student Attendance Checker'
    },
    siteDescription: {
        type: String,
        default: 'A modern attendance tracking system for university students'
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    registrationEnabled: {
        type: Boolean,
        default: true
    },
    minAttendancePercentage: {
        type: Number,
        default: 75
    },
    maxLoginAttempts: {
        type: Number,
        default: 5
    },
    lockoutDuration: {
        type: Number,
        default: 30
    },
    sessionTimeout: {
        type: Number,
        default: 60
    },
    emailNotifications: {
        type: Boolean,
        default: false
    },
    autoBackup: {
        type: Boolean,
        default: false
    },
    backupFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
    },
    theme: {
        type: String,
        enum: ['cyberpunk', 'dark', 'light'],
        default: 'cyberpunk'
    },
    language: {
        type: String,
        default: 'en'
    },
    contactEmail: {
        type: String,
        default: 'admin@university.edu'
    },
    socialLinks: {
        github: { type: String, default: '' },
        twitter: { type: String, default: '' },
        linkedin: { type: String, default: '' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
