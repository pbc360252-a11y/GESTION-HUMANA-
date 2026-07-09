const express = require('express');
const { 
  registrarRetiro, 
  getRetiroByAsociadoId, 
  updateRetiro 
} = require('../controllers/retiroController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/asociado/:asociadoId', protect, registrarRetiro);
router.get('/asociado/:asociadoId', protect, getRetiroByAsociadoId);
router.put('/:id', protect, updateRetiro);

module.exports = router;
