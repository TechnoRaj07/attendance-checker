const express = require('express');
const router = express.Router();
const { getAnalytics, getRealtime } = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getAnalytics);
router.get('/realtime', auth, getRealtime);

module.exports = router;
