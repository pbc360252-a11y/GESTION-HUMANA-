const express = require('express');
const { getAlertas, resolverAlerta, runCronManually } = require('../controllers/alertaController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getAlertas);
router.put('/:id/resolver', protect, resolverAlerta);
router.post('/run-cron', protect, runCronManually);

module.exports = router;
