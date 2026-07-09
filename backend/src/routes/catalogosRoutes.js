const express = require('express');
const { 
  getCargos, 
  createCargo, 
  updateCargo, 
  getCentrosTrabajo, 
  createCentroTrabajo, 
  updateCentroTrabajo, 
  getValoresCatalogo, 
  createValorCatalogo, 
  toggleValorCatalogo 
} = require('../controllers/catalogosController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Cargos
router.get('/cargos', protect, getCargos);
router.post('/cargos', protect, createCargo);
router.put('/cargos/:id', protect, updateCargo);

// Centros de Trabajo
router.get('/centros', protect, getCentrosTrabajo);
router.post('/centros', protect, createCentroTrabajo);
router.put('/centros/:id', protect, updateCentroTrabajo);

// Valores de Catálogos (EPS, FondoPension, Rh, etc.)
router.get('/valores/:tipo', protect, getValoresCatalogo);
router.post('/valores', protect, createValorCatalogo);
router.put('/valores/:id/toggle', protect, toggleValorCatalogo);

module.exports = router;
