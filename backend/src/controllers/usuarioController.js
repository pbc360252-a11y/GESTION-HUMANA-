const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const { registrarAuditoria } = require('../utils/auditoria');

const getUsuarios = async (req, res) => {
  try {
    const { rol } = req.user;
    if (rol !== 'ADMIN') return res.status(403).json({ mensaje: 'No autorizado' });

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        activo: true,
        ultimoLogin: true,
        createdAt: true
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

const createUsuario = async (req, res) => {
  try {
    const { rol: creatorRol, id: creatorId } = req.user;
    if (creatorRol !== 'ADMIN') return res.status(403).json({ mensaje: 'No autorizado' });

    const { nombre, correo, password, rol, activo } = req.body;

    if (!nombre || !correo || !password || !rol) {
      return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    const existe = await prisma.usuario.findUnique({ where: { correo: correo.toLowerCase() } });
    if (existe) return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado' });

    const hashPassword = bcrypt.hashSync(password, 10);

    const nuevo = await prisma.usuario.create({
      data: {
        nombre,
        correo: correo.toLowerCase(),
        hashPassword,
        rol,
        activo: activo !== undefined ? activo : true
      }
    });

    await registrarAuditoria(creatorId, 'Usuario', nuevo.id, 'CREAR', 'Todos', null, nuevo.correo, req.ip);

    res.status(201).json({
      id: nuevo.id,
      nombre: nuevo.nombre,
      correo: nuevo.correo,
      rol: nuevo.rol,
      activo: nuevo.activo
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ mensaje: 'Error al crear usuario' });
  }
};

const updateUsuario = async (req, res) => {
  try {
    const { rol: creatorRol, id: creatorId } = req.user;
    if (creatorRol !== 'ADMIN') return res.status(403).json({ mensaje: 'No autorizado' });

    const { id } = req.params;
    const { nombre, correo, password, rol, activo } = req.body;

    const original = await prisma.usuario.findUnique({ where: { id } });
    if (!original) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (correo) updateData.correo = correo.toLowerCase();
    if (rol) updateData.rol = rol;
    if (activo !== undefined) updateData.activo = activo;
    if (password) {
      updateData.hashPassword = bcrypt.hashSync(password, 10);
    }

    const editado = await prisma.usuario.update({
      where: { id },
      data: updateData
    });

    // Auditoría
    const campos = Object.keys(updateData);
    for (const campo of campos) {
      if (campo !== 'hashPassword') {
        const valAnt = original[campo];
        const valNew = updateData[campo];
        if (valAnt !== valNew && valNew !== undefined) {
          await registrarAuditoria(creatorId, 'Usuario', id, 'EDITAR', campo, String(valAnt), String(valNew), req.ip);
        }
      }
    }

    res.json({
      id: editado.id,
      nombre: editado.nombre,
      correo: editado.correo,
      rol: editado.rol,
      activo: editado.activo
    });
  } catch (error) {
    console.error('Error al editar usuario:', error);
    res.status(500).json({ mensaje: 'Error al editar usuario' });
  }
};

module.exports = {
  getUsuarios,
  createUsuario,
  updateUsuario
};
