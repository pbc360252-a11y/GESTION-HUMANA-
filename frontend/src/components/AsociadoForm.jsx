import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { API_URL } from '../App';

export default function AsociadoForm({ token, user, asociadoId, navigateTo }) {
  const isEdit = !!asociadoId;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Opciones de Catálogos desde BD
  const [cargos, setCargos] = useState([]);
  const [centros, setCentros] = useState([]);
  const [catEPS, setCatEPS] = useState([]);
  const [catFondo, setCatFondo] = useState([]);
  const [catRH, setCatRH] = useState([]);
  const [catGenero, setCatGenero] = useState([]);
  const [catOrientacion, setCatOrientacion] = useState([]);
  const [catReligion, setCatReligion] = useState([]);
  const [catRaza, setCatRaza] = useState([]);
  const [catVivienda, setCatVivienda] = useState([]);
  const [catEstudios, setCatEstudios] = useState([]);
  const [catIngresos, setCatIngresos] = useState([]);
  const [catTransporte, setCatTransporte] = useState([]);
  const [catTraslado, setCatTraslado] = useState([]);

  // Estado del Formulario
  const [formData, setFormData] = useState({
    numeroCarpetaActual: '',
    acta: '',
    tipoDocumento: 'CC',
    numeroIdentificacion: '',
    primerApellido: '',
    segundoApellido: '',
    primerNombre: '',
    segundoNombre: '',
    fechaNacimiento: '',
    fechaExpedicionCedula: '',
    correoElectronico: '',
    direccion: '',
    telefonoFijo: '',
    celular: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaParentesco: '',
    contactoEmergenciaTelefono: '',
    fechaIngreso: '',
    psicofisicoVigente: false,
    psicosensometricoVigente: false,
    compensacionOrdinaria: 0,
    promedioSalarialMensual: 0,
    funeraria: '',
    tienePolizaSura: false,
    cuentaBancaria: '',
    codigoCurso: '',
    nitEscuela: '',
    numeroCertificadoCurso: '',
    sexoAlNacer: 'MASCULINO',
    estadoCivil: 'SOLTERO',
    numeroHijos: 0,
    personasACargo: 0,
    tipoVivienda: '',
    estrato: 1,
    nivelEstudio: '',
    rangoIngresos: '',
    planDeVida: '',
    medioTransporte: '',
    tiempoTraslado: '',
    cargoId: '',
    centroTrabajoId: '',
    epsId: '',
    fondoPensionId: '',
    rhId: '',
    generoId: '',
    orientacionSexualId: '',
    religionId: '',
    razaId: '',
    motivoCambioCargo: '' // Para cambios de cargo
  });

  // Reingreso Especial
  const [esReingreso, setEsReingreso] = useState(false);
  const [originalEstado, setOriginalEstado] = useState('ACTIVO');

  // Cargar Catálogos
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const [rCargos, rCentros, rEps, rFondo, rRh, rGen, rOri, rRel, rRaz, rViv, rEst, rIng, rTra, rTla] = await Promise.all([
          fetch(`${API_URL}/catalogos/cargos`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/centros`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/EPS`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/FONDO_PENSION`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/RH`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/GENERO`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/ORIENTACION_SEXUAL`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/RELIGION`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/RAZA`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/TIPO_VIVIENDA`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/NIVEL_ESTUDIO`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/RANGO_INGRESOS`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/MEDIO_TRANSPORTE`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/catalogos/valores/TIEMPO_TRASLADO`, { headers }).then(r => r.json()),
        ]);

        setCargos(rCargos);
        setCentros(rCentros);
        setCatEPS(rEps);
        setCatFondo(rFondo);
        setCatRH(rRh);
        setCatGenero(rGen);
        setCatOrientacion(rOri);
        setCatReligion(rRel);
        setCatRaza(rRaz);
        setCatVivienda(rViv);
        setCatEstudios(rEst);
        setCatIngresos(rIng);
        setCatTransporte(rTra);
        setCatTraslado(rTla);

        // Preseleccionar primeros valores por defecto
        if (rCargos.length > 0 && !isEdit) {
          setFormData(prev => ({ 
            ...prev, 
            cargoId: rCargos[0].id,
            centroTrabajoId: rCentros[0]?.id || ''
          }));
        }
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
      }
    };

    fetchCatalogos();
  }, [token, isEdit]);

  // Cargar Datos si es Edición
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      fetch(`${API_URL}/asociados/${asociadoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setOriginalEstado(data.estado);
          if (data.estado === 'RETIRADO') {
            setEsReingreso(true);
          }

          // Formatear fechas para input type="date"
          const formatDateForInput = (dStr) => {
            if (!dStr) return '';
            return new Date(dStr).toISOString().split('T')[0];
          };

          setFormData({
            numeroCarpetaActual: data.numeroCarpetaActual || '',
            acta: data.acta || '',
            tipoDocumento: data.tipoDocumento || 'CC',
            numeroIdentificacion: data.numeroIdentificacion || '',
            primerApellido: data.primerApellido || '',
            segundoApellido: data.segundoApellido || '',
            primerNombre: data.primerNombre || '',
            segundoNombre: data.segundoNombre || '',
            fechaNacimiento: formatDateForInput(data.fechaNacimiento),
            fechaExpedicionCedula: formatDateForInput(data.fechaExpedicionCedula),
            correoElectronico: data.correoElectronico || '',
            direccion: data.direccion || '',
            telefonoFijo: data.telefonoFijo || '',
            celular: data.celular || '',
            contactoEmergenciaNombre: data.contactoEmergenciaNombre || '',
            contactoEmergenciaParentesco: data.contactoEmergenciaParentesco || '',
            contactoEmergenciaTelefono: data.contactoEmergenciaTelefono || '',
            fechaIngreso: formatDateForInput(data.fechaIngreso),
            psicofisicoVigente: data.psicofisicoVigente || false,
            psicosensometricoVigente: data.psicosensometricoVigente || false,
            compensacionOrdinaria: data.compensacionOrdinaria || 0,
            promedioSalarialMensual: data.promedioSalarialMensual || 0,
            funeraria: data.funeraria || '',
            tienePolizaSura: data.tienePolizaSura || false,
            cuentaBancaria: data.cuentaBancaria || '',
            codigoCurso: data.codigoCurso || '',
            nitEscuela: data.nitEscuela || '',
            numeroCertificadoCurso: data.numeroCertificadoCurso || '',
            sexoAlNacer: data.sexoAlNacer || 'MASCULINO',
            estadoCivil: data.estadoCivil || 'SOLTERO',
            numeroHijos: data.numeroHijos || 0,
            personasACargo: data.personasACargo || 0,
            tipoVivienda: data.tipoVivienda || '',
            estrato: data.estrato || 1,
            nivelEstudio: data.nivelEstudio || '',
            rangoIngresos: data.rangoIngresos || '',
            planDeVida: data.planDeVida || '',
            medioTransporte: data.medioTransporte || '',
            tiempoTraslado: data.tiempoTraslado || '',
            cargoId: data.cargoId || '',
            centroTrabajoId: data.centroTrabajoId || '',
            epsId: data.epsId || '',
            fondoPensionId: data.fondoPensionId || '',
            rhId: data.rhId || '',
            generoId: data.generoId || '',
            orientacionSexualId: data.orientacionSexualId || '',
            religionId: data.religionId || '',
            razaId: data.razaId || '',
            motivoCambioCargo: ''
          });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [asociadoId, isEdit, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const method = isEdit && !esReingreso ? 'PUT' : 'POST';
    const endpoint = esReingreso 
      ? `${API_URL}/asociados/${asociadoId}/reingresar`
      : isEdit 
        ? `${API_URL}/asociados/${asociadoId}` 
        : `${API_URL}/asociados`;

    // Limpiar campos vacíos de catálogos para evitar FK vacías
    const payload = { ...formData };
    const FKs = ['epsId', 'fondoPensionId', 'rhId', 'generoId', 'orientacionSexualId', 'religionId', 'razaId'];
    FKs.forEach(key => {
      if (payload[key] === '') payload[key] = null;
    });

    fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.mensaje || 'Error al guardar') });
        return res.json();
      })
      .then(data => {
        setSuccess(esReingreso ? 'Asociado reingresado exitosamente' : isEdit ? 'Asociado actualizado exitosamente' : 'Asociado creado exitosamente');
        setLoading(false);
        setTimeout(() => {
          navigateTo('asociado_detalle', { id: data.id || asociadoId });
        }, 1500);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  if (loading && cargos.length === 0) {
    return <p className="text-center py-10 text-xs">Cargando...</p>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigateTo(isEdit ? 'asociado_detalle' : 'asociados', { id: asociadoId })}
          className="flex items-center space-x-2 text-[#eaedfa]/70 hover:text-white transition-colors text-xs font-semibold"
        >
          <ArrowLeft size={16} />
          <span>Cancelar y Volver</span>
        </button>

        <h1 className="text-xl font-bold text-white">
          {esReingreso ? 'Procesar Reingreso de Asociado' : isEdit ? 'Editar Asociado' : 'Registrar Nuevo Asociado'}
        </h1>
      </div>

      {/* Alerta de Reingreso Especial */}
      {esReingreso && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-xl flex items-center space-x-3 text-xs leading-relaxed">
          <AlertTriangle size={24} className="shrink-0" />
          <div>
            <strong>ALERTA DE REINGRESO:</strong> Este asociado se encuentra en estado <strong>RETIRADO</strong>. 
            Completar este formulario reactivará su registro asignándole una nueva carpeta y fecha de ingreso, 
            preservando su historial anterior.
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs p-3 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/15 border border-green-500/30 text-green-300 text-xs p-3 rounded-lg text-center font-medium animate-pulse">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: DATOS BÁSICOS DE IDENTIDAD */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
          <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1.5">1. Identidad y Datos Básicos</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Primer Nombre *</label>
              <input
                type="text"
                required
                name="primerNombre"
                disabled={user.rol === 'SST'}
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499] disabled:opacity-50"
                value={formData.primerNombre}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Segundo Nombre</label>
              <input
                type="text"
                name="segundoNombre"
                disabled={user.rol === 'SST'}
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499] disabled:opacity-50"
                value={formData.segundoNombre}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Primer Apellido *</label>
              <input
                type="text"
                required
                name="primerApellido"
                disabled={user.rol === 'SST'}
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499] disabled:opacity-50"
                value={formData.primerApellido}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Segundo Apellido</label>
              <input
                type="text"
                name="segundoApellido"
                disabled={user.rol === 'SST'}
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499] disabled:opacity-50"
                value={formData.segundoApellido}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Tipo Documento *</label>
              <select
                name="tipoDocumento"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499]"
                value={formData.tipoDocumento}
                onChange={handleChange}
              >
                <option value="CC">Cédula Ciudadanía (CC)</option>
                <option value="CE">Cédula Extranjería (CE)</option>
                <option value="PA">Pasaporte (PA)</option>
                <option value="PEP">Permiso Especial Permanente (PEP)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">N.º Identificación *</label>
              <input
                type="text"
                required
                name="numeroIdentificacion"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499]"
                value={formData.numeroIdentificacion}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Fecha Expedición</label>
              <input
                type="date"
                name="fechaExpedicionCedula"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#123499]"
                value={formData.fechaExpedicionCedula}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Fecha Nacimiento *</label>
              <input
                type="date"
                required
                name="fechaNacimiento"
                disabled={user.rol === 'SST'}
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#123499] disabled:opacity-50"
                value={formData.fechaNacimiento}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: DATOS LABORALES */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
          <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1.5">2. Ubicación y Datos Laborales</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">N.º Carpeta Actual</label>
              <input
                type="number"
                name="numeroCarpetaActual"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499]"
                value={formData.numeroCarpetaActual}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Acta de Ingreso</label>
              <input
                type="text"
                name="acta"
                placeholder="ACTA 0001 - DD-MM-YYYY"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499]"
                value={formData.acta}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Fecha Ingreso *</label>
              <input
                type="date"
                required
                name="fechaIngreso"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#123499]"
                value={formData.fechaIngreso}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Cargo *</label>
              <select
                name="cargoId"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499]"
                value={formData.cargoId}
                onChange={handleChange}
              >
                {cargos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.esCritico ? '(Crítico)' : ''}</option>
                ))}
              </select>
            </div>

            {isEdit && formData.cargoId !== asociadoId && (
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-yellow-400 mb-1">Motivo del Cambio de Cargo</label>
                <input
                  type="text"
                  name="motivoCambioCargo"
                  placeholder="Ej: Ascenso, Reubicación médica, etc."
                  className="w-full bg-[#00072d]/60 border border-yellow-500/30 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
                  value={formData.motivoCambioCargo}
                  onChange={handleChange}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Centro de Trabajo *</label>
              <select
                name="centroTrabajoId"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499]"
                value={formData.centroTrabajoId}
                onChange={handleChange}
              >
                {centros.map(c => (
                  <option key={c.id} value={c.id}>{c.codigo} - {c.nombreCliente}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Compensación Ordinaria</label>
              <input
                type="number"
                name="compensacionOrdinaria"
                disabled={user.rol === 'SST'}
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499] disabled:opacity-50"
                value={formData.compensacionOrdinaria}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Promedio Salarial Mensual</label>
              <input
                type="number"
                name="promedioSalarialMensual"
                disabled={user.rol === 'SST'}
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#123499] disabled:opacity-50"
                value={formData.promedioSalarialMensual}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: DATOS SOCIODEMOGRÁFICOS Y SENSIBLES */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
          <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1.5">3. Datos Sociodemográficos y Sensibles</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">RH Sangre</label>
              <select name="rhId" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.rhId} onChange={handleChange}>
                <option value="">No Registra</option>
                {catRH.map(v => <option key={v.id} value={v.id}>{v.valor}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Género</label>
              <select name="generoId" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.generoId} onChange={handleChange}>
                <option value="">No Registra</option>
                {catGenero.map(v => <option key={v.id} value={v.id}>{v.valor}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Orientación Sexual</label>
              <select name="orientacionSexualId" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.orientacionSexualId} onChange={handleChange}>
                <option value="">No Registra</option>
                {catOrientacion.map(v => <option key={v.id} value={v.id}>{v.valor}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Religión</label>
              <select name="religionId" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.religionId} onChange={handleChange}>
                <option value="">No Registra</option>
                {catReligion.map(v => <option key={v.id} value={v.id}>{v.valor}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Raza / Etnia</label>
              <select name="razaId" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.razaId} onChange={handleChange}>
                <option value="">No Registra</option>
                {catRaza.map(v => <option key={v.id} value={v.id}>{v.valor}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Sexo al Nacer</label>
              <select name="sexoAlNacer" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.sexoAlNacer} onChange={handleChange}>
                <option value="MASCULINO">MASCULINO</option>
                <option value="FEMENINO">FEMENINO</option>
                <option value="OTRO">OTRO</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Estado Civil</label>
              <select name="estadoCivil" disabled={user.rol === 'SST'} className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none disabled:opacity-50" value={formData.estadoCivil} onChange={handleChange}>
                <option value="SOLTERO">SOLTERO(A)</option>
                <option value="CASADO">CASADO(A)</option>
                <option value="UNION_LIBRE">UNIÓN LIBRE</option>
                <option value="DIVORCIADO">DIVORCIADO(A)</option>
                <option value="VIUDO">VIUDO(A)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Nivel de Estudio</label>
              <select name="nivelEstudio" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.nivelEstudio} onChange={handleChange}>
                <option value="">No Registra</option>
                {catEstudios.map(v => <option key={v.valor} value={v.valor}>{v.valor}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: INFORMACIÓN DE CONTACTO Y COMPLEMENTOS */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
          <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1.5">4. Datos de Contacto y Complementos</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Celular *</label>
              <input type="text" required name="celular" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.celular} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Teléfono Fijo</label>
              <input type="text" name="telefonoFijo" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.telefonoFijo} onChange={handleChange} />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Dirección Residencia</label>
              <input type="text" name="direccion" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.direccion} onChange={handleChange} />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Correo Electrónico</label>
              <input type="email" name="correoElectronico" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.correoElectronico} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">EPS</label>
              <select name="epsId" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.epsId} onChange={handleChange}>
                <option value="">No Registra</option>
                {catEPS.map(v => <option key={v.id} value={v.id}>{v.valor}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Fondo Pensión</label>
              <select name="fondoPensionId" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.fondoPensionId} onChange={handleChange}>
                <option value="">No Registra</option>
                {catFondo.map(v => <option key={v.id} value={v.id}>{v.valor}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: BENEFICIOS, CURSOS Y CONTROL SST */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
          <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1.5">5. Beneficios, Cursos y Control SST</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Funeraria</label>
              <input type="text" name="funeraria" placeholder="Ej: Nazareno, Los Olivos" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.funeraria} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Cuenta Bancaria (Davivienda)</label>
              <input type="text" name="cuentaBancaria" placeholder="Número de cuenta" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.cuentaBancaria} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Código del Curso</label>
              <input type="text" name="codigoCurso" placeholder="Código del curso" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.codigoCurso} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">NIT Escuela</label>
              <input type="text" name="nitEscuela" placeholder="NIT de la Escuela" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.nitEscuela} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">N.º Certificado Escuela</label>
              <input type="text" name="numeroCertificadoCurso" placeholder="Número de certificado" className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none" value={formData.numeroCertificadoCurso} onChange={handleChange} />
            </div>

            <div className="flex items-center space-x-3 bg-[#00072d]/40 border border-white/5 rounded-lg p-2.5">
              <input type="checkbox" id="tienePolizaSura" name="tienePolizaSura" checked={formData.tienePolizaSura} onChange={handleChange} className="rounded border-white/10 text-[#123499] focus:ring-0 focus:ring-offset-0" />
              <label htmlFor="tienePolizaSura" className="text-[10px] uppercase font-bold text-[#eaedfa]/80 cursor-pointer">Póliza SURA</label>
            </div>

            <div className="flex items-center space-x-3 bg-[#00072d]/40 border border-white/5 rounded-lg p-2.5">
              <input type="checkbox" id="psicofisicoVigente" name="psicofisicoVigente" checked={formData.psicofisicoVigente} onChange={handleChange} className="rounded border-white/10 text-[#123499] focus:ring-0 focus:ring-offset-0" />
              <label htmlFor="psicofisicoVigente" className="text-[10px] uppercase font-bold text-[#eaedfa]/80 cursor-pointer">Psicofísico Vigente</label>
            </div>

            <div className="flex items-center space-x-3 bg-[#00072d]/40 border border-white/5 rounded-lg p-2.5">
              <input type="checkbox" id="psicosensometricoVigente" name="psicosensometricoVigente" checked={formData.psicosensometricoVigente} onChange={handleChange} className="rounded border-white/10 text-[#123499] focus:ring-0 focus:ring-offset-0" />
              <label htmlFor="psicosensometricoVigente" className="text-[10px] uppercase font-bold text-[#eaedfa]/80 cursor-pointer">Psicosensom. Vigente</label>
            </div>
          </div>
        </div>

        {/* ACCIÓN GUARDAR */}
        <div className="flex justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigateTo(isEdit ? 'asociado_detalle' : 'asociados', { id: asociadoId })}
            className="bg-[#00072d]/80 hover:bg-[#00072d] border border-white/10 text-white font-semibold text-xs py-3 px-6 rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 bg-[#123499] hover:bg-[#123499]/85 text-white font-bold text-xs py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-[#123499]/30 disabled:opacity-50"
          >
            {esReingreso ? <RefreshCw size={14} /> : <Save size={14} />}
            <span>{loading ? 'Guardando...' : esReingreso ? 'Confirmar Reingreso' : 'Guardar Asociado'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
