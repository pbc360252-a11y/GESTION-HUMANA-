const express = require('express');
const { login, getMe, status } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/status', status);

module.exports = router;
