const express = require('express');
const { getAuditoria } = require('../controllers/auditoriaController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getAuditoria);

module.exports = router;
