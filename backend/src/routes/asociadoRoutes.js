const express = require('express');
const { 
  getAsociados, 
  getAsociadoById, 
  createAsociado, 
  updateAsociado, 
  reingresarAsociado 
} = require('../controllers/asociadoController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getAsociados);
router.get('/:id', protect, getAsociadoById);
router.post('/', protect, createAsociado);
router.put('/:id', protect, updateAsociado);
router.post('/:id/reingresar', protect, reingresarAsociado);

module.exports = router;
