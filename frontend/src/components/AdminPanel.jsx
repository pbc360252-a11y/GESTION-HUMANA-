import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  UserPlus, 
  Edit, 
  Search,
  Check,
  Shield,
  Activity
} from 'lucide-react';
import { API_URL } from '../App';

export default function AdminPanel({ token, user, tab }) {
  const [activeTab, setActiveTab] = useState(tab || 'catalogos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para CATÁLOGOS
  const [selectedCatType, setSelectedCatType] = useState('EPS');
  const [valoresCat, setValoresCat] = useState([]);
  const [nuevoValorCat, setNuevoValorCat] = useState('');

  const [cargos, setCargos] = useState([]);
  const [centros, setCentros] = useState([]);

  // Form cargo
  const [cargoForm, setCargoForm] = useState({ id: '', nombre: '', esCritico: false, frecuenciaActualizacionAnios: 2 });
  const [showCargoModal, setShowCargoModal] = useState(false);

  // Form centro
  const [centroForm, setCentroForm] = useState({ id: '', codigo: '', nombreCliente: '', direccion: '', zona: '', activo: true });
  const [showCentroModal, setShowCentroModal] = useState(false);

  // Estados para USUARIOS
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioForm, setUsuarioForm] = useState({ id: '', nombre: '', correo: '', password: '', rol: 'GESTION_HUMANA', activo: true });
  const [showUserModal, setShowUserModal] = useState(false);

  // Estados para AUDITORÍA
  const [auditorias, setAuditorias] = useState([]);
  const [auditUserQuery, setAuditUserQuery] = useState('');
  const [auditEntidadQuery, setAuditEntidadQuery] = useState('');

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  // Cargar datos
  const cargarCatalogos = () => {
    setLoading(true);
    fetch(`${API_URL}/catalogos/valores/${selectedCatType}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setValoresCat(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  const cargarCargosCentros = () => {
    setLoading(true);
    fetch(`${API_URL}/catalogos/cargos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCargos(data))
      .catch(console.error);

    fetch(`${API_URL}/catalogos/centros`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setCentros(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  const cargarUsuarios = () => {
    setLoading(true);
    fetch(`${API_URL}/usuarios`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setUsuarios(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  const cargarAuditorias = () => {
    setLoading(true);
    let url = `${API_URL}/auditoria`;
    const params = [];
    if (auditEntidadQuery) params.push(`entidad=${auditEntidadQuery}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setAuditorias(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    setError('');
    setSuccess('');
    if (activeTab === 'catalogos') {
      cargarCatalogos();
      cargarCargosCentros();
    } else if (activeTab === 'usuarios') {
      cargarUsuarios();
    } else if (activeTab === 'auditoria') {
      cargarAuditorias();
    }
  }, [activeTab, selectedCatType, token]);

  // ==========================================
  // LÓGICA DE CATÁLOGOS MAESTROS
  // ==========================================
  const handleAddValorCat = (e) => {
    e.preventDefault();
    if (!nuevoValorCat) return;

    fetch(`${API_URL}/catalogos/valores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tipo: selectedCatType, valor: nuevoValorCat })
    })
      .then(res => res.json())
      .then(() => {
        setNuevoValorCat('');
        cargarCatalogos();
        setSuccess('Valor agregado al catálogo');
        setTimeout(() => setSuccess(''), 2000);
      })
      .catch(console.error);
  };

  const handleToggleValorCat = (id) => {
    fetch(`${API_URL}/catalogos/valores/${id}/toggle`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => {
        cargarCatalogos();
      })
      .catch(console.error);
  };

  // Guardar Cargo (Nuevo o Editar)
  const handleSaveCargo = (e) => {
    e.preventDefault();
    const isEdit = !!cargoForm.id;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `${API_URL}/catalogos/cargos/${cargoForm.id}` : `${API_URL}/catalogos/cargos`;

    fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(cargoForm)
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al guardar cargo');
        return res.json();
      })
      .then(() => {
        setShowCargoModal(false);
        cargarCargosCentros();
        setSuccess('Cargo guardado exitosamente');
        setTimeout(() => setSuccess(''), 2000);
      })
      .catch(err => setError(err.message));
  };

  // Guardar Centro (Nuevo o Editar)
  const handleSaveCentro = (e) => {
    e.preventDefault();
    const isEdit = !!centroForm.id;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `${API_URL}/catalogos/centros/${centroForm.id}` : `${API_URL}/catalogos/centros`;

    fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(centroForm)
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al guardar centro de trabajo');
        return res.json();
      })
      .then(() => {
        setShowCentroModal(false);
        cargarCargosCentros();
        setSuccess('Centro de trabajo guardado');
        setTimeout(() => setSuccess(''), 2000);
      })
      .catch(err => setError(err.message));
  };

  // ==========================================
  // LÓGICA DE USUARIOS
  // ==========================================
  const handleSaveUsuario = (e) => {
    e.preventDefault();
    const isEdit = !!usuarioForm.id;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `${API_URL}/usuarios/${usuarioForm.id}` : `${API_URL}/usuarios`;

    fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(usuarioForm)
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.mensaje) });
        return res.json();
      })
      .then(() => {
        setShowUserModal(false);
        cargarUsuarios();
        setSuccess('Usuario guardado exitosamente');
        setTimeout(() => setSuccess(''), 2000);
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
        <p className="text-xs text-[#eaedfa]/60">Configuración global del sistema, control de accesos e histórico de auditoría</p>
      </div>

      {success && (
        <div className="bg-green-500/15 border border-green-500/30 text-green-300 text-xs p-3 rounded-lg text-center font-medium">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs p-3 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      {/* PESTAÑA 1: CATÁLOGOS MAESTROS */}
      {activeTab === 'catalogos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Valores Genéricos */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider">Catálogos Genéricos</h3>
              <select
                className="bg-[#00072d] border border-white/10 rounded p-1 text-[10px] text-white focus:outline-none"
                value={selectedCatType}
                onChange={(e) => setSelectedCatType(e.target.value)}
              >
                <option value="EPS">EPS</option>
                <option value="FONDO_PENSION">Fondo Pensión</option>
                <option value="RH">Tipo de Sangre RH</option>
                <option value="GENERO">Género</option>
                <option value="ORIENTACION_SEXUAL">Orientación Sexual</option>
                <option value="RELIGION">Religión</option>
                <option value="RAZA">Raza / Etnia</option>
                <option value="MOTIVO_RETIRO">Motivos Retiro</option>
                <option value="RAZON_RETIRO">Razones Retiro</option>
                <option value="MEDIO_TRANSPORTE">Medios de Transporte</option>
                <option value="TIEMPO_TRASLADO">Tiempos de Traslado</option>
                <option value="TIPO_VIVIENDA">Tipos de Vivienda</option>
                <option value="NIVEL_ESTUDIO">Nivel de Estudio</option>
                <option value="RANGO_INGRESOS">Rango de Ingresos</option>
              </select>
            </div>

            {/* Agregar Valor */}
            <form onSubmit={handleAddValorCat} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Nuevo valor..."
                className="flex-1 bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#123499]"
                value={nuevoValorCat}
                onChange={(e) => setNuevoValorCat(e.target.value)}
              />
              <button type="submit" className="bg-[#123499] hover:bg-[#123499]/85 text-white p-2 rounded-lg">
                <Plus size={16} />
              </button>
            </form>

            {/* Lista Valores */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5 pr-1">
              {valoresCat.map(val => (
                <div key={val.id} className="flex items-center justify-between py-2.5 text-xs">
                  <span className={val.activo ? 'text-white' : 'text-white/40 line-through'}>{val.valor}</span>
                  <button onClick={() => handleToggleValorCat(val.id)} className="text-[#eaedfa]/60 hover:text-white">
                    {val.activo ? (
                      <ToggleRight size={18} className="text-green-400" />
                    ) : (
                      <ToggleLeft size={18} className="text-white/20" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Cargos */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider">Cargos</h3>
              <button 
                onClick={() => {
                  setCargoForm({ id: '', nombre: '', esCritico: false, frecuenciaActualizacionAnios: 2 });
                  setShowCargoModal(true);
                }}
                className="flex items-center space-x-1 bg-[#123499]/20 hover:bg-[#123499]/40 border border-[#123499]/30 text-[10px] py-1 px-2.5 rounded text-white"
              >
                <Plus size={12} />
                <span>Agregar Cargo</span>
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5 pr-1 text-xs">
              {cargos.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <strong className="text-white block">{c.nombre}</strong>
                    <span className="text-[10px] text-[#eaedfa]/50">
                      {c.esCritico ? 'Crítico (Examen c/ 1 año)' : 'No Crítico (Examen c/ 2 años)'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setCargoForm(c);
                      setShowCargoModal(true);
                    }}
                    className="p-1 hover:bg-white/5 rounded text-[#eaedfa]/60 hover:text-white"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Centros de Trabajo */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider">Centros de Trabajo</h3>
              <button 
                onClick={() => {
                  setCentroForm({ id: '', codigo: '', nombreCliente: '', direccion: '', zona: '', activo: true });
                  setShowCentroModal(true);
                }}
                className="flex items-center space-x-1 bg-[#123499]/20 hover:bg-[#123499]/40 border border-[#123499]/30 text-[10px] py-1 px-2.5 rounded text-white"
              >
                <Plus size={12} />
                <span>Agregar Centro</span>
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5 pr-1 text-xs">
              {centros.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <strong className="text-white block">{c.codigo} - {c.nombreCliente}</strong>
                    <span className="text-[10px] text-[#eaedfa]/50">Zona {c.zona || 'N/A'}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setCentroForm(c);
                      setShowCentroModal(true);
                    }}
                    className="p-1 hover:bg-white/5 rounded text-[#eaedfa]/60 hover:text-white"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider">Usuarios del Sistema</h3>
            <button 
              onClick={() => {
                setUsuarioForm({ id: '', nombre: '', correo: '', password: '', rol: 'GESTION_HUMANA', activo: true });
                setShowUserModal(true);
              }}
              className="flex items-center space-x-2 bg-[#123499] hover:bg-[#123499]/85 text-xs font-semibold py-2 px-4 rounded-lg transition-all"
            >
              <UserPlus size={14} />
              <span>Registrar Usuario</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#051650]/60 border-b border-white/5 text-[#eaedfa]/60">
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Último Login</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="p-3 font-semibold text-white">{u.nombre}</td>
                    <td className="p-3 font-mono text-[#eaedfa]/80">{u.correo}</td>
                    <td className="p-3">
                      <span className="bg-[#123499]/20 text-[#d9a74a] text-[9px] font-bold px-2 py-0.5 rounded border border-[#d9a74a]/20 uppercase">
                        {u.rol.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {u.activo ? (
                        <span className="text-green-400 font-bold">Activo</span>
                      ) : (
                        <span className="text-red-400 font-bold">Inactivo</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-[#eaedfa]/60">
                      {u.ultimoLogin ? new Date(u.ultimoLogin).toLocaleString() : 'Nunca'}
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => {
                          setUsuarioForm({ ...u, password: '' });
                          setShowUserModal(true);
                        }}
                        className="p-1.5 bg-[#00072d]/60 hover:bg-white/5 rounded-lg border border-white/10 text-white transition-all"
                      >
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: AUDITORÍA */}
      {activeTab === 'auditoria' && (
        <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider">Bitácora de Auditoría (Trazabilidad)</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Filtrar por Entidad..."
                className="bg-[#00072d]/60 border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-[#123499]"
                value={auditEntidadQuery}
                onChange={(e) => setAuditEntidadQuery(e.target.value)}
                onBlur={cargarAuditorias}
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#051650]/60 border-b border-white/5 text-[#eaedfa]/60">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Usuario</th>
                  <th className="p-3 text-center">Acción</th>
                  <th className="p-3">Entidad</th>
                  <th className="p-3">Campo</th>
                  <th className="p-3">Valor Viejo</th>
                  <th className="p-3">Valor Nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[11px]">
                {auditorias.map(a => (
                  <tr key={a.id} className="hover:bg-white/5">
                    <td className="p-3 text-[#eaedfa]/60 font-mono">{new Date(a.fecha).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{a.usuario.nombre}</div>
                      <div className="text-[9px] text-[#eaedfa]/40">{a.usuario.correo}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        a.accion === 'CREAR' ? 'bg-green-500/10 text-green-400' : a.accion === 'ELIMINAR' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {a.accion}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">{a.entidad}</td>
                    <td className="p-3 font-mono text-[#eaedfa]/70">{a.campoModificado || '-'}</td>
                    <td className="p-3 text-[#eaedfa]/40 truncate max-w-[150px]">{a.valorAnterior || '-'}</td>
                    <td className="p-3 text-white truncate max-w-[150px] font-medium">{a.valorNuevo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CARGOS */}
      {showCargoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSaveCargo} className="w-full max-w-sm glass-panel border border-white/10 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">{cargoForm.id ? 'Editar Cargo' : 'Registrar Nuevo Cargo'}</h3>
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Nombre del Cargo *</label>
              <input
                type="text"
                required
                className="w-full bg-[#00072d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499]"
                value={cargoForm.nombre}
                onChange={(e) => setCargoForm({ ...cargoForm, nombre: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Frecuencia Actualización Exámenes *</label>
              <select
                className="w-full bg-[#00072d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                value={cargoForm.frecuenciaActualizacionAnios}
                onChange={(e) => setCargoForm({ ...cargoForm, frecuenciaActualizacionAnios: parseInt(e.target.value), esCritico: e.target.value === '1' })}
              >
                <option value={2}>Cada 2 Años (Cargo Normal)</option>
                <option value={1}>Cada 1 Año (Cargo Crítico / SST)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCargoModal(false)} className="bg-white/5 hover:bg-white/10 text-xs px-4 py-2 rounded-lg text-white">Cancelar</button>
              <button type="submit" className="bg-[#123499] hover:bg-[#123499]/85 text-xs font-bold px-5 py-2 rounded-lg text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CENTROS */}
      {showCentroModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSaveCentro} className="w-full max-w-sm glass-panel border border-white/10 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">{centroForm.id ? 'Editar Centro de Trabajo' : 'Registrar Centro de Trabajo'}</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Código *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#00072d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  value={centroForm.codigo}
                  onChange={(e) => setCentroForm({ ...centroForm, codigo: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Zona</label>
                <input
                  type="text"
                  className="w-full bg-[#00072d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  value={centroForm.zona}
                  onChange={(e) => setCentroForm({ ...centroForm, zona: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Nombre Cliente / Centro *</label>
              <input
                type="text"
                required
                className="w-full bg-[#00072d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                value={centroForm.nombreCliente}
                onChange={(e) => setCentroForm({ ...centroForm, nombreCliente: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Dirección</label>
              <input
                type="text"
                className="w-full bg-[#00072d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                value={centroForm.direccion}
                onChange={(e) => setCentroForm({ ...centroForm, direccion: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCentroModal(false)} className="bg-white/5 hover:bg-white/10 text-xs px-4 py-2 rounded-lg text-white">Cancelar</button>
              <button type="submit" className="bg-[#123499] hover:bg-[#123499]/85 text-xs font-bold px-5 py-2 rounded-lg text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL USUARIO */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSaveUsuario} className="w-full max-w-sm glass-panel border border-white/10 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">{usuarioForm.id ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h3>
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                className="w-full bg-[#00072d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                value={usuarioForm.nombre}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, nombre: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Correo Electrónico *</label>
              <input
                type="email"
                required
                className="w-full bg-[#00072d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                value={usuarioForm.correo}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, correo: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">
                Contraseña {usuarioForm.id ? '(Dejar vacío para mantener)' : '*'}
              </label>
              <input
                type="password"
                required={!usuarioForm.id}
                className="w-full bg-[#00072d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                value={usuarioForm.password}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Rol de Acceso *</label>
              <select
                className="w-full bg-[#00072d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                value={usuarioForm.rol}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, rol: e.target.value })}
              >
                <option value="ADMIN">Administrador (Acceso Total)</option>
                <option value="GESTION_HUMANA">Gestión Humana (CRUD Personal)</option>
                <option value="SST">Salud y Seguridad en el Trabajo (SST)</option>
                <option value="COORDINADOR_OPERATIVO">Coordinador Operativo (Lectura zonal/Oculto)</option>
                <option value="CONSULTA">Consulta Solo Lectura (Dashboard/Anonimizado)</option>
              </select>
            </div>

            {usuarioForm.id && (
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="user-status"
                  className="rounded border-white/10 text-[#123499] focus:ring-[#123499] bg-[#00072d]"
                  checked={usuarioForm.activo}
                  onChange={(e) => setUsuarioForm({ ...usuarioForm, activo: e.target.checked })}
                />
                <label htmlFor="user-status" className="text-xs text-[#eaedfa]">Usuario Activo (Permite iniciar sesión)</label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowUserModal(false)} className="bg-white/5 hover:bg-white/10 text-xs px-4 py-2 rounded-lg text-white">Cancelar</button>
              <button type="submit" className="bg-[#123499] hover:bg-[#123499]/85 text-xs font-bold px-5 py-2 rounded-lg text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
