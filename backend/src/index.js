require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const asociadoRoutes = require('./routes/asociadoRoutes');
const retiroRoutes = require('./routes/retiroRoutes');
const catalogosRoutes = require('./routes/catalogosRoutes');
const documentoRoutes = require('./routes/documentoRoutes');
const alertaRoutes = require('./routes/alertaRoutes');
const importRoutes = require('./routes/importRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const ausentismoRoutes = require('./routes/ausentismoRoutes');

// Importar tareas programadas (Cron)
const { iniciarCronAlertas } = require('./jobs/alertasCron');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
// Configurar límites de tamaño para carga de planillas Excel en base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos subidos de forma estática
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Registro de endpoints de la API
app.use('/api/auth', authRoutes);
app.use('/api/asociados', asociadoRoutes);
app.use('/api/retiros', retiroRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/import', importRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/ausentismos', ausentismoRoutes);

// Servir archivos estáticos del frontend compilado en producción
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDistPath));
  
  // Redirigir cualquier otra ruta no-API al index.html de React (SPA)
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    mensaje: 'Ha ocurrido un error interno en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Inicializar el cron job de alertas automáticas
iniciarCronAlertas();

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(`   HRM CORAZA SEGURIDAD CTA - BACKEND ACTIVO      `);
  console.log(`   Servidor escuchando en: http://localhost:${PORT} `);
  console.log(`==================================================`);

  // Probar conexión a la base de datos al arrancar
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log(`[DB] ✅ Conexión a la base de datos exitosa`);
    await prisma.$disconnect();
  } catch (error) {
    console.error(`[DB] ❌ Error de conexión a la base de datos:`, error.message);
  }
});
