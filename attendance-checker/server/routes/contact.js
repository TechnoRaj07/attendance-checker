const express = require('express');
const router = express.Router();
const {
    submitMessage, getMessages, markRead, toggleStar,
    archiveMessage, replyMessage, deleteMessage
} = require('../controllers/contactController');
const { auth } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimiter');

router.post('/', contactLimiter, submitMessage);
router.get('/messages', auth, getMessages);
router.put('/:id/read', auth, markRead);
router.put('/:id/star', auth, toggleStar);
router.put('/:id/archive', auth, archiveMessage);
router.put('/:id/reply', auth, replyMessage);
router.delete('/:id', auth, deleteMessage);

module.exports = router;
