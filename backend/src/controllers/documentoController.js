const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { registrarAuditoria } = require('../utils/auditoria');

// Subir y asociar documento a un empleado
const uploadDocumento = async (req, res) => {
  try {
    const { asociadoId } = req.params;
    const { id: usuarioId } = req.user;
    const { tipoDocumento, fileName, fileData, fechaVencimiento } = req.body;

    if (!tipoDocumento || !fileName || !fileData) {
      return res.status(400).json({ mensaje: 'Campos requeridos: tipoDocumento, fileName, fileData (Base64)' });
    }

    const asociado = await prisma.asociado.findUnique({ where: { id: asociadoId } });
    if (!asociado) {
      return res.status(404).json({ mensaje: 'Asociado no encontrado' });
    }

    // Crear carpeta uploads si no existe
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Guardar archivo decodificando base64
    const uniqueFileName = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadsDir, uniqueFileName);
    const buffer = Buffer.from(fileData.split(',')[1] || fileData, 'base64');
    fs.writeFileSync(filePath, buffer);

    const archivoUrl = `/uploads/${uniqueFileName}`;
    const fVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;

    // Crear registro del documento en la BD
    const nuevoDoc = await prisma.documentoAsociado.create({
      data: {
        asociadoId,
        tipoDocumento,
        archivoUrl,
        fechaVencimiento: fVencimiento,
        cargadoPorId: usuarioId
      }
    });

    // Regla de Negocio: Si se sube examen vigente, actualizar el flag del Asociado y resolver alertas del mismo tipo
    const updateData = {};
    let tipoAlerta = null;

    if (tipoDocumento === 'EXAMEN_PSICOFISICO') {
      updateData.psicofisicoVigente = true;
      tipoAlerta = 'VENCIMIENTO_PSICOFISICO';
    } else if (tipoDocumento === 'EXAMEN_PSICOSENSOMETRICO') {
      updateData.psicosensometricoVigente = true;
      tipoAlerta = 'VENCIMIENTO_PSICOSENSOMETRICO';
    } else if (tipoDocumento === 'CERTIFICADO_CURSO') {
      tipoAlerta = 'VENCIMIENTO_CURSO';
    } else if (tipoDocumento === 'POLIZA_SURA') {
      updateData.tienePolizaSura = true;
      tipoAlerta = 'VENCIMIENTO_POLIZA';
    }

    // Actualizar campos en el Asociado
    if (Object.keys(updateData).length > 0) {
      await prisma.asociado.update({
        where: { id: asociadoId },
        data: updateData
      });
    }

    // Resolver alertas existentes asociadas a este tipo de documento
    if (tipoAlerta) {
      await prisma.alerta.updateMany({
        where: {
          asociadoId,
          tipoAlerta,
          estado: 'PENDIENTE'
        },
        data: {
          estado: 'RESUELTA'
        }
      });
    }

    // Auditoría
    await registrarAuditoria(usuarioId, 'DocumentoAsociado', nuevoDoc.id, 'CREAR', 'archivoUrl', null, archivoUrl, req.ip);

    res.status(201).json(nuevoDoc);
  } catch (error) {
    console.error('Error al subir documento:', error);
    res.status(500).json({ mensaje: 'Error al cargar el documento: ' + error.message });
  }
};

// Eliminar documento
const deleteDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId } = req.user;

    const doc = await prisma.documentoAsociado.findUnique({
      where: { id }
    });

    if (!doc) {
      return res.status(404).json({ mensaje: 'Documento no encontrado' });
    }

    // Eliminar el archivo físico si existe
    const filePath = path.join(__dirname, '../..', doc.archivoUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar de base de datos
    await prisma.documentoAsociado.delete({
      where: { id }
    });

    // Auditoría
    await registrarAuditoria(usuarioId, 'DocumentoAsociado', id, 'ELIMINAR', 'archivoUrl', doc.archivoUrl, null, req.ip);

    res.json({ mensaje: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el documento' });
  }
};

module.exports = {
  uploadDocumento,
  deleteDocumento
};
