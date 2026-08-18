require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos subidos de forma estática
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ruta pública keep-alive para evitar pausa de Supabase
app.get('/api/public/keep-alive', async (req, res) => {
  try {
    await prisma.$executeRaw`SELECT 1`;
    res.json({ estado: 'activo', database: 'conectada', fecha: new Date() });
  } catch (error) {
    console.error('[KEEP-ALIVE ERROR]', error);
    res.status(500).json({ estado: 'error', database: 'desconectada', error: error.message });
  }
});

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
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
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

module.exports = app;
