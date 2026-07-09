const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcularDiferenciaAnios } = require('../services/asociadoService');
const { registrarAuditoria } = require('../utils/auditoria');

// Procesar retiro de asociado y diligenciar encuesta de salida
const registrarRetiro = async (req, res) => {
  try {
    const { asociadoId } = req.params;
    const { rol, id: usuarioId } = req.user;

    if (rol !== 'ADMIN' && rol !== 'GESTION_HUMANA') {
      return res.status(403).json({ mensaje: 'No autorizado para registrar retiros' });
    }

    const {
      fechaRetiro,
      motivoRetiroId,
      razonRetiroId,
      liquidacionEstado,
      encuestaAmbienteFisico,
      encuestaInduccion,
      encuestaReinduccion,
      encuestaCapacitacion,
      encuestaMotivacionGrupo,
      encuestaReconocimiento,
      encuestaCompensaciones,
      queMenosLeGustaba,
      volveriaATrabajar,
      observaciones
    } = req.body;

    const asociado = await prisma.asociado.findUnique({
      where: { id: asociadoId },
      include: { cargo: true }
    });

    if (!asociado) {
      return res.status(404).json({ mensaje: 'Asociado no encontrado' });
    }

    if (asociado.estado === 'RETIRADO') {
      return res.status(400).json({ mensaje: 'El asociado ya se encuentra RETIRADO' });
    }

    // Calcular edad al retiro
    const fRetiro = new Date(fechaRetiro);
    const edadAlRetiro = calcularDiferenciaAnios(asociado.fechaNacimiento, fRetiro);

    // Crear registro de Retiro y actualizar Asociado en una transacción
    const [nuevoRetiro, asociadoActualizado] = await prisma.$transaction([
      prisma.retiro.create({
        data: {
          asociadoId,
          ultimoCargo: asociado.cargo.nombre,
          fechaRetiro: fRetiro,
          liquidacionEstado: liquidacionEstado || 'PENDIENTE',
          encuestaAmbienteFisico: parseInt(encuestaAmbienteFisico),
          encuestaInduccion: parseInt(encuestaInduccion),
          encuestaReinduccion: parseInt(encuestaReinduccion),
          encuestaCapacitacion: parseInt(encuestaCapacitacion),
          encuestaMotivacionGrupo: parseInt(encuestaMotivacionGrupo),
          encuestaReconocimiento: parseInt(encuestaReconocimiento),
          encuestaCompensaciones: parseInt(encuestaCompensaciones),
          queMenosLeGustaba: queMenosLeGustaba || null,
          volveriaATrabajar: volveriaATrabajar || 'N-A',
          edadAlRetiro,
          observaciones: observaciones || null,
          motivoRetiroId,
          razonRetiroId
        }
      }),
      prisma.asociado.update({
        where: { id: asociadoId },
        data: { estado: 'RETIRADO' }
      })
    ]);

    // Registrar en auditoría
    await registrarAuditoria(usuarioId, 'Retiro', nuevoRetiro.id, 'CREAR', 'Todos', null, asociado.numeroIdentificacion, req.ip);
    await registrarAuditoria(usuarioId, 'Asociado', asociadoId, 'EDITAR', 'estado', 'ACTIVO', 'RETIRADO', req.ip);

    res.status(201).json({ retiro: nuevoRetiro, asociado: asociadoActualizado });
  } catch (error) {
    console.error('Error al registrar retiro:', error);
    res.status(500).json({ mensaje: 'Error al registrar el retiro: ' + error.message });
  }
};

// Obtener detalle de retiro de un asociado
const getRetiroByAsociadoId = async (req, res) => {
  try {
    const { asociadoId } = req.params;
    const { rol } = req.user;

    if (rol === 'CONSULTA') {
      return res.status(403).json({ mensaje: 'No tiene permisos para ver detalles de retiro' });
    }

    const retiro = await prisma.retiro.findFirst({
      where: { asociadoId },
      include: {
        asociado: true,
        motivoRetiro: true,
        razonRetiro: true
      },
      orderBy: { fechaRetiro: 'desc' }
    });

    if (!retiro) {
      return res.status(404).json({ mensaje: 'No se encontró registro de retiro para este asociado' });
    }

    res.json(retiro);
  } catch (error) {
    console.error('Error al obtener retiro:', error);
    res.status(500).json({ mensaje: 'Error al obtener retiro' });
  }
};

// Editar encuesta/registro de retiro
const updateRetiro = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, id: usuarioId } = req.user;

    if (rol !== 'ADMIN' && rol !== 'GESTION_HUMANA') {
      return res.status(403).json({ mensaje: 'No autorizado para editar retiros' });
    }

    const retiro = await prisma.retiro.findUnique({
      where: { id }
    });

    if (!retiro) {
      return res.status(404).json({ mensaje: 'Registro de retiro no encontrado' });
    }

    // Regla de negocio: Bloquear edición después de 30 días salvo para ADMIN
    const fechaCreacion = new Date(retiro.createdAt);
    const diasTranscurridos = (new Date().getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24);
    if (diasTranscurridos > 30 && rol !== 'ADMIN') {
      return res.status(403).json({ 
        mensaje: 'La encuesta de salida está bloqueada para edición porque han transcurrido más de 30 días. Comuníquese con un Administrador.' 
      });
    }

    const data = req.body;
    const updateData = { ...data };
    if (data.fechaRetiro) updateData.fechaRetiro = new Date(data.fechaRetiro);
    if (data.encuestaAmbienteFisico) updateData.encuestaAmbienteFisico = parseInt(data.encuestaAmbienteFisico);
    if (data.encuestaInduccion) updateData.encuestaInduccion = parseInt(data.encuestaInduccion);
    if (data.encuestaReinduccion) updateData.encuestaReinduccion = parseInt(data.encuestaReinduccion);
    if (data.encuestaCapacitacion) updateData.encuestaCapacitacion = parseInt(data.encuestaCapacitacion);
    if (data.encuestaMotivacionGrupo) updateData.encuestaMotivacionGrupo = parseInt(data.encuestaMotivacionGrupo);
    if (data.encuestaReconocimiento) updateData.encuestaReconocimiento = parseInt(data.encuestaReconocimiento);
    if (data.encuestaCompensaciones) updateData.encuestaCompensaciones = parseInt(data.encuestaCompensaciones);

    const retiroActualizado = await prisma.retiro.update({
      where: { id },
      data: updateData
    });

    // Auditoría
    const camposRelevantes = Object.keys(data);
    for (const campo of camposRelevantes) {
      const valAnt = retiro[campo];
      const valNew = data[campo];
      if (valAnt !== valNew && valNew !== undefined) {
        await registrarAuditoria(usuarioId, 'Retiro', id, 'EDITAR', campo, valAnt, valNew, req.ip);
      }
    }

    res.json(retiroActualizado);
  } catch (error) {
    console.error('Error al actualizar retiro:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el retiro: ' + error.message });
  }
};

module.exports = {
  registrarRetiro,
  getRetiroByAsociadoId,
  updateRetiro
};
