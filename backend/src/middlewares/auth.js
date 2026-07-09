const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'coraza-seguridad-super-secret-key-12345');

      req.user = await prisma.usuario.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          nombre: true,
          correo: true,
          rol: true,
          activo: true,
        },
      });

      if (!req.user) {
        return res.status(401).json({ mensaje: 'No autorizado, usuario no encontrado' });
      }

      if (!req.user.activo) {
        return res.status(401).json({ mensaje: 'Usuario inactivo, contacte al administrador' });
      }

      next();
    } catch (error) {
      console.error('Error al verificar el token:', error);
      return res.status(401).json({ mensaje: 'No autorizado, token fallido' });
    }
  }

  if (!token) {
    return res.status(401).json({ mensaje: 'No autorizado, sin token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        mensaje: `Acceso denegado. Rol '${req.user ? req.user.rol : 'Desconocido'}' no está autorizado.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
