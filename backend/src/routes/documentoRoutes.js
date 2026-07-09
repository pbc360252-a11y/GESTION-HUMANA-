const express = require('express');
const { uploadDocumento, deleteDocumento } = require('../controllers/documentoController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/upload/:asociadoId', protect, uploadDocumento);
router.delete('/:id', protect, deleteDocumento);

module.exports = router;
