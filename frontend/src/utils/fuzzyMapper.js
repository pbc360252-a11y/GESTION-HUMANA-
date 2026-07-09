export const autoMap = (field, headers) => {
  const fClean = field.toLowerCase().replace(/id|actual|empresa|cedula|nombre|apellido|fecha/g, '').trim();
  const lowerField = field.toLowerCase();

  // Coincidencias directas
  for (const h of headers) {
    const hLower = h.toLowerCase().replace(/[\s_\.\-\/]/g, '');
    if (hLower === lowerField.toLowerCase()) return h;
  }

  // Coincidencias parciales inteligentes
  for (const h of headers) {
    const hLower = h.toLowerCase();
    
    if (field === 'numeroIdentificacion' && (hLower.includes('cedula') || hLower.includes('identificacion') || hLower.includes('documento') || hLower === 'c.c' || hLower === 'cc')) return h;
    if (field === 'primerNombre' && hLower.includes('primer nombre')) return h;
    if (field === 'segundoNombre' && hLower.includes('segundo nombre')) return h;
    if (field === 'primerApellido' && (hLower.includes('primer apellido') || (hLower.includes('apellido') && !hLower.includes('segundo')))) return h;
    if (field === 'segundoApellido' && hLower.includes('segundo apellido')) return h;
    if (field === 'fechaNacimiento' && (hLower.includes('nacimiento') || hLower.includes('fecha nac'))) return h;
    if (field === 'fechaIngreso' && (hLower.includes('ingreso') || hLower.includes('fecha ing'))) return h;
    if (field === 'cargoId' && (hLower === 'cargo' || hLower.includes('cargo actual') || hLower.includes('puesto'))) return h;
    if (field === 'centroTrabajoId' && (hLower.includes('centro') || hLower.includes('zona') || hLower === 'cliente' || hLower.includes('lugar'))) return h;
    if (field === 'epsId' && hLower === 'eps') return h;
    if (field === 'fondoPensionId' && (hLower.includes('fondo') || hLower.includes('pension') || hLower === 'afp')) return h;
    if (field === 'celular' && (hLower.includes('celular') || hLower.includes('telefono') || hLower === 'tel')) return h;
  }

  return "";
};
