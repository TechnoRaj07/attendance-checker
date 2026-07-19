const Attendance = require('../models/Attendance');
const Visitor = require('../models/Visitor');
const ActivityLog = require('../models/ActivityLog');
const { generatePDF } = require('../utils/pdfGenerator');
const { generateExcel } = require('../utils/excelGenerator');
const { generateCSV } = require('../utils/csvGenerator');
const path = require('path');

// @desc    Export attendance as PDF
// @route   GET /api/export/attendance/pdf/:id
exports.exportAttendancePDF = async (req, res) => {
    try {
        const record = await Attendance.findById(req.params.id);
        if (!record) return res.status(404).json({ success: false, error: 'Record not found.' });

        const safeRollNumber = record.student.rollNumber.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `attendance_${safeRollNumber}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '..', '..', 'reports', fileName);

        await generatePDF(record, filePath);

        if (req.admin) {
            await ActivityLog.create({
                action: 'report_download',
                adminId: req.admin._id,
                adminEmail: req.admin.email,
                details: `Downloaded PDF for ${record.student.name}`,
                ipAddress: req.ip
            });
        }

        res.download(filePath, fileName);
    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).json({ success: false, error: 'Error generating PDF.' });
    }
};

// @desc    Export all attendance as Excel
// @route   GET /api/export/attendance/excel
exports.exportAttendanceExcel = async (req, res) => {
    try {
        const records = await Attendance.find().sort('-createdAt').limit(1000);
        const fileName = `attendance_records_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '..', '..', 'reports', fileName);

        await generateExcel(records, filePath);

        if (req.admin) {
            await ActivityLog.create({
                action: 'export_data',
                adminId: req.admin._id,
                adminEmail: req.admin.email,
                details: `Exported ${records.length} attendance records as Excel`,
                ipAddress: req.ip
            });
        }

        res.download(filePath, fileName);
    } catch (error) {
        console.error('Excel Export Error:', error);
        res.status(500).json({ success: false, error: 'Error generating Excel.' });
    }
};

// @desc    Export visitors as CSV
// @route   GET /api/export/visitors/csv
exports.exportVisitorsCSV = async (req, res) => {
    try {
        const visitors = await Visitor.find({ isArchived: false }).sort('-date').limit(5000);
        const fileName = `visitors_${Date.now()}.csv`;
        const filePath = path.join(__dirname, '..', '..', 'reports', fileName);

        await generateCSV(visitors, filePath);

        if (req.admin) {
            await ActivityLog.create({
                action: 'export_data',
                adminId: req.admin._id,
                adminEmail: req.admin.email,
                details: `Exported ${visitors.length} visitors as CSV`,
                ipAddress: req.ip
            });
        }

        res.download(filePath, fileName);
    } catch (error) {
        console.error('CSV Export Error:', error);
        res.status(500).json({ success: false, error: 'Error generating CSV.' });
    }
};

// @desc    Export attendance as CSV
// @route   GET /api/export/attendance/csv
exports.exportAttendanceCSV = async (req, res) => {
    try {
        const records = await Attendance.find().sort('-createdAt').limit(1000);
        const fileName = `attendance_${Date.now()}.csv`;
        const filePath = path.join(__dirname, '..', '..', 'reports', fileName);

        const flatRecords = records.map(r => ({
            studentName: r.student.name,
            rollNumber: r.student.rollNumber,
            year: r.student.year,
            department: r.student.department,
            semester: r.student.semester,
            email: r.student.email,
            phone: r.student.phone,
            totalClasses: r.overallAttendance.totalClasses,
            totalAttended: r.overallAttendance.totalAttended,
            percentage: r.overallAttendance.percentage,
            status: r.overallAttendance.status,
            date: r.createdAt
        }));

        await generateCSV(flatRecords, filePath);
        res.download(filePath, fileName);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error generating CSV.' });
    }
};
