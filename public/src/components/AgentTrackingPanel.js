// src/components/AgentTrackingPanel.js - SUPER ROBUSTO
const { useState, useEffect, useRef } = React;

const AgentTrackingPanel = ({ adminId }) => {
  // Estados
  const [realUsers, setRealUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [onlineCount, setOnlineCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Inicializando...');
  const [debugInfo, setDebugInfo] = useState([]);
  
  // Referencias
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const retryCount = useRef(0);

  // Debug logger
  const addDebug = (message) => {
    console.log(message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

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
        addDebug('✅ Leaflet ya disponible');
        resolve();
        return;
      }

      addDebug('📦 Cargando Leaflet...');
      
      // CSS de Leaflet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // JavaScript de Leaflet
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        addDebug('✅ Leaflet cargado exitosamente');
        resolve();
      };
      script.onerror = () => {
        addDebug('❌ Error cargando Leaflet');
        reject(new Error('Error cargando Leaflet'));
      };
      document.head.appendChild(script);
    });
  };

  // Verificar contenedor con reintentos
  const waitForContainer = () => {
    return new Promise((resolve, reject) => {
      const checkContainer = () => {
        addDebug(`🔍 Verificando contenedor... Intento ${retryCount.current + 1}`);
        addDebug(`📍 mapRef.current: ${mapRef.current ? 'ENCONTRADO' : 'NULL'}`);
        
        if (mapRef.current) {
          addDebug('✅ Contenedor del mapa encontrado');
          resolve();
        } else {
          retryCount.current++;
          if (retryCount.current < 10) {
            addDebug(`⏳ Contenedor no listo, reintentando en 1 segundo...`);
            setTimeout(checkContainer, 1000);
          } else {
            addDebug('❌ Timeout esperando contenedor del mapa');
            reject(new Error('Timeout esperando contenedor'));
          }
        }
      };
      
      checkContainer();
    });
  };

  // Inicializar mapa
  const initializeMap = async () => {
    try {
      setLoadingMessage('Esperando contenedor del mapa...');
      addDebug('🗺️ Iniciando inicialización del mapa...');
      
      // Esperar contenedor
      await waitForContainer();
      
      setLoadingMessage('Cargando Leaflet...');
      // Cargar Leaflet
      await loadLeaflet();
      
      setLoadingMessage('Creando mapa...');
      addDebug('🗺️ Creando instancia del mapa...');
      
      // Crear mapa centrado en Buenos Aires
      mapInstance.current = window.L.map(mapRef.current, {
        center: [-34.6118, -58.3960],
        zoom: 12,
        zoomControl: true,
        attributionControl: true
      });

      // Agregar tiles de OpenStreetMap
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      });
      
      tileLayer.addTo(mapInstance.current);
      
      // Esperar a que el mapa se renderice completamente
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMapReady(true);
      addDebug('✅ Mapa OpenStreetMap inicializado exitosamente');
      
      // Cargar usuarios
      setLoadingMessage('Cargando usuarios...');
      loadUsersFromFirebase();
      
    } catch (error) {
      addDebug(`❌ Error inicializando mapa: ${error.message}`);
      setLoadingMessage(`Error: ${error.message}`);
      
      // Reintentar después de 3 segundos
      setTimeout(() => {
        addDebug('🔄 Reintentando inicialización...');
        retryCount.current = 0;
        initializeMap();
      }, 3000);
    }
  };

  // Cargar usuarios de Firebase
  const loadUsersFromFirebase = async () => {
    try {
      addDebug('📥 Cargando usuarios de Firebase...');
      
      if (!window.db) {
        throw new Error('Firebase no disponible');
      }

      const snapshot = await window.db.collection('usuarios').get();
      addDebug(`📋 Firebase: ${snapshot.size} usuarios encontrados`);
      
      if (snapshot.empty) {
        setRealUsers([]);
        setOnlineCount(0);
        setIsLoading(false);
        addDebug('⚠️ No hay usuarios en Firebase');
        return;
      }

      const users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        
        const user = {
          id: doc.id,
          name: data.nombre || data.name || 'Usuario sin nombre',
          email: data.email || 'sin-email@construccion.com',
          role: data.rol || data.role || 'albañil',
          obra: data.obra || 'Sin obra asignada',
          // Ubicaciones distribuidas en Buenos Aires
          location: {
            lat: -34.6118 + (Math.random() - 0.5) * 0.02,
            lng: -58.3960 + (Math.random() - 0.5) * 0.02
          },
          isOnline: true,
          lastSeen: new Date(),
          source: 'firebase'
        };
        
        users.push(user);
        addDebug(`👤 Usuario cargado: ${user.name} (${user.role})`);
      });

      setRealUsers(users);
      window.realUsers = users; // Para debugging
      setOnlineCount(users.filter(u => u.isOnline).length);
      setLastUpdate(new Date());
      setIsLoading(false);
      
      addDebug(`✅ ${users.length} usuarios procesados correctamente`);
      
      // Crear marcadores si el mapa está listo
      if (mapReady && mapInstance.current) {
        createMarkers(users);
      }
      
    } catch (error) {
      addDebug(`❌ Error cargando usuarios: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Crear marcadores en el mapa
  const createMarkers = (users) => {
    if (!mapInstance.current || !window.L) {
      addDebug('⏳ Mapa no listo para marcadores');
      return;
    }

    addDebug(`📍 Creando ${users.length} marcadores...`);

    // Limpiar marcadores anteriores
    Object.values(markersRef.current).forEach(marker => {
      mapInstance.current.removeLayer(marker);
    });
    markersRef.current = {};

    // Crear marcadores
    users.forEach(user => {
      const style = getRoleStyle(user.role, user.isOnline);
      
      // Crear marcador con DivIcon personalizado
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

      // Popup informativo
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
            <p style="margin: 4px 0;"><strong>📍 ID:</strong> ${user.id}</p>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      // Agregar al mapa y guardar referencia
      marker.addTo(mapInstance.current);
      markersRef.current[user.id] = marker;
    });

    // Ajustar vista para mostrar todos los marcadores
    if (users.length > 0) {
      const group = new window.L.featureGroup(Object.values(markersRef.current));
      mapInstance.current.fitBounds(group.getBounds().pad(0.1));
      
      // Zoom mínimo
      setTimeout(() => {
        if (mapInstance.current.getZoom() > 15) {
          mapInstance.current.setZoom(15);
        }
      }, 500);
    }

    addDebug(`✅ ${users.length} marcadores creados exitosamente`);
  };

  // Effect para inicializar
  useEffect(() => {
    addDebug('🚀 AgentTrackingPanel montado');
    
    // Delay inicial más largo
    const timer = setTimeout(() => {
      addDebug('⏰ Iniciando proceso de inicialización...');
      initializeMap();
    }, 2000); // 2 segundos de delay

    return () => {
      clearTimeout(timer);
      addDebug('🧹 AgentTrackingPanel desmontado');
    };
  }, []);

  // Effect para crear marcadores cuando todo esté listo
  useEffect(() => {
    if (mapReady && realUsers.length > 0) {
      addDebug('🎯 Mapa y usuarios listos, creando marcadores...');
      createMarkers(realUsers);
    }
  }, [mapReady, realUsers]);

  // Actualización periódica
  useEffect(() => {
    if (!isLoading && mapReady) {
      const interval = setInterval(() => {
        addDebug('🔄 Actualizando usuarios automáticamente...');
        loadUsersFromFirebase();
      }, 30000); // Cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [isLoading, mapReady]);

  // Loading/Error screens
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Control de Agentes</div>
          <div className="text-gray-500 mb-4">{loadingMessage}</div>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto animate-spin mb-4"></div>
          
          {/* Debug info */}
          <div className="bg-gray-100 rounded-lg p-3 text-left text-xs">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            {debugInfo.map((info, index) => (
              <div key={index} className="text-gray-600 mb-1">{info}</div>
            ))}
          </div>
          
          <button 
            onClick={() => {
              retryCount.current = 0;
              setDebugInfo([]);
              addDebug('🔄 Reinicio manual');
              initializeMap();
            }}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
          >
            🔄 Reintentar
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
        {/* CONTENEDOR DEL MAPA - SIEMPRE VISIBLE */}
        <div 
          ref={mapRef}
          className="w-full h-full"
          style={{ 
            minHeight: '600px',
            backgroundColor: '#f0f0f0',
            border: '2px solid #e0e0e0' // Para debug visual
          }}
        />
        
        {/* Stats panel */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
          <h3 className="font-semibold text-gray-800 mb-2">Estado</h3>
          <div className="space-y-1 text-sm">
            <p>📍 Contenedor: {mapRef.current ? '✅ OK' : '❌ NULL'}</p>
            <p>🗺️ Mapa: {mapReady ? '✅ Listo' : '⏳ Cargando'}</p>
            <p>🍃 Leaflet: {window.L ? '✅ OK' : '❌ No'}</p>
            <p>📊 Firebase: {window.db ? '✅ OK' : '❌ No'}</p>
            <p>👥 Usuarios: {realUsers.length}</p>
            <p>📍 Marcadores: {Object.keys(markersRef.current).length}</p>
          </div>
          
          {/* Debug reciente */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-1 text-xs">Debug reciente:</h4>
            <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
              {debugInfo.slice(-3).map((info, index) => (
                <div key={index} className="text-gray-600">{info}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Exportar
window.AgentTrackingPanel = AgentTrackingPanel;