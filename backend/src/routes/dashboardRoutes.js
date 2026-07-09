const express = require('express');
const { getDashboardStats, exportAsociadosExcel, exportMatrizCumplimientoExcel } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/export/asociados', protect, exportAsociadosExcel);
router.get('/export/cumplimiento', protect, exportMatrizCumplimientoExcel);

module.exports = router;
