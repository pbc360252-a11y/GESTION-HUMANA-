const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcularCamposDerivados } = require('../services/asociadoService');
const ExcelJS = require('exceljs');

const getDashboardStats = async (req, res) => {
  try {
    const { rol } = req.user;

    // Obtener asociados y retiros
    const asociados = await prisma.asociado.findMany({
      include: {
        cargo: true,
        centroTrabajo: true,
        eps: true,
        genero: true,
        retiros: true
      }
    });

    const totalActivos = asociados.filter(a => a.estado === 'ACTIVO').length;
    const totalSuspendidos = asociados.filter(a => a.estado === 'SUSPENDIDO').length;
    const totalRetirados = asociados.filter(a => a.estado === 'RETIRADO').length;

    // Calcular campos derivados en memoria
    const activosDerivados = asociados
      .filter(a => a.estado === 'ACTIVO')
      .map(a => calcularCamposDerivados(a));

    // 1. Distribución por Rangos de Edad (Activos)
    const rangosEdad = { '<25': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
    activosDerivados.forEach(der => {
      const edad = der.edadActual;
      if (edad < 25) rangosEdad['<25']++;
      else if (edad <= 34) rangosEdad['25-34']++;
      else if (edad <= 44) rangosEdad['35-44']++;
      else if (edad <= 54) rangosEdad['45-54']++;
      else rangosEdad['55+']++;
    });

    // 2. Distribución por Rango de Antigüedad (Activos)
    const rangosAntiguedad = { '0-1 año': 0, '1-3 años': 0, '3-5 años': 0, '5-10 años': 0, '10+ años': 0 };
    activosDerivados.forEach(der => {
      const ant = der.antiguedadEmpresaAnios;
      if (ant < 1) rangosAntiguedad['0-1 año']++;
      else if (ant <= 3) rangosAntiguedad['1-3 años']++;
      else if (ant <= 5) rangosAntiguedad['3-5 años']++;
      else if (ant <= 10) rangosAntiguedad['5-10 años']++;
      else rangosAntiguedad['10+ años']++;
    });

    // 3. Distribución por EPS (Activos)
    const epsDist = {};
    asociados.filter(a => a.estado === 'ACTIVO').forEach(a => {
      const nombreEps = a.eps ? a.eps.valor : 'SIN REGISTRO';
      epsDist[nombreEps] = (epsDist[nombreEps] || 0) + 1;
    });

    // 4. Distribución por Género (Activos)
    const generoDist = {};
    asociados.filter(a => a.estado === 'ACTIVO').forEach(a => {
      const gen = a.genero ? a.genero.valor : 'SIN REGISTRO';
      generoDist[gen] = (generoDist[gen] || 0) + 1;
    });

    // 5. Distribución por Nivel de Estudios (Activos)
    const estudiosDist = {};
    asociados.filter(a => a.estado === 'ACTIVO').forEach(a => {
      const nivel = a.nivelEstudio || 'SIN REGISTRO';
      estudiosDist[nivel] = (estudiosDist[nivel] || 0) + 1;
    });

    // 6. Distribución por Estado Civil (Activos)
    const estadoCivilDist = {};
    asociados.filter(a => a.estado === 'ACTIVO').forEach(a => {
      const est = a.estadoCivil || 'SIN REGISTRO';
      estadoCivilDist[est] = (estadoCivilDist[est] || 0) + 1;
    });

    // 7. Top Motivos de Retiro (Todos los retiros)
    const retiros = await prisma.retiro.findMany({
      include: { motivoRetiro: true, razonRetiro: true }
    });

    const motivosRetiroDist = {};
    retiros.forEach(r => {
      const mot = r.motivoRetiro ? r.motivoRetiro.valor : 'OTRO';
      motivosRetiroDist[mot] = (motivosRetiroDist[mot] || 0) + 1;
    });

    // 8. Vencimientos Próximos (Alertas activas por tipo)
    const alertasPendientes = await prisma.alerta.findMany({
      where: { estado: 'PENDIENTE' }
    });
    
    const alertasDist = {
      VENCIMIENTO_PSICOFISICO: 0,
      VENCIMIENTO_PSICOSENSOMETRICO: 0,
      VENCIMIENTO_CURSO: 0,
      VENCIMIENTO_POLIZA: 0,
      DOCUMENTO_FALTANTE: 0
    };
    alertasPendientes.forEach(al => {
      if (alertasDist[al.tipoAlerta] !== undefined) {
        alertasDist[al.tipoAlerta]++;
      }
    });

    // 9. Cálculo de Rotación de Personal (Últimos 6 meses)
    const rotacionMensual = [];
    const hoy = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const anio = d.getFullYear();
      const mes = d.getMonth(); // 0-11
      const mesNombre = d.toLocaleString('es-ES', { month: 'short' }).toUpperCase();

      // Retiros en este mes/año
      const retirosMes = retiros.filter(r => {
        const fr = new Date(r.fechaRetiro);
        return fr.getFullYear() === anio && fr.getMonth() === mes;
      }).length;

      // Activos en ese momento (estimado con el total de activos actual para simplificar)
      const activosMomento = totalActivos || 1; 
      const tasaRotacion = parseFloat(((retirosMes / activosMomento) * 100).toFixed(2));

      rotacionMensual.push({
        mes: `${mesNombre} ${anio}`,
        retiros: retirosMes,
        tasaRotacion
      });
    }

    res.json({
      resumen: {
        totalActivos,
        totalSuspendidos,
        totalRetirados,
        totalRegistros: asociados.length
      },
      demograficos: {
        rangosEdad,
        rangosAntiguedad,
        eps: epsDist,
        genero: generoDist,
        estudios: estudiosDist,
        estadoCivil: estadoCivilDist
      },
      retirosStats: {
        motivos: motivosRetiroDist,
        tendenciaRotacion: rotacionMensual
      },
      alertasStats: alertasDist
    });

  } catch (error) {
    console.error('Error al calcular estadísticas:', error);
    res.status(500).json({ mensaje: 'Error al cargar estadísticas del panel' });
  }
};

// Exportar Listado de Asociados Filtrado a Excel
const exportAsociadosExcel = async (req, res) => {
  try {
    const asociados = await prisma.asociado.findMany({
      include: {
        cargo: true,
        centroTrabajo: true,
        eps: true,
        fondoPension: true,
        rh: true
      }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asociados Activos');

    worksheet.columns = [
      { header: 'Carpeta', key: 'carpeta', width: 10 },
      { header: 'Identificación', key: 'identificacion', width: 15 },
      { header: 'Apellidos', key: 'apellidos', width: 25 },
      { header: 'Nombres', key: 'nombres', width: 25 },
      { header: 'Cargo', key: 'cargo', width: 20 },
      { header: 'Centro Trabajo', key: 'centro', width: 25 },
      { header: 'Fecha Ingreso', key: 'ingreso', width: 15 },
      { header: 'Antigüedad (Años)', key: 'antiguedad', width: 15 },
      { header: 'EPS', key: 'eps', width: 15 },
      { header: 'Fondo Pensión', key: 'afp', width: 15 },
      { header: 'RH', key: 'rh', width: 10 },
      { header: 'Celular', key: 'celular', width: 15 },
      { header: 'Estado', key: 'estado', width: 12 }
    ];

    asociados.forEach(asoc => {
      const derivados = calcularCamposDerivados(asoc);
      worksheet.addRow({
        carpeta: asoc.numeroCarpetaActual || '',
        identificacion: asoc.numeroIdentificacion,
        apellidos: `${asoc.primerApellido} ${asoc.segundoApellido || ''}`,
        nombres: `${asoc.primerNombre} ${asoc.segundoNombre || ''}`,
        cargo: asoc.cargo.nombre,
        centro: asoc.centroTrabajo.nombreCliente,
        ingreso: asoc.fechaIngreso.toISOString().split('T')[0],
        antiguedad: derivados.antiguedadEmpresaAnios,
        eps: asoc.eps ? asoc.eps.valor : '',
        afp: asoc.fondoPension ? asoc.fondoPension.valor : '',
        rh: asoc.rh ? asoc.rh.valor : '',
        celular: asoc.celular,
        estado: asoc.estado
      });
    });

    // Dar formato a las cabeceras
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0A2472' } // Color de la marca
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'Reporte_Asociados.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    res.status(500).json({ mensaje: 'Error al exportar reporte Excel' });
  }
};

// Exportar Matriz de Cumplimiento
const exportMatrizCumplimientoExcel = async (req, res) => {
  try {
    const asociados = await prisma.asociado.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        cargo: true,
        documentos: {
          orderBy: { fechaCarga: 'desc' }
        }
      }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Matriz Cumplimiento Normativo');

    worksheet.columns = [
      { header: 'Identificación', key: 'identificacion', width: 15 },
      { header: 'Asociado', key: 'nombre', width: 30 },
      { header: 'Cargo', key: 'cargo', width: 20 },
      { header: 'Crítico', key: 'critico', width: 10 },
      { header: 'Curso Reentrenamiento', key: 'curso', width: 25 },
      { header: 'Examen Psicofísico', key: 'psicofisico', width: 25 },
      { header: 'Examen Psicosensométrico', key: 'psicosensometrico', width: 25 }
    ];

    asociados.forEach(asoc => {
      const ultimosDocs = {};
      asoc.documentos.forEach(doc => {
        if (!ultimosDocs[doc.tipoDocumento]) {
          ultimosDocs[doc.tipoDocumento] = doc;
        }
      });

      const getDocStatus = (tipoDoc) => {
        const doc = ultimosDocs[tipoDoc];
        if (!doc) return 'PENDIENTE / FALTANTE';
        if (!doc.fechaVencimiento) return 'CARGADO';
        
        const hoy = new Date();
        const fVenc = new Date(doc.fechaVencimiento);
        if (fVenc < hoy) {
          return `VENCIDO (${fVenc.toISOString().split('T')[0]})`;
        }
        return `VIGENTE (Vence ${fVenc.toISOString().split('T')[0]})`;
      };

      worksheet.addRow({
        identificacion: asoc.numeroIdentificacion,
        nombre: `${asoc.primerNombre} ${asoc.primerApellido}`,
        cargo: asoc.cargo.nombre,
        critico: asoc.cargo.esCritico ? 'SI' : 'NO',
        curso: getDocStatus('CERTIFICADO_CURSO'),
        psicofisico: getDocStatus('EXAMEN_PSICOFISICO'),
        psicosensometrico: getDocStatus('EXAMEN_PSICOSENSOMETRICO')
      });
    });

    // Formato cabeceras
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '123499' }
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'Matriz_Cumplimiento.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar matriz:', error);
    res.status(500).json({ mensaje: 'Error al exportar matriz de cumplimiento' });
  }
};

module.exports = {
  getDashboardStats,
  exportAsociadosExcel,
  exportMatrizCumplimientoExcel
};
