import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  UploadCloud, 
  Activity, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  FileText,
  TrendingUp,
  Clock,
  Briefcase
} from 'lucide-react';
import { API_URL } from '../App';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function AusentismoPanel({ token, user, navigateTo }) {
  const [activeTab, setActiveTab] = useState('listado');
  const [ausentismos, setAusentismos] = useState([]);
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [asociados, setAsociados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  // Estados de Formulario Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Datos del Formulario
  const [asociadoId, setAsociadoId] = useState('');
  const [tipo, setTipo] = useState('MEDICO'); // "MEDICO" o "OTRO"
  const [tipoEvento, setTipoEvento] = useState('D.A.'); // "D.A.", "S.P.", "L.R.", "L.N.R.", "ACT"
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [prorroga, setProrroga] = useState(false);
  const [examenPostIncapacidad, setExamenPostIncapacidad] = useState(false);
  const [origenIncapacidad, setOrigenIncapacidad] = useState('ENFERMEDAD GENERAL');
  const [diagnosticoId, setDiagnosticoId] = useState('');
  const [causa, setCausa] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [salarioBase, setSalarioBase] = useState('');
  const [costosAsumidosAT, setCostosAsumidosAT] = useState('');

  // Autocomplete
  const [asociadoBusqueda, setAsociadoBusqueda] = useState('');
  const [asociadosFiltrados, setAsociadosFiltrados] = useState([]);
  const [diagnosticoBusqueda, setDiagnosticoBusqueda] = useState('');
  const [diagnosticosFiltrados, setDiagnosticosFiltrados] = useState([]);

  // Importar Excel
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Cargar lista de ausentismos
  const fetchAusentismos = () => {
    setLoading(true);
    fetch(`${API_URL}/ausentismos?busqueda=${busqueda}&tipo=${filtroTipo}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAusentismos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Error al conectar con el servidor.');
        setLoading(false);
      });
  };

  // Cargar asociados al iniciar
  useEffect(() => {
    fetch(`${API_URL}/asociados`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAsociados(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchAusentismos();
  }, [busqueda, filtroTipo]);

  // Autocompletar Asociado
  useEffect(() => {
    if (asociadoBusqueda.length > 1) {
      const fil = asociados.filter(a => 
        a.numeroIdentificacion.includes(asociadoBusqueda) ||
        `${a.primerNombre} ${a.primerApellido}`.toLowerCase().includes(asociadoBusqueda.toLowerCase())
      );
      setAsociadosFiltrados(fil.slice(0, 5));
    } else {
      setAsociadosFiltrados([]);
    }
  }, [asociadoBusqueda]);

  // Autocompletar Diagnóstico CIE-10
  useEffect(() => {
    if (diagnosticoBusqueda.length > 1) {
      fetch(`${API_URL}/ausentismos/diagnosticos?busqueda=${diagnosticoBusqueda}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setDiagnosticosFiltrados(data))
        .catch(console.error);
    } else {
      setDiagnosticosFiltrados([]);
    }
  }, [diagnosticoBusqueda]);

  const resetForm = () => {
    setEditingId(null);
    setAsociadoId('');
    setAsociadoBusqueda('');
    setTipo('MEDICO');
    setTipoEvento('D.A.');
    setFechaInicio('');
    setFechaFin('');
    setProrroga(false);
    setExamenPostIncapacidad(false);
    setOrigenIncapacidad('ENFERMEDAD GENERAL');
    setDiagnosticoId('');
    setDiagnosticoBusqueda('');
    setCausa('');
    setObservaciones('');
    setSalarioBase('');
    setCostosAsumidosAT('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (aus) => {
    setEditingId(aus.id);
    setAsociadoId(aus.asociadoId);
    setAsociadoBusqueda(`${aus.asociado.primerNombre} ${aus.asociado.primerApellido} (${aus.asociado.numeroIdentificacion})`);
    setTipo(aus.tipo);
    setTipoEvento(aus.tipoEvento);
    setFechaInicio(aus.fechaInicio.split('T')[0]);
    setFechaFin(aus.fechaFin.split('T')[0]);
    setProrroga(aus.prorroga);
    setExamenPostIncapacidad(aus.examenPostIncapacidad);
    setOrigenIncapacidad(aus.origenIncapacidad || 'ENFERMEDAD GENERAL');
    setDiagnosticoId(aus.diagnosticoId || '');
    setDiagnosticoBusqueda(aus.diagnostico ? `${aus.diagnostico.codigo} - ${aus.diagnostico.descripcion}` : '');
    setCausa(aus.causa || '');
    setObservaciones(aus.observaciones || '');
    setSalarioBase(aus.salarioBase || '');
    setCostosAsumidosAT(aus.costosAsumidosAT || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (!asociadoId || !tipo || !tipoEvento || !fechaInicio || !fechaFin) {
      setError('Por favor, rellene todos los campos requeridos.');
      return;
    }

    const payload = {
      asociadoId,
      tipo,
      tipoEvento,
      fechaInicio,
      fechaFin,
      prorroga,
      examenPostIncapacidad,
      origenIncapacidad: tipo === 'MEDICO' ? origenIncapacidad : null,
      diagnosticoId: tipo === 'MEDICO' ? (diagnosticoId || null) : null,
      causa: tipo === 'OTRO' ? causa : null,
      observaciones,
      salarioBase: salarioBase ? parseFloat(salarioBase) : null,
      costosAsumidosAT: costosAsumidosAT ? parseFloat(costosAsumidosAT) : null
    };

    const url = editingId ? `${API_URL}/ausentismos/${editingId}` : `${API_URL}/ausentismos`;
    const method = editingId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al guardar el ausentismo');
        return res.json();
      })
      .then(() => {
        setExito(editingId ? 'Registro actualizado con éxito.' : 'Registro creado con éxito.');
        setIsModalOpen(false);
        resetForm();
        fetchAusentismos();
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Está seguro de eliminar este registro de ausentismo?')) return;
    setError('');
    setExito('');

    fetch(`${API_URL}/ausentismos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al eliminar');
        return res.json();
      })
      .then(() => {
        setExito('Registro eliminado.');
        fetchAusentismos();
      })
      .catch(err => {
        console.error(err);
        setError('No se pudo eliminar el registro.');
      });
  };

  // Drag and drop / Excel Upload
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    setImporting(true);
    setError('');
    setExito('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target.result;

      fetch(`${API_URL}/ausentismos/importar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fileData: b64 })
      })
        .then(res => res.json())
        .then(data => {
          if (data.mensaje) {
            setExito(`${data.mensaje} (${data.estadisticas.incapacidadesMedicas} Médicos, ${data.estadisticas.otrosAusentismos} Otros)`);
            fetchAusentismos();
          } else {
            setError(data.mensaje || 'Error en el servidor durante la importación.');
          }
          setImporting(false);
        })
        .catch(err => {
          console.error(err);
          setError('Error al cargar y procesar la planilla de ausentismo.');
          setImporting(false);
        });
    };
    reader.readAsDataURL(file);
  };

  // --- MÁTRICAS DE ESTADÍSTICAS ---
  const totalDias = ausentismos.reduce((acc, a) => acc + a.diasAusencia, 0);
  const totalMedicos = ausentismos.filter(a => a.tipo === 'MEDICO').length;
  const totalOtros = ausentismos.filter(a => a.tipo === 'OTRO').length;

  // Datos para gráfico 1: Distribución por Origen de Incapacidad
  const origenCounts = {};
  ausentismos.filter(a => a.tipo === 'MEDICO').forEach(a => {
    const orig = a.origenIncapacidad || 'OTROS';
    origenCounts[orig] = (origenCounts[orig] || 0) + a.diasAusencia;
  });
  const dataPie = Object.keys(origenCounts).map(name => ({
    name,
    value: origenCounts[name]
  }));
  const COLORS = ['#123499', '#d9a74a', '#10b981', '#ef4444', '#f59e0b'];

  // Datos para gráfico 2: Ausencias por Cargo
  const cargoCounts = {};
  ausentismos.forEach(a => {
    const carg = a.asociado?.celular ? 'VIGILANTE' : 'VIGILANTE'; // Asumimos default
    // Pero en el registro real el asociado tiene cargo, busquemos el nombre del cargo
    // Para simplificar, agruparemos por tipo de evento
    const ev = a.tipoEvento || 'D.A.';
    cargoCounts[ev] = (cargoCounts[ev] || 0) + a.diasAusencia;
  });
  const dataBar = Object.keys(cargoCounts).map(name => ({
    tipo: name,
    dias: cargoCounts[name]
  }));

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-display">Control de Ausentismo</h1>
          <p className="text-sm text-[#eaedfa]/60 mt-1">Registra, analiza y procesa incapacidades, licencias, vacaciones y permisos.</p>
        </div>
        {user.rol !== 'CONSULTA' && (
          <div className="flex gap-3">
            <button
              onClick={handleOpenCreateModal}
              className="bg-[#123499] hover:bg-[#123499]/80 border border-[#d9a74a]/40 text-white font-bold py-2.5 px-4 rounded-lg flex items-center gap-2 transition-all hover:shadow-lg text-xs"
            >
              <Plus size={16} /> Registrar Ausencia
            </button>
          </div>
        )}
      </div>

      {/* Alertas de Éxito / Error */}
      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-sm p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {exito && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm p-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle size={20} />
          {exito}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          onClick={() => setActiveTab('listado')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${
            activeTab === 'listado' ? 'text-white border-b-2 border-[#d9a74a]' : 'text-[#eaedfa]/60 hover:text-white'
          }`}
        >
          Listado de Ausencias
        </button>
        <button
          onClick={() => setActiveTab('estadisticas')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${
            activeTab === 'estadisticas' ? 'text-white border-b-2 border-[#d9a74a]' : 'text-[#eaedfa]/60 hover:text-white'
          }`}
        >
          Estadísticas y KPIs
        </button>
        {(user.rol === 'ADMIN' || user.rol === 'GESTION_HUMANA') && (
          <button
            onClick={() => setActiveTab('importar')}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'importar' ? 'text-white border-b-2 border-[#d9a74a]' : 'text-[#eaedfa]/60 hover:text-white'
            }`}
          >
            Importar Excel (Planilla)
          </button>
        )}
      </div>

      {/* CONTENIDO DE TABS */}

      {/* TAB 1: LISTADO */}
      {activeTab === 'listado' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por cédula o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[#051650]/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d9a74a]/50"
              />
              <Search className="absolute left-3.5 top-3.5 text-white/30" size={16} />
            </div>

            <div>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full bg-[#051650]/40 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#d9a74a]/50"
              >
                <option value="">Todos los Tipos</option>
                <option value="MEDICO">Incapacidades Médicas</option>
                <option value="OTRO">Permisos y Licencias</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#051650]/80 text-[#eaedfa]/80 uppercase tracking-wider text-[10px] font-semibold border-b border-white/15">
                    <th className="p-4">Asociado</th>
                    <th className="p-4">Cédula</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Evento</th>
                    <th className="p-4">Fecha Inicio</th>
                    <th className="p-4">Fecha Fin</th>
                    <th className="p-4 text-center">Días</th>
                    <th className="p-4">Detalle / Diagnóstico</th>
                    {user.rol !== 'CONSULTA' && <th className="p-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-white/50">Cargando ausencias...</td>
                    </tr>
                  ) : ausentismos.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-white/50">No se encontraron ausencias.</td>
                    </tr>
                  ) : (
                    ausentismos.map((aus) => (
                      <tr key={aus.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-semibold text-white">
                          {aus.asociado ? `${aus.asociado.primerNombre} ${aus.asociado.primerApellido}` : 'No Encontrado'}
                        </td>
                        <td className="p-4 text-white/70">{aus.asociado?.numeroIdentificacion}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[9px] uppercase ${
                            aus.tipo === 'MEDICO' ? 'bg-[#123499]/40 text-blue-300 border border-blue-500/20' : 'bg-[#d9a74a]/15 text-[#d9a74a] border border-[#d9a74a]/20'
                          }`}>
                            {aus.tipo === 'MEDICO' ? 'Médico' : 'Administrativo'}
                          </span>
                        </td>
                        <td className="p-4 text-white/70 font-semibold">{aus.tipoEvento}</td>
                        <td className="p-4 text-white/70">{new Date(aus.fechaInicio).toLocaleDateString()}</td>
                        <td className="p-4 text-white/70">{new Date(aus.fechaFin).toLocaleDateString()}</td>
                        <td className="p-4 text-center text-white font-bold">{aus.diasAusencia}</td>
                        <td className="p-4 max-w-xs truncate text-white/80">
                          {aus.tipo === 'MEDICO' && aus.diagnostico ? (
                            <span className="flex items-center gap-1.5" title={aus.diagnostico.descripcion}>
                              <span className="font-semibold text-[#d9a74a] shrink-0">{aus.diagnostico.codigo}</span>
                              <span className="truncate">{aus.diagnostico.descripcion}</span>
                            </span>
                          ) : (
                            <span>{aus.causa || aus.observaciones || 'Sin Causa Registrada'}</span>
                          )}
                        </td>
                        {user.rol !== 'CONSULTA' && (
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(aus)}
                                className="p-1.5 rounded bg-white/5 hover:bg-[#d9a74a]/25 text-[#eaedfa]/80 hover:text-white transition-colors"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(aus.id)}
                                className="p-1.5 rounded bg-white/5 hover:bg-red-500/25 text-[#eaedfa]/80 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ESTADÍSTICAS */}
      {activeTab === 'estadisticas' && (
        <div className="space-y-6">
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-[#123499]/20 rounded-xl border border-blue-500/20 text-[#d9a74a]">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{ausentismos.length}</h3>
                <p className="text-xs text-[#eaedfa]/50 uppercase tracking-wider mt-0.5">Total Eventos</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{totalDias}</h3>
                <p className="text-xs text-[#eaedfa]/50 uppercase tracking-wider mt-0.5">Días Perdidos</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-[#d9a74a]/10 rounded-xl border border-[#d9a74a]/20 text-[#d9a74a]">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{totalMedicos}</h3>
                <p className="text-xs text-[#eaedfa]/50 uppercase tracking-wider mt-0.5">Incapacidades</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{totalOtros}</h3>
                <p className="text-xs text-[#eaedfa]/50 uppercase tracking-wider mt-0.5">Otros Permisos</p>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Barras: Días Perdidos por Tipo de Evento */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5">
              <h3 className="text-sm font-semibold text-white mb-4">Días Perdidos por Tipo de Evento</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataBar}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="tipo" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#051650', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="dias" fill="#123499">
                      {dataBar.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Torta: Origen de Incapacidades Médicas */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5">
              <h3 className="text-sm font-semibold text-white mb-4">Origen de las Incapacidades Médicas</h3>
              <div className="h-72 flex flex-col justify-center items-center">
                {dataPie.length === 0 ? (
                  <p className="text-xs text-white/40">Sin datos de incapacidades registrados.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={dataPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dataPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#051650', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Leyenda manual */}
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {dataPie.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-[10px]">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-white/70 uppercase">{entry.name} ({entry.value} d)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IMPORTAR */}
      {activeTab === 'importar' && (
        <div className="max-w-2xl mx-auto glass-panel p-8 rounded-2xl border border-white/5 text-center space-y-6">
          <div className="h-16 w-16 mx-auto bg-[#123499]/20 rounded-full border border-[#d9a74a]/40 flex items-center justify-center text-[#d9a74a]">
            <UploadCloud size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Importar planilla de ausentismo</h3>
            <p className="text-xs text-[#eaedfa]/60 mt-1 max-w-md mx-auto">
              Arrastra o selecciona el Excel de control de ausentismo para cargar todo el historial. Se procesarán las hojas "REG AUSENTISMO MED" y "OTRO AUSENTISMO".
            </p>
          </div>

          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 transition-colors ${
              dragActive ? 'border-[#d9a74a] bg-[#d9a74a]/5' : 'border-white/10 hover:border-white/20'
            }`}
          >
            {importing ? (
              <div className="space-y-3">
                <div className="animate-spin h-8 w-8 mx-auto border-2 border-[#d9a74a] border-t-transparent rounded-full"></div>
                <p className="text-xs text-white/70">Procesando planilla en la base de datos de Supabase...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-white/50">Arrastra el archivo aquí o</p>
                <label className="bg-[#123499] hover:bg-[#123499]/80 border border-[#d9a74a]/40 text-white font-bold py-2 px-4 rounded-lg cursor-pointer text-xs transition-colors">
                  Seleccionar Archivo
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORMULARIO MODAL (CREAR / EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#00072d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-white/15 pb-3">
              <h2 className="text-base font-bold text-white font-display">
                {editingId ? 'Editar Registro de Ausencia' : 'Registrar Ausencia de Personal'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sección 1: Datos del Asociado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Asociado (Buscar)</label>
                  <input
                    type="text"
                    required
                    placeholder="Escribe cédula o nombre..."
                    value={asociadoBusqueda}
                    onChange={(e) => setAsociadoBusqueda(e.target.value)}
                    disabled={!!editingId}
                    className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d9a74a]/50"
                  />
                  {asociadosFiltrados.length > 0 && (
                    <div className="absolute left-0 right-0 bg-[#051650] border border-white/15 rounded-lg mt-1 z-10 overflow-hidden divide-y divide-white/5 shadow-2xl">
                      {asociadosFiltrados.map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setAsociadoId(a.id);
                            setAsociadoBusqueda(`${a.primerNombre} ${a.primerApellido} (${a.numeroIdentificacion})`);
                            setAsociadosFiltrados([]);
                          }}
                          className="w-full text-left p-2.5 text-xs hover:bg-[#123499]/40 text-white transition-colors block"
                        >
                          {a.primerNombre} {a.primerApellido} - <span className="text-[#d9a74a] font-semibold">{a.numeroIdentificacion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Tipo de Ausencia</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#d9a74a]/50"
                  >
                    <option value="MEDICO">Incapacidad Médica</option>
                    <option value="OTRO">Permiso, Licencia o Vacaciones</option>
                  </select>
                </div>
              </div>

              {/* Sección 2: Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Fecha Inicial</label>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#d9a74a]/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Fecha Final</label>
                  <input
                    type="date"
                    required
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#d9a74a]/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Tipo de Evento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: D.A., S.P., L.R."
                    value={tipoEvento}
                    onChange={(e) => setTipoEvento(e.target.value)}
                    className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Campos condicionales: MÉDICOS */}
              {tipo === 'MEDICO' && (
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Diagnóstico CIE-10 (Código/Nombre)</label>
                      <input
                        type="text"
                        placeholder="Busca ej: A083..."
                        value={diagnosticoBusqueda}
                        onChange={(e) => setDiagnosticoBusqueda(e.target.value)}
                        className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d9a74a]/50"
                      />
                      {diagnosticosFiltrados.length > 0 && (
                        <div className="absolute left-0 right-0 bg-[#051650] border border-white/15 rounded-lg mt-1 z-10 overflow-hidden divide-y divide-white/5 shadow-2xl">
                          {diagnosticosFiltrados.map(d => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                setDiagnosticoId(d.id);
                                setDiagnosticoBusqueda(`${d.codigo} - ${d.descripcion}`);
                                setDiagnosticosFiltrados([]);
                              }}
                              className="w-full text-left p-2.5 text-xs hover:bg-[#123499]/40 text-white transition-colors block"
                            >
                              <span className="font-semibold text-[#d9a74a]">{d.codigo}</span> - {d.descripcion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Origen de Incapacidad</label>
                      <select
                        value={origenIncapacidad}
                        onChange={(e) => setOrigenIncapacidad(e.target.value)}
                        className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                      >
                        <option value="ENFERMEDAD GENERAL">Enfermedad General</option>
                        <option value="ACCIDENTE DE TRABAJO">Accidente de Trabajo</option>
                        <option value="ENFERMEDAD LABORAL">Enfermedad Laboral</option>
                        <option value="MATERNIDAD">Maternidad</option>
                        <option value="PATERNIDAD">Paternidad</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prorroga}
                        onChange={(e) => setProrroga(e.target.checked)}
                        className="rounded bg-[#051650] border-white/10 focus:ring-0 text-[#d9a74a]"
                      />
                      <span className="text-xs text-white/80">¿Es Prórroga?</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={examenPostIncapacidad}
                        onChange={(e) => setExamenPostIncapacidad(e.target.checked)}
                        className="rounded bg-[#051650] border-white/10 focus:ring-0 text-[#d9a74a]"
                      />
                      <span className="text-xs text-white/80">¿Requiere Examen Post-Incapacidad?</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Campos condicionales: OTROS (Administrativos) */}
              {tipo === 'OTRO' && (
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Causa de la Ausencia</label>
                    <input
                      type="text"
                      placeholder="Ej: Licencia de luto, permiso personal, vacaciones..."
                      value={causa}
                      onChange={(e) => setCausa(e.target.value)}
                      className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Valores Financieros y Observaciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Salario Base (Mensual)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 1300000"
                    value={salarioBase}
                    onChange={(e) => setSalarioBase(e.target.value)}
                    className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Costos Asumidos A.T.</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 50000"
                    value={costosAsumidosAT}
                    onChange={(e) => setCostosAsumidosAT(e.target.value)}
                    className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/70 mb-1.5 font-medium">Observaciones Generales</label>
                <textarea
                  placeholder="Detalles adicionales del evento de ausencia..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full bg-[#051650]/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#d9a74a]/50"
                ></textarea>
              </div>

              {/* Botones de Envío */}
              <div className="flex justify-end gap-3 border-t border-white/15 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#123499] hover:bg-[#123499]/85 text-white font-bold py-2 px-4 rounded-lg text-xs border border-[#d9a74a]/40 transition-colors"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
