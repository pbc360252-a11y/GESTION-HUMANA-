const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { registrarAuditoria } = require('../utils/auditoria');

// Generador de Alertas (Compartido con el Cron Job y Ejecución Manual)
const generarAlertasDeVencimiento = async () => {
  const hoy = new Date();
  const hoyMs = hoy.getTime();
  let alertasCreadasCount = 0;
  const reporte = [];

  // Buscar todos los asociados activos
  const asociados = await prisma.asociado.findMany({
    where: { estado: 'ACTIVO' },
    include: {
      cargo: true,
      documentos: {
        orderBy: { fechaCarga: 'desc' }
      }
    }
  });

  for (const asoc of asociados) {
    // 1. Verificar documentos que vencen
    // Filtrar los últimos documentos cargados por tipo para este asociado
    const ultimosDocs = {};
    for (const doc of asoc.documentos) {
      if (!ultimosDocs[doc.tipoDocumento]) {
        ultimosDocs[doc.tipoDocumento] = doc;
      }
    }

    const tiposAVerificar = [
      { tipoDoc: 'EXAMEN_PSICOFISICO', tipoAler: 'VENCIMIENTO_PSICOFISICO' },
      { tipoDoc: 'EXAMEN_PSICOSENSOMETRICO', tipoAler: 'VENCIMIENTO_PSICOSENSOMETRICO' },
      { tipoDoc: 'CERTIFICADO_CURSO', tipoAler: 'VENCIMIENTO_CURSO' },
      { tipoDoc: 'POLIZA_SURA', tipoAler: 'VENCIMIENTO_POLIZA' }
    ];

    for (const { tipoDoc, tipoAler } of tiposAVerificar) {
      const doc = ultimosDocs[tipoDoc];
      if (doc && doc.fechaVencimiento) {
        const fechaVenc = new Date(doc.fechaVencimiento);
        const diffMs = fechaVenc.getTime() - hoyMs;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Regla: Generar alerta si faltan 60, 30 o 7 días o menos
        if (diffDays <= 60) {
          // Verificar si ya existe una alerta pendiente para este mismo vencimiento
          const alertaExistente = await prisma.alerta.findFirst({
            where: {
              asociadoId: asoc.id,
              tipoAlerta: tipoAler,
              fechaVencimiento: fechaVenc,
              estado: 'PENDIENTE'
            }
          });

          if (!alertaExistente) {
            await prisma.alerta.create({
              data: {
                asociadoId: asoc.id,
                tipoAlerta: tipoAler,
                fechaVencimiento: fechaVenc,
                estado: 'PENDIENTE'
              }
            });
            alertasCreadasCount++;
            reporte.push({
              asociado: `${asoc.primerNombre} ${asoc.primerApellido}`,
              tipo: tipoAler,
              diasRestantes: diffDays
            });

            // Si es crítico (<=7 días), marcar en el asociado que ya no está vigente (si aplica)
            if (diffDays <= 0) {
              const dataUpdate = {};
              if (tipoDoc === 'EXAMEN_PSICOFISICO') dataUpdate.psicofisicoVigente = false;
              if (tipoDoc === 'EXAMEN_PSICOSENSOMETRICO') dataUpdate.psicosensometricoVigente = false;
              if (Object.keys(dataUpdate).length > 0) {
                await prisma.asociado.update({
                  where: { id: asoc.id },
                  data: dataUpdate
                });
              }
            }
          }
        }
      } else {
        // Si no tiene el documento y su cargo es crítico, crear alerta de DOCUMENTO_FALTANTE
        if (asoc.cargo.esCritico && (tipoDoc === 'EXAMEN_PSICOFISICO' || tipoDoc === 'EXAMEN_PSICOSENSOMETRICO')) {
          const alertaExistente = await prisma.alerta.findFirst({
            where: {
              asociadoId: asoc.id,
              tipoAlerta: 'DOCUMENTO_FALTANTE',
              estado: 'PENDIENTE'
            }
          });

          if (!alertaExistente) {
            await prisma.alerta.create({
              data: {
                asociadoId: asoc.id,
                tipoAlerta: 'DOCUMENTO_FALTANTE',
                fechaVencimiento: new Date(hoyMs + 7 * 24 * 60 * 60 * 1000), // Vence en 7 días para cargar
                estado: 'PENDIENTE'
              }
            });
            alertasCreadasCount++;
            reporte.push({
              asociado: `${asoc.primerNombre} ${asoc.primerApellido}`,
              tipo: `DOCUMENTO_FALTANTE (${tipoDoc})`,
              diasRestantes: 7
            });
          }
        }
      }
    }
  }

  return { alertasCreadasCount, reporte };
};

// Listar alertas pendientes
const getAlertas = async (req, res) => {
  try {
    const { tipoAlerta, centroTrabajoId } = req.query;

    const where = { estado: 'PENDIENTE' };
    if (tipoAlerta) where.tipoAlerta = tipoAlerta;
    if (centroTrabajoId) {
      where.asociado = {
        centroTrabajoId: centroTrabajoId
      };
    }

    const alertas = await prisma.alerta.findMany({
      where,
      include: {
        asociado: {
          include: {
            cargo: true,
            centroTrabajo: true
          }
        }
      }
    });

    const hoy = new Date().getTime();
    
    // Calcular días restantes y ordenar por urgencia
    const result = alertas.map(alerta => {
      const vTime = new Date(alerta.fechaVencimiento).getTime();
      const diffMs = vTime - hoy;
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      return {
        ...alerta,
        diasRestantes
      };
    });

    // Ordenar: vencidos primero (negativos o menores días restantes)
    result.sort((a, b) => a.diasRestantes - b.diasRestantes);

    res.json(result);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ mensaje: 'Error al obtener alertas' });
  }
};

// Resolver una alerta
const resolverAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId } = req.user;

    const alerta = await prisma.alerta.findUnique({ where: { id } });
    if (!alerta) {
      return res.status(404).json({ mensaje: 'Alerta no encontrada' });
    }

    const alertaResuelta = await prisma.alerta.update({
      where: { id },
      data: { 
        estado: 'RESUELTA',
        asignadoAId: usuarioId
      }
    });

    await registrarAuditoria(usuarioId, 'Alerta', id, 'EDITAR', 'estado', 'PENDIENTE', 'RESUELTA', req.ip);

    res.json(alertaResuelta);
  } catch (error) {
    console.error('Error al resolver alerta:', error);
    res.status(500).json({ mensaje: 'Error al resolver la alerta' });
  }
};

// Ejecución manual del Cron Job
const runCronManually = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.user;
    if (rol !== 'ADMIN' && rol !== 'SST') {
      return res.status(403).json({ mensaje: 'No tiene permisos para ejecutar el motor de alertas' });
    }

    const result = await generarAlertasDeVencimiento();

    await registrarAuditoria(usuarioId, 'Alerta', 'SISTEMA', 'EJECUTAR_CRON', 'Todos', null, `Alertas creadas: ${result.alertasCreadasCount}`, req.ip);

    res.json({
      mensaje: 'Motor de alertas ejecutado correctamente',
      ...result
    });
  } catch (error) {
    console.error('Error al ejecutar cron manualmente:', error);
    res.status(500).json({ mensaje: 'Error al ejecutar cron' });
  }
};

module.exports = {
  getAlertas,
  resolverAlerta,
  runCronManually,
  generarAlertasDeVencimiento
};
