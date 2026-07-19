const express = require('express');
const router = express.Router();
const {
    getUsers, createUser, updateUser, deleteUser,
    suspendUser, activateUser, resetPassword
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getUsers);
router.post('/', auth, createUser);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);
router.put('/:id/suspend', auth, suspendUser);
router.put('/:id/activate', auth, activateUser);
router.put('/:id/reset-password', auth, resetPassword);

module.exports = router;
