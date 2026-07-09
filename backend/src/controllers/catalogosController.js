const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { registrarAuditoria } = require('../utils/auditoria');

// ==========================================
// 1. CARGOS
// ==========================================
const getCargos = async (req, res) => {
  try {
    const cargos = await prisma.cargo.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json(cargos);
  } catch (error) {
    console.error('Error al obtener cargos:', error);
    res.status(500).json({ mensaje: 'Error al obtener cargos' });
  }
};

const createCargo = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.user;
    if (rol !== 'ADMIN') return res.status(403).json({ mensaje: 'No autorizado' });

    const { nombre, esCritico, frecuenciaActualizacionAnios } = req.body;

    const cargo = await prisma.cargo.create({
      data: {
        nombre: nombre.toUpperCase(),
        esCritico: esCritico === true || esCritico === 'true',
        frecuenciaActualizacionAnios: parseInt(frecuenciaActualizacionAnios) || 2
      }
    });

    await registrarAuditoria(usuarioId, 'Cargo', cargo.id, 'CREAR', 'Todos', null, cargo.nombre, req.ip);
    res.status(201).json(cargo);
  } catch (error) {
    console.error('Error al crear cargo:', error);
    res.status(500).json({ mensaje: 'Error al crear cargo: ' + error.message });
  }
};

const updateCargo = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.user;
    if (rol !== 'ADMIN') return res.status(403).json({ mensaje: 'No autorizado' });

    const { id } = req.params;
    const { nombre, esCritico, frecuenciaActualizacionAnios } = req.body;

    const cargoOriginal = await prisma.cargo.findUnique({ where: { id } });
    if (!cargoOriginal) return res.status(404).json({ mensaje: 'Cargo no encontrado' });

    const cargo = await prisma.cargo.update({
      where: { id },
      data: {
        nombre: nombre ? nombre.toUpperCase() : cargoOriginal.nombre,
        esCritico: esCritico !== undefined ? (esCritico === true || esCritico === 'true') : cargoOriginal.esCritico,
        frecuenciaActualizacionAnios: frecuenciaActualizacionAnios !== undefined ? parseInt(frecuenciaActualizacionAnios) : cargoOriginal.frecuenciaActualizacionAnios
      }
    });

    await registrarAuditoria(usuarioId, 'Cargo', id, 'EDITAR', 'Varios', JSON.stringify(cargoOriginal), JSON.stringify(cargo), req.ip);
    res.json(cargo);
  } catch (error) {
    console.error('Error al editar cargo:', error);
    res.status(500).json({ mensaje: 'Error al editar cargo' });
  }
};

// ==========================================
// 2. CENTROS DE TRABAJO
// ==========================================
const getCentrosTrabajo = async (req, res) => {
  try {
    const centros = await prisma.centroTrabajo.findMany({
      orderBy: { codigo: 'asc' }
    });
    res.json(centros);
  } catch (error) {
    console.error('Error al obtener centros de trabajo:', error);
    res.status(500).json({ mensaje: 'Error al obtener centros de trabajo' });
  }
};

const createCentroTrabajo = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.user;
    if (rol !== 'ADMIN') return res.status(403).json({ mensaje: 'No autorizado' });

    const { codigo, nombreCliente, direccion, zona, activo } = req.body;

    const centro = await prisma.centroTrabajo.create({
      data: {
        codigo,
        nombreCliente,
        direccion,
        zona,
        activo: activo !== undefined ? (activo === true || activo === 'true') : true
      }
    });

    await registrarAuditoria(usuarioId, 'CentroTrabajo', centro.id, 'CREAR', 'Todos', null, centro.codigo, req.ip);
    res.status(201).json(centro);
  } catch (error) {
    console.error('Error al crear centro de trabajo:', error);
    res.status(500).json({ mensaje: 'Error al crear centro de trabajo: ' + error.message });
  }
};

const updateCentroTrabajo = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.user;
    if (rol !== 'ADMIN') return res.status(403).json({ mensaje: 'No autorizado' });

    const { id } = req.params;
    const data = req.body;

    const original = await prisma.centroTrabajo.findUnique({ where: { id } });
    if (!original) return res.status(404).json({ mensaje: 'Centro de trabajo no encontrado' });

    const centro = await prisma.centroTrabajo.update({
      where: { id },
      data
    });

    await registrarAuditoria(usuarioId, 'CentroTrabajo', id, 'EDITAR', 'Varios', JSON.stringify(original), JSON.stringify(centro), req.ip);
    res.json(centro);
  } catch (error) {
    console.error('Error al editar centro de trabajo:', error);
    res.status(500).json({ mensaje: 'Error al editar centro de trabajo' });
  }
};

// ==========================================
// 3. CATÁLOGOS MAESTROS (CatalogoValor)
// ==========================================
const getValoresCatalogo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const valores = await prisma.catalogoValor.findMany({
      where: { tipo: tipo.toUpperCase() },
      orderBy: { valor: 'asc' }
    });
    res.json(valores);
  } catch (error) {
    console.error('Error al obtener valores de catálogo:', error);
    res.status(500).json({ mensaje: 'Error al obtener valores de catálogo' });
  }
};

const createValorCatalogo = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.user;
    if (rol !== 'ADMIN') return res.status(403).json({ mensaje: 'No autorizado' });

    const { tipo, valor } = req.body;

    const valorCatalogo = await prisma.catalogoValor.create({
      data: {
        tipo: tipo.toUpperCase(),
        valor: valor,
        activo: true
      }
    });

    await registrarAuditoria(usuarioId, 'CatalogoValor', valorCatalogo.id, 'CREAR', 'Todos', null, `${tipo}: ${valor}`, req.ip);
    res.status(201).json(valorCatalogo);
  } catch (error) {
    console.error('Error al crear valor de catálogo:', error);
    res.status(500).json({ mensaje: 'Error al crear valor de catálogo' });
  }
};

const toggleValorCatalogo = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.user;
    if (rol !== 'ADMIN') return res.status(403).json({ mensaje: 'No autorizado' });

    const { id } = req.params;

    const original = await prisma.catalogoValor.findUnique({ where: { id } });
    if (!original) return res.status(404).json({ mensaje: 'Valor de catálogo no encontrado' });

    const valorCatalogo = await prisma.catalogoValor.update({
      where: { id },
      data: { activo: !original.activo }
    });

    await registrarAuditoria(usuarioId, 'CatalogoValor', id, 'EDITAR', 'activo', String(original.activo), String(valorCatalogo.activo), req.ip);
    res.json(valorCatalogo);
  } catch (error) {
    console.error('Error al alternar estado de catálogo:', error);
    res.status(500).json({ mensaje: 'Error al cambiar estado' });
  }
};

module.exports = {
  getCargos,
  createCargo,
  updateCargo,
  getCentrosTrabajo,
  createCentroTrabajo,
  updateCentroTrabajo,
  getValoresCatalogo,
  createValorCatalogo,
  toggleValorCatalogo
};
