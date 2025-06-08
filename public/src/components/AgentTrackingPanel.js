// src/components/AgentTrackingPanel.js - VERSIÓN SIMPLE SIN CONDICIONES
const { useState, useEffect, useRef } = React;

const AgentTrackingPanel = ({ adminId }) => {
  // Estados
  const [realUsers, setRealUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [onlineCount, setOnlineCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Inicializando...');
  
  // Referencias
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  // Colores por rol
  const getRoleStyle = (role, isOnline) => {
    const styles = {
      admin: { color: '#8B5CF6', icon: '👑', name: 'Admin' },
      supervisor: { color: '#3B82F6', icon: '🛠️', name: 'Supervisor' },
      jefe_obra: { color: '#F59E0B', icon: '👨‍💼', name: 'Jefe de Obra' },
      albañil: { color: '#10B981', icon: '👷', name: 'Albañil' },
      logistica: { color: '#EF4444', icon: '🚚', name: 'Logística' }
    };
    
    const style = styles[role] || styles.albañil;
    return { ...style, opacity: isOnline ? 1 : 0.5 };
  };

  // Esperar Google Maps
  const waitForGoogleMaps = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 30;
      
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error('Google Maps timeout'));
        }
      }, 1000);
    });
  };

  // Inicializar mapa
  const initializeMap = async () => {
    try {
      console.log('🗺️ Iniciando inicialización del mapa...');
      console.log('📍 mapRef.current:', mapRef.current);
      
      if (!mapRef.current) {
        console.error('❌ mapRef.current es null');
        throw new Error('Contenedor del mapa no disponible');
      }

      console.log('⏳ Esperando Google Maps...');
      await waitForGoogleMaps();
      
      console.log('🗺️ Creando instancia del mapa...');
      const mapOptions = {
        center: { lat: -34.6118, lng: -58.3960 },
        zoom: 12,
        mapTypeId: 'roadmap'
      };

      mapInstance.current = new window.google.maps.Map(mapRef.current, mapOptions);
      setMapReady(true);
      setIsLoading(false);
      
      console.log('✅ Mapa inicializado exitosamente');
      
      // Cargar usuarios
      loadUsers();
      
    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
      setLoadingMessage('Error: ' + error.message);
    }
  };

  // Cargar usuarios REALES
  const loadUsers = async () => {
    try {
      console.log('📥 Cargando usuarios de Firebase...');
      
      if (!window.db) {
        console.error('❌ Firebase db no disponible');
        setRealUsers([]);
        return;
      }

      // Obtener usuarios
      const usersSnapshot = await window.db.collection('usuarios').get();
      console.log(`👥 Snapshot recibido con ${usersSnapshot.size} documentos`);
      
      if (usersSnapshot.empty) {
        console.log('⚠️ No hay usuarios en la colección "usuarios"');
        setRealUsers([]);
        return;
      }

      const users = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log('👤 Usuario encontrado:', { id: doc.id, ...userData });
        users.push({ id: doc.id, ...userData });
      });

      console.log(`✅ ${users.length} usuarios cargados`);
      
      // Por ahora mostrar usuarios aunque no tengan ubicación
      const processedUsers = users.map(user => ({
        id: user.id,
        name: user.nombre || user.name || 'Usuario sin nombre',
        email: user.email || '',
        role: user.rol || user.role || 'albañil',
        location: { lat: -34.6118 + (Math.random() - 0.5) * 0.01, lng: -58.3960 + (Math.random() - 0.5) * 0.01 }, // Ubicación temporal
        lastSeen: new Date(),
        isOnline: true,
        obra: user.obra || 'Sin obra asignada'
      }));

      setRealUsers(processedUsers);
      setOnlineCount(processedUsers.length);
      setLastUpdate(new Date());
      
      // Actualizar marcadores
      if (mapReady && mapInstance.current) {
        updateMarkers(processedUsers);
      }
      
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      setRealUsers([]);
    }
  };

  // Actualizar marcadores
  const updateMarkers = (userList) => {
    if (!mapInstance.current || !mapReady) return;

    console.log(`📍 Creando ${userList.length} marcadores...`);

    // Limpiar marcadores anteriores
    Object.values(markersRef.current).forEach(marker => marker.setMap(null));
    markersRef.current = {};

    // Crear nuevos marcadores
    userList.forEach(user => {
      const style = getRoleStyle(user.role, user.isOnline);
      
      const marker = new window.google.maps.Marker({
        position: user.location,
        map: mapInstance.current,
        title: user.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="${style.color}" stroke="white" stroke-width="3"/>
              <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${style.icon}</text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        }
      });

      const infoContent = `
        <div style="padding: 10px;">
          <h3>${user.name}</h3>
          <p>Rol: ${style.name}</p>
          <p>Email: ${user.email}</p>
          <p>Obra: ${user.obra}</p>
        </div>
      `;

      marker.addListener('click', () => {
        const infoWindow = new window.google.maps.InfoWindow({ content: infoContent });
        infoWindow.open(mapInstance.current, marker);
      });

      markersRef.current[user.id] = marker;
    });

    // Ajustar vista
    if (userList.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      userList.forEach(user => bounds.extend(user.location));
      mapInstance.current.fitBounds(bounds);
    }
  };

  // Effect principal
  useEffect(() => {
    console.log('🚀 AgentTrackingPanel montado');
    
    // Esperar que el DOM esté listo
    const timer = setTimeout(() => {
      console.log('⏰ Timer ejecutado, verificando mapRef...');
      console.log('📍 mapRef.current en timer:', mapRef.current);
      
      if (mapRef.current) {
        console.log('✅ mapRef encontrado, inicializando...');
        initializeMap();
      } else {
        console.log('❌ mapRef aún null, reintentando...');
        // Reintentar cada segundo
        const interval = setInterval(() => {
          console.log('🔄 Reintentando... mapRef.current:', mapRef.current);
          if (mapRef.current) {
            clearInterval(interval);
            initializeMap();
          }
        }, 1000);
        
        // Limpiar después de 30 segundos
        setTimeout(() => clearInterval(interval), 30000);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Effect para marcadores cuando el mapa esté listo
  useEffect(() => {
    if (mapReady && realUsers.length > 0) {
      updateMarkers(realUsers);
    }
  }, [mapReady, realUsers]);

  // RENDERIZAR SIEMPRE EL MAPA (sin condiciones)
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h1 className="text-xl font-bold">Control de Agentes</h1>
              <p className="text-blue-100 text-sm">
                {realUsers.length} agentes • {onlineCount} en línea • {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-green-500 px-3 py-1 rounded-full text-sm font-medium">
              {mapReady ? '🟢 EN VIVO' : '⏳ CARGANDO'}
            </div>
            <button 
              onClick={loadUsers}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* MAPA - SIEMPRE RENDERIZADO */}
      <div className="flex-1 relative">
        <div 
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '600px', backgroundColor: '#f0f0f0' }}
        />
        
        {/* Stats overlay */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Estado</h3>
          <div className="space-y-1 text-sm">
            <p>Contenedor: {mapRef.current ? '✅' : '❌'}</p>
            <p>Google Maps: {window.google && window.google.maps ? '✅' : '❌'}</p>
            <p>Mapa listo: {mapReady ? '✅' : '❌'}</p>
            <p>Usuarios: {realUsers.length}</p>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <div className="text-lg font-semibold mb-2">Cargando mapa...</div>
              <div className="text-gray-500 mb-4">{loadingMessage}</div>
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto animate-spin"></div>
            </div>
          </div>
        )}

        {/* No users message */}
        {!isLoading && realUsers.length === 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">📍</div>
              <div className="text-lg font-semibold mb-2">No hay usuarios</div>
              <div className="text-gray-500 mb-4">No se encontraron usuarios en Firebase</div>
              <button 
                onClick={loadUsers}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600"
              >
                🔄 Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Exportar
window.AgentTrackingPanel = AgentTrackingPanel;