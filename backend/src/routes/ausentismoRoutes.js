const express = require('express');
const router = express.Router();
const { getAusentismos, createAusentismo, updateAusentismo, deleteAusentismo, getDiagnosticos } = require('../controllers/ausentismoController');
const { importAusentismos } = require('../controllers/ausentismoImportController');
const { protect } = require('../middlewares/auth');

// Rutas protegidas de ausentismos
router.get('/', protect, getAusentismos);
router.post('/', protect, createAusentismo);
router.put('/:id', protect, updateAusentismo);
router.delete('/:id', protect, deleteAusentismo);
router.get('/diagnosticos', protect, getDiagnosticos);
router.post('/importar', protect, importAusentismos);

module.exports = router;
