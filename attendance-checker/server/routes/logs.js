const express = require('express');
const router = express.Router();
const { getLogs, getLogSummary, deleteOldLogs } = require('../controllers/logController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getLogs);
router.get('/summary', auth, getLogSummary);
router.delete('/old', auth, deleteOldLogs);

module.exports = router;
