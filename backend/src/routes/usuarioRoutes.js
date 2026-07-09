const express = require('express');
const { getUsuarios, createUsuario, updateUsuario } = require('../controllers/usuarioController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getUsuarios);
router.post('/', protect, createUsuario);
router.put('/:id', protect, updateUsuario);

module.exports = router;
