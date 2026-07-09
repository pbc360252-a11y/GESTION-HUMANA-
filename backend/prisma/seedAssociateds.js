const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Insertando 5 asociados de prueba en la base de datos...');

  // 1. Obtener los IDs de cargos
  const dbCargos = await prisma.cargo.findMany();
  const getCargoId = (nombre) => dbCargos.find(c => c.nombre === nombre)?.id;

  // 2. Obtener los IDs de centros de trabajo
  const dbCentros = await prisma.centroTrabajo.findMany();
  const getCentroId = (codigo) => dbCentros.find(c => c.codigo === codigo)?.id;

  // 3. Obtener valores de catálogos
  const dbValores = await prisma.catalogoValor.findMany();
  const getCatId = (tipo, valor) => dbValores.find(v => v.tipo === tipo && v.valor === valor)?.id;

  const idVigilante = getCargoId('VIGILANTE');
  const idVigilArma = getCargoId('VIGIL CON ARMA');
  const idSupervisor = getCargoId('SUPERVISOR');
  const idDirGH = getCargoId('DIR GESTION HUMANA');

  const idCentro01 = getCentroId('01');
  const idCentro02 = getCentroId('02');
  const idCentro03 = getCentroId('03');
  const idCentro04 = getCentroId('04');
  const idCentro05 = getCentroId('05');

  const idEpsSura = getCatId('EPS', 'SURA');
  const idEpsSanitas = getCatId('EPS', 'SANITAS EPS');
  const idEpsSaludTotal = getCatId('EPS', 'SALUD TOTAL');
  const idEpsNuevaEps = getCatId('EPS', 'NUEVA EPS');

  const idFondoPorvenir = getCatId('FONDO_PENSION', 'PORVENIR');
  const idFondoColpensiones = getCatId('FONDO_PENSION', 'COLPENSIONES');
  const idFondoProteccion = getCatId('FONDO_PENSION', 'PROTECCION');

  const idRhOPlus = getCatId('RH', 'O+');
  const idRhAPlus = getCatId('RH', 'A+');

  const idGeneroHombre = getCatId('GENERO', 'HOMBRE');
  const idGeneroMujer = getCatId('GENERO', 'MUJER');

  const idRelCatolica = getCatId('RELIGION', 'CATOLICA');
  const idRazaMestizo = getCatId('RAZA', 'MESTIZO');

  const hoy = new Date();

  const asociados = [
    // 1. Juan Carlos Pérez Montoya (Vigilante Activo, Regular)
    {
      numeroCarpetaActual: 101,
      acta: 'ACTA 0101 - 12-05-2023',
      tipoDocumento: 'CC',
      numeroIdentificacion: '1020304050',
      primerApellido: 'Pérez',
      segundoApellido: 'Montoya',
      primerNombre: 'Juan',
      segundoNombre: 'Carlos',
      fechaNacimiento: new Date(hoy.getFullYear() - 32, 4, 15), // Hace 32 años
      fechaExpedicionCedula: new Date(hoy.getFullYear() - 14, 4, 20),
      correoElectronico: 'juan.perez@gmail.com',
      direccion: 'Carrera 45 # 67-89, Medellín',
      celular: '3001234567',
      contactoEmergenciaNombre: 'Patricia Montoya',
      contactoEmergenciaParentesco: 'MADRE',
      contactoEmergenciaTelefono: '3009876543',
      fechaIngreso: new Date(hoy.getFullYear() - 3, 2, 10), // Hace 3 años
      psicofisicoVigente: false, // Vencido
      psicosensometricoVigente: true,
      compensacionOrdinaria: 1400000,
      promedioSalarialMensual: 1600000,
      funeraria: 'Los Olivos',
      tienePolizaSura: true,
      cuentaBancaria: 'Ahorros Bancolombia 123-456789-01',
      codigoCurso: 'CURSO-VIG-2025',
      nitEscuela: '800.123.456-7',
      numeroCertificadoCurso: 'CERT-998877',
      sexoAlNacer: 'MASCULINO',
      estadoCivil: 'SOLTERO',
      numeroHijos: 1,
      personasACargo: 1,
      tipoVivienda: 'ARRENDADA',
      estrato: 2,
      nivelEstudio: 'BACHILLER',
      rangoIngresos: 'ENTRE 1 Y 2 SMLV',
      planDeVida: 'Comprar vivienda propia y estudiar tecnología',
      medioTransporte: 'MOTO',
      tiempoTraslado: 'DE 10 A 30 MINUTOS',
      estado: 'ACTIVO',
      cargoId: idVigilante,
      centroTrabajoId: idCentro02,
      epsId: idEpsSura,
      fondoPensionId: idFondoPorvenir,
      rhId: idRhOPlus,
      generoId: idGeneroHombre,
      orientacionSexualId: getCatId('ORIENTACION_SEXUAL', 'HETEROSEXUAL'),
      religionId: idRelCatolica,
      razaId: idRazaMestizo
    },
    // 2. María Camila Restrepo Díaz (Supervisor Activo, Regular)
    {
      numeroCarpetaActual: 102,
      acta: 'ACTA 0102 - 18-09-2024',
      tipoDocumento: 'CC',
      numeroIdentificacion: '1030405060',
      primerApellido: 'Restrepo',
      segundoApellido: 'Díaz',
      primerNombre: 'María',
      segundoNombre: 'Camila',
      fechaNacimiento: new Date(hoy.getFullYear() - 28, 8, 25), // Hace 28 años
      fechaExpedicionCedula: new Date(hoy.getFullYear() - 10, 9, 5),
      correoElectronico: 'camila.restrepo@outlook.com',
      direccion: 'Calle 10 # 25-30, Medellín',
      celular: '3124567890',
      contactoEmergenciaNombre: 'Carlos Restrepo',
      contactoEmergenciaParentesco: 'PADRE',
      contactoEmergenciaTelefono: '3157894561',
      fechaIngreso: new Date(hoy.getFullYear() - 1, 8, 18), // Hace 1 año
      psicofisicoVigente: true,
      psicosensometricoVigente: true,
      compensacionOrdinaria: 1800000,
      promedioSalarialMensual: 2100000,
      funeraria: 'La Ofrenda',
      tienePolizaSura: false,
      cuentaBancaria: 'Ahorros Davivienda 456-789012-34',
      codigoCurso: 'CURSO-SUP-2025',
      nitEscuela: '900.789.012-3',
      numeroCertificadoCurso: 'CERT-665544',
      sexoAlNacer: 'FEMENINO',
      estadoCivil: 'UNION_LIBRE',
      numeroHijos: 0,
      personasACargo: 0,
      tipoVivienda: 'PROPIA',
      estrato: 3,
      nivelEstudio: 'TECNOLOGO',
      rangoIngresos: 'ENTRE 1 Y 2 SMLV',
      planDeVida: 'Ascender a coordinadora operativa',
      medioTransporte: 'CARRO',
      tiempoTraslado: 'DE 30 MIN A 1 HORA',
      estado: 'ACTIVO',
      cargoId: idSupervisor,
      centroTrabajoId: idCentro03,
      epsId: idEpsSanitas,
      fondoPensionId: idFondoColpensiones,
      rhId: idRhAPlus,
      generoId: idGeneroMujer,
      orientacionSexualId: getCatId('ORIENTACION_SEXUAL', 'HETEROSEXUAL'),
      religionId: idRelCatolica,
      razaId: idRazaMestizo
    },
    // 3. Andrés Felipe Alzate Gómez (Vigilante Con Arma, Cargo Crítico - Vencimientos en alerta)
    {
      numeroCarpetaActual: 103,
      acta: 'ACTA 0103 - 05-02-2022',
      tipoDocumento: 'CC',
      numeroIdentificacion: '1040506070',
      primerApellido: 'Alzate',
      segundoApellido: 'Gómez',
      primerNombre: 'Andrés',
      segundoNombre: 'Felipe',
      fechaNacimiento: new Date(hoy.getFullYear() - 38, 1, 5), // Hace 38 años
      fechaExpedicionCedula: new Date(hoy.getFullYear() - 20, 1, 15),
      correoElectronico: 'andres.felipe@gmail.com',
      direccion: 'Transversal 39b # 12-45, Medellín',
      celular: '3157891234',
      contactoEmergenciaNombre: 'Sandra Gómez',
      contactoEmergenciaParentesco: 'ESPOSA',
      contactoEmergenciaTelefono: '3161234567',
      fechaIngreso: new Date(hoy.getFullYear() - 4, 1, 5), // Hace 4 años
      psicofisicoVigente: true,
      psicosensometricoVigente: true,
      compensacionOrdinaria: 1600000,
      promedioSalarialMensual: 1900000,
      funeraria: 'Los Olivos',
      tienePolizaSura: true,
      cuentaBancaria: 'Ahorros BBVA 987-654321-12',
      codigoCurso: 'CURSO-ARMA-2025',
      nitEscuela: '800.123.456-7',
      numeroCertificadoCurso: 'CERT-112233',
      sexoAlNacer: 'MASCULINO',
      estadoCivil: 'CASADO',
      numeroHijos: 2,
      personasACargo: 3,
      tipoVivienda: 'ARRENDADA',
      estrato: 2,
      nivelEstudio: 'BACHILLER',
      rangoIngresos: 'ENTRE 1 Y 2 SMLV',
      planDeVida: 'Comprar apartamento en el sur',
      medioTransporte: 'MOTO',
      tiempoTraslado: 'DE 10 A 30 MINUTOS',
      estado: 'ACTIVO',
      cargoId: idVigilArma,
      centroTrabajoId: idCentro04,
      epsId: idEpsSaludTotal,
      fondoPensionId: idFondoProteccion,
      rhId: idRhOPlus,
      generoId: idGeneroHombre,
      orientacionSexualId: getCatId('ORIENTACION_SEXUAL', 'HETEROSEXUAL'),
      religionId: idRelCatolica,
      razaId: idRazaMestizo
    },
    // 4. Diana Patricia Henao Uribe (Directora Gestión Humana - Administrativo)
    {
      numeroCarpetaActual: 104,
      acta: 'ACTA 0104 - 01-11-2019',
      tipoDocumento: 'CC',
      numeroIdentificacion: '1050607080',
      primerApellido: 'Henao',
      segundoApellido: 'Uribe',
      primerNombre: 'Diana',
      segundoNombre: 'Patricia',
      fechaNacimiento: new Date(hoy.getFullYear() - 42, 10, 1), // Hace 42 años
      fechaExpedicionCedula: new Date(hoy.getFullYear() - 24, 10, 15),
      correoElectronico: 'gestionhumana@corazaseguridad.com',
      direccion: 'Circular 4 # 70-12, Laureles',
      celular: '3014567890',
      contactoEmergenciaNombre: 'Carlos Henao',
      contactoEmergenciaParentesco: 'HERMANO',
      contactoEmergenciaTelefono: '3024567891',
      fechaIngreso: new Date(hoy.getFullYear() - 6, 10, 1), // Hace 6 años
      psicofisicoVigente: true,
      psicosensometricoVigente: true,
      compensacionOrdinaria: 3500000,
      promedioSalarialMensual: 3500000,
      funeraria: 'Jardines de la Fe',
      tienePolizaSura: true,
      cuentaBancaria: 'Corriente Bancolombia 321-654987-99',
      codigoCurso: null,
      nitEscuela: null,
      numeroCertificadoCurso: null,
      sexoAlNacer: 'FEMENINO',
      estadoCivil: 'CASADO',
      numeroHijos: 1,
      personasACargo: 1,
      tipoVivienda: 'PROPIA',
      estrato: 4,
      nivelEstudio: 'PROFESIONAL',
      rangoIngresos: 'MAS DE 5 SMLV',
      planDeVida: 'Especializarse en gerencia estratégica y viajar al exterior',
      medioTransporte: 'CARRO',
      tiempoTraslado: 'DE 10 A 30 MINUTOS',
      estado: 'ACTIVO',
      cargoId: idDirGH,
      centroTrabajoId: idCentro01,
      epsId: idEpsSura,
      fondoPensionId: idFondoPorvenir,
      rhId: idRhAPlus,
      generoId: idGeneroMujer,
      orientacionSexualId: getCatId('ORIENTACION_SEXUAL', 'HETEROSEXUAL'),
      religionId: idRelCatolica,
      razaId: idRazaMestizo
    },
    // 5. Carlos Mario Bedoya Ruiz (Vigilante Retirado hace 3 meses con Encuesta)
    {
      numeroCarpetaActual: 105,
      acta: 'ACTA 0105 - 15-06-2021',
      tipoDocumento: 'CC',
      numeroIdentificacion: '1060708090',
      primerApellido: 'Bedoya',
      segundoApellido: 'Ruiz',
      primerNombre: 'Carlos',
      segundoNombre: 'Mario',
      fechaNacimiento: new Date(hoy.getFullYear() - 35, 2, 10), // Hace 35 años
      fechaExpedicionCedula: new Date(hoy.getFullYear() - 17, 2, 20),
      correoElectronico: 'carlos.mario@hotmail.com',
      direccion: 'Calle 80 # 45a-12, Bello',
      celular: '3206549871',
      contactoEmergenciaNombre: 'Gladys Ruiz',
      contactoEmergenciaParentesco: 'MADRE',
      contactoEmergenciaTelefono: '3219874563',
      fechaIngreso: new Date(hoy.getFullYear() - 5, 5, 15), // Hace 5 años
      psicofisicoVigente: false,
      psicosensometricoVigente: false,
      compensacionOrdinaria: 1400000,
      promedioSalarialMensual: 1550000,
      funeraria: 'Los Olivos',
      tienePolizaSura: false,
      cuentaBancaria: 'Ahorros Bancolombia 789-123456-55',
      codigoCurso: 'CURSO-VIG-2023',
      nitEscuela: '800.123.456-7',
      numeroCertificadoCurso: 'CERT-443322',
      sexoAlNacer: 'MASCULINO',
      estadoCivil: 'DIVORCIADO',
      numeroHijos: 2,
      personasACargo: 2,
      tipoVivienda: 'ARRENDADA',
      estrato: 2,
      nivelEstudio: 'BACHILLER',
      rangoIngresos: 'ENTRE 1 Y 2 SMLV',
      planDeVida: 'Montar negocio de comidas rápidas',
      medioTransporte: 'MOTO',
      tiempoTraslado: 'DE 30 MIN A 1 HORA',
      estado: 'RETIRADO',
      cargoId: idVigilante,
      centroTrabajoId: idCentro05,
      epsId: idEpsNuevaEps,
      fondoPensionId: idFondoColpensiones,
      rhId: idRhOPlus,
      generoId: idGeneroHombre,
      orientacionSexualId: getCatId('ORIENTACION_SEXUAL', 'HETEROSEXUAL'),
      religionId: idRelCatolica,
      razaId: idRazaMestizo
    }
  ];

  // Insertar Asociados
  for (const asoc of asociados) {
    const createdAsoc = await prisma.asociado.upsert({
      where: { numeroIdentificacion: asoc.numeroIdentificacion },
      update: {},
      create: asoc
    });
    console.log(`Asociado ${createdAsoc.primerNombre} ${createdAsoc.primerApellido} creado.`);

    // Crear historial inicial de cargos
    await prisma.historialCargo.create({
      data: {
        asociadoId: createdAsoc.id,
        cargoId: asoc.cargoId,
        motivoCambio: 'Ingreso inicial sembrado de prueba'
      }
    });

    // Cargar documentos iniciales de prueba para validar vencimientos
    if (asoc.numeroIdentificacion === '1020304050') {
      // Examen psicofísico vencido (hace 10 días) para alertar
      await prisma.documentoAsociado.create({
        data: {
          asociadoId: createdAsoc.id,
          tipoDocumento: 'EXAMEN_PSICOFISICO',
          archivoUrl: '/uploads/examen_psicofisico_vencido.pdf',
          fechaVencimiento: new Date(hoy.getTime() - 10 * 24 * 60 * 60 * 1000), // Hace 10 días
          cargadoPorId: (await prisma.usuario.findFirst()).id
        }
      });
    }

    if (asoc.numeroIdentificacion === '1040506070') {
      // Examen psicosensométrico por vencer en 5 días
      await prisma.documentoAsociado.create({
        data: {
          asociadoId: createdAsoc.id,
          tipoDocumento: 'EXAMEN_PSICOSENSOMETRICO',
          archivoUrl: '/uploads/examen_psicosensometrico_alerta.pdf',
          fechaVencimiento: new Date(hoy.getTime() + 5 * 24 * 60 * 60 * 1000), // En 5 días
          cargadoPorId: (await prisma.usuario.findFirst()).id
        }
      });

      // Curso por vencer en 25 días
      await prisma.documentoAsociado.create({
        data: {
          asociadoId: createdAsoc.id,
          tipoDocumento: 'CERTIFICADO_CURSO',
          archivoUrl: '/uploads/curso_reentrenamiento_alerta.pdf',
          fechaVencimiento: new Date(hoy.getTime() + 25 * 24 * 60 * 60 * 1000), // En 25 días
          cargadoPorId: (await prisma.usuario.findFirst()).id
        }
      });
    }

    // Agregar registro de Retiro y Encuesta de salida para el retirado Carlos Bedoya
    if (asoc.estado === 'RETIRADO') {
      const fRetiro = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 15); // Hace 3 meses
      await prisma.retiro.create({
        data: {
          asociadoId: createdAsoc.id,
          ultimoCargo: 'VIGILANTE',
          fechaRetiro: fRetiro,
          liquidacionEstado: 'OK',
          encuestaAmbienteFisico: 4,
          encuestaInduccion: 5,
          encuestaReinduccion: 3,
          encuestaCapacitacion: 4,
          encuestaMotivacionGrupo: 5,
          encuestaReconocimiento: 4,
          encuestaCompensaciones: 2, // Baja calificación de salario
          queMenosLeGustaba: 'El sueldo y los horarios rotativos nocturnos',
          volveriaATrabajar: 'SI',
          edadAlRetiro: 34.7,
          observaciones: 'El asociado se retira de manera voluntaria para iniciar emprendimiento familiar. Liquidado y paz y salvo al día.',
          motivoRetiroId: getCatId('MOTIVO_RETIRO', 'Voluntaria'),
          razonRetiroId: getCatId('RAZON_RETIRO', 'Baja remuneracion')
        }
      });
    }
  }

  // Ejecutar el motor de alertas inmediatamente para poblar las alertas de prueba en el dashboard
  console.log('Ejecutando escaneo inicial de alertas...');
  const { generarAlertasDeVencimiento } = require('../src/controllers/alertaController');
  const alertStats = await generarAlertasDeVencimiento();
  console.log(`Alertas creadas: ${alertStats.alertasCreadasCount}`);

  console.log('Sembrado de asociados de prueba completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
