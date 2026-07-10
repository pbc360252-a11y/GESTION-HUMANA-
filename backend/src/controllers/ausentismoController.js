const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { registrarAuditoria } = require('../utils/auditoria');

// Listar ausentismos con filtros
const getAusentismos = async (req, res) => {
  try {
    const { busqueda, tipo, tipoEvento, fechaInicio, fechaFin } = req.query;

    const where = {};

    if (tipo) {
      where.tipo = tipo;
    }
    if (tipoEvento) {
      where.tipoEvento = tipoEvento;
    }

    if (fechaInicio || fechaFin) {
      where.fechaInicio = {};
      if (fechaInicio) {
        where.fechaInicio.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.fechaFin = { lte: new Date(fechaFin) };
      }
    }

    // Búsqueda por nombre/cédula de asociado
    if (busqueda) {
      where.asociado = {
        OR: [
          { numeroIdentificacion: { contains: busqueda, mode: 'insensitive' } },
          { primerNombre: { contains: busqueda, mode: 'insensitive' } },
          { primerApellido: { contains: busqueda, mode: 'insensitive' } }
        ]
      };
    }

    const ausentismos = await prisma.ausentismo.findMany({
      where,
      include: {
        asociado: {
          select: {
            id: true,
            numeroIdentificacion: true,
            primerNombre: true,
            segundoNombre: true,
            primerApellido: true,
            segundoApellido: true,
            celular: true
          }
        },
        diagnostico: true
      },
      orderBy: {
        fechaInicio: 'desc'
      }
    });

    res.json(ausentismos);
  } catch (error) {
    console.error('Error al obtener ausentismos:', error);
    res.status(500).json({ mensaje: 'Error al obtener ausentismos' });
  }
};

// Crear nuevo ausentismo
const createAusentismo = async (req, res) => {
  try {
    const { usuarioId } = req.user;
    const {
      asociadoId,
      tipo,
      tipoEvento,
      fechaInicio,
      fechaFin,
      prorroga,
      examenPostIncapacidad,
      origenIncapacidad,
      diagnosticoId,
      causa,
      observaciones,
      salarioBase,
      costosAsumidosAT
    } = req.body;

    if (!asociadoId || !tipo || !tipoEvento || !fechaInicio || !fechaFin) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || fin < inicio) {
      return res.status(400).json({ mensaje: 'Fechas de ausencia no válidas' });
    }

    // Calcular días de ausencia (inclusive)
    const diffTime = fin.getTime() - inicio.getTime();
    const diasAusencia = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Verificar asociado
    const asociado = await prisma.asociado.findUnique({ where: { id: asociadoId } });
    if (!asociado) {
      return res.status(404).json({ mensaje: 'Asociado no encontrado' });
    }

    const nuevo = await prisma.ausentismo.create({
      data: {
        asociadoId,
        tipo,
        tipoEvento,
        fechaInicio: inicio,
        fechaFin: fin,
        diasAusencia,
        prorroga: !!prorroga,
        examenPostIncapacidad: !!examenPostIncapacidad,
        origenIncapacidad: origenIncapacidad || null,
        diagnosticoId: diagnosticoId || null,
        causa: causa || null,
        observaciones: observaciones || null,
        salarioBase: salarioBase ? parseFloat(salarioBase) : null,
        costosAsumidosAT: costosAsumidosAT ? parseFloat(costosAsumidosAT) : null
      },
      include: { asociado: true }
    });

    await registrarAuditoria(usuarioId, 'Ausentismo', nuevo.id, 'CREAR', null, null, asociado.numeroIdentificacion, req.ip);

    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear ausentismo:', error);
    res.status(500).json({ mensaje: 'Error al registrar ausentismo' });
  }
};

// Actualizar ausentismo
const updateAusentismo = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.user;
    const data = req.body;

    const original = await prisma.ausentismo.findUnique({
      where: { id },
      include: { asociado: true }
    });

    if (!original) {
      return res.status(404).json({ mensaje: 'Ausentismo no encontrado' });
    }

    const updateData = { ...data };

    // Si cambian las fechas, recalcular días de ausencia
    if (data.fechaInicio || data.fechaFin) {
      const inicio = new Date(data.fechaInicio || original.fechaInicio);
      const fin = new Date(data.fechaFin || original.fechaFin);
      if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin >= inicio) {
        const diffTime = fin.getTime() - inicio.getTime();
        updateData.diasAusencia = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      updateData.fechaInicio = inicio;
      updateData.fechaFin = fin;
    }

    if (data.salarioBase !== undefined) updateData.salarioBase = data.salarioBase ? parseFloat(data.salarioBase) : null;
    if (data.costosAsumidosAT !== undefined) updateData.costosAsumidosAT = data.costosAsumidosAT ? parseFloat(data.costosAsumidosAT) : null;

    const actualizado = await prisma.ausentismo.update({
      where: { id },
      data: updateData
    });

    await registrarAuditoria(usuarioId, 'Ausentismo', id, 'EDITAR', null, null, original.asociado.numeroIdentificacion, req.ip);

    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar ausentismo:', error);
    res.status(500).json({ mensaje: 'Error al actualizar ausentismo' });
  }
};

// Eliminar ausentismo
const deleteAusentismo = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.user;

    const original = await prisma.ausentismo.findUnique({
      where: { id },
      include: { asociado: true }
    });

    if (!original) {
      return res.status(404).json({ mensaje: 'Ausentismo no encontrado' });
    }

    await prisma.ausentismo.delete({ where: { id } });

    await registrarAuditoria(usuarioId, 'Ausentismo', id, 'ELIMINAR', null, null, original.asociado.numeroIdentificacion, req.ip);

    res.json({ mensaje: 'Ausentismo eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar ausentismo:', error);
    res.status(500).json({ mensaje: 'Error al eliminar ausentismo' });
  }
};

// Buscar diagnósticos CIE-10 (Autocomplete)
const getDiagnosticos = async (req, res) => {
  try {
    const { busqueda } = req.query;

    if (!busqueda) {
      return res.json([]);
    }

    const diagnosticos = await prisma.diagnosticoCIE10.findMany({
      where: {
        OR: [
          { codigo: { contains: busqueda, mode: 'insensitive' } },
          { descripcion: { contains: busqueda, mode: 'insensitive' } }
        ]
      },
      take: 20
    });

    res.json(diagnosticos);
  } catch (error) {
    console.error('Error al buscar diagnósticos:', error);
    res.status(500).json({ mensaje: 'Error al buscar diagnósticos' });
  }
};

module.exports = {
  getAusentismos,
  createAusentismo,
  updateAusentismo,
  deleteAusentismo,
  getDiagnosticos
};
