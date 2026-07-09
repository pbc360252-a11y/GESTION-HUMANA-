import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Search,
  Settings
} from 'lucide-react';
import { API_URL } from '../App';

export default function MatrixAndAlerts({ token, user, tabInicial = 'matriz', navigateTo }) {
  const [activeTab, setActiveTab] = useState(tabInicial);
  const [loading, setLoading] = useState(true);
  
  // Datos
  const [asociados, setAsociados] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [centros, setCentros] = useState([]);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [centroId, setCentroId] = useState('');
  const [tipoAlerta, setTipoAlerta] = useState('');

  // Cron
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState('');

  // Cargar Centros de Trabajo
  useEffect(() => {
    fetch(`${API_URL}/catalogos/centros`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCentros(data))
      .catch(console.error);
  }, [token]);

  // Cargar datos principales según la pestaña activa
  const cargarDatos = () => {
    setLoading(true);
    if (activeTab === 'matriz') {
      // Cargar matriz (asociados activos con sus documentos)
      fetch(`${API_URL}/asociados?estado=ACTIVO`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          setAsociados(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      // Cargar alertas pendientes
      let url = `${API_URL}/alertas`;
      const queryParams = [];
      if (tipoAlerta) queryParams.push(`tipoAlerta=${tipoAlerta}`);
      if (centroId) queryParams.push(`centroTrabajoId=${centroId}`);
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          setAlertas(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [activeTab, centroId, tipoAlerta, token]);

  const handleRunCron = () => {
    if (!window.confirm('¿Desea escanear y generar alertas de vencimiento inmediatamente?')) return;
    setCronRunning(true);
    setCronResult('');

    fetch(`${API_URL}/alertas/run-cron`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCronRunning(false);
        setCronResult(`Escaneo completo. Alertas creadas: ${data.alertasCreadasCount}`);
        cargarDatos();
        setTimeout(() => setCronResult(''), 5000);
      })
      .catch(err => {
        console.error(err);
        setCronRunning(false);
        setCronResult('Error al ejecutar escaneo');
      });
  };

  const handleResolverAlerta = (alertaId) => {
    fetch(`${API_URL}/alertas/${alertaId}/resolver`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => {
        cargarDatos();
      })
      .catch(console.error);
  };

  // Filtrar matriz en memoria por búsqueda
  const asociadosFiltradosMatriz = asociados.filter(asoc => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      asoc.numeroIdentificacion.includes(term) ||
      `${asoc.primerNombre} ${asoc.primerApellido}`.toLowerCase().includes(term) ||
      asoc.cargo.nombre.toLowerCase().includes(term)
    );
  });

  const getMatrizDocCell = (asoc, tipoDoc) => {
    // Buscar si tiene cargado el documento y si tiene fecha de vencimiento
    // En el listado no vienen los documentos completos, pero si el psicofisicoVigente y psicosensometricoVigente en el asociados!
    // Para simplificar y optimizar, usamos los flags directos del asociado:
    let flag = true;
    if (tipoDoc === 'EXAMEN_PSICOFISICO') flag = asoc.psicofisicoVigente;
    else if (tipoDoc === 'EXAMEN_PSICOSENSOMETRICO') flag = asoc.psicosensometricoVigente;
    else if (tipoDoc === 'POLIZA_SURA') flag = asoc.tienePolizaSura;
    else if (tipoDoc === 'CERTIFICADO_CURSO') flag = asoc.codigoCurso && asoc.numeroCertificadoCurso;

    if (flag) {
      return (
        <td className="p-3 text-center">
          <span className="inline-flex items-center space-x-1 bg-green-500/10 text-green-400 font-bold px-2 py-0.5 rounded text-[10px]">
            <CheckCircle2 size={12} />
            <span>VIGENTE</span>
          </span>
        </td>
      );
    } else {
      return (
        <td className="p-3 text-center">
          <span className="inline-flex items-center space-x-1 bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded text-[10px]">
            <XCircle size={12} />
            <span>VENCIDO / FALTA</span>
          </span>
        </td>
      );
    }
  };

  const getDiferenciaDiasAlerta = (fechaVenc) => {
    const hoy = new Date().getTime();
    const vTime = new Date(fechaVenc).getTime();
    const diffMs = vTime - hoy;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cumplimiento y Alertas</h1>
          <p className="text-xs text-[#eaedfa]/60">Monitoreo de requisitos y alertas normativas de salud y seguridad</p>
        </div>

        {/* Acciones de SST / ADMIN */}
        {(user.rol === 'ADMIN' || user.rol === 'SST') && (
          <div className="flex items-center space-x-3">
            {cronResult && (
              <span className="text-xs text-yellow-400 font-semibold animate-pulse">{cronResult}</span>
            )}
            <button
              onClick={handleRunCron}
              disabled={cronRunning}
              className="flex items-center space-x-2 bg-[#051650]/60 hover:bg-[#051650] border border-[#d9a74a]/30 hover:border-[#d9a74a]/60 text-xs font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={cronRunning ? 'animate-spin' : ''} />
              <span>{cronRunning ? 'Escaneando...' : 'Escanear Vencimientos'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('matriz')}
          className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-semibold text-xs tracking-wide transition-colors ${
            activeTab === 'matriz'
              ? 'border-[#d9a74a] text-white bg-white/5'
              : 'border-transparent text-[#eaedfa]/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Matriz de Cumplimiento</span>
        </button>
        <button
          onClick={() => setActiveTab('alertas')}
          className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-semibold text-xs tracking-wide transition-colors ${
            activeTab === 'alertas'
              ? 'border-[#d9a74a] text-white bg-white/5'
              : 'border-transparent text-[#eaedfa]/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell size={14} />
          <span>Alertas Activas</span>
        </button>
      </div>

      {/* FILTROS SEGÚN PESTAÑA */}
      <div className="glass-panel p-4 rounded-xl border border-white/5">
        {activeTab === 'matriz' ? (
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[#eaedfa]/40" size={16} />
            <input
              type="text"
              placeholder="Buscar asociado por nombre o identificación..."
              className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#123499] transition-colors"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Filtrar por Centro Trabajo</label>
              <select
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                value={centroId}
                onChange={(e) => setCentroId(e.target.value)}
              >
                <option value="">Todos los Centros</option>
                {centros.map(c => (
                  <option key={c.id} value={c.id}>{c.codigo} - {c.nombreCliente}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Filtrar por Tipo de Alerta</label>
              <select
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                value={tipoAlerta}
                onChange={(e) => setTipoAlerta(e.target.value)}
              >
                <option value="">Todas las Alertas</option>
                <option value="VENCIMIENTO_PSICOFISICO">Vencimiento Examen Psicofísico</option>
                <option value="VENCIMIENTO_PSICOSENSOMETRICO">Vencimiento Examen Psicosensométrico</option>
                <option value="VENCIMIENTO_CURSO">Vencimiento Curso Reentrenamiento</option>
                <option value="VENCIMIENTO_POLIZA">Vencimiento Póliza SURA</option>
                <option value="DOCUMENTO_FALTANTE">Documento Faltante</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d9a74a]"></div>
            <p className="mt-3 text-xs text-[#eaedfa]/50">Cargando...</p>
          </div>
        ) : activeTab === 'matriz' ? (
          /* TAB MATRIZ DE CUMPLIMIENTO */
          asociadosFiltradosMatriz.length === 0 ? (
            <p className="text-center py-10 text-xs text-[#eaedfa]/50">No hay asociados activos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#051650]/60 border-b border-white/5 text-[#eaedfa]/60">
                    <th className="p-3 font-semibold">Identificación</th>
                    <th className="p-3 font-semibold">Asociado</th>
                    <th className="p-3 font-semibold">Cargo</th>
                    <th className="p-3 text-center font-semibold">Curso Reentrenamiento</th>
                    <th className="p-3 text-center font-semibold">Examen Psicofísico</th>
                    <th className="p-3 text-center font-semibold">Examen Psicosensométrico</th>
                    <th className="p-3 text-center font-semibold">Póliza SURA</th>
                    <th className="p-3 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {asociadosFiltradosMatriz.map(asoc => (
                    <tr key={asoc.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono font-medium text-white">{asoc.numeroIdentificacion}</td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{asoc.primerNombre} {asoc.primerApellido}</div>
                        <div className="text-[10px] text-[#eaedfa]/40">{asoc.centroTrabajo.nombreCliente}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-white">{asoc.cargo.nombre}</div>
                        <div className="text-[9px]">
                          {asoc.cargo.esCritico ? (
                            <span className="text-yellow-400 font-bold">CRÍTICO</span>
                          ) : (
                            <span className="text-blue-400">NORMAL</span>
                          )}
                        </div>
                      </td>
                      {getMatrizDocCell(asoc, 'CERTIFICADO_CURSO')}
                      {getMatrizDocCell(asoc, 'EXAMEN_PSICOFISICO')}
                      {getMatrizDocCell(asoc, 'EXAMEN_PSICOSENSOMETRICO')}
                      {getMatrizDocCell(asoc, 'POLIZA_SURA')}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => navigateTo('asociado_detalle', { id: asoc.id })}
                          className="bg-[#123499] hover:bg-[#123499]/85 text-white font-bold py-1 px-3 rounded text-[10px] transition-colors"
                        >
                          Ver H.V
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* TAB ALERTAS ACTIVAS */
          alertas.length === 0 ? (
            <p className="text-center py-10 text-xs text-[#eaedfa]/50">No hay alertas pendientes.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {alertas.map(al => {
                const dias = getDiferenciaDiasAlerta(al.fechaVencimiento);
                const esVencido = dias <= 0;
                
                return (
                  <div key={al.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start space-x-4">
                      {/* Icono de color según criticidad */}
                      <div className={`p-2.5 rounded-lg shrink-0 ${
                        esVencido 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : dias <= 7 
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        <AlertTriangle size={18} />
                      </div>

                      <div className="text-xs">
                        <h4 className="font-bold uppercase tracking-wider text-white">
                          {al.tipoAlerta.replace('_', ' ')}
                        </h4>
                        <p className="text-[#eaedfa]/70 mt-1">
                          Asociado: <strong className="text-white">{al.asociado.primerNombre} {al.asociado.primerApellido}</strong> ({al.asociado.cargo.nombre})
                        </p>
                        <div className="text-[10px] text-[#eaedfa]/50 space-x-3 mt-1.5 flex flex-wrap">
                          <span>Centro: <strong>{al.asociado.centroTrabajo.nombreCliente}</strong></span>
                          <span>Vence el: <strong>{al.fechaVencimiento.split('T')[0]}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                      {/* Badge de tiempo */}
                      <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center space-x-1 ${
                        esVencido 
                          ? 'bg-red-500/15 text-red-400' 
                          : 'bg-yellow-500/15 text-yellow-400'
                      }`}>
                        <Clock size={10} />
                        <span>{esVencido ? `VENCIDO HACE ${Math.abs(dias)} DÍAS` : `VENCE EN ${dias} DÍAS`}</span>
                      </span>

                      {/* Botón Resolver */}
                      {(user.rol === 'ADMIN' || user.rol === 'GESTION_HUMANA' || user.rol === 'SST') && (
                        <button
                          onClick={() => handleResolverAlerta(al.id)}
                          className="bg-[#123499] hover:bg-[#123499]/85 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-colors"
                        >
                          Marcar Resuelta
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
