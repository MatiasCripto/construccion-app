// src/components/AgentTrackingPanel.js - FINAL FUNCIONAL
const { useState, useEffect, useRef } = React;

const AgentTrackingPanel = ({ adminId }) => {
  // Estados
  const [realUsers, setRealUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [onlineCount, setOnlineCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Inicializando...');
  const [error, setError] = useState(null);
  
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

  // Cargar Leaflet dinámicamente
  const loadLeaflet = () => {
    return new Promise((resolve, reject) => {
      if (window.L) {
        resolve();
        return;
      }

      console.log('📦 Cargando Leaflet...');
      
      // CSS de Leaflet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // JavaScript de Leaflet
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        console.log('✅ Leaflet cargado');
        resolve();
      };
      script.onerror = () => reject(new Error('Error cargando Leaflet'));
      document.head.appendChild(script);
    });
  };

  // Inicializar mapa con OpenStreetMap
  const initializeMap = async () => {
    try {
      console.log('🗺️ Inicializando mapa...');
      setLoadingMessage('Cargando mapa...');
      
      if (!mapRef.current) {
        throw new Error('Contenedor del mapa no disponible');
      }

      // Cargar Leaflet
      await loadLeaflet();
      
      setLoadingMessage('Creando mapa...');
      
      // Crear mapa centrado en Buenos Aires
      mapInstance.current = window.L.map(mapRef.current).setView([-34.6118, -58.3960], 12);

      // Agregar tiles de OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance.current);

      setMapReady(true);
      console.log('✅ Mapa OpenStreetMap inicializado');
      
      // Cargar usuarios después de que el mapa esté listo
      loadUsersFromFirebase();
      
    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
      setError('Error inicializando mapa: ' + error.message);
      setLoadingMessage('Error en mapa');
    }
  };

  // Cargar usuarios REALES de Firebase
  const loadUsersFromFirebase = async () => {
    try {
      console.log('📥 Cargando usuarios de Firebase...');
      setLoadingMessage('Cargando usuarios...');
      
      if (!window.db) {
        throw new Error('Firebase no disponible');
      }

      // Obtener usuarios de Firebase
      const snapshot = await window.db.collection('usuarios').get();
      console.log(`📋 Firebase snapshot: ${snapshot.size} documentos`);
      
      if (snapshot.empty) {
        console.log('⚠️ No hay usuarios en Firebase');
        setRealUsers([]);
        setOnlineCount(0);
        setIsLoading(false);
        return;
      }

      const users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`👤 Usuario encontrado:`, { id: doc.id, ...data });
        
        // Procesar cada usuario
        const user = {
          id: doc.id,
          name: data.nombre || data.name || 'Usuario sin nombre',
          email: data.email || 'sin-email@construccion.com',
          role: data.rol || data.role || 'albañil',
          obra: data.obra || 'Sin obra asignada',
          // Ubicación temporal para testing (en Buenos Aires)
          location: {
            lat: -34.6118 + (Math.random() - 0.5) * 0.02,
            lng: -58.3960 + (Math.random() - 0.5) * 0.02
          },
          isOnline: true, // Por ahora todos online
          lastSeen: new Date(),
          source: 'firebase'
        };
        
        users.push(user);
      });

      console.log(`✅ ${users.length} usuarios procesados:`, users);
      
      // Guardar usuarios en estado Y en ventana global para debug
      setRealUsers(users);
      window.realUsers = users; // Para debugging
      setOnlineCount(users.filter(u => u.isOnline).length);
      setLastUpdate(new Date());
      setIsLoading(false);
      
      // Crear marcadores si el mapa está listo
      if (mapReady && mapInstance.current && users.length > 0) {
        createMarkers(users);
      }
      
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      setError('Error cargando usuarios: ' + error.message);
      setIsLoading(false);
    }
  };

  // Crear marcadores en el mapa
  const createMarkers = (users) => {
    if (!mapInstance.current || !window.L) {
      console.log('⏳ Mapa no listo para marcadores');
      return;
    }

    console.log(`📍 Creando ${users.length} marcadores...`);

    // Limpiar marcadores anteriores
    Object.values(markersRef.current).forEach(marker => {
      mapInstance.current.removeLayer(marker);
    });
    markersRef.current = {};

    // Crear grupo de marcadores para mejor rendimiento
    const markersGroup = window.L.layerGroup().addTo(mapInstance.current);

    users.forEach(user => {
      const style = getRoleStyle(user.role, user.isOnline);
      
      // Crear marcador personalizado con DivIcon
      const customIcon = window.L.divIcon({
        html: `
          <div style="
            background-color: ${style.color};
            color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            opacity: ${style.opacity};
          ">
            ${style.icon}
          </div>
        `,
        className: 'custom-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      // Crear marcador
      const marker = window.L.marker([user.location.lat, user.location.lng], {
        icon: customIcon
      });

      // Popup con información del usuario
      const popupContent = `
        <div style="padding: 10px; min-width: 200px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 24px; margin-right: 8px;">${style.icon}</span>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${user.name}</h3>
              <p style="margin: 0; color: ${style.color}; font-size: 14px;">${style.name}</p>
            </div>
          </div>
          <div style="font-size: 14px; line-height: 1.4;">
            <p style="margin: 4px 0;"><strong>📧 Email:</strong> ${user.email}</p>
            <p style="margin: 4px 0;"><strong>🏗️ Obra:</strong> ${user.obra}</p>
            <p style="margin: 4px 0;"><strong>📊 Estado:</strong> 
              <span style="color: ${user.isOnline ? '#10B981' : '#EF4444'};">
                ${user.isOnline ? '🟢 En línea' : '🔴 Desconectado'}
              </span>
            </p>
            <p style="margin: 4px 0;"><strong>🕐 Última vez:</strong> ${user.lastSeen.toLocaleTimeString()}</p>
            <p style="margin: 4px 0;"><strong>📍 Coordenadas:</strong> ${user.location.lat.toFixed(4)}, ${user.location.lng.toFixed(4)}</p>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button onclick="alert('Contactar a ${user.name}')" style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">📞 Contactar</button>
            <button onclick="alert('Ver historial de ${user.name}')" style="background: #6B7280; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">📊 Historial</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      // Agregar al grupo y guardar referencia
      markersGroup.addLayer(marker);
      markersRef.current[user.id] = marker;
    });

    // Ajustar vista para mostrar todos los marcadores
    if (users.length > 0) {
      const group = new window.L.featureGroup(Object.values(markersRef.current));
      mapInstance.current.fitBounds(group.getBounds().pad(0.1));
      
      // Zoom mínimo para que no esté muy cerca
      setTimeout(() => {
        if (mapInstance.current.getZoom() > 15) {
          mapInstance.current.setZoom(15);
        }
      }, 500);
    }

    console.log(`✅ ${users.length} marcadores creados exitosamente`);
  };

  // Effect para inicializar
  useEffect(() => {
    console.log('🚀 AgentTrackingPanel montado');
    
    const timer = setTimeout(() => {
      if (mapRef.current) {
        initializeMap();
      } else {
        setError('Contenedor del mapa no encontrado');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Effect para crear marcadores cuando el mapa y usuarios estén listos
  useEffect(() => {
    if (mapReady && realUsers.length > 0) {
      createMarkers(realUsers);
    }
  }, [mapReady, realUsers]);

  // Actualización periódica
  useEffect(() => {
    if (!isLoading) {
      const interval = setInterval(() => {
        console.log('🔄 Actualizando usuarios...');
        loadUsersFromFirebase();
      }, 30000); // Cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Control de Agentes</div>
          <div className="text-gray-500 mb-4">{loadingMessage}</div>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto animate-spin mb-4"></div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
      </div>
    );
  }

  // Error screen
  if (error && realUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Error en Control de Agentes</div>
          <div className="text-red-500 mb-4">{error}</div>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              initializeMap();
            }}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  // No users screen
  if (realUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">No hay agentes</div>
          <div className="text-gray-500 mb-4">No se encontraron usuarios con ubicación</div>
          <button 
            onClick={loadUsersFromFirebase}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h1 className="text-xl font-bold">Control de Agentes en Tiempo Real</h1>
              <p className="text-blue-100 text-sm">
                {realUsers.length} agentes • {onlineCount} en línea • {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-green-500 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              EN VIVO
            </div>
            <button 
              onClick={loadUsersFromFirebase}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <div 
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '600px' }}
        />
        
        {/* Stats panel */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
          <h3 className="font-semibold text-gray-800 mb-2">Estado del Sistema</h3>
          <div className="space-y-1 text-sm">
            <p>🗺️ Mapa: {mapReady ? '✅ Listo' : '⏳ Cargando'}</p>
            <p>📊 Firebase: {window.db ? '✅ Conectado' : '❌ Error'}</p>
            <p>👥 Usuarios: {realUsers.length}</p>
            <p>🟢 En línea: {onlineCount}</p>
            <p>🔴 Offline: {realUsers.length - onlineCount}</p>
          </div>
          
          {/* Debug info */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-1">Por rol:</h4>
            <div className="text-xs space-y-1">
              <p>👑 Admins: {realUsers.filter(u => u.role === 'admin').length}</p>
              <p>🛠️ Supervisores: {realUsers.filter(u => u.role === 'supervisor').length}</p>
              <p>👨‍💼 Jefes: {realUsers.filter(u => u.role === 'jefe_obra').length}</p>
              <p>👷 Albañiles: {realUsers.filter(u => u.role === 'albañil').length}</p>
              <p>🚚 Logística: {realUsers.filter(u => u.role === 'logistica').length}</p>
            </div>
          </div>
        </div>

        {/* Map loading overlay */}
        {!mapReady && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto animate-spin mb-4"></div>
              <div className="text-gray-700 font-medium">{loadingMessage}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Exportar
window.AgentTrackingPanel = AgentTrackingPanel;