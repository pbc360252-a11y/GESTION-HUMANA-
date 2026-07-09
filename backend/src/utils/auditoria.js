const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const registrarAuditoria = async (usuarioId, entidad, entidadId, accion, campoModificado = null, valorAnterior = null, valorNuevo = null, ip = null) => {
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId,
        entidad,
        entidadId,
        accion,
        campoModificado,
        valorAnterior: valorAnterior !== null ? String(valorAnterior) : null,
        valorNuevo: valorNuevo !== null ? String(valorNuevo) : null,
        ip
      }
    });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};

module.exports = { registrarAuditoria };
