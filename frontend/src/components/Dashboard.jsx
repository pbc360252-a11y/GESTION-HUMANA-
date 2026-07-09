import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserMinus, 
  TrendingUp, 
  AlertTriangle,
  FileSpreadsheet, 
  Download,
  Percent
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { API_URL } from '../App';

const COLORS = ['#123499', '#d9a74a', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

export default function Dashboard({ token, user, navigateTo }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar estadísticas:', err);
        setLoading(false);
      });
  }, [token]);

  const handleExportAsociados = () => {
    window.open(`${API_URL}/dashboard/export/asociados?token=${token}`, '_blank');
  };

  const handleExportCumplimiento = () => {
    window.open(`${API_URL}/dashboard/export/cumplimiento?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d9a74a]"></div>
        <p className="mt-4 text-sm text-[#eaedfa]/60">Cargando estadísticas del sistema...</p>
      </div>
    );
  }

  if (!stats) return <p className="text-center py-10">Error al cargar datos del tablero.</p>;

  // Convertir datos demográficos a arreglos para Recharts
  const dataEdad = Object.entries(stats.demograficos.rangosEdad).map(([name, value]) => ({ name, value }));
  const dataAntiguedad = Object.entries(stats.demograficos.rangosAntiguedad).map(([name, value]) => ({ name, value }));
  
  const dataEPS = Object.entries(stats.demograficos.eps)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 EPS

  const dataGenero = Object.entries(stats.demograficos.genero).map(([name, value]) => ({ name, value }));
  
  const dataMotivos = Object.entries(stats.retirosStats.motivos)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 motivos

  const totalAlertas = Object.values(stats.alertasStats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Panel Principal</h1>
          <p className="text-xs text-[#eaedfa]/60">Resumen operativo y demográfico de asociados</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportAsociados}
            className="flex items-center space-x-2 bg-[#051650]/60 hover:bg-[#051650] border border-[#d9a74a]/30 hover:border-[#d9a74a]/60 text-xs font-semibold py-2.5 px-4 rounded-lg transition-all"
          >
            <Download size={14} className="text-[#d9a74a]" />
            <span>Exportar Asociados</span>
          </button>
          <button 
            onClick={handleExportCumplimiento}
            className="flex items-center space-x-2 bg-[#051650]/60 hover:bg-[#051650] border border-[#d9a74a]/30 hover:border-[#d9a74a]/60 text-xs font-semibold py-2.5 px-4 rounded-lg transition-all"
          >
            <FileSpreadsheet size={14} className="text-green-400" />
            <span>Matriz Cumplimiento</span>
          </button>
        </div>
      </div>

      {/* Cards Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Activos */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 flex items-center space-x-4">
          <div className="bg-[#123499]/20 p-3.5 rounded-lg border border-[#123499]/30">
            <Users size={22} className="text-[#123499]" />
          </div>
          <div>
            <span className="text-[10px] text-[#eaedfa]/50 uppercase tracking-wider block font-semibold">Asociados Activos</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{stats.resumen.totalActivos}</span>
          </div>
        </div>

        {/* Suspendidos */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 flex items-center space-x-4">
          <div className="bg-[#d9a74a]/15 p-3.5 rounded-lg border border-[#d9a74a]/30">
            <Users size={22} className="text-[#d9a74a]" />
          </div>
          <div>
            <span className="text-[10px] text-[#eaedfa]/50 uppercase tracking-wider block font-semibold">Suspendidos</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{stats.resumen.totalSuspendidos}</span>
          </div>
        </div>

        {/* Retirados */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 flex items-center space-x-4">
          <div className="bg-red-500/15 p-3.5 rounded-lg border border-red-500/30">
            <UserMinus size={22} className="text-red-400" />
          </div>
          <div>
            <span className="text-[10px] text-[#eaedfa]/50 uppercase tracking-wider block font-semibold">Asociados Retirados</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{stats.resumen.totalRetirados}</span>
          </div>
        </div>

        {/* Alertas */}
        <div 
          onClick={() => navigateTo('matriz', { tab: 'alertas' })}
          className="glass-panel p-5 rounded-xl border border-white/5 flex items-center space-x-4 cursor-pointer hover:border-yellow-500/30 transition-all"
        >
          <div className="bg-yellow-500/15 p-3.5 rounded-lg border border-yellow-500/30">
            <AlertTriangle size={22} className="text-yellow-400" />
          </div>
          <div>
            <span className="text-[10px] text-[#eaedfa]/50 uppercase tracking-wider block font-semibold">Alertas Críticas</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{totalAlertas}</span>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia Rotación */}
        <div className="glass-panel p-5 rounded-xl border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingUp size={16} className="text-[#d9a74a]" />
            <span>Tendencia de Retiros y Rotación</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.retirosStats.tendenciaRotacion}>
                <XAxis dataKey="mes" stroke="#eaedfa" fontSize={10} opacity={0.6} />
                <YAxis stroke="#eaedfa" fontSize={10} opacity={0.6} />
                <Tooltip contentStyle={{ backgroundColor: '#051650', borderColor: '#123499' }} />
                <Legend verticalAlign="top" height={36}/>
                <Line name="Tasa de Rotación (%)" type="monotone" dataKey="tasaRotacion" stroke="#d9a74a" strokeWidth={2} />
                <Line name="Número de Retiros" type="monotone" dataKey="retiros" stroke="#123499" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Motivos Retiro */}
        <div className="glass-panel p-5 rounded-xl border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
            <UserMinus size={16} className="text-red-400" />
            <span>Top 5 Motivos de Retiro</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataMotivos}>
                <XAxis dataKey="name" stroke="#eaedfa" fontSize={10} opacity={0.6} />
                <YAxis stroke="#eaedfa" fontSize={10} opacity={0.6} />
                <Tooltip contentStyle={{ backgroundColor: '#051650', borderColor: '#123499' }} />
                <Bar name="Cantidad" dataKey="value" fill="#123499" radius={[4, 4, 0, 0]}>
                  {dataMotivos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por EPS */}
        <div className="glass-panel p-5 rounded-xl border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4">Top 5 EPS de Asociados Activos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataEPS} layout="vertical">
                <XAxis type="number" stroke="#eaedfa" fontSize={10} opacity={0.6} />
                <YAxis dataKey="name" type="category" stroke="#eaedfa" fontSize={10} opacity={0.6} width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#051650', borderColor: '#123499' }} />
                <Bar name="Asociados" dataKey="value" fill="#d9a74a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Género y Edad */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-semibold text-[#eaedfa]/80 uppercase tracking-wider mb-4">Distribución por Género</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataGenero}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dataGenero.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#051650', borderColor: '#123499' }} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 9 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#eaedfa]/80 uppercase tracking-wider mb-4">Rangos de Edad</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataEdad}>
                  <XAxis dataKey="name" stroke="#eaedfa" fontSize={10} opacity={0.6} />
                  <YAxis stroke="#eaedfa" fontSize={10} opacity={0.6} />
                  <Tooltip contentStyle={{ backgroundColor: '#051650', borderColor: '#123499' }} />
                  <Bar name="Asociados" dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
