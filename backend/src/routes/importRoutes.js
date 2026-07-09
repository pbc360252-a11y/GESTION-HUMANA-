const express = require('express');
const { previewExcel, analyzeExcelSheet, confirmExcelImport } = require('../controllers/importController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/preview', protect, authorize('ADMIN', 'GESTION_HUMANA'), previewExcel);
router.post('/analyze', protect, authorize('ADMIN', 'GESTION_HUMANA'), analyzeExcelSheet);
router.post('/confirm', protect, authorize('ADMIN', 'GESTION_HUMANA'), confirmExcelImport);

module.exports = router;
