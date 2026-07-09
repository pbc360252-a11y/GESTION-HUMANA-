const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { parseExcelDate } = require('../utils/dateUtils');
const { registrarAuditoria } = require('../utils/auditoria');

// Paso 1: Leer el Excel y extraer hojas, columnas y filas de previsualización
const previewExcel = async (req, res) => {
  try {
    const { fileData } = req.body;
    if (!fileData) {
      return res.status(400).json({ mensaje: 'Archivo Excel requerido (Base64)' });
    }

    const buffer = Buffer.from(fileData.split(',')[1] || fileData, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const sheetsInfo = {};
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      // Convertir a matriz JSON con cabeceras originales
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (rows.length > 0) {
        const headers = rows[0].map(h => String(h || '').trim());
        const previewRows = rows.slice(1, 6).map(row => {
          const rowObj = {};
          headers.forEach((h, index) => {
            rowObj[h] = row[index] !== undefined ? row[index] : null;
          });
          return rowObj;
        });

        sheetsInfo[sheetName] = {
          headers,
          previewRows,
          totalRows: Math.max(0, rows.length - 1)
        };
      }
    }

    res.json({ sheets: sheetsInfo });
  } catch (error) {
    console.error('Error al previsualizar Excel:', error);
    res.status(500).json({ mensaje: 'Error al procesar el archivo Excel: ' + error.message });
  }
};

// Paso 2: Analizar hoja seleccionada con mapeo de columnas provisto
const analyzeExcelSheet = async (req, res) => {
  try {
    const { fileData, sheetName, columnMapping } = req.body;

    if (!fileData || !sheetName || !columnMapping) {
      return res.status(400).json({ mensaje: 'Faltan parámetros requeridos (fileData, sheetName, columnMapping)' });
    }

    const buffer = Buffer.from(fileData.split(',')[1] || fileData, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return res.status(404).json({ mensaje: `No se encontró la hoja '${sheetName}'` });
    }

    // Convertir hoja a filas de objetos
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    // Inicializar contenedores de análisis
    const uniqueValues = {
      cargo: new Set(),
      centroTrabajo: new Set(),
      eps: new Set(),
      fondoPension: new Set(),
      rh: new Set(),
      genero: new Set(),
      orientacionSexual: new Set(),
      religion: new Set(),
      raza: new Set(),
      tipoVivienda: new Set(),
      nivelEstudio: new Set(),
      rangoIngresos: new Set(),
      medioTransporte: new Set(),
      tiempoTraslado: new Set(),
      estadoCivil: new Set(),
      motivoRetiro: new Set(),
      razonRetiro: new Set()
    };

    const errors = [];
    const duplicates = [];
    const idsEnArchivo = new Set();

    // Obtener IDs de asociados ya existentes en la BD
    const asociadosExistentesBD = await prisma.asociado.findMany({
      select: { id: true, numeroIdentificacion: true, estado: true, primerNombre: true, primerApellido: true }
    });

    const bdMap = new Map(asociadosExistentesBD.map(a => [a.numeroIdentificacion, a]));

    // Recorrer filas de datos
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 2; // Fila 1 es cabecera (1-indexed)

      // Extraer campos según el mapeo de columnas
      const idCol = columnMapping.numeroIdentificacion;
      const numIdentificacion = row[idCol] ? String(row[idCol]).trim() : null;

      if (!numIdentificacion) {
        errors.push({
          row: rowNum,
          field: 'numeroIdentificacion',
          value: null,
          message: 'Número de identificación faltante (obligatorio)'
        });
        continue;
      }

      // Validar duplicados en el mismo archivo
      if (idsEnArchivo.has(numIdentificacion)) {
        duplicates.push({
          row: rowNum,
          id: numIdentificacion,
          name: `${row[columnMapping.primerNombre] || ''} ${row[columnMapping.primerApellido] || ''}`,
          type: 'ARCHIVO_DUPLICADO',
          message: 'Identificación duplicada en esta misma hoja'
        });
      } else {
        idsEnArchivo.add(numIdentificacion);
      }

      // Validar duplicados contra la base de datos
      const existInBD = bdMap.get(numIdentificacion);
      if (existInBD) {
        duplicates.push({
          row: rowNum,
          id: numIdentificacion,
          name: `${existInBD.primerNombre} ${existInBD.primerApellido}`,
          type: existInBD.estado === 'RETIRADO' ? 'BD_RETIRADO' : 'BD_ACTIVO',
          message: existInBD.estado === 'RETIRADO' 
            ? 'Existe en la base de datos como RETIRADO (se procesará como reingreso)' 
            : 'Ya existe en la base de datos como ACTIVO o SUSPENDIDO (se omitirá o actualizará)'
        });
      }

      // Validar campos obligatorios
      const camposObligatorios = ['primerNombre', 'primerApellido', 'fechaIngreso', 'fechaNacimiento', 'cargoId', 'centroTrabajoId'];
      for (const key of camposObligatorios) {
        const fileColName = columnMapping[key];
        const val = row[fileColName];
        if (val === undefined || val === null || String(val).trim() === '') {
          errors.push({
            row: rowNum,
            field: key,
            value: null,
            message: `Campo obligatorio '${key}' está vacío`
          });
        }
      }

      // Validar fechas
      const camposFechas = ['fechaNacimiento', 'fechaIngreso', 'fechaExpedicionCedula', 'fechaRetiro'];
      for (const key of camposFechas) {
        const fileColName = columnMapping[key];
        if (fileColName && row[fileColName]) {
          const parsedDate = parseExcelDate(row[fileColName]);
          if (!parsedDate) {
            errors.push({
              row: rowNum,
              field: key,
              value: row[fileColName],
              message: `Formato de fecha inválido para '${key}'`
            });
          }
        }
      }

      // Recopilar valores únicos de campos de catálogo para el mapeo
      const camposCatalogos = [
        { key: 'cargoId', cat: 'cargo' },
        { key: 'centroTrabajoId', cat: 'centroTrabajo' },
        { key: 'epsId', cat: 'eps' },
        { key: 'fondoPensionId', cat: 'fondoPension' },
        { key: 'rhId', cat: 'rh' },
        { key: 'generoId', cat: 'genero' },
        { key: 'orientacionSexualId', cat: 'orientacionSexual' },
        { key: 'religionId', cat: 'religion' },
        { key: 'razaId', cat: 'raza' },
        { key: 'tipoVivienda', cat: 'tipoVivienda' },
        { key: 'nivelEstudio', cat: 'nivelEstudio' },
        { key: 'rangoIngresos', cat: 'rangoIngresos' },
        { key: 'medioTransporte', cat: 'medioTransporte' },
        { key: 'tiempoTraslado', cat: 'tiempoTraslado' },
        { key: 'estadoCivil', cat: 'estadoCivil' },
        { key: 'motivoRetiroId', cat: 'motivoRetiro' },
        { key: 'razonRetiroId', cat: 'razonRetiro' }
      ];

      for (const { key, cat } of camposCatalogos) {
        const colName = columnMapping[key];
        if (colName && row[colName]) {
          const valStr = String(row[colName]).trim();
          if (valStr && !valStr.startsWith('#VAL') && !valStr.includes('#VALUE')) {
            uniqueValues[cat].add(valStr);
          }
        }
      }
    }

    // Convertir Sets a Arrays para enviar al frontend
    const uniqueValuesArrays = {};
    for (const [key, set] of Object.entries(uniqueValues)) {
      uniqueValuesArrays[key] = Array.from(set).sort();
    }

    res.json({
      totalRows: rows.length,
      errors,
      duplicates,
      uniqueValues: uniqueValuesArrays
    });
  } catch (error) {
    console.error('Error al analizar hoja de Excel:', error);
    res.status(500).json({ mensaje: 'Error al analizar la hoja de cálculo: ' + error.message });
  }
};

// Paso 3: Confirmar la importación con mapeos de valores
const confirmExcelImport = async (req, res) => {
  try {
    const { id: usuarioId } = req.user;
    const { 
      fileData, 
      sheetName, 
      columnMapping, 
      valueMappings, // { eps: { "sura eps": "SURA" }, ... }
      importMode // "IGNORE_DUPLICATES" | "UPDATE_DUPLICATES" | "RECREATE_REENTRIES"
    } = req.body;

    if (!fileData || !sheetName || !columnMapping) {
      return res.status(400).json({ mensaje: 'Faltan parámetros requeridos' });
    }

    const buffer = Buffer.from(fileData.split(',')[1] || fileData, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return res.status(404).json({ mensaje: 'Hoja no encontrada' });

    const rows = XLSX.utils.sheet_to_json(sheet);

    // 1. Cargar bases de datos maestras para asignación rápida de IDs
    const DB_Cargos = await prisma.cargo.findMany();
    const DB_Centros = await prisma.centroTrabajo.findMany();
    const DB_Valores = await prisma.catalogoValor.findMany();

    const cargoMap = new Map(DB_Cargos.map(c => [c.nombre, c.id]));
    const centroMap = new Map(DB_Centros.map(c => [c.codigo, c.id]));
    const centroNombreMap = new Map(DB_Centros.map(c => [c.nombreCliente.toUpperCase(), c.id]));

    // catalogoMap['EPS']['SURA'] = id
    const catalogoMap = {};
    for (const val of DB_Valores) {
      if (!catalogoMap[val.tipo]) catalogoMap[val.tipo] = {};
      catalogoMap[val.tipo][val.valor.toUpperCase()] = val.id;
    }

    // Funciones de resolución de valores usando los mapeos provistos por el usuario
    const resolverCargo = async (val) => {
      if (!val) return null;
      const cleanVal = String(val).trim().toUpperCase();
      const mapped = valueMappings?.cargo?.[val] || cleanVal;
      
      // Buscar en BD
      let id = cargoMap.get(mapped);
      if (!id) {
        // Crear nuevo cargo
        const nuevo = await prisma.cargo.create({
          data: { nombre: mapped, esCritico: false, frecuenciaActualizacionAnios: 2 }
        });
        cargoMap.set(mapped, nuevo.id);
        id = nuevo.id;
      }
      return id;
    };

    const resolverCentro = async (val) => {
      if (!val) return null;
      const cleanVal = String(val).trim();
      const mapped = valueMappings?.centroTrabajo?.[val] || cleanVal;

      // Buscar por código o por nombre
      let id = centroMap.get(mapped) || centroNombreMap.get(mapped.toUpperCase());
      if (!id) {
        // Crear nuevo centro
        const genCodigo = `MIG_${Date.now().toString().slice(-4)}_${Math.floor(Math.random() * 100)}`;
        const nuevo = await prisma.centroTrabajo.create({
          data: { codigo: genCodigo, nombreCliente: mapped }
        });
        centroMap.set(genCodigo, nuevo.id);
        centroNombreMap.set(mapped.toUpperCase(), nuevo.id);
        id = nuevo.id;
      }
      return id;
    };

    const resolverCatalogo = async (val, tipo) => {
      if (!val) return null;
      const cleanVal = String(val).trim().toUpperCase();
      const mapped = (valueMappings?.[tipo.toLowerCase()]?.[val] || val).toUpperCase();

      if (!catalogoMap[tipo]) catalogoMap[tipo] = {};
      
      let id = catalogoMap[tipo][mapped];
      if (!id) {
        // Crear valor en catálogo
        try {
          const nuevo = await prisma.catalogoValor.create({
            data: { tipo: tipo, valor: mapped }
          });
          catalogoMap[tipo][mapped] = nuevo.id;
          id = nuevo.id;
        } catch (e) {
          // Evitar errores por duplicación paralela
          const exist = await prisma.catalogoValor.findFirst({ where: { tipo, valor: mapped } });
          id = exist ? exist.id : null;
        }
      }
      return id;
    };

    let ingresadosCount = 0;
    let actualizadosCount = 0;
    let reingresosCount = 0;
    let omitidosCount = 0;

    // Procesar fila por fila en una transacción para mayor seguridad (o secuencialmente)
    for (const row of rows) {
      const idCol = columnMapping.numeroIdentificacion;
      const numIdentificacion = row[idCol] ? String(row[idCol]).trim() : null;

      if (!numIdentificacion) continue;

      // Buscar si existe en la BD
      const asociadoBD = await prisma.asociado.findUnique({
        where: { numeroIdentificacion: numIdentificacion }
      });

      if (asociadoBD) {
        if (asociadoBD.estado === 'RETIRADO') {
          // REINGRESO
          if (importMode === 'IGNORE_DUPLICATES') {
            omitidosCount++;
            continue;
          }

          // Reactivar
          const cargoId = await resolverCargo(row[columnMapping.cargoId]);
          const centroTrabajoId = await resolverCentro(row[columnMapping.centroTrabajoId]);

          await prisma.asociado.update({
            where: { id: asociadoBD.id },
            data: {
              estado: 'ACTIVO',
              fechaIngreso: parseExcelDate(row[columnMapping.fechaIngreso]) || asociadoBD.fechaIngreso,
              numeroCarpetaActual: row[columnMapping.numeroCarpetaActual] ? parseInt(row[columnMapping.numeroCarpetaActual]) : asociadoBD.numeroCarpetaActual,
              cargoId: cargoId || asociadoBD.cargoId,
              centroTrabajoId: centroTrabajoId || asociadoBD.centroTrabajoId
            }
          });

          await prisma.historialCargo.create({
            data: {
              asociadoId: asociadoBD.id,
              cargoId: cargoId || asociadoBD.cargoId,
              motivoCambio: 'Reingreso mediante migración Excel'
            }
          });

          reingresosCount++;
          continue;
        } else {
          // DUPLICADO ACTIVO
          if (importMode === 'UPDATE_DUPLICATES') {
            // Actualizar datos laborales
            const cargoId = await resolverCargo(row[columnMapping.cargoId]);
            const centroTrabajoId = await resolverCentro(row[columnMapping.centroTrabajoId]);

            await prisma.asociado.update({
              where: { id: asociadoBD.id },
              data: {
                primerNombre: row[columnMapping.primerNombre] ? String(row[columnMapping.primerNombre]).trim() : asociadoBD.primerNombre,
                primerApellido: row[columnMapping.primerApellido] ? String(row[columnMapping.primerApellido]).trim() : asociadoBD.primerApellido,
                segundoNombre: row[columnMapping.segundoNombre] ? String(row[columnMapping.segundoNombre]).trim() : asociadoBD.segundoNombre,
                segundoApellido: row[columnMapping.segundoApellido] ? String(row[columnMapping.segundoApellido]).trim() : asociadoBD.segundoApellido,
                celular: row[columnMapping.celular] ? String(row[columnMapping.celular]).trim() : asociadoBD.celular,
                cargoId: cargoId || asociadoBD.cargoId,
                centroTrabajoId: centroTrabajoId || asociadoBD.centroTrabajoId
              }
            });
            actualizadosCount++;
            continue;
          } else {
            omitidosCount++;
            continue;
          }
        }
      }

      // RESOLVER TODOS LOS IDS DE CARGOS, CENTROS Y CATÁLOGOS
      const cargoId = await resolverCargo(row[columnMapping.cargoId]);
      const centroTrabajoId = await resolverCentro(row[columnMapping.centroTrabajoId]);

      if (!cargoId || !centroTrabajoId) {
        omitidosCount++;
        continue;
      }

      const epsId = await resolverCatalogo(row[columnMapping.epsId], 'EPS');
      const fondoPensionId = await resolverCatalogo(row[columnMapping.fondoPensionId], 'FONDO_PENSION');
      const rhId = await resolverCatalogo(row[columnMapping.rhId], 'RH');
      const generoId = await resolverCatalogo(row[columnMapping.generoId], 'GENERO');
      const orientacionSexualId = await resolverCatalogo(row[columnMapping.orientacionSexualId], 'ORIENTACION_SEXUAL');
      const religionId = await resolverCatalogo(row[columnMapping.religionId], 'RELIGION');
      const razaId = await resolverCatalogo(row[columnMapping.razaId], 'RAZA');

      // Crear nuevo asociado
      const nuevo = await prisma.asociado.create({
        data: {
          numeroCarpetaActual: row[columnMapping.numeroCarpetaActual] ? parseInt(row[columnMapping.numeroCarpetaActual]) : null,
          acta: row[columnMapping.acta] ? String(row[columnMapping.acta]).trim() : null,
          tipoDocumento: row[columnMapping.tipoDocumento] ? String(row[columnMapping.tipoDocumento]).trim() : 'CC',
          numeroIdentificacion: numIdentificacion,
          primerApellido: String(row[columnMapping.primerApellido]).trim(),
          segundoApellido: row[columnMapping.segundoApellido] ? String(row[columnMapping.segundoApellido]).trim() : null,
          primerNombre: String(row[columnMapping.primerNombre]).trim(),
          segundoNombre: row[columnMapping.segundoNombre] ? String(row[columnMapping.segundoNombre]).trim() : null,
          fechaNacimiento: parseExcelDate(row[columnMapping.fechaNacimiento]),
          fechaExpedicionCedula: parseExcelDate(row[columnMapping.fechaExpedicionCedula]),
          correoElectronico: row[columnMapping.correoElectronico] ? String(row[columnMapping.correoElectronico]).trim() : null,
          direccion: row[columnMapping.direccion] ? String(row[columnMapping.direccion]).trim() : null,
          telefonoFijo: row[columnMapping.telefonoFijo] ? String(row[columnMapping.telefonoFijo]).trim() : null,
          celular: row[columnMapping.celular] ? String(row[columnMapping.celular]).trim() : '0000000',
          contactoEmergenciaNombre: row[columnMapping.contactoEmergenciaNombre] ? String(row[columnMapping.contactoEmergenciaNombre]).trim() : null,
          contactoEmergenciaParentesco: row[columnMapping.contactoEmergenciaParentesco] ? String(row[columnMapping.contactoEmergenciaParentesco]).trim() : null,
          contactoEmergenciaTelefono: row[columnMapping.contactoEmergenciaTelefono] ? String(row[columnMapping.contactoEmergenciaTelefono]).trim() : null,
          fechaIngreso: parseExcelDate(row[columnMapping.fechaIngreso]),
          psicofisicoVigente: row[columnMapping.psicofisicoVigente] === 'SI' || row[columnMapping.psicofisicoVigente] === true,
          psicosensometricoVigente: row[columnMapping.psicosensometricoVigente] === 'SI' || row[columnMapping.psicosensometricoVigente] === true,
          compensacionOrdinaria: row[columnMapping.compensacionOrdinaria] ? parseFloat(row[columnMapping.compensacionOrdinaria]) : 0,
          promedioSalarialMensual: row[columnMapping.promedioSalarialMensual] ? parseFloat(row[columnMapping.promedioSalarialMensual]) : 0,
          funeraria: row[columnMapping.funeraria] ? String(row[columnMapping.funeraria]).trim() : null,
          tienePolizaSura: row[columnMapping.tienePolizaSura] === 'SI' || row[columnMapping.tienePolizaSura] === true,
          cuentaBancaria: row[columnMapping.cuentaBancaria] ? String(row[columnMapping.cuentaBancaria]).trim() : null,
          codigoCurso: row[columnMapping.codigoCurso] ? String(row[columnMapping.codigoCurso]).trim() : null,
          sexoAlNacer: row[columnMapping.sexoAlNacer] ? String(row[columnMapping.sexoAlNacer]).trim() : null,
          estadoCivil: row[columnMapping.estadoCivil] ? String(row[columnMapping.estadoCivil]).trim() : null,
          numeroHijos: row[columnMapping.numeroHijos] ? parseInt(row[columnMapping.numeroHijos]) : 0,
          personasACargo: row[columnMapping.personasACargo] ? parseInt(row[columnMapping.personasACargo]) : 0,
          tipoVivienda: row[columnMapping.tipoVivienda] ? String(row[columnMapping.tipoVivienda]).trim() : null,
          estrato: row[columnMapping.estrato] ? parseInt(row[columnMapping.estrato]) : null,
          nivelEstudio: row[columnMapping.nivelEstudio] ? String(row[columnMapping.nivelEstudio]).trim() : null,
          rangoIngresos: row[columnMapping.rangoIngresos] ? String(row[columnMapping.rangoIngresos]).trim() : null,
          medioTransporte: row[columnMapping.medioTransporte] ? String(row[columnMapping.medioTransporte]).trim() : null,
          tiempoTraslado: row[columnMapping.tiempoTraslado] ? String(row[columnMapping.tiempoTraslado]).trim() : null,
          estado: 'ACTIVO',
          cargoId,
          centroTrabajoId,
          epsId,
          fondoPensionId,
          rhId,
          generoId,
          orientacionSexualId,
          religionId,
          razaId
        }
      });

      // Crear historial inicial
      await prisma.historialCargo.create({
        data: {
          asociadoId: nuevo.id,
          cargoId,
          motivoCambio: 'Cargado mediante migración Excel'
        }
      });

      ingresadosCount++;
    }

    // Auditoría
    await registrarAuditoria(usuarioId, 'Asociado', 'SISTEMA_IMPORTACION', 'CREAR_MASIVO', 'Todos', null, `Ingresados: ${ingresadosCount}, Actualizados: ${actualizadosCount}, Reingresos: ${reingresosCount}, Omitidos: ${omitidosCount}`, req.ip);

    res.json({
      mensaje: 'Proceso de importación masiva finalizado',
      ingresadosCount,
      actualizadosCount,
      reingresosCount,
      omitidosCount
    });
  } catch (error) {
    console.error('Error al confirmar importación masiva:', error);
    res.status(500).json({ mensaje: 'Error al importar registros: ' + error.message });
  }
};

module.exports = {
  previewExcel,
  analyzeExcelSheet,
  confirmExcelImport
};
