const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    studentName: { type: String, default: 'Anonymous' },
    rollNumber: { type: String, default: '' },
    year: { type: String, default: '' },
    department: { type: String, default: '' },
    semester: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    country: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    browser: { type: String, default: '' },
    operatingSystem: { type: String, default: '' },
    device: { type: String, default: 'Desktop' },
    screenResolution: { type: String, default: '' },
    timeZone: { type: String, default: '' },
    language: { type: String, default: '' },
    referralWebsite: { type: String, default: 'Direct' },
    visitedPage: { type: String, default: '/' },
    visitDuration: { type: Number, default: 0 },
    loginTime: { type: Date, default: Date.now },
    logoutTime: { type: Date, default: null },
    submissionTime: { type: Date, default: null },
    date: { type: Date, default: Date.now },
    userAgent: { type: String, default: '' },
    internetProvider: { type: String, default: '' },
    visitorId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    isArchived: { type: Boolean, default: false }
}, {
    timestamps: true
});

visitorSchema.index({ visitorId: 1 });
visitorSchema.index({ sessionId: 1 });
visitorSchema.index({ date: -1 });
visitorSchema.index({ ipAddress: 1 });
visitorSchema.index({ country: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
