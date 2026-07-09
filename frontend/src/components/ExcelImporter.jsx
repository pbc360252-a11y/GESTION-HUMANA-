import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { API_URL } from '../App';
import { autoMap } from '../utils/fuzzyMapper';

export default function ExcelImporter({ token, user, navigateTo }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Paso 1: Datos de subida
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState({});
  const [selectedSheet, setSelectedSheet] = useState('');

  // Paso 2: Datos de cabeceras y mapeo
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});

  // Paso 3: Resultados de análisis y mapeo de valores
  const [analysis, setAnalysis] = useState(null);
  const [dbCargos, setDbCargos] = useState([]);
  const [dbCentros, setDbCentros] = useState([]);
  const [dbEPS, setDbEPS] = useState([]);
  const [dbFondo, setDbFondo] = useState([]);
  const [dbRH, setDbRH] = useState([]);
  const [dbGenero, setDbGenero] = useState([]);
  
  // Mapeos de valores de texto libre -> valores oficiales de la BD
  const [valueMappings, setValueMappings] = useState({
    cargo: {},
    centroTrabajo: {},
    eps: {},
    fondoPension: {},
    rh: {},
    genero: {}
  });

  const [importMode, setImportMode] = useState('IGNORE_DUPLICATES');
  
  // Paso 4: Resultados de importación
  const [importResults, setImportResults] = useState(null);

  // Campos del sistema que requieren mapeo
  const camposSistema = [
    { key: 'numeroIdentificacion', label: 'Cédula / Identificación *', required: true },
    { key: 'primerNombre', label: 'Primer Nombre *', required: true },
    { key: 'segundoNombre', label: 'Segundo Nombre', required: false },
    { key: 'primerApellido', label: 'Primer Apellido *', required: true },
    { key: 'segundoApellido', label: 'Segundo Apellido', required: false },
    { key: 'fechaNacimiento', label: 'Fecha Nacimiento *', required: true },
    { key: 'fechaIngreso', label: 'Fecha Ingreso *', required: true },
    { key: 'cargoId', label: 'Cargo *', required: true },
    { key: 'centroTrabajoId', label: 'Centro de Trabajo *', required: true },
    { key: 'numeroCarpetaActual', label: 'Número de Carpeta', required: false },
    { key: 'acta', label: 'Acta de Ingreso', required: false },
    { key: 'celular', label: 'Celular', required: false },
    { key: 'correoElectronico', label: 'Correo Electrónico', required: false },
    { key: 'epsId', label: 'EPS', required: false },
    { key: 'fondoPensionId', label: 'Fondo de Pensión', required: false },
    { key: 'rhId', label: 'Tipo RH', required: false },
    { key: 'generoId', label: 'Género', required: false },
  ];

  // Cargar catálogos oficiales para mapeos de valores en el paso 3
  useEffect(() => {
    if (step === 3) {
      const headersAuth = { Authorization: `Bearer ${token}` };
      Promise.all([
        fetch(`${API_URL}/catalogos/cargos`, { headers: headersAuth }).then(r => r.json()),
        fetch(`${API_URL}/catalogos/centros`, { headers: headersAuth }).then(r => r.json()),
        fetch(`${API_URL}/catalogos/valores/EPS`, { headers: headersAuth }).then(r => r.json()),
        fetch(`${API_URL}/catalogos/valores/FONDO_PENSION`, { headers: headersAuth }).then(r => r.json()),
        fetch(`${API_URL}/catalogos/valores/RH`, { headers: headersAuth }).then(r => r.json()),
        fetch(`${API_URL}/catalogos/valores/GENERO`, { headers: headersAuth }).then(r => r.json())
      ])
        .then(([cargos, centros, eps, fondo, rh, genero]) => {
          setDbCargos(cargos);
          setDbCentros(centros);
          setDbEPS(eps);
          setDbFondo(fondo);
          setDbRH(rh);
          setDbGenero(genero);
        })
        .catch(console.error);
    }
  }, [step, token]);

  // Manejar subida y previsualización inicial del Excel
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setFileBase64(base64);

      fetch(`${API_URL}/import/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fileData: base64 })
      })
        .then(res => {
          if (!res.ok) throw new Error('Error al leer el archivo Excel');
          return res.json();
        })
        .then(data => {
          setSheets(data.sheets);
          // Autoseleccionar primera hoja
          const firstSheet = Object.keys(data.sheets)[0];
          setSelectedSheet(firstSheet);
          actualizarHeaders(data.sheets, firstSheet);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError(err.message);
          setLoading(false);
        });
    };
    reader.readAsDataURL(file);
  };

  const actualizarHeaders = (sheetsData, sheetName) => {
    if (!sheetsData[sheetName]) return;
    const sheetHeaders = sheetsData[sheetName].headers;
    setHeaders(sheetHeaders);

    // Inicializar mapeo inteligente difuso (fuzzy mapping)
    const initMapping = {};
    camposSistema.forEach(campo => {
      initMapping[campo.key] = autoMap(campo.key, sheetHeaders);
    });
    setColumnMapping(initMapping);
  };

  const handleSheetChange = (e) => {
    const name = e.target.value;
    setSelectedSheet(name);
    actualizarHeaders(sheets, name);
  };

  const handleMappingChange = (campoKey, value) => {
    setColumnMapping(prev => ({
      ...prev,
      [campoKey]: value
    }));
  };

  // Enviar para analizar formato, duplicados y valores únicos
  const handleAnalyze = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar mapeos obligatorios
    const faltantes = camposSistema.filter(c => c.required && !columnMapping[c.key]);
    if (faltantes.length > 0) {
      setError(`Falta mapear las columnas obligatorias: ${faltantes.map(f => f.label).join(', ')}`);
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/import/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fileData: fileBase64,
        sheetName: selectedSheet,
        columnMapping
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al analizar la hoja');
        return res.json();
      })
      .then(data => {
        setAnalysis(data);
        // Inicializar mapeos de valores
        const initValMappings = { cargo: {}, centroTrabajo: {}, eps: {}, fondoPension: {}, rh: {}, genero: {} };
        
        // Autocompletar mapeos si coinciden con BD
        data.uniqueValues.eps.forEach(val => {
          const match = dbEPS.find(d => d.valor.toUpperCase() === val.toUpperCase());
          initValMappings.eps[val] = match ? match.valor : '';
        });
        
        data.uniqueValues.fondoPension.forEach(val => {
          const match = dbFondo.find(d => d.valor.toUpperCase() === val.toUpperCase());
          initValMappings.fondoPension[val] = match ? match.valor : '';
        });

        setValueMappings(initValMappings);
        setStep(3);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  const handleValueMappingChange = (categoria, originalText, mappedValue) => {
    setValueMappings(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [originalText]: mappedValue
      }
    }));
  };

  // Confirmar Importación
  const handleConfirmImport = () => {
    setLoading(true);
    setError('');

    fetch(`${API_URL}/import/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fileData: fileBase64,
        sheetName: selectedSheet,
        columnMapping,
        valueMappings,
        importMode
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al importar registros');
        return res.json();
      })
      .then(data => {
        setImportResults(data);
        setStep(4);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-white">Importador Asistido de Planillas</h1>
        <p className="text-xs text-[#eaedfa]/60">Migra de forma controlada el historial del personal de Excel a la base de datos</p>
      </div>

      {/* Barra de Progreso */}
      <div className="flex items-center justify-between bg-[#051650]/40 border border-white/5 p-4 rounded-xl">
        {[
          { num: 1, text: 'Subir Excel' },
          { num: 2, text: 'Mapear Columnas' },
          { num: 3, text: 'Normalizar Valores' },
          { num: 4, text: 'Resultado' }
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s.num 
                ? 'bg-[#d9a74a] text-[#00072d]' 
                : step > s.num 
                  ? 'bg-green-400 text-[#00072d]' 
                  : 'bg-white/10 text-white/40'
            }`}>
              {step > s.num ? <Check size={12} /> : s.num}
            </span>
            <span className={`text-xs font-medium ${step === s.num ? 'text-white font-semibold' : 'text-[#eaedfa]/50'}`}>
              {s.text}
            </span>
            {s.num < 4 && <ArrowRight size={14} className="text-white/10" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs p-3 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-10 flex flex-col items-center justify-center glass-panel rounded-xl border border-white/5">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d9a74a]"></div>
          <p className="mt-3 text-xs text-[#eaedfa]/50">Procesando y analizando planilla...</p>
        </div>
      )}

      {/* PASO 1: CARGAR ARCHIVO */}
      {step === 1 && !loading && (
        <div className="glass-panel p-8 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center space-y-6">
          <div className="bg-[#123499]/20 p-5 rounded-full border border-[#123499]/30">
            <Upload size={36} className="text-[#123499]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Sube la planilla de control de asociados (.xlsx)</h3>
            <p className="text-xs text-[#eaedfa]/50 mt-1 max-w-md mx-auto">
              El importador leerá las pestañas e identificará automáticamente columnas como nombres, cédula, cargos, etc.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <input
              type="file"
              accept=".xlsx"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="w-full flex items-center justify-center space-x-2 bg-[#123499] hover:bg-[#123499]/85 text-xs font-bold py-3 px-6 rounded-lg transition-all cursor-pointer shadow-lg hover:shadow-[#123499]/20 border border-[#d9a74a]/20"
            >
              <FileSpreadsheet size={16} />
              <span>Seleccionar Archivo</span>
            </label>
          </div>
        </div>
      )}

      {/* PASO 2: MAPEAR COLUMNAS */}
      {step === 2 && !loading && (
        <div className="space-y-5">
          <div className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Paso 2: Mapeo de Cabeceras</h3>
              <p className="text-[10px] text-[#eaedfa]/50 mt-0.5">Asigna qué columna del Excel corresponde a qué dato en el sistema</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#eaedfa]/60">Pestaña a importar:</span>
              <select
                className="bg-[#00072d]/80 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                value={selectedSheet}
                onChange={handleSheetChange}
              >
                {Object.keys(sheets).map(name => (
                  <option key={name} value={name}>{name} ({sheets[name].totalRows} filas)</option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="glass-panel p-6 rounded-xl border border-white/5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {camposSistema.map(campo => (
                <div key={campo.key} className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-white font-medium">{campo.label}</span>
                  <select
                    className="bg-[#00072d]/60 border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none w-56"
                    value={columnMapping[campo.key] || ''}
                    onChange={(e) => handleMappingChange(campo.key, e.target.value)}
                  >
                    <option value="">-- No Mapear --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-[#00072d]/80 hover:bg-[#00072d] border border-white/10 text-white font-semibold text-xs py-3 px-6 rounded-lg transition-all"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 bg-[#123499] hover:bg-[#123499]/85 text-white font-bold text-xs py-3 px-8 rounded-lg transition-all shadow-lg"
              >
                <span>Analizar Hoja</span>
                <Play size={14} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PASO 3: NORMALIZAR VALORES Y ANÁLISIS */}
      {step === 3 && !loading && analysis && (
        <div className="space-y-6">
          {/* Tarjeta de Resumen Análisis */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[10px] text-[#eaedfa]/50 uppercase tracking-wider block font-semibold">Total Filas</span>
              <span className="text-xl font-bold text-white">{analysis.totalRows}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#eaedfa]/50 uppercase tracking-wider block font-semibold text-red-400">Filas con Errores</span>
              <span className="text-xl font-bold text-red-400">{analysis.errors.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#eaedfa]/50 uppercase tracking-wider block font-semibold text-yellow-400">Duplicados BD / Archivo</span>
              <span className="text-xl font-bold text-yellow-400">{analysis.duplicates.length}</span>
            </div>
          </div>

          {/* Errores Críticos si hay */}
          {analysis.errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-red-400 flex items-center space-x-2">
                <AlertTriangle size={16} />
                <span>Errores de formato / Vacíos encontrados ({analysis.errors.length})</span>
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1 text-red-300/80">
                {analysis.errors.slice(0, 10).map((err, idx) => (
                  <div key={idx}>Fila {err.row}: campo <strong>{err.field}</strong> es inválido (Valor original: "{err.value || 'vacío'}"). {err.message}</div>
                ))}
                {analysis.errors.length > 10 && <div>Y {analysis.errors.length - 10} errores más...</div>}
              </div>
            </div>
          )}

          {/* Duplicados encontrados */}
          {analysis.duplicates.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-yellow-400 flex items-center space-x-2">
                <Clock size={16} />
                <span>Duplicados identificados ({analysis.duplicates.length})</span>
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1 text-yellow-300/80">
                {analysis.duplicates.slice(0, 5).map((dup, idx) => (
                  <div key={idx}>Fila {dup.row}: CC <strong>{dup.id}</strong> ({dup.name}). {dup.message}</div>
                ))}
              </div>
              <div className="pt-2">
                <label className="block text-[10px] uppercase font-bold text-yellow-400/80 mb-1">Estrategia para tratar los duplicados activos:</label>
                <select
                  className="bg-[#051650] border border-yellow-500/20 rounded-lg p-2 text-xs text-white focus:outline-none"
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value)}
                >
                  <option value="IGNORE_DUPLICATES">Omitir duplicados activos (Seguro)</option>
                  <option value="UPDATE_DUPLICATES">Actualizar datos de asociados activos existentes</option>
                </select>
              </div>
            </div>
          )}

          {/* MAPEO DE VALORES DEL CATÁLOGO EPS */}
          <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1.5">Mapeo de Valores de EPS (Normalización de Texto Libre)</h3>
            <p className="text-[10px] text-[#eaedfa]/50">Asigna los textos libres encontrados en la hoja de cálculo a una EPS válida en la base de datos.</p>
            
            {analysis.uniqueValues.eps.length === 0 ? (
              <p className="text-xs text-[#eaedfa]/40">No se detectaron valores de EPS.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.uniqueValues.eps.map((val) => (
                  <div key={val} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono text-[#eaedfa]/80 font-medium">{val}</span>
                    <select
                      className="bg-[#00072d] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none w-56"
                      value={valueMappings.eps[val] || ''}
                      onChange={(e) => handleValueMappingChange('eps', val, e.target.value)}
                    >
                      <option value="">-- Crear Nuevo en BD --</option>
                      {dbEPS.map(d => (
                        <option key={d.id} value={d.valor}>{d.valor}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MAPEO DE VALORES DEL CATÁLOGO FONDO PENSION */}
          <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1.5">Mapeo de Valores de Fondo de Pensión</h3>
            
            {analysis.uniqueValues.fondoPension.length === 0 ? (
              <p className="text-xs text-[#eaedfa]/40">No se detectaron valores de Fondo.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.uniqueValues.fondoPension.map((val) => (
                  <div key={val} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono text-[#eaedfa]/80 font-medium">{val}</span>
                    <select
                      className="bg-[#00072d] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none w-56"
                      value={valueMappings.fondoPension[val] || ''}
                      onChange={(e) => handleValueMappingChange('fondoPension', val, e.target.value)}
                    >
                      <option value="">-- Crear Nuevo en BD --</option>
                      {dbFondo.map(d => (
                        <option key={d.id} value={d.valor}>{d.valor}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-[#00072d]/80 hover:bg-[#00072d] border border-white/10 text-white font-semibold text-xs py-3 px-6 rounded-lg transition-all"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-[#00072d] font-bold text-xs py-3 px-8 rounded-lg transition-all shadow-lg"
            >
              <span>Confirmar y Cargar</span>
              <CheckCircle size={14} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: RESULTADO DE LA IMPORTACIÓN */}
      {step === 4 && importResults && (
        <div className="glass-panel p-8 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center space-y-6">
          <div className="bg-green-500/10 p-5 rounded-full border border-green-500/20 text-green-400">
            <CheckCircle size={36} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Importación Masiva Completada</h3>
            <p className="text-xs text-[#eaedfa]/60 mt-1">Los datos se han procesado de acuerdo a los mapeos provistos</p>
          </div>

          <div className="w-full max-w-md bg-[#00072d]/60 border border-white/5 rounded-xl p-5 space-y-3 text-xs text-left">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-[#eaedfa]/60">Nuevos asociados ingresados:</span>
              <strong className="text-green-400">{importResults.ingresadosCount}</strong>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-[#eaedfa]/60">Asociados actualizados:</span>
              <strong className="text-blue-400">{importResults.actualizadosCount}</strong>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-[#eaedfa]/60">Ex-asociados reactivados (Reingresos):</span>
              <strong className="text-yellow-400">{importResults.reingresosCount}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#eaedfa]/60">Registros ignorados/omitidos:</span>
              <strong className="text-white/60">{importResults.omitidosCount}</strong>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setFileBase64('');
                setFileName('');
                setImportResults(null);
              }}
              className="bg-[#00072d]/80 hover:bg-[#00072d] border border-white/10 text-white font-semibold text-xs py-3 px-6 rounded-lg transition-all"
            >
              Importar otro archivo
            </button>
            <button
              type="button"
              onClick={() => navigateTo('asociados')}
              className="bg-[#123499] hover:bg-[#123499]/85 text-white font-bold text-xs py-3 px-8 rounded-lg transition-all shadow-lg"
            >
              Ir al Directorio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
