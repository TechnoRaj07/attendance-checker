const express = require('express');
const router = express.Router();
const {
    exportAttendancePDF, exportAttendanceExcel,
    exportVisitorsCSV, exportAttendanceCSV
} = require('../controllers/exportController');
const { auth } = require('../middleware/auth');

router.get('/attendance/pdf/:id', exportAttendancePDF);
router.get('/attendance/excel', auth, exportAttendanceExcel);
router.get('/attendance/csv', auth, exportAttendanceCSV);
router.get('/visitors/csv', auth, exportVisitorsCSV);

module.exports = router;
