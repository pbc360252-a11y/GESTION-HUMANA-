const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

const excelRetirosPath = 'c:\\Users\\gdocumental\\Downloads\\FOLEAR CORAZA\\excel_retiros.json';
const DEFAULT_CARGO_ID = '294675db-dff0-44cf-b789-b519b2cfcbc7'; // VIGILANTE
const DEFAULT_CENTRO_ID = 'd99bec60-4b56-4cfe-9dc6-71d49feeee05'; // Sede Administrativa Principal

async function main() {
  console.log('Loading Excel retiros JSON...');
  if (!fs.existsSync(excelRetirosPath)) {
    console.error('File not found:', excelRetirosPath);
    return;
  }
  const excelRetiros = JSON.parse(fs.readFileSync(excelRetirosPath, 'utf8'));
  console.log(`Loaded ${excelRetiros.length} records from Excel.`);

  // Clean and filter unique cédulas from Excel
  const uniqueExcel = new Map();
  excelRetiros.forEach(r => {
    const ced = r.cedula.trim();
    if (!uniqueExcel.has(ced)) {
      uniqueExcel.set(ced, r);
    }
  });
  console.log(`Unique Cédulas in Excel: ${uniqueExcel.size}`);

  // Fetch db cache of catalogs
  console.log('Caching catalogs...');
  const catalogos = await prisma.catalogoValor.findMany();
  const catalogCache = [...catalogos];

  // Fetch db cache of centros de trabajo
  const centrosTrabajo = await prisma.centroTrabajo.findMany();
  const centroMap = new Map();
  centrosTrabajo.forEach(ct => {
    centroMap.set(ct.codigo.trim(), ct.id);
  });

  // Helper function to resolve or create CatalogoValor
  async function getOrCreateCatalog(tipo, valor) {
    if (!valor || valor.toString().trim() === '') {
      if (tipo === 'MOTIVO_RETIRO') {
        const val = catalogCache.find(c => c.tipo === 'MOTIVO_RETIRO' && c.valor.toLowerCase() === 'voluntaria');
        return val ? val.id : 'd064f76d-e906-48f7-86bc-a8f7c9816bf3';
      }
      if (tipo === 'RAZON_RETIRO') {
        const val = catalogCache.find(c => c.tipo === 'RAZON_RETIRO' && c.valor.toLowerCase() === 'otros');
        return val ? val.id : '9931d4e5-f2c4-4b8f-b188-74d8810c937d';
      }
    }

    const normVal = valor.toString().trim();
    let match = catalogCache.find(c => c.tipo === tipo && c.valor.toLowerCase() === normVal.toLowerCase());
    if (!match) {
      console.log(`[CATALOG] Creating new ${tipo}: "${normVal}"`);
      match = await prisma.catalogoValor.create({
        data: { tipo, valor: normVal }
      });
      catalogCache.push(match);
    }
    return match.id;
  }

  // Helper function to clean and map CentroTrabajo code
  function getCentroTrabajoId(codigoExcel) {
    if (!codigoExcel) return DEFAULT_CENTRO_ID;
    let code = codigoExcel.toString().trim();
    if (code.endsWith('.0')) code = code.slice(0, -2);
    if (/^\d$/.test(code)) code = '0' + code;

    if (centroMap.has(code)) {
      return centroMap.get(code);
    }
    // If not found, check if code without leading zero exists
    const codeNoZero = code.startsWith('0') ? code.substring(1) : code;
    if (centroMap.has(codeNoZero)) {
      return centroMap.get(codeNoZero);
    }
    return DEFAULT_CENTRO_ID;
  }

  // Fetch db cache of asociados
  console.log('Querying database for Asociados...');
  const asociados = await prisma.asociado.findMany({
    include: {
      cargo: true,
      retiros: true
    }
  });
  console.log(`Database has ${asociados.length} asociados.`);

  const dbAsocMap = new Map();
  asociados.forEach(a => {
    dbAsocMap.set(a.numeroIdentificacion.trim(), a);
  });

  let correctedDiscrepancies = 0;
  let importedMissing = 0;

  // 1. Solve the 59 discrepancies (Mark ACTIVE as RETIRED and create Retiro record if missing)
  console.log('\n--- 1. SOLVING DISCREPANCIES (ACTIVE -> RETIRED) ---');
  for (const [cedula, info] of uniqueExcel.entries()) {
    if (dbAsocMap.has(cedula)) {
      const dbAsoc = dbAsocMap.get(cedula);
      if (dbAsoc.estado === 'ACTIVO') {
        console.log(`Fixing discrepant associate ${cedula} (${dbAsoc.primerNombre} ${dbAsoc.primerApellido})`);
        
        // Update state to RETIRADO
        await prisma.asociado.update({
          where: { id: dbAsoc.id },
          data: { estado: 'RETIRADO' }
        });

        // Check if there is already a retiro record
        if (dbAsoc.retiros.length === 0) {
          const motivoId = await getOrCreateCatalog('MOTIVO_RETIRO', info.motivo);
          const razonId = await getOrCreateCatalog('RAZON_RETIRO', info.razon);
          const fechaRetiroDate = info.fechaRetiro ? new Date(info.fechaRetiro) : new Date();
          const fechaNacDate = dbAsoc.fechaNacimiento ? new Date(dbAsoc.fechaNacimiento) : new Date('1980-01-01');
          
          let edadAlRetiro = 35.0;
          if (fechaRetiroDate && fechaNacDate) {
            edadAlRetiro = (fechaRetiroDate - fechaNacDate) / (1000 * 60 * 60 * 24 * 365.25);
            if (edadAlRetiro < 18 || edadAlRetiro > 90) edadAlRetiro = 35.0;
          }

          await prisma.retiro.create({
            data: {
              asociadoId: dbAsoc.id,
              ultimoCargo: dbAsoc.cargo ? dbAsoc.cargo.nombre : 'VIGILANTE',
              fechaRetiro: fechaRetiroDate,
              liquidacionEstado: 'OK',
              encuestaAmbienteFisico: 5,
              encuestaInduccion: 5,
              encuestaReinduccion: 5,
              encuestaCapacitacion: 5,
              encuestaMotivacionGrupo: 5,
              encuestaReconocimiento: 5,
              encuestaCompensaciones: 5,
              queMenosLeGustaba: 'N/A',
              volveriaATrabajar: 'N-A',
              edadAlRetiro,
              observaciones: info.observaciones ? info.observaciones.toString() : 'Importado de forma masiva',
              motivoRetiroId: motivoId,
              razonRetiroId: razonId
            }
          });
          console.log(`Created Retiro record for ${cedula}`);
        }
        correctedDiscrepancies++;
      }
    }
  }

  // 2. Load the 2,402 missing retired associates
  console.log('\n--- 2. IMPORTING MISSING RETIRED ASSOCIATES ---');
  
  // Find all missing associates
  const missingAsocs = [];
  for (const [cedula, info] of uniqueExcel.entries()) {
    if (!dbAsocMap.has(cedula)) {
      missingAsocs.push(info);
    }
  }
  console.log(`Found ${missingAsocs.length} missing associates to import.`);

  // Import sequentially to avoid Supabase connection pool exhaustion (max 15 connections)
  for (let i = 0; i < missingAsocs.length; i++) {
    const info = missingAsocs[i];
    if (i % 100 === 0) {
      console.log(`Processing import ${i} of ${missingAsocs.length}...`);
    }

    try {
      // Idempotency check: see if associate exists in database
      const existing = await prisma.asociado.findUnique({
        where: { numeroIdentificacion: info.cedula.toString() }
      });
      if (existing) {
        continue;
      }

      const centroId = getCentroTrabajoId(info.centroTrabajo);
      const motivoId = await getOrCreateCatalog('MOTIVO_RETIRO', info.motivo);
      const razonId = await getOrCreateCatalog('RAZON_RETIRO', info.razon);

      const fechaNacDate = info.fechaNacimiento ? new Date(info.fechaNacimiento) : new Date('1980-01-01');
      const fechaIngDate = info.fechaIngreso ? new Date(info.fechaIngreso) : new Date('2015-01-01');
      const fechaRetDate = info.fechaRetiro ? new Date(info.fechaRetiro) : new Date();

      let edadAlRetiro = 35.0;
      if (fechaRetDate && fechaNacDate) {
        edadAlRetiro = (fechaRetDate - fechaNacDate) / (1000 * 60 * 60 * 24 * 365.25);
        if (edadAlRetiro < 18 || edadAlRetiro > 90) edadAlRetiro = 35.0;
      }

      // Create Asociado record directly as RETIRADO
      const newAsoc = await prisma.asociado.create({
        data: {
          numeroCarpetaActual: info.carpeta ? parseInt(info.carpeta) : null,
          acta: info.acta ? info.acta.toString() : null,
          tipoDocumento: info.tipoDocumento ? info.tipoDocumento.toString() : 'CC',
          numeroIdentificacion: info.cedula ? info.cedula.toString() : '',
          primerApellido: info.primerApellido ? info.primerApellido.toString() : '',
          segundoApellido: info.segundoApellido ? info.segundoApellido.toString() : null,
          primerNombre: info.primerNombre ? info.primerNombre.toString() : '',
          segundoNombre: info.segundoNombre ? info.segundoNombre.toString() : null,
          fechaNacimiento: fechaNacDate,
          correoElectronico: info.correoElectronico ? info.correoElectronico.toString() : null,
          direccion: info.direccion ? info.direccion.toString() : null,
          telefonoFijo: info.telefonoFijo ? info.telefonoFijo.toString() : null,
          celular: info.celular ? info.celular.toString() : '0',
          fechaIngreso: fechaIngDate,
          estado: 'RETIRADO',
          cargoId: DEFAULT_CARGO_ID,
          centroTrabajoId: centroId
        }
      });

      // Create Retiro record
      await prisma.retiro.create({
        data: {
          asociadoId: newAsoc.id,
          ultimoCargo: 'VIGILANTE',
          fechaRetiro: fechaRetDate,
          liquidacionEstado: 'OK',
          encuestaAmbienteFisico: 5,
          encuestaInduccion: 5,
          encuestaReinduccion: 5,
          encuestaCapacitacion: 5,
          encuestaMotivacionGrupo: 5,
          encuestaReconocimiento: 5,
          encuestaCompensaciones: 5,
          queMenosLeGustaba: 'N/A',
          volveriaATrabajar: 'N-A',
          edadAlRetiro,
          observaciones: info.observaciones ? info.observaciones.toString() : 'Importado históricamente desde planilla',
          motivoRetiroId: motivoId,
          razonRetiroId: razonId
        }
      });

      importedMissing++;
    } catch (err) {
      console.error(`Failed to import associate ${info.cedula}:`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log('              COMPLETED RESOLUTION STATUS');
  console.log('======================================================');
  console.log(`Discrepancies corrected (Active -> Retired): ${correctedDiscrepancies}`);
  console.log(`Missing retired associates successfully imported: ${importedMissing}`);
  console.log('======================================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
