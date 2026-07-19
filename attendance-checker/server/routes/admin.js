const express = require('express');
const router = express.Router();
const {
    login, getProfile, updateProfile, changePassword,
    logout, getSettings, updateSettings, getDashboard
} = require('../controllers/adminController');
const { auth } = require('../middleware/auth');

router.post('/login', login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.post('/logout', auth, logout);
router.get('/settings', auth, getSettings);
router.put('/settings', auth, updateSettings);
router.get('/dashboard', auth, getDashboard);

module.exports = router;
