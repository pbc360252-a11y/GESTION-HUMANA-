const express = require('express');
const router = express.Router();
const { getAusentismos, createAusentismo, updateAusentismo, deleteAusentismo, getDiagnosticos } = require('../controllers/ausentismoController');
const { importAusentismos } = require('../controllers/ausentismoImportController');
const { protect, authorize } = require('../middlewares/auth');

// Rutas protegidas de ausentismos
router.get('/', protect, getAusentismos);
router.post('/', protect, authorize('ADMIN', 'GESTION_HUMANA', 'SST', 'COORDINADOR_OPERATIVO'), createAusentismo);
router.put('/:id', protect, authorize('ADMIN', 'GESTION_HUMANA', 'SST', 'COORDINADOR_OPERATIVO'), updateAusentismo);
router.delete('/:id', protect, authorize('ADMIN', 'GESTION_HUMANA', 'SST', 'COORDINADOR_OPERATIVO'), deleteAusentismo);
router.get('/diagnosticos', protect, getDiagnosticos);
router.post('/importar', protect, authorize('ADMIN', 'GESTION_HUMANA'), importAusentismos);

module.exports = router;
