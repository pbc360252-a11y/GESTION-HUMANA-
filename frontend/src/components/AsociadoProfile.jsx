import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  FileText, 
  Bell, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Upload, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  Download,
  AlertTriangle
} from 'lucide-react';
import { API_URL } from '../App';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : '';

export default function AsociadoProfile({ token, user, asociadoId, navigateTo }) {
  const [asoc, setAsoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personales');
  
  // Estados para carga de documentos
  const [tipoDocUpload, setTipoDocUpload] = useState('CEDULA');
  const [fechaVencUpload, setFechaVencUpload] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const cargarFicha = () => {
    setLoading(true);
    fetch(`${API_URL}/asociados/${asociadoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAsoc(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarFicha();
  }, [asociadoId, token]);

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!fileInput) {
      setUploadError('Por favor seleccione un archivo');
      return;
    }

    setUploading(true);
    setUploadError('');

    const file = fileInput;
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const base64Data = reader.result;

      fetch(`${API_URL}/documentos/upload/${asociadoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tipoDocumento: tipoDocUpload,
          fileName: file.name,
          fileData: base64Data,
          fechaVencimiento: fechaVencUpload || null
        })
      })
        .then(res => {
          if (!res.ok) throw new Error('Error al cargar documento');
          return res.json();
        })
        .then(() => {
          setUploading(false);
          setFechaVencUpload('');
          setUploadError('');
          // Recargar datos para mostrar el nuevo documento y flags actualizados
          cargarFicha();
        })
        .catch(err => {
          console.error(err);
          setUploading(false);
          setUploadError('Error al subir el archivo al servidor');
        });
    };

    reader.readAsDataURL(file);
  };

  const handleDocDelete = (docId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este documento?')) return;

    fetch(`${API_URL}/documentos/${docId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => {
        cargarFicha();
      })
      .catch(console.error);
  };

  const handleResolverAlerta = (alertaId) => {
    fetch(`${API_URL}/alertas/${alertaId}/resolver`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => {
        cargarFicha();
      })
      .catch(console.error);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d9a74a]"></div>
        <p className="mt-4 text-sm text-[#eaedfa]/60">Cargando ficha digital de asociado...</p>
      </div>
    );
  }

  if (!asoc) return <p className="text-center py-10">Error al cargar ficha de asociado.</p>;

  const formatFecha = (dStr) => {
    if (!dStr) return 'N/A';
    return new Date(dStr).toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Botón Volver */}
      <button 
        onClick={() => navigateTo('asociados')}
        className="flex items-center space-x-2 text-[#eaedfa]/70 hover:text-white transition-colors text-xs font-semibold"
      >
        <ArrowLeft size={16} />
        <span>Volver al directorio</span>
      </button>

      {/* Tarjeta de Encabezado de Perfil */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar / Logo */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#051650] border-2 border-[#d9a74a] flex items-center justify-center shadow-lg">
              <User size={48} className="text-[#eaedfa]" />
            </div>
            <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-[#00072d] ${
              asoc.estado === 'ACTIVO' ? 'bg-green-400' : asoc.estado === 'SUSPENDIDO' ? 'bg-yellow-400' : 'bg-red-400'
            }`}></span>
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-white font-display">
              {asoc.primerNombre} {asoc.segundoNombre || ''} {asoc.primerApellido} {asoc.segundoApellido || ''}
            </h1>
            <p className="text-sm font-mono text-[#d9a74a] font-medium mt-1">C.C. {asoc.numeroIdentificacion}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-xs text-[#eaedfa]/70">
              <span className="flex items-center space-x-1.5">
                <Briefcase size={14} className="text-[#123499]" />
                <span>{asoc.cargo.nombre}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <MapPin size={14} className="text-red-400" />
                <span>{asoc.centroTrabajo.nombreCliente}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Indicadores de Cumplimiento SST */}
        <div className="bg-[#00072d]/40 border border-white/5 p-4 rounded-xl flex items-center gap-6 self-stretch md:self-auto justify-around">
          <div className="text-center">
            <span className="text-[9px] uppercase tracking-widest text-[#eaedfa]/50 block font-semibold mb-1">Psicofísico</span>
            {asoc.psicofisicoVigente ? (
              <span className="text-green-400 text-xs font-bold flex items-center justify-center space-x-1">
                <CheckCircle size={14} />
                <span>VIGENTE</span>
              </span>
            ) : (
              <span className="text-red-400 text-xs font-bold flex items-center justify-center space-x-1">
                <XCircle size={14} />
                <span>VENCIDO</span>
              </span>
            )}
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="text-center">
            <span className="text-[9px] uppercase tracking-widest text-[#eaedfa]/50 block font-semibold mb-1">Psicosensom.</span>
            {asoc.psicosensometricoVigente ? (
              <span className="text-green-400 text-xs font-bold flex items-center justify-center space-x-1">
                <CheckCircle size={14} />
                <span>VIGENTE</span>
              </span>
            ) : (
              <span className="text-red-400 text-xs font-bold flex items-center justify-center space-x-1">
                <XCircle size={14} />
                <span>VENCIDO</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {[
          { id: 'personales', label: 'Datos Personales', icon: User },
          { id: 'laborales', label: 'Laboral e Historial', icon: Briefcase },
          { id: 'documentos', label: 'Documentos Adjuntos', icon: FileText },
          { id: 'alertas', label: 'Alertas y Notificaciones', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-semibold text-xs tracking-wide transition-colors ${
                activeTab === tab.id
                  ? 'border-[#d9a74a] text-white bg-white/5'
                  : 'border-transparent text-[#eaedfa]/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido de Pestañas */}
      <div className="glass-panel p-6 rounded-xl border border-white/5">
        {/* TABA: DATOS PERSONALES */}
        {activeTab === 'personales' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Bloque Identidad */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1">Identidad</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Tipo Documento:</span> <span className="font-semibold text-white">{asoc.tipoDocumento}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Identificación:</span> <span className="font-semibold text-white font-mono">{asoc.numeroIdentificacion}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Fecha Expedición:</span> <span className="font-semibold text-white">{formatFecha(asoc.fechaExpedicionCedula)}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Fecha Nacimiento:</span> <span className="font-semibold text-white">{formatFecha(asoc.fechaNacimiento)}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Edad Actual:</span> <span className="font-semibold text-white">{asoc.edadActual} años</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Sexo al Nacer:</span> <span className="font-semibold text-white">{asoc.sexoAlNacer || 'No registrado'}</span></div>
                </div>
              </div>

              {/* Bloque Contacto */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1">Contacto</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center"><span className="text-[#eaedfa]/50">Celular:</span> <span className="font-semibold text-white flex items-center space-x-1"><Phone size={10}/> <span>{asoc.celular}</span></span></div>
                  <div className="flex justify-between items-center"><span className="text-[#eaedfa]/50">Teléfono Fijo:</span> <span className="font-semibold text-white">{asoc.telefonoFijo || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[#eaedfa]/50">Correo:</span> <span className="font-semibold text-white flex items-center space-x-1"><Mail size={10}/> <span className="lowercase">{asoc.correoElectronico || 'N/A'}</span></span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Dirección:</span> <span className="font-semibold text-white truncate max-w-[150px]" title={asoc.direccion}>{asoc.direccion || 'N/A'}</span></div>
                </div>
              </div>

              {/* Bloque Demográfico / Sensible */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1">Demográfico (Protegido Ley 1581)</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Género:</span> <span className="font-semibold text-white">{asoc.genero ? asoc.genero.valor : 'No registrado'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Orientación Sexual:</span> <span className="font-semibold text-white">{asoc.orientacionSexual ? asoc.orientacionSexual.valor : 'No registrado'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Raza / Etnia:</span> <span className="font-semibold text-white">{asoc.raza ? asoc.raza.valor : 'No registrado'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Religión:</span> <span className="font-semibold text-white">{asoc.religion ? asoc.religion.valor : 'No registrado'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">RH Sangre:</span> <span className="font-semibold text-white">{asoc.rh ? asoc.rh.valor : 'No registrado'}</span></div>
                </div>
              </div>

              {/* Bloque Vivienda y Educación */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1">Hogar y Estudios</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Estado Civil:</span> <span className="font-semibold text-white">{asoc.estadoCivil || 'No registrado'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Número Hijos:</span> <span className="font-semibold text-white">{asoc.numeroHijos}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Vivienda:</span> <span className="font-semibold text-white">{asoc.tipoVivienda || 'No registrado'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Estrato:</span> <span className="font-semibold text-white">{asoc.estrato || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Nivel de Estudio:</span> <span className="font-semibold text-white">{asoc.nivelEstudio || 'No registrado'}</span></div>
                </div>
              </div>

              {/* Bloque Emergencias */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1">Contacto Emergencia</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Nombre:</span> <span className="font-semibold text-white">{asoc.contactoEmergenciaNombre || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Parentesco:</span> <span className="font-semibold text-white">{asoc.contactoEmergenciaParentesco || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Celular:</span> <span className="font-semibold text-white">{asoc.contactoEmergenciaTelefono || 'N/A'}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABA: DATOS LABORALES */}
        {activeTab === 'laborales' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información de Contrato */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1">Contrato y Ingreso</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Fecha Ingreso:</span> <span className="font-semibold text-white">{formatFecha(asoc.fechaIngreso)}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Edad al Ingreso:</span> <span className="font-semibold text-white">{asoc.edadIngreso} años</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Antigüedad General:</span> <span className="font-semibold text-white">{asoc.antiguedadEmpresaAnios} años</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Compensación Ordinaria:</span> <span className="font-semibold text-white">${asoc.compensacionOrdinaria.toLocaleString()} COP</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Promedio Salarial:</span> <span className="font-semibold text-white">${asoc.promedioSalarialMensual.toLocaleString()} COP</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Rango de Ingresos:</span> <span className="font-semibold text-white">{asoc.rangoIngresos || 'N/A'}</span></div>
                </div>
              </div>

              {/* Seguro y Escuela */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1">Seguridad Social y Certificaciones</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">EPS:</span> <span className="font-semibold text-white">{asoc.eps ? asoc.eps.valor : 'No registrado'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Fondo Pensión:</span> <span className="font-semibold text-white">{asoc.fondoPension ? asoc.fondoPension.valor : 'No registrado'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Cuenta Bancaria:</span> <span className="font-semibold text-white">{asoc.cuentaBancaria || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Funeraria:</span> <span className="font-semibold text-white">{asoc.funeraria || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Póliza SURA:</span> <span className="font-semibold text-white">{asoc.tienePolizaSura ? 'SÍ' : 'NO'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">Código Curso Vigilancia:</span> <span className="font-semibold text-white">{asoc.codigoCurso || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">NIT Escuela:</span> <span className="font-semibold text-white">{asoc.nitEscuela || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[#eaedfa]/50">N.º Certificado Escuela:</span> <span className="font-semibold text-white">{asoc.numeroCertificadoCurso || 'N/A'}</span></div>
                </div>
              </div>
            </div>

            {/* Historial de Cambios de Cargo */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1">Historial de Cargos</h3>
              {asoc.cambiosCargo.length === 0 ? (
                <p className="text-xs text-[#eaedfa]/50">No hay cambios de cargo registrados.</p>
              ) : (
                <div className="relative border-l border-white/10 ml-2.5 pl-6 space-y-4">
                  {asoc.cambiosCargo.map(cambio => (
                    <div key={cambio.id} className="relative">
                      <span className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#123499] border-2 border-[#00072d]"></span>
                      <div className="text-xs">
                        <span className="font-semibold text-white">{cambio.cargo.nombre}</span>
                        <span className="text-[#eaedfa]/40 text-[10px] ml-2">{formatFecha(cambio.fechaCambio)}</span>
                        <p className="text-[#eaedfa]/60 text-[10px] mt-0.5">{cambio.motivoCambio || 'Cambio registrado en el sistema'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TABA: DOCUMENTOS ADJUNTOS */}
        {activeTab === 'documentos' && (
          <div className="space-y-6">
            {/* Formulario de Carga */}
            {(user.rol === 'ADMIN' || user.rol === 'GESTION_HUMANA' || user.rol === 'SST') && (
              <form onSubmit={handleFileUpload} className="bg-[#00072d]/40 border border-white/5 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#eaedfa]/60 mb-1">Tipo de Documento</label>
                  <select
                    className="w-full bg-[#051650] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                    value={tipoDocUpload}
                    onChange={(e) => setTipoDocUpload(e.target.value)}
                  >
                    <option value="CEDULA">Cédula Ciudadanía</option>
                    <option value="CERTIFICADO_CURSO">Certificado Curso Vigilancia</option>
                    <option value="EXAMEN_PSICOFISICO">Examen Psicofísico</option>
                    <option value="EXAMEN_PSICOSENSOMETRICO">Examen Psicosensométrico</option>
                    <option value="POLIZA_SURA">Póliza SURA</option>
                    <option value="CONTRATO">Contrato Laboral</option>
                    <option value="ACTA">Acta de Ingreso</option>
                    <option value="OTRO">Otro Documento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#eaedfa]/60 mb-1">Fecha de Vencimiento (Si aplica)</label>
                  <input
                    type="date"
                    className="w-full bg-[#051650] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none"
                    value={fechaVencUpload}
                    onChange={(e) => setFechaVencUpload(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#eaedfa]/60 mb-1">Archivo (PDF o Imagen)</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,image/*"
                    className="w-full bg-[#051650] border border-white/10 rounded-lg p-1 text-[10px] text-white focus:outline-none"
                    onChange={(e) => setFileInput(e.target.files[0])}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full flex items-center justify-center space-x-1 bg-[#123499] hover:bg-[#123499]/85 text-xs font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                  >
                    <Upload size={14} />
                    <span>{uploading ? 'Subiendo...' : 'Cargar'}</span>
                  </button>
                </div>

                {uploadError && (
                  <div className="col-span-1 sm:col-span-4 text-red-400 text-xs mt-1 text-center font-medium">
                    {uploadError}
                  </div>
                )}
              </form>
            )}

            {/* Listado de Documentos */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1">Documentos Cargados</h3>
              {asoc.documentos.length === 0 ? (
                <p className="text-xs text-[#eaedfa]/50">No hay documentos registrados para este asociado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {asoc.documentos.map(doc => (
                    <div key={doc.id} className="bg-[#00072d]/30 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                      <div className="space-y-1 overflow-hidden pr-3">
                        <span className="bg-[#123499]/20 text-[#123499] text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                          {doc.tipoDocumento.replace('_', ' ')}
                        </span>
                        <h4 className="text-xs font-semibold text-white truncate max-w-[200px]" title={doc.archivoUrl.split('/').pop()}>
                          {doc.archivoUrl.split('/').pop().slice(13)} {/* Cortar el timestamp del nombre */}
                        </h4>
                        <div className="text-[10px] text-[#eaedfa]/50 space-y-0.5">
                          <div>Cargado el: {formatFecha(doc.fechaCarga)}</div>
                          {doc.fechaVencimiento && (
                            <div className="flex items-center space-x-1">
                              <Calendar size={10} />
                              <span className={new Date(doc.fechaVencimiento) < new Date() ? 'text-red-400 font-bold' : ''}>
                                Vence: {formatFecha(doc.fechaVencimiento)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <a
                          href={`${BACKEND_URL}${doc.archivoUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Descargar / Ver"
                          className="p-1.5 bg-[#00072d]/60 hover:bg-[#123499] border border-white/10 rounded-lg text-white transition-colors"
                        >
                          <Download size={14} />
                        </a>
                        {(user.rol === 'ADMIN' || user.rol === 'GESTION_HUMANA' || user.rol === 'SST') && (
                          <button
                            onClick={() => handleDocDelete(doc.id)}
                            title="Eliminar"
                            className="p-1.5 bg-[#00072d]/60 hover:bg-red-500/20 border border-white/10 rounded-lg text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TABA: ALERTAS */}
        {activeTab === 'alertas' && (
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1">Alertas Activas e Historial</h3>
            {asoc.alertas.length === 0 ? (
              <p className="text-xs text-[#eaedfa]/50">No se registran alertas para este asociado.</p>
            ) : (
              <div className="space-y-3">
                {asoc.alertas.map(al => (
                  <div 
                    key={al.id} 
                    className={`border p-4 rounded-xl flex items-center justify-between ${
                      al.estado === 'PENDIENTE' 
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' 
                        : 'bg-green-500/10 border-green-500/20 text-green-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <AlertTriangle size={18} />
                      <div className="text-xs">
                        <span className="font-bold uppercase tracking-wider block">
                          {al.tipoAlerta.replace('_', ' ')}
                        </span>
                        <span className="text-white/60 text-[10px] block mt-0.5">
                          Fecha Vencimiento: {formatFecha(al.fechaVencimiento)}
                        </span>
                      </div>
                    </div>

                    {al.estado === 'PENDIENTE' && (user.rol === 'ADMIN' || user.rol === 'GESTION_HUMANA' || user.rol === 'SST') && (
                      <button
                        onClick={() => handleResolverAlerta(al.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-[#00072d] font-bold text-[10px] py-1.5 px-3 rounded-lg transition-all shadow"
                      >
                        Marcar Resuelta
                      </button>
                    )}
                    {al.estado === 'RESUELTA' && (
                      <span className="text-[10px] uppercase font-bold tracking-wide flex items-center space-x-1">
                        <CheckCircle size={12} />
                        <span>Resuelta</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
