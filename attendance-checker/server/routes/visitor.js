const express = require('express');
const router = express.Router();
const {
    getVisitors, getVisitorById, deleteVisitor,
    bulkDelete, archiveVisitor, restoreVisitor
} = require('../controllers/visitorController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getVisitors);
router.get('/:id', auth, getVisitorById);
router.delete('/:id', auth, deleteVisitor);
router.post('/bulk-delete', auth, bulkDelete);
router.put('/:id/archive', auth, archiveVisitor);
router.put('/:id/restore', auth, restoreVisitor);

module.exports = router;
