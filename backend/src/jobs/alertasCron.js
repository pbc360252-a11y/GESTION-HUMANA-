const cron = require('node-cron');
const { generarAlertasDeVencimiento } = require('../controllers/alertaController');

const iniciarCronAlertas = () => {
  // Ejecutar todos los días a la medianoche (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON ALERTAS] Iniciando escaneo diario de vencimientos...');
    try {
      const resultado = await generarAlertasDeVencimiento();
      console.log(`[CRON ALERTAS] Completado. Alertas creadas: ${resultado.alertasCreadasCount}`);
    } catch (error) {
      console.error('[CRON ALERTAS] Error al generar alertas:', error);
    }
  });

  console.log('[CRON ALERTAS] Tarea programada registrada (Ejecución diaria a medianoche)');
};

module.exports = { iniciarCronAlertas };
