const app = require('./app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { iniciarCronAlertas } = require('./jobs/alertasCron');

const PORT = process.env.PORT || 5000;

// Inicializar el cron job de alertas automáticas
iniciarCronAlertas();

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(`   HRM CORAZA SEGURIDAD CTA - BACKEND ACTIVO      `);
  console.log(`   Servidor escuchando en: http://localhost:${PORT} `);
  console.log(`==================================================`);

  // Probar conexión a la base de datos al arrancar
  try {
    await prisma.$connect();
    console.log(`[DB] ✅ Conexión a la base de datos exitosa`);
  } catch (error) {
    console.error(`[DB] ❌ Error de conexión a la base de datos:`, error.message);
  }
});
