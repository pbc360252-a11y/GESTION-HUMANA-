const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAuditoria = async (req, res) => {
  try {
    const { rol } = req.user;
    if (rol !== 'ADMIN') {
      return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden ver la bitácora de auditoría.' });
    }

    const { usuarioId, entidad, fechaInicio, fechaFin } = req.query;

    const where = {};
    if (usuarioId) where.usuarioId = usuarioId;
    if (entidad) where.entidad = entidad;
    
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) {
        const fEnd = new Date(fechaFin);
        fEnd.setHours(23, 59, 59, 999);
        where.fecha.lte = fEnd;
      }
    }

    const registros = await prisma.auditoria.findMany({
      where,
      include: {
        usuario: {
          select: { nombre: true, correo: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    res.json(registros);
  } catch (error) {
    console.error('Error al obtener bitácora de auditoría:', error);
    res.status(500).json({ mensaje: 'Error al obtener registros de auditoría' });
  }
};

module.exports = { getAuditoria };
