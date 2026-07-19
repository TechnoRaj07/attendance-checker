const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');

// ==========================================
// Core Attendance Formula (from C++)
// Attendance % = (attended / total) × 100
// Minimum = 75%
// Classes Needed = max(0, 3 × total − 4 × attended)
// ==========================================

const calculateAttendance = (attended, total) => {
    if (total === 0) return { percentage: 0, status: 'SHORT', classesNeeded: 0 };

    const percentage = (attended / total) * 100;
    let classesNeeded = (3 * total) - (4 * attended);
    if (classesNeeded < 0) classesNeeded = 0;

    return {
        percentage: Math.round(percentage * 100) / 100,
        status: percentage >= 75 ? 'PASS' : 'SHORT',
        classesNeeded: Math.ceil(classesNeeded)
    };
};

// @desc    Check attendance / Submit attendance record
// @route   POST /api/attendance/check
exports.checkAttendance = async (req, res) => {
    try {
        const { student, subjects, numberOfSubjects } = req.body;

        // Validate student info
        if (!student || !student.name || !student.rollNumber || !student.year ||
            !student.department || !student.semester || !student.email || !student.phone) {
            return res.status(400).json({
                success: false,
                error: 'All student fields are required.'
            });
        }

        // Validate subjects
        if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one subject is required.'
            });
        }

        let totalClassesAll = 0;
        let totalAttendedAll = 0;
        const processedSubjects = [];

        for (const subject of subjects) {
            if (!subject.subjectName || !subject.facultyName) {
                return res.status(400).json({
                    success: false,
                    error: 'Subject name and faculty name are required for all subjects.'
                });
            }

            const total = parseInt(subject.totalClasses);
            const attended = parseInt(subject.attendedClasses);

            if (isNaN(total) || isNaN(attended) || total < 0 || attended < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Classes must be valid non-negative numbers.'
                });
            }

            if (attended > total) {
                return res.status(400).json({
                    success: false,
                    error: `Attended classes cannot exceed total classes for ${subject.subjectName}.`
                });
            }

            const result = calculateAttendance(attended, total);

            processedSubjects.push({
                subjectName: subject.subjectName,
                facultyName: subject.facultyName,
                totalClasses: total,
                attendedClasses: attended,
                percentage: result.percentage,
                classesNeeded: result.classesNeeded,
                status: result.status
            });

            totalClassesAll += total;
            totalAttendedAll += attended;
        }

        const overallResult = calculateAttendance(totalAttendedAll, totalClassesAll);

        const attendanceRecord = new Attendance({
            student: {
                name: student.name,
                rollNumber: student.rollNumber,
                year: parseInt(student.year),
                department: student.department,
                semester: student.semester,
                email: student.email,
                phone: student.phone
            },
            subjects: processedSubjects,
            overallAttendance: {
                totalClasses: totalClassesAll,
                totalAttended: totalAttendedAll,
                percentage: overallResult.percentage,
                status: overallResult.status
            },
            numberOfSubjects: numberOfSubjects || subjects.length,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        await attendanceRecord.save();

        res.status(201).json({
            success: true,
            data: attendanceRecord
        });

    } catch (error) {
        console.error('Check Attendance Error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while processing attendance.'
        });
    }
};

// @desc    Get all attendance records
// @route   GET /api/attendance
exports.getAttendance = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            sort = '-createdAt',
            search = '',
            status = '',
            department = '',
            year = ''
        } = req.query;

        const query = { isArchived: false };

        if (search) {
            query.$or = [
                { 'student.name': { $regex: search, $options: 'i' } },
                { 'student.rollNumber': { $regex: search, $options: 'i' } },
                { 'student.email': { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query['overallAttendance.status'] = status;
        if (department) query['student.department'] = { $regex: department, $options: 'i' };
        if (year) query['student.year'] = parseInt(year);

        const total = await Attendance.countDocuments(query);
        const records = await Attendance.find(query)
            .sort(sort)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: records,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get Attendance Error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
exports.getAttendanceById = async (req, res) => {
    try {
        const record = await Attendance.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ success: false, error: 'Record not found.' });
        }
        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
exports.updateAttendance = async (req, res) => {
    try {
        const record = await Attendance.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!record) {
            return res.status(404).json({ success: false, error: 'Record not found.' });
        }

        // Log activity
        if (req.admin) {
            await ActivityLog.create({
                action: 'record_edit',
                adminId: req.admin._id,
                adminEmail: req.admin.email,
                details: `Updated attendance record for ${record.student.name}`,
                targetId: record._id.toString(),
                ipAddress: req.ip
            });
        }

        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
exports.deleteAttendance = async (req, res) => {
    try {
        const record = await Attendance.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ success: false, error: 'Record not found.' });
        }

        await Attendance.findByIdAndDelete(req.params.id);

        if (req.admin) {
            await ActivityLog.create({
                action: 'record_delete',
                adminId: req.admin._id,
                adminEmail: req.admin.email,
                details: `Deleted attendance record for ${record.student.name} (${record.student.rollNumber})`,
                targetId: req.params.id,
                ipAddress: req.ip
            });
        }

        res.json({ success: true, message: 'Record deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Approve/Reject attendance record
// @route   PUT /api/attendance/:id/status
exports.updateStatus = async (req, res) => {
    try {
        const { isApproved } = req.body;
        const record = await Attendance.findByIdAndUpdate(
            req.params.id,
            { isApproved },
            { new: true }
        );

        if (!record) {
            return res.status(404).json({ success: false, error: 'Record not found.' });
        }

        await ActivityLog.create({
            action: isApproved ? 'record_approve' : 'record_reject',
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            details: `${isApproved ? 'Approved' : 'Rejected'} record for ${record.student.name}`,
            targetId: record._id.toString(),
            ipAddress: req.ip
        });

        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
exports.getStats = async (req, res) => {
    try {
        const total = await Attendance.countDocuments();
        const passed = await Attendance.countDocuments({ 'overallAttendance.status': 'PASS' });
        const shorted = await Attendance.countDocuments({ 'overallAttendance.status': 'SHORT' });

        const avgResult = await Attendance.aggregate([
            { $group: { _id: null, avgAttendance: { $avg: '$overallAttendance.percentage' } } }
        ]);

        const byDepartment = await Attendance.aggregate([
            { $group: { _id: '$student.department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const byYear = await Attendance.aggregate([
            { $group: { _id: '$student.year', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                total,
                passed,
                shorted,
                averageAttendance: avgResult[0]?.avgAttendance?.toFixed(2) || 0,
                byDepartment,
                byYear
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Search attendance by roll number
// @route   GET /api/attendance/search/:roll
exports.searchByRoll = async (req, res) => {
    try {
        const records = await Attendance.find({
            'student.rollNumber': { $regex: req.params.roll, $options: 'i' }
        }).sort('-createdAt');

        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};
