const parseExcelDate = (val) => {
  if (val === undefined || val === null || val === '') return null;

  // Si ya es un objeto Date
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }

  // Si es un número (formato serial de Excel)
  if (typeof val === 'number') {
    // Excel guarda fechas desde 01-01-1900. 25569 es la diferencia en días hasta 01-01-1970 (Unix epoch).
    const date = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Si es un String
  if (typeof val === 'string') {
    const cleaned = val.trim();
    if (cleaned === '' || cleaned.includes('#VALUE!') || cleaned.includes('#VALOR!')) {
      return null;
    }

    // Limpieza de formato tipográfico común (ej. 15/010/1993 -> 15/10/1993)
    let sanitized = cleaned.replace(/\/0+(\d+)\//g, '/$1/'); // Reemplaza /010/ con /10/
    sanitized = sanitized.replace(/-0+(\d+)-/g, '-$1-');

    // Intentar parsed común YYYY-MM-DD o DD/MM/YYYY
    let parts = sanitized.split(/[\/\-]/);
    if (parts.length === 3) {
      let day, month, year;
      // Determinar si es DD/MM/YYYY o YYYY/MM/DD
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
      } else {
        // DD/MM/YYYY
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        year = parseInt(parts[2]);
      }

      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && year < 2100) {
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }

    const testDate = new Date(sanitized);
    if (!isNaN(testDate.getTime())) {
      return testDate;
    }
  }

  return null;
};

module.exports = { parseExcelDate };
