const express = require('express');
const router = express.Router();
const {
    checkAttendance, getAttendance, getAttendanceById,
    updateAttendance, deleteAttendance, updateStatus,
    getStats, searchByRoll
} = require('../controllers/attendanceController');
const { auth } = require('../middleware/auth');

router.post('/check', checkAttendance);
router.get('/', getAttendance);
router.get('/stats', getStats);
router.get('/search/:roll', searchByRoll);
router.get('/:id', getAttendanceById);
router.put('/:id', auth, updateAttendance);
router.delete('/:id', auth, deleteAttendance);
router.put('/:id/status', auth, updateStatus);

module.exports = router;
