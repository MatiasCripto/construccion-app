const { useState, useEffect, useRef } = React;

const MobileInterface = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('obras');
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    loadData();
    getCurrentLocation();
    
    // Listeners para conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/obras', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) setObras(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Error getting location:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
      );
    }
  };

  const triggerInstall = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('Usuario instaló la app');
      }
      window.deferredPrompt = null;
      setShowInstallPrompt(false);
    }
  };

  const getRoleLabel = (rol) => {
    const roles = {
      admin: 'Admin',
      jefe_obra: 'Jefe',
      logistica: 'Logística',
      albanil: 'Albañil'
    };
    return roles[rol] || rol;
  };

  if (loading) {
    return <MobileLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header móvil */}
      <div className="bg-blue-600 text-white p-4 mobile-safe-area">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">🏗️</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Construcción Pro</h1>
              <p className="text-blue-100 text-sm">
                {user.nombre} • {getRoleLabel(user.rol)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isOnline && (
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            )}
            <button
              onClick={onLogout}
              className="p-2 bg-blue-700 rounded-lg touch-target"
            >
              🚪
            </button>
          </div>
        </div>
        
        {/* Install PWA prompt */}
        {showInstallPrompt && (
          <div className="mt-3 p-3 bg-blue-700 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">📱 Instalar App</p>
                <p className="text-xs text-blue-200">Para mejor experiencia</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="px-3 py-1 text-xs bg-blue-800 rounded"
                >
                  Después
                </button>
                <button
                  onClick={triggerInstall}
                  className="px-3 py-1 text-xs bg-white text-blue-600 rounded font-medium"
                >
                  Instalar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions para albañiles */}
      {user.rol === 'albanil' && (
        <MobileQuickActions obras={obras} currentLocation={currentLocation} />
      )}

      {/* Content */}
      <div className="p-4">
        {activeTab === 'obras' && (
          <MobileObrasList obras={obras} user={user} onUpdate={loadData} />
        )}
        {activeTab === 'camera' && (
          <MobileCameraView obras={obras} currentLocation={currentLocation} />
        )}
        {activeTab === 'chat' && (
          <MobileChatView obras={obras} user={user} />
        )}
        {activeTab === 'profile' && (
          <MobileProfileView user={user} />
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} userRole={user.rol} />
    </div>
  );
};

// Loading screen móvil
const MobileLoadingScreen = () => (
  <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center text-white">
    <div className="text-6xl mb-4">🏗️</div>
    <h1 className="text-2xl font-bold mb-2">Construcción Pro</h1>
    <div className="spinner w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
    <p className="mt-4 text-blue-100">Cargando...</p>
  </div>
);

// Quick Actions para albañiles
const MobileQuickActions = ({ obras, currentLocation }) => {
  const obraActiva = obras.find(o => o.estado === 'en_progreso');
  
  return (
    <div className="p-4 bg-white border-b">
      <h2 className="text-lg font-semibold mb-3">⚡ Acciones Rápidas</h2>
      <div className="grid grid-cols-2 gap-3">
        <QuickActionButton
          icon="📷"
          label="Tomar Foto"
          color="bg-green-500"
          onClick={() => document.getElementById('camera-input')?.click()}
        />
        <QuickActionButton
          icon="📍"
          label="Mi Ubicación"
          color="bg-blue-500"
          onClick={() => console.log('Ubicación:', currentLocation)}
        />
        <QuickActionButton
          icon="⏱️"
          label="Iniciar Trabajo"
          color="bg-orange-500"
          onClick={() => console.log('Cronómetro iniciado')}
        />
        <QuickActionButton
          icon="💬"
          label="Chat Obra"
          color="bg-purple-500"
          disabled={!obraActiva}
          onClick={() => console.log('Abrir chat')}
        />
      </div>
    </div>
  );
};

const QuickActionButton = ({ icon, label, color, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${color} ${disabled ? 'opacity-50' : ''} text-white p-4 rounded-xl touch-target flex flex-col items-center space-y-1 active:scale-95 transition-transform`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

// Lista de obras móvil
const MobileObrasList = ({ obras, user, onUpdate }) => {
  const [filter, setFilter] = useState('all');
  
  const filteredObras = obras.filter(obra => {
    if (filter === 'all') return true;
    return obra.estado === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">📋 Mis Obras</h2>
        <div className="bg-blue-100 px-3 py-1 rounded-full">
          <span className="text-blue-800 text-sm font-medium">{obras.length}</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <FilterChip
          label="Todas"
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          count={obras.length}
        />
        <FilterChip
          label="Pendientes"
          active={filter === 'pendiente'}
          onClick={() => setFilter('pendiente')}
          count={obras.filter(o => o.estado === 'pendiente').length}
        />
        <FilterChip
          label="En Progreso"
          active={filter === 'en_progreso'}
          onClick={() => setFilter('en_progreso')}
          count={obras.filter(o => o.estado === 'en_progreso').length}
        />
      </div>

      {/* Lista de obras */}
      <div className="space-y-3">
        {filteredObras.map(obra => (
          <MobileObraCard key={obra.id} obra={obra} user={user} onUpdate={onUpdate} />
        ))}
        {filteredObras.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-500">No hay obras con este filtro</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FilterChip = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap touch-target ${
      active 
        ? 'bg-blue-500 text-white' 
        : 'bg-gray-200 text-gray-700'
    }`}
  >
    {label} {count > 0 && `(${count})`}
  </button>
);

// Tarjeta de obra móvil
const MobileObraCard = ({ obra, user, onUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_progreso: 'bg-blue-100 text-blue-800',
      completada: 'bg-green-100 text-green-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      pendiente: '⏳',
      en_progreso: '🔄',
      completada: '✅'
    };
    return icons[estado] || '📋';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 active:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{obra.nombre}</h3>
          <p className="text-gray-600 text-sm">📍 {obra.ubicacion}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(obra.estado)}`}>
          {getEstadoIcon(obra.estado)} {obra.estado.replace('_', ' ')}
        </span>
      </div>

      {/* Estadísticas rápidas */}
      <div className="flex justify-between text-sm text-gray-500 mb-3">
        <span>📷 {obra.total_fotos || 0}</span>
        <span>💬 {obra.total_mensajes || 0}</span>
        <span>🧱 {obra.total_materiales || 0}</span>
      </div>

      {/* Acciones */}
      <div className="flex space-x-2">
        <button
          onClick={() => setShowDetails(true)}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm font-medium touch-target"
        >
          Ver Detalles
        </button>
        
        {obra.estado === 'pendiente' && (
          <button
            onClick={() => cambiarEstado(obra.id, 'en_progreso')}
            className="bg-green-500 text-white py-2 px-4 rounded-lg text-sm font-medium touch-target"
          >
            ▶️ Iniciar
          </button>
        )}
        
        {obra.estado === 'en_progreso' && (
          <button
            onClick={() => cambiarEstado(obra.id, 'completada')}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg text-sm font-medium touch-target"
          >
            ✅ Completar
          </button>
        )}
      </div>

      {showDetails && (
        <MobileObraModal
          obra={obra}
          user={user}
          onClose={() => setShowDetails(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );

  async function cambiarEstado(obraId, nuevoEstado) {
    try {
      const response = await fetch(`/api/obras/${obraId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      
      if (response.ok) {
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar estado');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  }
};

// Modal de obra móvil
const MobileObraModal = ({ obra, user, onClose, onUpdate }) => {
  const [activeSection, setActiveSection] = useState('info');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="bg-white flex-1 mt-12 rounded-t-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">{obra.nombre}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center touch-target"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100">
          <TabButton
            label="Info"
            active={activeSection === 'info'}
            onClick={() => setActiveSection('info')}
          />
          <TabButton
            label="Fotos"
            active={activeSection === 'fotos'}
            onClick={() => setActiveSection('fotos')}
          />
          <TabButton
            label="Chat"
            active={activeSection === 'chat'}
            onClick={() => setActiveSection('chat')}
          />
          <TabButton
            label="Materiales"
            active={activeSection === 'materiales'}
            onClick={() => setActiveSection('materiales')}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeSection === 'info' && <ObraInfo obra={obra} />}
          {activeSection === 'fotos' && <MobilePhotoView obraId={obra.id} user={user} />}
          {activeSection === 'chat' && <MobileChatView obras={[obra]} user={user} />}
          {activeSection === 'materiales' && <MobileMaterialView obraId={obra.id} user={user} />}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 text-sm font-medium ${
      active ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
    }`}
  >
    {label}
  </button>
);

// Navigation inferior
const MobileBottomNav = ({ activeTab, onTabChange, userRole }) => {
  const tabs = [
    { id: 'obras', icon: '🏗️', label: 'Obras' },
    { id: 'camera', icon: '📷', label: 'Foto' },
    { id: 'chat', icon: '💬', label: 'Chat' },
    { id: 'profile', icon: '👤', label: 'Perfil' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2 px-1 flex flex-col items-center touch-target ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Componentes adicionales móviles
const ObraInfo = ({ obra }) => (
  <div className="space-y-4">
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">📍 Ubicación</h3>
      <p className="text-gray-700">{obra.ubicacion}</p>
      {obra.latitud && obra.longitud && (
        <div className="mt-2">
          <MiniMap location={{ lat: obra.latitud, lng: obra.longitud }} height="150px" />
        </div>
      )}
    </div>
    
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">📝 Descripción</h3>
      <p className="text-gray-700">{obra.descripcion || 'Sin descripción'}</p>
    </div>
    
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">👥 Personal</h3>
      <p className="text-gray-700">👷 {obra.albanil_nombre} {obra.albanil_apellido}</p>
      {obra.jefe_nombre && (
        <p className="text-gray-700">👨‍💼 {obra.jefe_nombre} {obra.jefe_apellido}</p>
      )}
    </div>
  </div>
);

window.MobileInterface = MobileInterface;