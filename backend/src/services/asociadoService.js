const calcularDiferenciaAnios = (fechaInicio, fechaFin) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return 0;
  }
  
  const diffTime = fin.getTime() - inicio.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.2425);
  return parseFloat(Math.max(0, diffYears).toFixed(1));
};

const calcularCamposDerivados = (asociado, fechaRetiro = null) => {
  const hoy = new Date();
  
  const edadIngreso = calcularDiferenciaAnios(asociado.fechaNacimiento, asociado.fechaIngreso);
  const edadActual = calcularDiferenciaAnios(asociado.fechaNacimiento, hoy);
  
  const finAntiguedad = asociado.estado === 'RETIRADO' || fechaRetiro 
    ? (fechaRetiro || (asociado.retiros && asociado.retiros[0] ? asociado.retiros[0].fechaRetiro : hoy))
    : hoy;
    
  const antiguedadEmpresaAnios = calcularDiferenciaAnios(asociado.fechaIngreso, finAntiguedad);

  return {
    edadIngreso,
    edadActual,
    antiguedadEmpresaAnios,
  };
};

module.exports = {
  calcularDiferenciaAnios,
  calcularCamposDerivados
};
