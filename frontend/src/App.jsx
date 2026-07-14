import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronDown,
  User as UserIcon,
  Bell,
  CalendarDays
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import AsociadosList from './components/AsociadosList';
import AsociadoProfile from './components/AsociadoProfile';
import AsociadoForm from './components/AsociadoForm';
import RetiroFlow from './components/RetiroFlow';
import MatrixAndAlerts from './components/MatrixAndAlerts';
import ExcelImporter from './components/ExcelImporter';
import AdminPanel from './components/AdminPanel';
import AusentismoPanel from './components/AusentismoPanel';

export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : '/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewParams, setViewParams] = useState({});
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // Cargar perfil del usuario si hay token
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Sesión expirada');
          return res.json();
        })
        .then(data => {
          setUser(data);
        })
        .catch(err => {
          console.error(err);
          handleLogout();
        });
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: loginEmail, password: loginPassword })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setToken(data.token);
        } else {
          setLoginError(data.mensaje || 'Error al iniciar sesión');
        }
      })
      .catch(err => {
        console.error(err);
        setLoginError('Error de conexión con el servidor');
      });
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setCurrentView('dashboard');
    setViewParams({});
  };

  const navigateTo = (view, params = {}) => {
    setCurrentView(view);
    setViewParams(params);
  };

  // Renderizador de Vistas
  const renderContent = () => {
    if (!user) return null;

    switch (currentView) {
      case 'dashboard':
        return <Dashboard token={token} user={user} navigateTo={navigateTo} />;
      case 'asociados':
        return <AsociadosList token={token} user={user} navigateTo={navigateTo} />;
      case 'asociado_detalle':
        return <AsociadoProfile token={token} user={user} asociadoId={viewParams.id} navigateTo={navigateTo} />;
      case 'asociado_form':
        return <AsociadoForm token={token} user={user} asociadoId={viewParams.id} navigateTo={navigateTo} />;
      case 'retiro':
        return <RetiroFlow token={token} user={user} asociadoId={viewParams.id} navigateTo={navigateTo} />;
      case 'matriz':
        return <MatrixAndAlerts token={token} user={user} navigateTo={navigateTo} tabInicial={viewParams.tab || 'matriz'} />;
      case 'ausentismo':
        return <AusentismoPanel token={token} user={user} navigateTo={navigateTo} />;
      case 'importar':
        return <ExcelImporter token={token} user={user} navigateTo={navigateTo} />;
      case 'admin_catalogos':
        return <AdminPanel token={token} user={user} tab="catalogos" />;
      case 'admin_usuarios':
        return <AdminPanel token={token} user={user} tab="usuarios" />;
      case 'admin_auditoria':
        return <AdminPanel token={token} user={user} tab="auditoria" />;
      default:
        return <Dashboard token={token} user={user} navigateTo={navigateTo} />;
    }
  };

  // Pantalla de Login si no hay usuario autenticado
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-[#00072d] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#123499] opacity-10 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#d9a74a] opacity-5 blur-[120px]"></div>

        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl animate-fade-in z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-[#d9a74a] shadow-lg bg-[#00072d] flex items-center justify-center mb-3">
              <img src="/logo.png" alt="Logo Coraza" className="h-[105%] w-[105%] max-w-none object-cover scale-105" />
            </div>
            <h1 className="text-2xl font-bold font-display text-white tracking-wide text-center">CORAZA SEGURIDAD</h1>
            <p className="text-xs text-[#eaedfa]/60 mt-1 uppercase tracking-widest">Sistema de Gestión Humana</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-sm p-3 rounded-lg text-center">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#eaedfa]/80 mb-2 font-medium">Correo Electrónico</label>
              <input
                type="email"
                required
                className="w-full bg-[#051650]/60 border border-white/10 rounded-lg p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#d9a74a]/50 transition-colors"
                placeholder="ejemplo@coraza.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#eaedfa]/80 mb-2 font-medium">Contraseña</label>
              <input
                type="password"
                required
                className="w-full bg-[#051650]/60 border border-white/10 rounded-lg p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#d9a74a]/50 transition-colors"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#123499] hover:bg-[#123499]/80 border border-[#d9a74a]/30 hover:border-[#d9a74a]/60 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#123499]/20"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-8 text-center text-[10px] text-[#eaedfa]/40 border-t border-white/5 pt-4">
            Coraza Seguridad CTA &copy; {new Date().getFullYear()} <br />
            Protección de Datos conforme a la Ley 1581 de 2012
          </div>
        </div>
      </div>
    );
  }

  // Layout del Dashboard Autenticado
  return (
    <div className="min-h-screen bg-[#00072d] text-[#eaedfa] flex">
      {/* SIDEBAR */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-[#051650]/80 border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out z-20 shrink-0`}
      >
        {/* Cabecera Sidebar */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-[#d9a74a]/40 shadow bg-[#00072d] flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Logo" className="h-[105%] w-[105%] max-w-none object-cover scale-105" />
            </div>
            {isSidebarOpen && (
              <div className="truncate">
                <span className="font-bold text-white text-sm block tracking-wider">CORAZA</span>
                <span className="text-[9px] text-[#eaedfa]/50 uppercase tracking-widest block">Seguridad CTA</span>
              </div>
            )}
          </div>
        </div>

        {/* Info de Usuario logueado */}
        {isSidebarOpen && (
          <div className="p-4 border-b border-white/5 bg-[#00072d]/30">
            <div className="flex items-center space-x-3">
              <div className="bg-[#123499] p-2 rounded-full border border-[#d9a74a]/30">
                <UserIcon size={18} className="text-white" />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-semibold text-xs text-white truncate">{user.nombre}</h4>
                <p className="text-[9px] text-[#d9a74a] font-medium tracking-wide uppercase mt-0.5">{user.rol.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menú de Navegación */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              currentView === 'dashboard'
                ? 'bg-[#123499] text-white border-l-4 border-[#d9a74a]'
                : 'text-[#eaedfa]/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} />
            {isSidebarOpen && <span className="text-xs font-medium">Panel Principal</span>}
          </button>

          {/* Asociados */}
          <button
            onClick={() => navigateTo('asociados')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              currentView === 'asociados' || currentView === 'asociado_detalle' || currentView === 'asociado_form' || currentView === 'retiro'
                ? 'bg-[#123499] text-white border-l-4 border-[#d9a74a]'
                : 'text-[#eaedfa]/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users size={18} />
            {isSidebarOpen && <span className="text-xs font-medium">Asociados</span>}
          </button>

          {/* Matriz y Alertas */}
          <button
            onClick={() => navigateTo('matriz')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              currentView === 'matriz'
                ? 'bg-[#123499] text-white border-l-4 border-[#d9a74a]'
                : 'text-[#eaedfa]/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShieldCheck size={18} />
            {isSidebarOpen && <span className="text-xs font-medium">Cumplimiento y Alertas</span>}
          </button>

          {/* Ausentismo */}
          <button
            onClick={() => navigateTo('ausentismo')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              currentView === 'ausentismo'
                ? 'bg-[#123499] text-white border-l-4 border-[#d9a74a]'
                : 'text-[#eaedfa]/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <CalendarDays size={18} />
            {isSidebarOpen && <span className="text-xs font-medium">Ausentismo</span>}
          </button>

          {/* Importador Excel (ADMIN y GESTION_HUMANA) */}
          {(user.rol === 'ADMIN' || user.rol === 'GESTION_HUMANA') && (
            <button
              onClick={() => navigateTo('importar')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                currentView === 'importar'
                  ? 'bg-[#123499] text-white border-l-4 border-[#d9a74a]'
                  : 'text-[#eaedfa]/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <FileSpreadsheet size={18} />
              {isSidebarOpen && <span className="text-xs font-medium">Importar Planilla</span>}
            </button>
          )}

          {/* Submenú de Administración (Solo ADMIN) */}
          {user.rol === 'ADMIN' && (
            <div className="space-y-1">
              <button
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-[#eaedfa]/70 hover:bg-white/5 hover:text-white transition-colors`}
              >
                <div className="flex items-center space-x-3">
                  <Settings size={18} />
                  {isSidebarOpen && <span className="text-xs font-medium">Administración</span>}
                </div>
                {isSidebarOpen && (adminMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
              </button>

              {adminMenuOpen && isSidebarOpen && (
                <div className="pl-9 space-y-1 animate-fade-in bg-[#00072d]/20 py-1.5 rounded-lg">
                  <button
                    onClick={() => navigateTo('admin_catalogos')}
                    className={`w-full text-left py-2 text-[11px] font-medium transition-colors block ${
                      currentView === 'admin_catalogos' ? 'text-[#d9a74a]' : 'text-[#eaedfa]/60 hover:text-white'
                    }`}
                  >
                    Catálogos Maestros
                  </button>
                  <button
                    onClick={() => navigateTo('admin_usuarios')}
                    className={`w-full text-left py-2 text-[11px] font-medium transition-colors block ${
                      currentView === 'admin_usuarios' ? 'text-[#d9a74a]' : 'text-[#eaedfa]/60 hover:text-white'
                    }`}
                  >
                    Gestión de Usuarios
                  </button>
                  <button
                    onClick={() => navigateTo('admin_auditoria')}
                    className={`w-full text-left py-2 text-[11px] font-medium transition-colors block ${
                      currentView === 'admin_auditoria' ? 'text-[#d9a74a]' : 'text-[#eaedfa]/60 hover:text-white'
                    }`}
                  >
                    Bitácora de Auditoría
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Footer Sidebar (Logout) */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors"
          >
            <LogOut size={18} />
            {isSidebarOpen && <span className="text-xs font-semibold">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Cabecera Superior */}
        <header className="h-16 bg-[#051650]/40 border-b border-white/5 px-6 flex items-center justify-between shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-[#eaedfa]/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Información General */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigateTo('matriz', { tab: 'alertas' })}
              className="p-2 rounded-lg hover:bg-white/5 text-[#eaedfa]/70 hover:text-white transition-colors relative"
            >
              <Bell size={18} />
            </button>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-right">
              <span className="text-xs font-semibold text-white block">Coraza Seguridad</span>
              <span className="text-[10px] text-[#eaedfa]/40 uppercase tracking-widest font-medium">Colombia</span>
            </div>
          </div>
        </header>

        {/* Cuerpo de la Vista */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
