const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { registrarAuditoria } = require('../utils/auditoria');

const parseExcelDate = (val) => {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) return date;
  }
  if (typeof val === 'string') {
    const cleaned = val.trim();
    if (cleaned === '' || cleaned.includes('#VALUE!') || cleaned.includes('#VALOR!')) return null;
    let sanitized = cleaned.replace(/\/0+(\d+)\//g, '/$1/');
    sanitized = sanitized.replace(/-0+(\d+)-/g, '-$1-');
    let parts = sanitized.split(/[\/\-]/);
    if (parts.length === 3) {
      let day, month, year;
      if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
      } else {
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        year = parseInt(parts[2]);
      }
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && year < 2100) {
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }
  return null;
};

const parseSmallInt = (val, defaultVal = 0) => {
  const p = parseInt(val);
  return isNaN(p) ? defaultVal : p;
};

const parseSafeFloat = (val) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9\.,\-]/g, '');
  const normalized = cleaned.replace(/\./g, '').replace(/,/g, '.');
  const p = parseFloat(normalized);
  return isNaN(p) ? null : p;
};

const importAusentismos = async (req, res) => {
  try {
    const { usuarioId } = req.user;
    const { fileData } = req.body;

    if (!fileData) {
      return res.status(400).json({ mensaje: 'Archivo Excel requerido (Base64)' });
    }

    const buffer = Buffer.from(fileData.split(',')[1] || fileData, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    // Cargar asociados y diagnósticos actuales en memoria
    const DB_Asociados = await prisma.asociado.findMany({ select: { id: true, numeroIdentificacion: true } });
    const asociadoMap = new Map(DB_Asociados.map(a => [a.numeroIdentificacion.trim(), a.id]));

    const DB_Diagnosticos = await prisma.diagnosticoCIE10.findMany({ select: { id: true, codigo: true } });
    const diagnosticoMap = new Map(DB_Diagnosticos.map(d => [d.codigo.toUpperCase().trim(), d.id]));

    // Limpiar ausentismos existentes
    await prisma.ausentismo.deleteMany();

    let countMedicos = 0;
    let countOtros = 0;
    let countOmitidos = 0;

    // 1. Procesar Hoja: REG AUSENTISMO MED (Incapacidades Médicas)
    const sheetMedName = workbook.SheetNames.find(n => n.includes('REG AUSENTISMO') || n.includes('MEDICO'));
    if (sheetMedName) {
      const sheetMed = workbook.Sheets[sheetMedName];
      const rowsMed = XLSX.utils.sheet_to_json(sheetMed, { header: 1 });
      
      // Las filas reales de datos empiezan en el índice 3
      const dataRowsMed = rowsMed.slice(3);

      for (const row of dataRowsMed) {
        if (!row || row.length === 0) continue;
        
        const cedulaRaw = row[1];
        if (!cedulaRaw) continue;
        const cedula = String(cedulaRaw).trim();

        const asociadoId = asociadoMap.get(cedula);
        if (!asociadoId) {
          countOmitidos++;
          continue;
        }

        const fechaIni = parseExcelDate(row[7]);
        const fechaFin = parseExcelDate(row[8]);
        if (!fechaIni || !fechaFin) continue;

        const diasAusencia = parseSmallInt(row[9], 1);
        const diasEnMes = row[10] ? parseSmallInt(row[10], 0) : null;
        const prorroga = row[11] === 'SI';
        const examPost = row[12] === 'SI';
        const origen = row[13] ? String(row[13]).trim() : 'ENFERMEDAD GENERAL';
        const diagCodigo = row[14] ? String(row[14]).trim().toUpperCase() : '';

        let diagnosticoId = null;
        if (diagCodigo) {
          diagnosticoId = diagnosticoMap.get(diagCodigo);
          if (!diagnosticoId) {
            // Si el código no existe en la base, lo creamos
            const nuevoDiag = await prisma.diagnosticoCIE10.create({
              data: { codigo: diagCodigo, descripcion: 'Diagnóstico creado durante importación' }
            });
            diagnosticoMap.set(diagCodigo, nuevoDiag.id);
            diagnosticoId = nuevoDiag.id;
          }
        }

        await prisma.ausentismo.create({
          data: {
            asociadoId,
            tipo: 'MEDICO',
            tipoEvento: 'D.A.',
            fechaInicio: fechaIni,
            fechaFin: fechaFin,
            diasAusencia,
            diasEnMes,
            prorroga,
            examenPostIncapacidad: examPost,
            origenIncapacidad: origen,
            diagnosticoId
          }
        });
        countMedicos++;
      }
    }

    // 2. Procesar Hoja: OTRO AUSENTISMO (Vacaciones, Permisos, Sanciones)
    const sheetOtroName = workbook.SheetNames.find(n => n.includes('OTRO AUSENTISMO'));
    if (sheetOtroName) {
      const sheetOtro = workbook.Sheets[sheetOtroName];
      const rowsOtro = XLSX.utils.sheet_to_json(sheetOtro, { header: 1 });
      
      // Las filas reales de datos empiezan en el índice 1
      const dataRowsOtro = rowsOtro.slice(1);

      for (const row of dataRowsOtro) {
        if (!row || row.length === 0) continue;

        const cedulaRaw = row[1];
        if (!cedulaRaw) continue;
        const cedula = String(cedulaRaw).trim();

        const asociadoId = asociadoMap.get(cedula);
        if (!asociadoId) {
          countOmitidos++;
          continue;
        }

        const tipoEventoRaw = row[7];
        if (!tipoEventoRaw) continue;
        const tipoEvento = String(tipoEventoRaw).trim();

        const fechaIni = parseExcelDate(row[8]);
        const fechaFin = parseExcelDate(row[9]);
        if (!fechaIni || !fechaFin) continue;

        const diasAusencia = parseSmallInt(row[10], 1);
        const causa = row[11] ? String(row[11]).trim() : null;
        const observaciones = row[12] ? String(row[12]).trim() : null;
        const salarioBase = parseSafeFloat(row[13]);
        const costosAT = parseSafeFloat(row[14]);

        await prisma.ausentismo.create({
          data: {
            asociadoId,
            tipo: 'OTRO',
            tipoEvento,
            fechaInicio: fechaIni,
            fechaFin: fechaFin,
            diasAusencia,
            causa,
            observaciones,
            salarioBase,
            costosAsumidosAT: costosAT
          }
        });
        countOtros++;
      }
    }

    await registrarAuditoria(usuarioId, 'Ausentismo', 'TODOS', 'IMPORTAR', null, null, `Medicos: ${countMedicos}, Otros: ${countOtros}, Omitidos: ${countOmitidos}`, req.ip);

    res.json({
      mensaje: 'Planilla de ausentismo importada con éxito',
      estadisticas: {
        incapacidadesMedicas: countMedicos,
        otrosAusentismos: countOtros,
        asociadosNoEncontrados: countOmitidos
      }
    });

  } catch (error) {
    console.error('Error al importar ausentismos:', error);
    res.status(500).json({ mensaje: 'Error al importar archivo de ausentismo: ' + error.message });
  }
};

module.exports = {
  importAusentismos
};
