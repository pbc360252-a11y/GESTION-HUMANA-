import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Star, AlertTriangle } from 'lucide-react';
import { API_URL } from '../App';

export default function RetiroFlow({ token, user, asociadoId, navigateTo }) {
  const [asoc, setAsoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Catálogos de retiro
  const [motivos, setMotivos] = useState([]);
  const [razones, setRazones] = useState([]);

  // Estado del Formulario de Retiro
  const [formData, setFormData] = useState({
    fechaRetiro: new Date().toISOString().split('T')[0],
    motivoRetiroId: '',
    razonRetiroId: '',
    liquidacionEstado: 'PENDIENTE',
    encuestaAmbienteFisico: 3,
    encuestaInduccion: 3,
    encuestaReinduccion: 3,
    encuestaCapacitacion: 3,
    encuestaMotivacionGrupo: 3,
    encuestaReconocimiento: 3,
    encuestaCompensaciones: 3,
    queMenosLeGustaba: '',
    volveriaATrabajar: 'SI',
    observaciones: ''
  });

  useEffect(() => {
    // Cargar datos del asociado
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

    // Cargar motivos de retiro
    fetch(`${API_URL}/catalogos/valores/MOTIVO_RETIRO`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMotivos(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, motivoRetiroId: data[0].id }));
      })
      .catch(console.error);

    // Cargar razones de retiro
    fetch(`${API_URL}/catalogos/valores/RAZON_RETIRO`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setRazones(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, razonRetiroId: data[0].id }));
      })
      .catch(console.error);
  }, [asociadoId, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (field, rating) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    fetch(`${API_URL}/retiros/asociado/${asociadoId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.mensaje || 'Error al retirar') });
        return res.json();
      })
      .then(() => {
        navigateTo('asociado_detalle', { id: asociadoId });
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  if (loading || !asoc) {
    return <p className="text-center py-10 text-xs">Cargando...</p>;
  }

  // Preguntas de la encuesta con sus llaves de estado
  const preguntasEncuesta = [
    { key: 'encuestaAmbienteFisico', label: 'Ambiente físico de trabajo' },
    { key: 'encuestaInduccion', label: 'Inducción inicial recibida' },
    { key: 'encuestaReinduccion', label: 'Reinducciones periódicas recibidas' },
    { key: 'encuestaCapacitacion', label: 'Capacitaciones normativas y técnicas' },
    { key: 'encuestaMotivacionGrupo', label: 'Motivación y clima del grupo de trabajo' },
    { key: 'encuestaReconocimiento', label: 'Reconocimiento a su labor' },
    { key: 'encuestaCompensaciones', label: 'Compensaciones, comisiones o recargos' },
  ];

  return (
    <div className="space-y-5 max-w-3xl mx-auto animate-fade-in">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigateTo('asociado_detalle', { id: asociadoId })}
          className="flex items-center space-x-2 text-[#eaedfa]/70 hover:text-white transition-colors text-xs font-semibold"
        >
          <ArrowLeft size={16} />
          <span>Volver al perfil</span>
        </button>

        <h1 className="text-xl font-bold text-red-400">Procesar Retiro de Asociado</h1>
      </div>

      <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-center space-x-3 text-xs leading-relaxed">
        <AlertTriangle size={24} className="shrink-0" />
        <div>
          <strong>ATENCIÓN:</strong> El asociado <strong>{asoc.primerNombre} {asoc.primerApellido}</strong> será marcado como <strong>RETIRADO</strong>. 
          Se congelará su cálculo de antigüedad laboral y se bloqueará la edición de esta encuesta después de 30 días. 
          Esta acción no elimina los datos del asociado.
        </div>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs p-3 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PARTE A: DETALLES DEL RETIRO */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
          <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1.5">Datos del Retiro</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Fecha de Retiro *</label>
              <input
                type="date"
                required
                name="fechaRetiro"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                value={formData.fechaRetiro}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Motivo Retiro *</label>
              <select
                name="motivoRetiroId"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                value={formData.motivoRetiroId}
                onChange={handleChange}
              >
                {motivos.map(m => (
                  <option key={m.id} value={m.id}>{m.valor}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Razon del Retiro *</label>
              <select
                name="razonRetiroId"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                value={formData.razonRetiroId}
                onChange={handleChange}
              >
                {razones.map(r => (
                  <option key={r.id} value={r.id}>{r.valor}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1">Estado de Liquidación</label>
              <select
                name="liquidacionEstado"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                value={formData.liquidacionEstado}
                onChange={handleChange}
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="EN_PROCESO">EN PROCESO</option>
                <option value="LIQUIDADO">OK - LIQUIDADO</option>
              </select>
            </div>
          </div>
        </div>

        {/* PARTE B: ENCUESTA DE SALIDA */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-5">
          <div>
            <h3 className="text-xs uppercase font-bold text-[#d9a74a] tracking-wider border-b border-white/5 pb-1.5">Encuesta de Salida (Calificación de 1 a 5)</h3>
            <p className="text-[10px] text-[#eaedfa]/50 mt-1">Evalúa cada uno de los aspectos de tu estancia en Coraza Seguridad CTA.</p>
          </div>

          <div className="space-y-4">
            {preguntasEncuesta.map(preg => (
              <div key={preg.key} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs text-white font-medium">{preg.label}</span>
                <div className="flex items-center space-x-1.5 mt-2 sm:mt-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(preg.key, star)}
                      className="p-1 hover:scale-115 transition-transform"
                    >
                      <Star 
                        size={18} 
                        className={
                          star <= formData[preg.key] 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-[#eaedfa]/20 hover:text-yellow-500/50'
                        } 
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-white/80 ml-2">({formData[preg.key]}/5)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Preguntas Abiertas */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1.5">¿Qué fue lo que MENOS le gustó de trabajar en la cooperativa?</label>
              <textarea
                name="queMenosLeGustaba"
                rows="2"
                placeholder="Escribe tu opinión libremente..."
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                value={formData.queMenosLeGustaba}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1.5 font-bold">¿Volvería a trabajar con nosotros?</label>
              <select
                name="volveriaATrabajar"
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                value={formData.volveriaATrabajar}
                onChange={handleChange}
              >
                <option value="SI">SÍ</option>
                <option value="NO">NO</option>
                <option value="N-A">PREFIERO NO RESPONDER (N/A)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#eaedfa]/60 mb-1.5">Observaciones adicionales</label>
              <textarea
                name="observaciones"
                rows="3"
                placeholder="Escribe cualquier detalle u observación final sobre la liquidación o retiro..."
                className="w-full bg-[#00072d]/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                value={formData.observaciones}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigateTo('asociado_detalle', { id: asociadoId })}
            className="bg-[#00072d]/80 hover:bg-[#00072d] border border-white/10 text-white font-semibold text-xs py-3 px-6 rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-red-500/20 disabled:opacity-50"
          >
            <Send size={14} />
            <span>{loading ? 'Procesando...' : 'Registrar Retiro'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
