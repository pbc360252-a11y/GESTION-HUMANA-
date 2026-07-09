const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el sembrado de la base de datos...');

  // 1. Crear Usuario Administrador por defecto
  const passwordHash = bcrypt.hashSync('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@coraza.com' },
    update: {},
    create: {
      nombre: 'Administrador Coraza',
      correo: 'admin@coraza.com',
      hashPassword: passwordHash,
      rol: 'ADMIN',
      activo: true,
    },
  });
  console.log('Usuario administrador creado/verificado:', admin.correo);

  // Crear otros usuarios de prueba para roles específicos
  const usuariosPrueba = [
    { nombre: 'Gestión Humana User', correo: 'gh@coraza.com', rol: 'GESTION_HUMANA' },
    { nombre: 'SST User', correo: 'sst@coraza.com', rol: 'SST' },
    { nombre: 'Coordinador Operativo User', correo: 'coordinador@coraza.com', rol: 'COORDINADOR_OPERATIVO' },
    { nombre: 'Consulta User', correo: 'consulta@coraza.com', rol: 'CONSULTA' },
  ];

  for (const user of usuariosPrueba) {
    await prisma.usuario.upsert({
      where: { correo: user.correo },
      update: {},
      create: {
        nombre: user.nombre,
        correo: user.correo,
        hashPassword: passwordHash,
        rol: user.rol,
        activo: true,
      },
    });
  }
  console.log('Usuarios de prueba creados.');

  // 2. Crear Centros de Trabajo iniciales
  const centrosTrabajo = [
    { codigo: '01', nombreCliente: 'Sede Administrativa Principal', direccion: 'Calle 45 # 12-34, Bogotá', zona: 'Centro' },
    { codigo: '02', nombreCliente: 'Puesto Zona Norte - Almacenes Éxito', direccion: 'Autopista Norte # 170-50', zona: 'Norte' },
    { codigo: '03', nombreCliente: 'Puesto Zona Sur - Centro Mayor', direccion: 'Calle 38 Sur # 34-60', zona: 'Sur' },
    { codigo: '04', nombreCliente: 'Puesto Vigilancia Tecnológica - Edificio Coraza', direccion: 'Av. El Dorado # 68b-85', zona: 'Occidente' },
    { codigo: '05', nombreCliente: 'Supervisión Móvil Bogotá', direccion: 'Bogotá D.C.', zona: 'General' },
  ];

  for (const centro of centrosTrabajo) {
    await prisma.centroTrabajo.upsert({
      where: { codigo: centro.codigo },
      update: {},
      create: centro,
    });
  }
  console.log('Centros de trabajo creados.');

  // 3. Crear Cargos (Críticos y No Críticos)
  const cargos = [
    // Críticos (reentrenamiento/exámenes cada 1 año)
    { nombre: 'GERENTE', esCritico: true, frecuenciaActualizacionAnios: 1 },
    { nombre: 'TESORERO', esCritico: true, frecuenciaActualizacionAnios: 1 },
    { nombre: 'DIR GESTION HUMANA', esCritico: true, frecuenciaActualizacionAnios: 1 },
    { nombre: 'DIR OPERATIVO', esCritico: true, frecuenciaActualizacionAnios: 1 },
    { nombre: 'DIR COMERCIAL', esCritico: true, frecuenciaActualizacionAnios: 1 },
    { nombre: 'COORDINADOR OPERATIVO', esCritico: true, frecuenciaActualizacionAnios: 1 },
    { nombre: 'ESCOLTA', esCritico: true, frecuenciaActualizacionAnios: 1 },
    { nombre: 'VIGIL CON ARMA', esCritico: true, frecuenciaActualizacionAnios: 1 },
    { nombre: 'PROGRAMADOR', esCritico: true, frecuenciaActualizacionAnios: 1 },
    { nombre: 'RESPONSABLE SST', esCritico: true, frecuenciaActualizacionAnios: 1 },
    // No Críticos (reentrenamiento/exámenes cada 2 años)
    { nombre: 'VIGILANTE', esCritico: false, frecuenciaActualizacionAnios: 2 },
    { nombre: 'SUPERVISOR', esCritico: false, frecuenciaActualizacionAnios: 2 },
    { nombre: 'RECEPCIONISTA', esCritico: false, frecuenciaActualizacionAnios: 2 },
    { nombre: 'AUX CONTABLE', esCritico: false, frecuenciaActualizacionAnios: 2 },
    { nombre: 'SERVICIOS GENERALES', esCritico: false, frecuenciaActualizacionAnios: 2 },
    { nombre: 'ASISTENTE TALENTO HUMANO', esCritico: false, frecuenciaActualizacionAnios: 2 },
    { nombre: 'AUXILIAR ADMINISTRATIVO', esCritico: false, frecuenciaActualizacionAnios: 2 },
    { nombre: 'OPERADOR DE MEDIO TECNOLOGICO', esCritico: false, frecuenciaActualizacionAnios: 2 },
  ];

  for (const cargo of cargos) {
    await prisma.cargo.upsert({
      where: { nombre: cargo.nombre },
      update: {
        esCritico: cargo.esCritico,
        frecuenciaActualizacionAnios: cargo.frecuenciaActualizacionAnios,
      },
      create: cargo,
    });
  }
  console.log('Cargos creados.');

  // 4. Catálogos Maestros (CatalogoValor)
  const catalogos = {
    EPS: [
      'SURA', 'COOSALUD', 'NUEVA EPS', 'FOSYGA', 'SALUD TOTAL', 
      'SANITAS EPS', 'SAVIA SALUD', 'CAJACOPI', 'MUTUAL SER', 
      'FAMISANAR', 'ASMET SALUD', 'EPS FAMILIAR DE COLOMBIA SAS'
    ],
    FONDO_PENSION: [
      'COLPENSIONES', 'PROTECCION', 'PORVENIR', 'COLFONDOS', 
      'HORIZONTE', 'PENSIONADO', 'ING PENSIONES Y CESANTIAS'
    ],
    RH: ['A+', 'A-', 'O+', 'O-', 'B+', 'B-', 'AB+', 'AB-'],
    GENERO: ['HOMBRE', 'MUJER', 'NO BINARIO', 'TRANSGENERO', 'PREFIERO NO DECIR'],
    ORIENTACION_SEXUAL: ['HETEROSEXUAL', 'HOMOSEXUAL', 'BISEXUAL', 'ASEXUAL', 'OTRO', 'PREFIERO NO DECIR'],
    RELIGION: ['CATOLICA', 'PROTESTANTE', 'JUDIA', 'MUSULMANA', 'OTRO', 'PREFIERO NO DECIR'],
    RAZA: ['MESTIZO', 'AFROCOLOMBIANO', 'INDIGENA', 'ROM', 'PALENQUERO', 'RAIZAL'],
    MOTIVO_RETIRO: [
      'Voluntaria', 'Exclusion', 'Fallecimiento', 'Pension', 
      'Demasiada presion o estres', 'Ambiente fisico de trabajo', 
      'Incumplimiento de lo ofrecido', 'Problemas con jefe directo', 
      'Falta de oportunidad', 'Falta de motivacion de grupo', 
      'Horario de trabajo', 'Falta de acompanamiento inicial', 
      'Relaciones laborales', 'Mejoras laborales', 'Necesidad economica'
    ],
    RAZON_RETIRO: [
      'Baja remuneracion', 'Problemas personales', 'Enfermedad', 
      'Falta de reconocimiento', 'Cumplimiento programacion', 
      'Incumplimiento programacion', 'Ubicacion puesto de trabajo', 
      'Induccion/Capacitacion', 'Trato diferente o discriminacion', 
      'Falta de induccion/capacitacion', 'Otros'
    ],
    MEDIO_TRANSPORTE: ['BICICLETA', 'SERVICIO PUBLICO', 'MOTO', 'CARRO', 'A PIE', 'OTRO'],
    TIEMPO_TRASLADO: [
      'MENOS DE 10 MINUTOS', 'DE 10 A 30 MINUTOS', 
      'DE 30 MIN A 1 HORA', 'ENTRE 1 Y 2 HORAS', 'MAS DE 2 HORAS'
    ],
    TIPO_VIVIENDA: ['PROPIA', 'ARRENDADA', 'FAMILIAR', 'COMPARTIDA'],
    NIVEL_ESTUDIO: ['BACHILLER', 'TECNICO', 'TECNOLOGO', 'PROFESIONAL'],
    RANGO_INGRESOS: ['MENOS DE 1 SMLV', 'ENTRE 1 Y 2 SMLV', 'ENTRE 2 Y 4 SMLV', 'MAS DE 5 SMLV']
  };

  for (const [tipo, valores] of Object.entries(catalogos)) {
    for (const valor of valores) {
      await prisma.catalogoValor.upsert({
        where: {
          tipo_valor: {
            tipo: tipo,
            valor: valor
          }
        },
        update: {},
        create: {
          tipo: tipo,
          valor: valor,
          activo: true,
        }
      });
    }
  }
  console.log('Catálogos maestros creados.');

  console.log('Sembrado completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error al sembrar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
