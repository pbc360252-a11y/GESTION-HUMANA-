import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Eye, 
  Edit, 
  UserMinus, 
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { API_URL } from '../App';

export default function AsociadosList({ token, user, navigateTo }) {
  const [asociados, setAsociados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargos, setCargos] = useState([]);
  const [centros, setCentros] = useState([]);
  
  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [centroId, setCentroId] = useState('');
  const [cargoId, setCargoId] = useState('');
  const [estado, setEstado] = useState('ACTIVO'); // ACTIVO por defecto
  const [esCritico, setEsCritico] = useState('');
  const [antiguedadMin, setAntiguedadMin] = useState('');
  const [antiguedadMax, setAntiguedadMax] = useState('');

  // Cargar catálogos iniciales
  useEffect(() => {
    // Cargos
    fetch(`${API_URL}/catalogos/cargos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCargos(data))
      .catch(console.error);

    // Centros de Trabajo
    fetch(`${API_URL}/catalogos/centros`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCentros(data))
      .catch(console.error);
  }, [token]);

  // Cargar asociados al cambiar filtros
  const cargarAsociados = () => {
    setLoading(true);
    let url = `${API_URL}/asociados?estado=${estado}`;
    if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;
    if (centroId) url += `&centroTrabajoId=${centroId}`;
    if (cargoId) url += `&cargoId=${cargoId}`;
    if (esCritico) url += `&esCritico=${esCritico}`;
    if (antiguedadMin) url += `&antiguedadMin=${antiguedadMin}`;
    if (antiguedadMax) url += `&antiguedadMax=${antiguedadMax}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Error al buscar asociados');
        return res.json();
      })
      .then(data => {
        setAsociados(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarAsociados();
  }, [estado, centroId, cargoId, esCritico, token]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarAsociados();
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setCentroId('');
    setCargoId('');
    setEstado('ACTIVO');
    setEsCritico('');
    setAntiguedadMin('');
    setAntiguedadMax('');
    // El useEffect cargará de nuevo por el cambio de estado/centroid
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Directorio de Asociados</h1>
          <p className="text-xs text-[#eaedfa]/60">Administración y control de personal</p>
        </div>
        {(user.rol === 'ADMIN' || user.rol === 'GESTION_HUMANA' || user.rol === 'SST') && (
          <button
            onClick={() => navigateTo('asociado_form')}
            className="flex items-center space-x-2 bg-[#123499] hover:bg-[#123499]/80 border border-[#d9a74a]/30 hover:border-[#d9a74a]/60 text-xs font-semibold py-2.5 px-4 rounded-lg transition-all"
          >
            <UserPlus size={16} />
            <span>Registrar Nuevo</span>
          </button>
        )}
      </div>

      {/* Panel de Filtros */}
      <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-4">
        <form onSubmit={handleBuscar} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 text-[#eaedfa]/40" size={16} />
            <input
              type="text"
              placeholder="Buscar por cédula, nombres o apellidos..."
              className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#123499] transition-colors"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-[#123499] hover:bg-[#123499]/85 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="bg-[#00072d]/60 hover:bg-[#00072d] border border-white/10 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all"
            >
              Limpiar
            </button>
          </div>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Estado */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1.5">Estado</label>
            <select
              className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="ACTIVO">Activos</option>
              <option value="SUSPENDIDO">Suspendidos</option>
              <option value="RETIRADO">Retirados</option>
            </select>
          </div>

          {/* Centro Trabajo */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1.5">Centro Trabajo</label>
            <select
              className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
              value={centroId}
              onChange={(e) => setCentroId(e.target.value)}
            >
              <option value="">Todos</option>
              {centros.map(c => (
                <option key={c.id} value={c.id}>{c.codigo} - {c.nombreCliente}</option>
              ))}
            </select>
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1.5">Cargo</label>
            <select
              className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
              value={cargoId}
              onChange={(e) => setCargoId(e.target.value)}
            >
              <option value="">Todos</option>
              {cargos.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Criticidad */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1.5">Nivel Cargo</label>
            <select
              className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
              value={esCritico}
              onChange={(e) => setEsCritico(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Cargos Críticos</option>
              <option value="false">No Críticos</option>
            </select>
          </div>

          {/* Antigüedad Min */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1.5">Antigüedad Mín (Años)</label>
            <input
              type="number"
              placeholder="Ej: 1"
              min="0"
              className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
              value={antiguedadMin}
              onChange={(e) => setAntiguedadMin(e.target.value)}
              onBlur={cargarAsociados}
            />
          </div>

          {/* Antigüedad Max */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1.5">Antigüedad Máx (Años)</label>
            <input
              type="number"
              placeholder="Ej: 5"
              min="0"
              className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
              value={antiguedadMax}
              onChange={(e) => setAntiguedadMax(e.target.value)}
              onBlur={cargarAsociados}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Asociados */}
      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d9a74a]"></div>
            <p className="mt-3 text-xs text-[#eaedfa]/50">Cargando registros...</p>
          </div>
        ) : asociados.length === 0 ? (
          <p className="text-center py-10 text-xs text-[#eaedfa]/50">No se encontraron asociados con los filtros seleccionados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#051650]/60 border-b border-white/5 text-[#eaedfa]/60">
                  <th className="p-3 font-semibold">Carpeta</th>
                  <th className="p-3 font-semibold">Identificación</th>
                  <th className="p-3 font-semibold">Asociado</th>
                  <th className="p-3 font-semibold">Cargo</th>
                  <th className="p-3 font-semibold">Centro Trabajo</th>
                  <th className="p-3 font-semibold text-center">Cumplimiento SST</th>
                  <th className="p-3 font-semibold">Antigüedad</th>
                  <th className="p-3 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {asociados.map(asoc => (
                  <tr key={asoc.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono font-medium text-[#d9a74a]">{asoc.numeroCarpetaActual || '-'}</td>
                    <td className="p-3 font-medium text-white">{asoc.numeroIdentificacion}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">
                        {asoc.primerNombre} {asoc.primerApellido}
                      </div>
                      <div className="text-[10px] text-[#eaedfa]/40">
                        {asoc.correoElectronico || 'Sin correo'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-[#eaedfa]">{asoc.cargo.nombre}</div>
                      <div className="text-[9px]">
                        {asoc.cargo.esCritico ? (
                          <span className="text-yellow-400 font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded">CRÍTICO (1A)</span>
                        ) : (
                          <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">REGULAR (2A)</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-white">{asoc.centroTrabajo.nombreCliente}</div>
                      <div className="text-[10px] text-[#eaedfa]/40">Zona {asoc.centroTrabajo.zona || 'N/A'}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Psicofísico */}
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] text-[#eaedfa]/50 uppercase tracking-widest">PsicoF</span>
                          {asoc.psicofisicoVigente ? (
                            <CheckCircle size={14} className="text-green-400 mt-0.5" />
                          ) : (
                            <XCircle size={14} className="text-red-400 mt-0.5" />
                          )}
                        </div>
                        {/* Psicosensometrico */}
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] text-[#eaedfa]/50 uppercase tracking-widest">PsicoS</span>
                          {asoc.psicosensometricoVigente ? (
                            <CheckCircle size={14} className="text-green-400 mt-0.5" />
                          ) : (
                            <XCircle size={14} className="text-red-400 mt-0.5" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-white">{asoc.antiguedadEmpresaAnios} años</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => navigateTo('asociado_detalle', { id: asoc.id })}
                          title="Ver Hoja de Vida"
                          className="p-1.5 bg-[#00072d]/60 hover:bg-[#123499] border border-white/10 rounded-lg text-white transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        
                        {(user.rol === 'ADMIN' || user.rol === 'GESTION_HUMANA' || user.rol === 'SST') && (
                          <button
                            onClick={() => navigateTo('asociado_form', { id: asoc.id })}
                            title="Editar Datos"
                            className="p-1.5 bg-[#00072d]/60 hover:bg-yellow-500/20 border border-white/10 rounded-lg text-yellow-400 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                        )}

                        {asoc.estado !== 'RETIRADO' && (user.rol === 'ADMIN' || user.rol === 'GESTION_HUMANA') && (
                          <button
                            onClick={() => navigateTo('retiro', { id: asoc.id })}
                            title="Procesar Retiro"
                            className="p-1.5 bg-[#00072d]/60 hover:bg-red-500/20 border border-white/10 rounded-lg text-red-400 transition-colors"
                          >
                            <UserMinus size={14} />
                          </button>
                        )}

                        {asoc.estado === 'RETIRADO' && (user.rol === 'ADMIN' || user.rol === 'GESTION_HUMANA') && (
                          <button
                            onClick={() => navigateTo('asociado_form', { id: asoc.id })} // El form detecta si está retirado y permite reactivación rápida
                            title="Procesar Reingreso"
                            className="p-1.5 bg-[#00072d]/60 hover:bg-green-500/20 border border-white/10 rounded-lg text-green-400 transition-colors"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
