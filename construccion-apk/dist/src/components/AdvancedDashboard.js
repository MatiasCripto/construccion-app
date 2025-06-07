const { useState, useEffect } = React;

const AdvancedDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [obras, setObras] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [loading, setLoading] = useState(true);
  const [tiempoTrabajo, setTiempoTrabajo] = useState(0);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadNotificaciones();
    
    // Aplicar modo oscuro
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Timer para cronómetro
    let interval;
    if (trabajando) {
      interval = setInterval(() => {
        setTiempoTrabajo(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [darkMode, trabajando]);

  const loadDashboardData = async () => {
    try {
      const [obrasRes, statsRes] = await Promise.all([
        fetch('/api/obras', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/obras/estadisticas', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const obrasData = await obrasRes.json();
      const statsData = await statsRes.json();

      if (obrasRes.ok) setObras(obrasData);
      if (statsRes.ok) setEstadisticas(statsData);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificaciones = async () => {
    try {
      const response = await fetch('/api/notificaciones', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) setNotificaciones(data);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  const toggleCronometro = () => {
    if (trabajando) {
      // Guardar tiempo trabajado
      guardarTiempoTrabajo();
    }
    setTrabajando(!trabajando);
  };

  const guardarTiempoTrabajo = async () => {
    try {
      await fetch('/api/tiempo-trabajo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tiempo: tiempoTrabajo,
          fecha: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Error guardando tiempo:', err);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoleLabel = (rol) => {
    const roles = {
      admin: 'Administrador',
      jefe_obra: 'Jefe de Obra',
      logistica: 'Logística',
      albanil: 'Albañil'
    };
    return roles[rol] || rol;
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-white' : 'text-gray-600'}`}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header Mejorado */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🏗️ Construcción Pro
              </h1>
              
              {/* Cronómetro de trabajo */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleCronometro}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    trabajando 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {trabajando ? '⏹️ Parar' : '▶️ Trabajar'}
                </button>
                <span className={`text-lg font-mono ${trabajando ? 'text-green-600' : (darkMode ? 'text-gray-300' : 'text-gray-600')}`}>
                  ⏱️ {formatTime(tiempoTrabajo)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notificaciones */}
              <div className="relative">
                <button className={`p-2 rounded-lg ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  🔔
                  {notificaciones.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notificaciones.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Toggle modo oscuro */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* Perfil */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.nombre} {user.apellido}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {getRoleLabel(user.rol)}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Mejorada */}
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'} hover:border-gray-300`
              }`}
            >
              📊 Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('obras')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'obras'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'} hover:border-gray-300`
              }`}
            >
              🏗️ Obras {obras.length > 0 && `(${obras.length})`}
            </button>

            <button
              onClick={() => setActiveTab('reportes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'reportes'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'} hover:border-gray-300`
              }`}
            >
              📈 Reportes
            </button>

            {user.rol === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : `border-transparent ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'} hover:border-gray-300`
                }`}
              >
                ⚙️ Admin
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardStats estadisticas={estadisticas} obras={obras} darkMode={darkMode} />
        )}
        
        {activeTab === 'obras' && (
          <ObrasGrid obras={obras} user={user} onUpdate={loadDashboardData} darkMode={darkMode} />
        )}
        
        {activeTab === 'reportes' && (
          <ReportesAvanzados obras={obras} estadisticas={estadisticas} darkMode={darkMode} />
        )}
        
        {activeTab === 'admin' && user.rol === 'admin' && (
          <AdminPanel darkMode={darkMode} />
        )}
      </main>
    </div>
  );
};

// Componente de estadísticas del dashboard
const DashboardStats = ({ estadisticas, obras, darkMode }) => {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    // Generar alertas inteligentes
    const nuevasAlertas = [];
    
    obras.forEach(obra => {
      if (obra.estado === 'pendiente' && obra.created_at) {
        const diasCreada = Math.floor((new Date() - new Date(obra.created_at)) / (1000 * 60 * 60 * 24));
        if (diasCreada > 3) {
          nuevasAlertas.push({
            tipo: 'warning',
            mensaje: `La obra "${obra.nombre}" lleva ${diasCreada} días sin iniciar`,
            obra: obra.nombre
          });
        }
      }
      
      if (obra.estado === 'en_progreso' && obra.total_fotos === 0) {
        nuevasAlertas.push({
          tipo: 'info',
          mensaje: `La obra "${obra.nombre}" no tiene fotos de progreso`,
          obra: obra.nombre
        });
      }
    });
    
    setAlertas(nuevasAlertas);
  }, [obras]);

  if (!estadisticas) {
    return <div className="text-center py-8">Cargando estadísticas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Obras"
          value={estadisticas.obras.total}
          icon="🏗️"
          color="blue"
          darkMode={darkMode}
        />
        <StatCard
          title="En Progreso"
          value={estadisticas.obras.en_progreso}
          icon="⏳"
          color="yellow"
          darkMode={darkMode}
        />
        <StatCard
          title="Completadas"
          value={estadisticas.obras.completadas}
          icon="✅"
          color="green"
          darkMode={darkMode}
        />
        <StatCard
          title="Archivadas"
          value={estadisticas.obras.archivadas}
          icon="📁"
          color="gray"
          darkMode={darkMode}
        />
      </div>

      {/* Alertas inteligentes */}
      {alertas.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            🚨 Alertas y Recomendaciones
          </h3>
          <div className="space-y-3">
            {alertas.map((alerta, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                alerta.tipo === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <p className="text-sm">{alerta.mensaje}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            📊 Distribución por Estado
          </h3>
          <PieChart data={estadisticas.obras} darkMode={darkMode} />
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            📈 Obras por Mes
          </h3>
          <LineChart data={estadisticas.porMes} darkMode={darkMode} />
        </div>
      </div>

      {/* Top albañiles */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          🏆 Albañiles Más Productivos
        </h3>
        <div className="space-y-3">
          {estadisticas.albaniles.slice(0, 5).map((albanil, index) => (
            <div key={index} className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👷'}</span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {albanil.nombre} {albanil.apellido}
                </span>
              </div>
              <div className="text-right">
                <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'} font-semibold`}>
                  {albanil.obras_completadas} completadas
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {albanil.obras_asignadas} total
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente de tarjeta de estadística
const StatCard = ({ title, value, icon, color, darkMode }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg`}>
      <div className="flex items-center">
        <div className={`${colorClasses[color]} rounded-lg p-3 mr-4`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
      </div>
    </div>
  );
};

// Componentes de gráficos simplificados (usando CSS)
const PieChart = ({ data, darkMode }) => {
  const total = data.total || 1;
  const pendiente = (data.pendientes / total) * 100;
  const progreso = (data.en_progreso / total) * 100;
  const completada = (data.completadas / total) * 100;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pendientes</span>
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.pendientes}</span>
        </div>
        <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${pendiente}%` }}></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>En Progreso</span>
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.en_progreso}</span>
        </div>
        <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progreso}%` }}></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completadas</span>
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.completadas}</span>
        </div>
        <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${completada}%` }}></div>
        </div>
      </div>
    </div>
  );
};

const LineChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Sin datos suficientes
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.cantidad));

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {item.mes}
            </span>
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {item.cantidad}
            </span>
          </div>
          <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(item.cantidad / maxValue) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Grid de obras mejorado
const ObrasGrid = ({ obras, user, onUpdate, darkMode }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Mis Obras
        </h2>
        <div className="flex space-x-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
            🔄 Actualizar
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
            📊 Exportar
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {obras.map(obra => (
          <EnhancedObraCard 
            key={obra.id} 
            obra={obra} 
            user={user} 
            onUpdate={onUpdate} 
            darkMode={darkMode}
          />
        ))}
      </div>
    </div>
  );
};

// Tarjeta de obra mejorada
const EnhancedObraCard = ({ obra, user, onUpdate, darkMode }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_progreso: 'bg-blue-100 text-blue-800',
      completada: 'bg-green-100 text-green-800',
      archivada: 'bg-gray-100 text-gray-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      archivada: 'Archivada'
    };
    return labels[estado] || estado;
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {obra.nombre}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(obra.estado)}`}>
            {getEstadoLabel(obra.estado)}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="font-medium">📍</span> {obra.ubicacion}
          </p>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="font-medium">👷</span> {obra.albanil_nombre} {obra.albanil_apellido}
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="flex justify-between text-sm mb-4">
          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            📷 {obra.total_fotos || 0} fotos
          </span>
          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            💬 {obra.total_mensajes || 0} mensajes
          </span>
          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            🧱 {obra.total_materiales || 0} materiales
          </span>
        </div>

        {/* Mini mapa si tiene coordenadas */}
        {obra.latitud && obra.longitud && (
          <div className="mb-4">
            <MiniMap location={{ lat: obra.latitud, lng: obra.longitud }} height="120px" />
          </div>
        )}
        
        <button
          onClick={() => setShowDetails(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
        >
          Ver Detalles Completos
        </button>
      </div>

      {showDetails && (
        <ObraDetailsModal 
          obra={obra} 
          user={user} 
          onClose={() => setShowDetails(false)}
          onUpdate={onUpdate}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

// Componente de reportes avanzados
const ReportesAvanzados = ({ obras, estadisticas, darkMode }) => {
  const [tipoReporte, setTipoReporte] = useState('general');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const generarReporte = async (tipo) => {
    try {
      const response = await fetch(`/api/reportes/${tipo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fechaInicio,
          fechaFin,
          incluirFotos: true,
          incluirMateriales: true
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${tipo}-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
      }
    } catch (err) {
      alert('Error generando reporte');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        📈 Reportes y Análisis
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Generar Reportes
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => generarReporte('general')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                📊 Reporte General
              </button>
              <button
                onClick={() => generarReporte('productividad')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                ⚡ Productividad
              </button>
              <button
                onClick={() => generarReporte('materiales')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                🧱 Materiales
              </button>
              <button
                onClick={() => generarReporte('tiempos')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                ⏱️ Tiempos
              </button>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Resumen Rápido
          </h3>
          <div className="space-y-4">
            <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                Obras activas: <span className="font-bold">{obras.filter(o => o.estado !== 'archivada').length}</span>
              </p>
            </div>
            <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-green-50'} rounded-lg`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-green-700'}`}>
                Completadas este mes: <span className="font-bold">
                  {obras.filter(o => o.estado === 'completada' && 
                    new Date(o.updated_at).getMonth() === new Date().getMonth()).length}
                </span>
              </p>
            </div>
            <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'} rounded-lg`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-yellow-700'}`}>
                Pendientes: <span className="font-bold">
                  {obras.filter(o => o.estado === 'pendiente').length}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.AdvancedDashboard = AdvancedDashboard;