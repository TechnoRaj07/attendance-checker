const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subjectName: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    facultyName: {
        type: String,
        required: [true, 'Faculty name is required'],
        trim: true
    },
    totalClasses: {
        type: Number,
        required: [true, 'Total classes is required'],
        min: [0, 'Total classes cannot be negative']
    },
    attendedClasses: {
        type: Number,
        required: [true, 'Attended classes is required'],
        min: [0, 'Attended classes cannot be negative']
    },
    percentage: {
        type: Number,
        default: 0
    },
    classesNeeded: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['PASS', 'SHORT'],
        default: 'PASS'
    }
});

const attendanceSchema = new mongoose.Schema({
    student: {
        name: { type: String, required: true },
        rollNumber: { type: String, required: true },
        year: { type: Number, required: true },
        department: { type: String, required: true },
        semester: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true }
    },
    subjects: [subjectSchema],
    overallAttendance: {
        totalClasses: { type: Number, default: 0 },
        totalAttended: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        status: { type: String, enum: ['PASS', 'SHORT'], default: 'PASS' }
    },
    numberOfSubjects: {
        type: Number,
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    isApproved: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

attendanceSchema.index({ 'student.rollNumber': 1 });
attendanceSchema.index({ 'student.name': 1 });
attendanceSchema.index({ createdAt: -1 });
attendanceSchema.index({ 'overallAttendance.status': 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
