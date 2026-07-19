const express = require('express');
const router = express.Router();
const {
    getFailedLogins, getBlockedAccounts, unlockAccount,
    deactivateAccount, getSecurityOverview
} = require('../controllers/securityController');
const { auth } = require('../middleware/auth');

router.get('/failed-logins', auth, getFailedLogins);
router.get('/blocked', auth, getBlockedAccounts);
router.put('/unlock/:id', auth, unlockAccount);
router.put('/deactivate/:id', auth, deactivateAccount);
router.get('/overview', auth, getSecurityOverview);

module.exports = router;
