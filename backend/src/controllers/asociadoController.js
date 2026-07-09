const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcularCamposDerivados } = require('../services/asociadoService');
const { registrarAuditoria } = require('../utils/auditoria');

// Enmascarar campos sensibles para coordinadores
const filtrarCamposSensibles = (asociado, rol) => {
  if (rol === 'COORDINADOR_OPERATIVO') {
    const copy = { ...asociado };
    copy.religionId = null;
    copy.religion = { id: 'oculto', tipo: 'RELIGION', valor: '*** OCULTO ***' };
    copy.orientacionSexualId = null;
    copy.orientacionSexual = { id: 'oculto', tipo: 'ORIENTACION_SEXUAL', valor: '*** OCULTO ***' };
    copy.razaId = null;
    copy.raza = { id: 'oculto', tipo: 'RAZA', valor: '*** OCULTO ***' };
    return copy;
  }
  return asociado;
};

// Listar asociados con filtros y búsqueda
const getAsociados = async (req, res) => {
  try {
    const { rol } = req.user;
    
    // El rol CONSULTA no puede ver listas individuales de asociados
    if (rol === 'CONSULTA') {
      return res.status(403).json({ mensaje: 'No tiene permisos para ver el listado de asociados' });
    }

    const { 
      busqueda, 
      centroTrabajoId, 
      cargoId, 
      epsId, 
      estado, 
      esCritico,
      antiguedadMin, 
      antiguedadMax 
    } = req.query;

    // Construcción del filtro WHERE
    const where = {};

    // Búsqueda por texto (nombres, apellidos, identificación)
    if (busqueda) {
      where.OR = [
        { numeroIdentificacion: { contains: busqueda } },
        { primerNombre: { contains: busqueda } },
        { segundoNombre: { contains: busqueda } },
        { primerApellido: { contains: busqueda } },
        { segundoApellido: { contains: busqueda } }
      ];
    }

    // Filtros directos
    if (centroTrabajoId) where.centroTrabajoId = centroTrabajoId;
    if (cargoId) where.cargoId = cargoId;
    if (epsId) where.epsId = epsId;
    if (estado) {
      where.estado = estado;
    }

    // Filtro por Cargo Crítico
    if (esCritico !== undefined) {
      where.cargo = {
        esCritico: esCritico === 'true'
      };
    }

    const asociados = await prisma.asociado.findMany({
      where,
      include: {
        cargo: true,
        centroTrabajo: true,
        eps: true,
        fondoPension: true,
        rh: true,
        genero: true,
        orientacionSexual: true,
        religion: true,
        raza: true,
        retiros: {
          orderBy: { fechaRetiro: 'desc' },
          take: 1
        }
      }
    });

    // Calcular campos derivados y aplicar enmascaramiento por rol
    let result = asociados.map(asoc => {
      const derivados = calcularCamposDerivados(asoc);
      const asocConDerivados = {
        ...asoc,
        edadIngreso: derivados.edadIngreso,
        edadActual: derivados.edadActual,
        antiguedadEmpresaAnios: derivados.antiguedadEmpresaAnios
      };
      return filtrarCamposSensibles(asocConDerivados, rol);
    });

    // Filtrar por antigüedad en memoria si se requiere
    if (antiguedadMin !== undefined || antiguedadMax !== undefined) {
      const min = antiguedadMin ? parseFloat(antiguedadMin) : 0;
      const max = antiguedadMax ? parseFloat(antiguedadMax) : 999;
      result = result.filter(asoc => asoc.antiguedadEmpresaAnios >= min && asoc.antiguedadEmpresaAnios <= max);
    }

    res.json(result);
  } catch (error) {
    console.error('Error al obtener asociados:', error);
    res.status(500).json({ mensaje: 'Error al obtener asociados' });
  }
};

// Obtener ficha completa de un asociado
const getAsociadoById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, id: usuarioId } = req.user;

    if (rol === 'CONSULTA') {
      return res.status(403).json({ mensaje: 'No tiene permisos para ver la ficha del asociado' });
    }

    const asociado = await prisma.asociado.findUnique({
      where: { id },
      include: {
        cargo: true,
        centroTrabajo: true,
        eps: true,
        fondoPension: true,
        rh: true,
        genero: true,
        orientacionSexual: true,
        religion: true,
        raza: true,
        retiros: {
          orderBy: { fechaRetiro: 'desc' },
          include: {
            motivoRetiro: true,
            razonRetiro: true
          }
        },
        documentos: {
          include: {
            cargadoPor: {
              select: { nombre: true }
            }
          }
        },
        alertas: {
          orderBy: { fechaGeneracion: 'desc' }
        },
        cambiosCargo: {
          include: { cargo: true },
          orderBy: { fechaCambio: 'desc' }
        }
      }
    });

    if (!asociado) {
      return res.status(404).json({ mensaje: 'Asociado no encontrado' });
    }

    // Calcular campos derivados
    const derivados = calcularCamposDerivados(asociado);
    const asociadoConDerivados = {
      ...asociado,
      edadIngreso: derivados.edadIngreso,
      edadActual: derivados.edadActual,
      antiguedadEmpresaAnios: derivados.antiguedadEmpresaAnios
    };

    const finalAsociado = filtrarCamposSensibles(asociadoConDerivados, rol);

    // Auditoría de lectura de datos sensibles
    await registrarAuditoria(usuarioId, 'Asociado', asociado.id, 'LEER_FICHA', null, null, asociado.numeroIdentificacion, req.ip);

    res.json(finalAsociado);
  } catch (error) {
    console.error('Error al obtener el asociado:', error);
    res.status(500).json({ mensaje: 'Error al obtener el asociado' });
  }
};

// Crear nuevo asociado
const createAsociado = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.user;

    // Solo ADMIN, GESTION_HUMANA o SST pueden crear asociados
    if (rol !== 'ADMIN' && rol !== 'GESTION_HUMANA' && rol !== 'SST') {
      return res.status(403).json({ mensaje: 'No autorizado para crear asociados' });
    }

    const data = req.body;

    // Validar identificación única en activos
    const existeActivo = await prisma.asociado.findFirst({
      where: {
        numeroIdentificacion: data.numeroIdentificacion,
        estado: { in: ['ACTIVO', 'SUSPENDIDO'] }
      }
    });

    if (existeActivo) {
      return res.status(400).json({ 
        mensaje: 'Ya existe un asociado ACTIVO o SUSPENDIDO con ese número de identificación. Use la opción de reingreso si está retirado.' 
      });
    }

    // Normalizar fechas
    const fechaNacimiento = new Date(data.fechaNacimiento);
    const fechaIngreso = new Date(data.fechaIngreso);
    const fechaExpedicionCedula = data.fechaExpedicionCedula ? new Date(data.fechaExpedicionCedula) : null;

    const nuevoAsociado = await prisma.asociado.create({
      data: {
        numeroCarpetaActual: data.numeroCarpetaActual ? parseInt(data.numeroCarpetaActual) : null,
        acta: data.acta || null,
        tipoDocumento: data.tipoDocumento,
        numeroIdentificacion: data.numeroIdentificacion,
        primerApellido: data.primerApellido,
        segundoApellido: data.segundoApellido || null,
        primerNombre: data.primerNombre,
        segundoNombre: data.segundoNombre || null,
        fechaNacimiento,
        fechaExpedicionCedula,
        correoElectronico: data.correoElectronico || null,
        direccion: data.direccion || null,
        telefonoFijo: data.telefonoFijo || null,
        celular: data.celular,
        contactoEmergenciaNombre: data.contactoEmergenciaNombre || null,
        contactoEmergenciaParentesco: data.contactoEmergenciaParentesco || null,
        contactoEmergenciaTelefono: data.contactoEmergenciaTelefono || null,
        fechaIngreso,
        psicofisicoVigente: data.psicofisicoVigente === true || data.psicofisicoVigente === 'true',
        psicosensometricoVigente: data.psicosensometricoVigente === true || data.psicosensometricoVigente === 'true',
        compensacionOrdinaria: data.compensacionOrdinaria ? parseFloat(data.compensacionOrdinaria) : 0,
        promedioSalarialMensual: data.promedioSalarialMensual ? parseFloat(data.promedioSalarialMensual) : 0,
        funeraria: data.funeraria || null,
        tienePolizaSura: data.tienePolizaSura === true || data.tienePolizaSura === 'true',
        cuentaBancaria: data.cuentaBancaria || null,
        codigoCurso: data.codigoCurso || null,
        nitEscuela: data.nitEscuela || null,
        numeroCertificadoCurso: data.numeroCertificadoCurso || null,
        sexoAlNacer: data.sexoAlNacer || null,
        estadoCivil: data.estadoCivil || null,
        numeroHijos: data.numeroHijos ? parseInt(data.numeroHijos) : 0,
        personasACargo: data.personasACargo ? parseInt(data.personasACargo) : 0,
        tipoVivienda: data.tipoVivienda || null,
        estrato: data.estrato ? parseInt(data.estrato) : null,
        nivelEstudio: data.nivelEstudio || null,
        rangoIngresos: data.rangoIngresos || null,
        planDeVida: data.planDeVida || null,
        medioTransporte: data.medioTransporte || null,
        tiempoTraslado: data.tiempoTraslado || null,
        estado: 'ACTIVO',
        cargoId: data.cargoId,
        centroTrabajoId: data.centroTrabajoId,
        epsId: data.epsId || null,
        fondoPensionId: data.fondoPensionId || null,
        rhId: data.rhId || null,
        generoId: data.generoId || null,
        orientacionSexualId: data.orientacionSexualId || null,
        religionId: data.religionId || null,
        razaId: data.razaId || null
      }
    });

    // Guardar historial de cargo inicial
    await prisma.historialCargo.create({
      data: {
        asociadoId: nuevoAsociado.id,
        cargoId: nuevoAsociado.cargoId,
        motivoCambio: 'Ingreso Inicial'
      }
    });

    // Registrar en auditoría
    await registrarAuditoria(usuarioId, 'Asociado', nuevoAsociado.id, 'CREAR', 'Todos', null, nuevoAsociado.numeroIdentificacion, req.ip);

    res.status(201).json(nuevoAsociado);
  } catch (error) {
    console.error('Error al crear asociado:', error);
    res.status(500).json({ mensaje: 'Error al crear el asociado: ' + error.message });
  }
};

// Editar asociado existente
const updateAsociado = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, id: usuarioId } = req.user;

    // Solo ADMIN, GESTION_HUMANA o SST pueden editar asociados
    if (rol !== 'ADMIN' && rol !== 'GESTION_HUMANA' && rol !== 'SST') {
      return res.status(403).json({ mensaje: 'No autorizado para editar asociados' });
    }

    const data = req.body;
    const original = await prisma.asociado.findUnique({ where: { id } });

    if (!original) {
      return res.status(404).json({ mensaje: 'Asociado no encontrado' });
    }

    // Regla de seguridad de SST: No puede editar datos personales no relacionados con salud ocupacional
    if (rol === 'SST') {
      // Validar si intentó cambiar datos personales bloqueados
      const camposProhibidosSST = [
        'primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido', 
        'fechaNacimiento', 'compensacionOrdinaria', 'promedioSalarialMensual', 'estadoCivil'
      ];
      for (const campo of camposProhibidosSST) {
        if (data[campo] !== undefined && data[campo] !== original[campo]) {
          return res.status(403).json({ mensaje: `El rol SST no puede modificar el campo personal '${campo}'` });
        }
      }
    }

    // Validar identificación si cambia
    if (data.numeroIdentificacion && data.numeroIdentificacion !== original.numeroIdentificacion) {
      const existeIdentificacion = await prisma.asociado.findFirst({
        where: {
          numeroIdentificacion: data.numeroIdentificacion,
          id: { not: id },
          estado: { in: ['ACTIVO', 'SUSPENDIDO'] }
        }
      });

      if (existeIdentificacion) {
        return res.status(400).json({ mensaje: 'Ya existe un asociado activo con ese número de identificación' });
      }
    }

    // Preparar objeto de actualización normalizando fechas
    const updateData = { ...data };
    if (data.fechaNacimiento) updateData.fechaNacimiento = new Date(data.fechaNacimiento);
    if (data.fechaIngreso) updateData.fechaIngreso = new Date(data.fechaIngreso);
    if (data.fechaExpedicionCedula) updateData.fechaExpedicionCedula = new Date(data.fechaExpedicionCedula);
    if (data.numeroCarpetaActual) updateData.numeroCarpetaActual = parseInt(data.numeroCarpetaActual);
    if (data.numeroHijos) updateData.numeroHijos = parseInt(data.numeroHijos);
    if (data.personasACargo) updateData.personasACargo = parseInt(data.personasACargo);
    if (data.estrato) updateData.estrato = parseInt(data.estrato);

    const editado = await prisma.asociado.update({
      where: { id },
      data: updateData
    });

    // Comparar y guardar auditoría detallada
    const camposRelevantes = Object.keys(data);
    for (const campo of camposRelevantes) {
      const valAnt = original[campo];
      const valNew = data[campo];
      if (valAnt !== valNew && valNew !== undefined) {
        await registrarAuditoria(usuarioId, 'Asociado', id, 'EDITAR', campo, valAnt, valNew, req.ip);
      }
    }

    // Si cambió el cargo, registrar en el historial de cargos
    if (data.cargoId && data.cargoId !== original.cargoId) {
      await prisma.historialCargo.create({
        data: {
          asociadoId: id,
          cargoId: data.cargoId,
          motivoCambio: data.motivoCambioCargo || 'Cambio de Cargo'
        }
      });
    }

    res.json(editado);
  } catch (error) {
    console.error('Error al editar asociado:', error);
    res.status(500).json({ mensaje: 'Error al editar el asociado: ' + error.message });
  }
};

// Reingresar un asociado retirado (reactivar registro histórico)
const reingresarAsociado = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, id: usuarioId } = req.user;

    if (rol !== 'ADMIN' && rol !== 'GESTION_HUMANA') {
      return res.status(403).json({ mensaje: 'No autorizado para procesar reingresos' });
    }

    const { numeroCarpetaActual, fechaIngreso, cargoId, centroTrabajoId } = req.body;

    const asociado = await prisma.asociado.findUnique({
      where: { id },
      include: { retiros: true }
    });

    if (!asociado) {
      return res.status(404).json({ mensaje: 'Asociado no encontrado' });
    }

    if (asociado.estado !== 'RETIRADO') {
      return res.status(400).json({ mensaje: 'El asociado no se encuentra en estado RETIRADO' });
    }

    // Actualizar estado a ACTIVO, actualizar carpeta, ingreso, cargo y centro de trabajo
    const reactivado = await prisma.asociado.update({
      where: { id },
      data: {
        estado: 'ACTIVO',
        numeroCarpetaActual: numeroCarpetaActual ? parseInt(numeroCarpetaActual) : asociado.numeroCarpetaActual,
        fechaIngreso: new Date(fechaIngreso),
        cargoId,
        centroTrabajoId
      }
    });

    // Registrar nuevo cambio de cargo en historial
    await prisma.historialCargo.create({
      data: {
        asociadoId: id,
        cargoId,
        motivoCambio: 'Reingreso a la Cooperativa'
      }
    });

    // Registrar en auditoría
    await registrarAuditoria(usuarioId, 'Asociado', id, 'REINGRESO', 'estado', 'RETIRADO', 'ACTIVO', req.ip);

    res.json(reactivado);
  } catch (error) {
    console.error('Error al reingresar asociado:', error);
    res.status(500).json({ mensaje: 'Error al procesar el reingreso: ' + error.message });
  }
};

module.exports = {
  getAsociados,
  getAsociadoById,
  createAsociado,
  updateAsociado,
  reingresarAsociado
};
