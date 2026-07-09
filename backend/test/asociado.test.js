const test = require('node:test');
const assert = require('node:assert');
const { calcularDiferenciaAnios, calcularCamposDerivados } = require('../src/services/asociadoService');

test('Cálculo de diferencia de años', () => {
  // Test 1: Diferencia simple
  const fecha1 = '1990-01-01';
  const fecha2 = '2000-01-01';
  const diff = calcularDiferenciaAnios(fecha1, fecha2);
  assert.strictEqual(diff, 10.0);

  // Test 2: Fechas inválidas devuelven 0
  assert.strictEqual(calcularDiferenciaAnios('fecha-invalida', '2000-01-01'), 0);
  assert.strictEqual(calcularDiferenciaAnios('1990-01-01', 'fecha-invalida'), 0);

  // Test 3: Fecha fin anterior a fecha inicio devuelve 0
  assert.strictEqual(calcularDiferenciaAnios('2000-01-01', '1990-01-01'), 0);
});

test('Cálculo de campos derivados del Asociado (ACTIVO)', () => {
  const hoy = new Date();
  // Crear un asociado de prueba nacido hace exactamente 30 años, ingresado hace 5 años
  const fechaNacimiento = new Date(hoy.getFullYear() - 30, hoy.getMonth(), hoy.getDate());
  const fechaIngreso = new Date(hoy.getFullYear() - 5, hoy.getMonth(), hoy.getDate());

  const asociado = {
    fechaNacimiento,
    fechaIngreso,
    estado: 'ACTIVO'
  };

  const derivados = calcularCamposDerivados(asociado);
  
  assert.strictEqual(derivados.edadIngreso, 25.0);
  assert.strictEqual(derivados.edadActual, 30.0);
  assert.strictEqual(derivados.antiguedadEmpresaAnios, 5.0);
});

test('Cálculo de campos derivados con antigüedad congelada (RETIRADO)', () => {
  const hoy = new Date();
  
  // Asociado de prueba nacido hace 40 años
  const fechaNacimiento = new Date(hoy.getFullYear() - 40, hoy.getMonth(), hoy.getDate());
  // Ingresó hace 10 años
  const fechaIngreso = new Date(hoy.getFullYear() - 10, hoy.getMonth(), hoy.getDate());
  // Se retiró hace 3 años (antigüedad de 7 años)
  const fechaRetiro = new Date(hoy.getFullYear() - 3, hoy.getMonth(), hoy.getDate());

  const asociado = {
    fechaNacimiento,
    fechaIngreso,
    estado: 'RETIRADO',
    retiros: [{ fechaRetiro }]
  };

  const derivados = calcularCamposDerivados(asociado);

  assert.strictEqual(derivados.edadIngreso, 30.0);
  assert.strictEqual(derivados.edadActual, 40.0);
  // La antigüedad debe estar congelada en 7 años, no 10 años.
  assert.strictEqual(derivados.antiguedadEmpresaAnios, 7.0);
});
