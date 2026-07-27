const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const excelRetirosPath = 'c:\\Users\\gdocumental\\Downloads\\FOLEAR CORAZA\\excel_retiros.json';

async function main() {
  console.log('Loading Excel retiros JSON...');
  if (!fs.existsSync(excelRetirosPath)) {
    console.error('File not found:', excelRetirosPath);
    return;
  }
  
  const excelRetiros = JSON.parse(fs.readFileSync(excelRetirosPath, 'utf8'));
  console.log(`Loaded ${excelRetiros.length} records from Excel.`);

  console.log('Querying database for Asociados...');
  const asociados = await prisma.asociado.findMany({
    select: {
      numeroIdentificacion: true,
      primerNombre: true,
      primerApellido: true,
      estado: true
    }
  });
  console.log(`Database has ${asociados.length} asociados.`);

  const dbAsocMap = new Map();
  asociados.forEach(a => {
    dbAsocMap.set(a.numeroIdentificacion.trim(), a);
  });

  // Querying database for Retiros
  const dbRetiros = await prisma.retiro.findMany({
    select: {
      asociado: {
        select: {
          numeroIdentificacion: true
        }
      }
    }
  });
  console.log(`Database has ${dbRetiros.length} retiro records.`);
  
  const dbRetirosSet = new Set();
  dbRetiros.forEach(r => {
    if (r.asociado && r.asociado.numeroIdentificacion) {
      dbRetirosSet.add(r.asociado.numeroIdentificacion.trim());
    }
  });

  // Categorize
  let countTotalExcel = excelRetiros.length;
  let countUniqueExcelCedulas = 0;
  
  const uniqueExcelCedulas = new Map();
  excelRetiros.forEach(r => {
    const ced = r.cedula.trim();
    if (!uniqueExcelCedulas.has(ced)) {
      uniqueExcelCedulas.set(ced, r);
    }
  });
  countUniqueExcelCedulas = uniqueExcelCedulas.size;
  console.log(`Unique Cédulas in Excel: ${countUniqueExcelCedulas}`);

  let foundInDbActive = [];
  let foundInDbSuspended = [];
  let foundInDbRetiredWithRetiroRecord = 0;
  let foundInDbRetiredNoRetiroRecord = [];
  let notFoundInDb = [];

  for (const [cedula, info] of uniqueExcelCedulas.entries()) {
    if (dbAsocMap.has(cedula)) {
      const dbAsoc = dbAsocMap.get(cedula);
      if (dbAsoc.estado === 'ACTIVO') {
        foundInDbActive.push({
          cedula,
          nombreExcel: `${info.primerNombre} ${info.primerApellido}`,
          nombreDb: `${dbAsoc.primerNombre} ${dbAsoc.primerApellido}`,
          sheet: info.sheetName
        });
      } else if (dbAsoc.estado === 'SUSPENDIDO') {
        foundInDbSuspended.push({
          cedula,
          nombreExcel: `${info.primerNombre} ${info.primerApellido}`,
          nombreDb: `${dbAsoc.primerNombre} ${dbAsoc.primerApellido}`,
          sheet: info.sheetName
        });
      } else if (dbAsoc.estado === 'RETIRADO') {
        if (dbRetirosSet.has(cedula)) {
          foundInDbRetiredWithRetiroRecord++;
        } else {
          foundInDbRetiredNoRetiroRecord.push({
            cedula,
            nombreExcel: `${info.primerNombre} ${info.primerApellido}`,
            nombreDb: `${dbAsoc.primerNombre} ${dbAsoc.primerApellido}`,
            sheet: info.sheetName
          });
        }
      }
    } else {
      notFoundInDb.push({
        cedula,
        nombre: `${info.primerNombre} ${info.primerApellido}`,
        sheet: info.sheetName
      });
    }
  }

  console.log('\n======================================================');
  console.log('              SUMMARY OF COMPARISON');
  console.log('======================================================');
  console.log(`Total Retiro Records in Excel Sheets:       ${countTotalExcel}`);
  console.log(`Unique Associate Cédulas in Excel Sheets:    ${countUniqueExcelCedulas}`);
  console.log(`- Found in DB as RETIRADO (with Retiro Rec): ${foundInDbRetiredWithRetiroRecord}`);
  console.log(`- Found in DB as RETIRADO (no Retiro Rec):   ${foundInDbRetiredNoRetiroRecord.length}`);
  console.log(`- Found in DB but marked as ACTIVO:          ${foundInDbActive.length}`);
  console.log(`- Found in DB but marked as SUSPENDIDO:      ${foundInDbSuspended.length}`);
  console.log(`- NOT found in DB at all:                    ${notFoundInDb.length}`);
  console.log('======================================================\n');

  // Save detailed discrepancies
  const report = {
    totalExcel: countTotalExcel,
    uniqueExcel: countUniqueExcelCedulas,
    foundActive: foundInDbActive,
    foundSuspended: foundInDbSuspended,
    foundRetiredNoRecord: foundInDbRetiredNoRetiroRecord,
    notFound: notFoundInDb
  };
  fs.writeFileSync('C:\\Users\\gdocumental\\Downloads\\FOLEAR CORAZA\\comparacion_reporte.json', JSON.stringify(report, null, 2), 'utf8');
  console.log('Detailed report saved to: C:\\Users\\gdocumental\\Downloads\\FOLEAR CORAZA\\comparacion_reporte.json');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
