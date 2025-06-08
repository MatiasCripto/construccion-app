// src/components/AgentTrackingPanel.js - SIN CALLBACK PROBLEMÁTICO
const { useState, useEffect, useRef } = React;

const AgentTrackingPanel = ({ adminId }) => {
  // Estados principales
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

  // Colores y iconos por rol
  const getRoleStyle = (role, isOnline) => {
    const styles = {
      admin: { color: '#8B5CF6', icon: '👑', name: 'Admin' },
      supervisor: { color: '#3B82F6', icon: '🛠️', name: 'Supervisor' },
      jefe_obra: { color: '#F59E0B', icon: '👨‍💼', name: 'Jefe de Obra' },
      albañil: { color: '#10B981', icon: '👷', name: 'Albañil' },
      logistica: { color: '#EF4444', icon: '🚚', name: 'Logística' }
    };
    
    const style = styles[role] || styles.albañil;
    return {
      ...style,
      opacity: isOnline ? 1 : 0.5
    };
  };

  // Esperar Google Maps sin callback
  const waitForGoogleMaps = () => {
    return new Promise((resolve, reject) => {
      // Si ya está cargado
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // Esperar hasta que se cargue
      let attempts = 0;
      const maxAttempts = 30; // 30 segundos máximo
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error('Google Maps no se cargó después de 30 segundos'));
        }
      }, 1000);
    });
  };

  // Inicializar Google Maps SIN depender de callback
  const initializeGoogleMaps = async () => {
    try {
      setLoadingMessage('Esperando Google Maps...');
      
      // Verificar contenedor
      if (!mapRef.current) {
        console.error('❌ Contenedor del mapa no encontrado');
        return;
      }

      // Esperar a que Google Maps esté disponible
      await waitForGoogleMaps();
      
      setLoadingMessage('Inicializando mapa...');
      console.log('🗺️ Inicializando Google Maps...');

      const mapOptions = {
        center: { lat: -34.6118, lng: -58.3960 }, // Buenos Aires por defecto
        zoom: 12,
        mapTypeId: 'roadmap',
        styles: [
          {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [{ "visibility": "off" }]
          }
        ],
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true
      };

      mapInstance.current = new window.google.maps.Map(mapRef.current, mapOptions);
      setMapReady(true);
      
      console.log('✅ Google Maps inicializado correctamente');
      
      // Cargar usuarios reales después de que el mapa esté listo
      setLoadingMessage('Cargando usuarios...');
      await loadRealUsers();
      
    } catch (error) {
      console.error('❌ Error inicializando Google Maps:', error);
      setLoadingMessage('Error cargando Google Maps');
      setIsLoading(false);
    }
  };

  // CARGAR USUARIOS REALES DE FIREBASE
  const loadRealUsers = async () => {
    try {
      console.log('📥 Cargando usuarios REALES de Firebase...');
      
      if (!window.FirebaseService || !window.db) {
        console.error('❌ Firebase no está disponible');
        setIsLoading(false);
        return;
      }

      // 1. Obtener todos los usuarios del sistema
      const usersSnapshot = await window.db.collection('usuarios').get();
      const users = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          ...userData
        });
      });

      console.log(`👥 ${users.length} usuarios encontrados en Firebase`);

      // 2. Para cada usuario, obtener su ubicación actual si existe
      const usersWithLocation = [];
      
      for (const user of users) {
        try {
          // Buscar la ubicación más reciente del usuario
          const locationSnapshot = await window.db
            .collection('user_locations')
            .where('userId', '==', user.id)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

          let location = null;
          let lastSeen = null;
          let isOnline = false;

          if (!locationSnapshot.empty) {
            const locationData = locationSnapshot.docs[0].data();
            location = {
              lat: locationData.latitude,
              lng: locationData.longitude
            };
            lastSeen = locationData.timestamp.toDate();
            
            // Considerar online si la última actualización fue hace menos de 5 minutos
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            isOnline = lastSeen > fiveMinutesAgo;
          }

          usersWithLocation.push({
            id: user.id,
            name: user.nombre || user.name || 'Usuario sin nombre',
            email: user.email || '',
            role: user.rol || user.role || 'albañil',
            location: location,
            lastSeen: lastSeen,
            isOnline: isOnline,
            obra: user.obra || 'Sin obra asignada'
          });

        } catch (error) {
          console.error(`❌ Error obteniendo ubicación para usuario ${user.id}:`, error);
          
          // Agregar usuario sin ubicación
          usersWithLocation.push({
            id: user.id,
            name: user.nombre || user.name || 'Usuario sin nombre',
            email: user.email || '',
            role: user.rol || user.role || 'albañil',
            location: null,
            lastSeen: null,
            isOnline: false,
            obra: user.obra || 'Sin obra asignada'
          });
        }
      }

      // Filtrar solo usuarios que tienen ubicación
      const usersWithValidLocation = usersWithLocation.filter(user => user.location !== null);
      
      console.log(`📍 ${usersWithValidLocation.length} usuarios con ubicación encontrados`);
      console.log('Usuarios con ubicación:', usersWithValidLocation);

      setRealUsers(usersWithValidLocation);
      setOnlineCount(usersWithValidLocation.filter(user => user.isOnline).length);
      setLastUpdate(new Date());
      setIsLoading(false);
      
      // Actualizar marcadores si el mapa está listo
      if (mapReady && mapInstance.current) {
        updateMarkersOnMap(usersWithValidLocation);
      }
      
    } catch (error) {
      console.error('❌ Error cargando usuarios reales:', error);
      setIsLoading(false);
      
      // Mostrar mensaje si no hay usuarios
      setRealUsers([]);
      setOnlineCount(0);
    }
  };

  // Actualizar marcadores en el mapa con usuarios REALES
  const updateMarkersOnMap = (userList) => {
    if (!mapInstance.current || !mapReady) {
      console.log('⏳ Mapa no está listo, esperando...');
      return;
    }

    console.log(`📍 Actualizando marcadores para ${userList.length} usuarios reales...`);

    // Limpiar marcadores anteriores
    Object.values(markersRef.current).forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = {};

    if (userList.length === 0) {
      console.log('⚠️ No hay usuarios con ubicación para mostrar');
      return;
    }

    // Crear marcadores para usuarios reales
    userList.forEach(user => {
      const style = getRoleStyle(user.role, user.isOnline);
      
      // Crear marcador personalizado
      const marker = new window.google.maps.Marker({
        position: user.location,
        map: mapInstance.current,
        title: user.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="${style.color}" stroke="white" stroke-width="3" opacity="${style.opacity}"/>
              <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${style.icon}</text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        }
      });

      // Info Window con detalles del usuario real
      const infoContent = `
        <div style="padding: 10px; max-width: 250px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 24px; margin-right: 8px;">${style.icon}</span>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${user.name}</h3>
              <p style="margin: 0; color: ${style.color}; font-size: 14px;">${style.name}</p>
            </div>
          </div>
          <div style="font-size: 14px;">
            <p style="margin: 4px 0;"><strong>Email:</strong> ${user.email}</p>
            <p style="margin: 4px 0;"><strong>Estado:</strong> 
              <span style="color: ${user.isOnline ? '#10B981' : '#EF4444'};">
                ${user.isOnline ? '🟢 En línea' : '🔴 Desconectado'}
              </span>
            </p>
            <p style="margin: 4px 0;"><strong>Obra:</strong> ${user.obra}</p>
            ${user.lastSeen ? `<p style="margin: 4px 0;"><strong>Última ubicación:</strong> ${user.lastSeen.toLocaleString()}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Coordenadas:</strong> ${user.location.lat.toFixed(6)}, ${user.location.lng.toFixed(6)}</p>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button onclick="alert('Contactar a ${user.name} (${user.email})')" style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">📞 Contactar</button>
            <button onclick="alert('Ver historial de ${user.name}')" style="background: #6B7280; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">📊 Historial</button>
          </div>
        </div>
      `;

      // Agregar evento click
      marker.addListener('click', () => {
        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        });
        infoWindow.open(mapInstance.current, marker);
      });

      markersRef.current[user.id] = marker;
    });

    // Ajustar zoom para mostrar todos los usuarios
    if (userList.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      userList.forEach(user => {
        bounds.extend(user.location);
      });
      mapInstance.current.fitBounds(bounds);
      
      // Asegurar zoom mínimo
      setTimeout(() => {
        const zoom = mapInstance.current.getZoom();
        if (zoom > 16) {
          mapInstance.current.setZoom(16);
        }
      }, 100);
    }
  };

  // Effect para inicializar
  useEffect(() => {
    console.log('🗺️ Inicializando Panel de Control de Agentes REALES...');
    
    const timer = setTimeout(() => {
      initializeGoogleMaps();
    }, 500); // Dar tiempo para que el DOM esté listo

    return () => clearTimeout(timer);
  }, []);

  // Effect para actualizar marcadores cuando el mapa esté listo
  useEffect(() => {
    if (mapReady && realUsers.length > 0) {
      updateMarkersOnMap(realUsers);
    }
  }, [mapReady, realUsers]);

  // Actualización periódica de ubicaciones REALES
  useEffect(() => {
    if (mapReady) {
      const interval = setInterval(() => {
        console.log('🔄 Actualizando ubicaciones de usuarios reales...');
        loadRealUsers();
      }, 30000); // Cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [mapReady]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Control de Agentes</div>
          <div className="text-gray-500 mb-4">{loadingMessage}</div>
          <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto animate-spin"></div>
        </div>
      </div>
    );
  }

  // Si no hay usuarios con ubicación
  if (realUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📍</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">No hay agentes con ubicación</div>
          <div className="text-gray-500 mb-4">
            Los empleados deben activar el tracking de ubicación desde sus dispositivos móviles.
          </div>
          <button 
            onClick={() => {
              setIsLoading(true);
              setLoadingMessage('Actualizando...');
              loadRealUsers();
            }}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h1 className="text-xl font-bold">Control de Agentes - Usuarios Reales</h1>
              <p className="text-blue-100 text-sm">
                {realUsers.length} agentes con ubicación • {onlineCount} en línea • 
                Actualizado: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-green-500 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              EN VIVO
            </div>
            <button 
              onClick={() => {
                setLoadingMessage('Actualizando usuarios...');
                loadRealUsers();
              }}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Mapa FULLSCREEN */}
      <div className="flex-1 relative">
        <div 
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '600px' }}
        />
        
        {/* Stats overlay */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-800 mb-2">Usuarios Reales</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>👑 Admins:</span>
              <span className="font-medium">{realUsers.filter(u => u.role === 'admin').length}</span>
            </div>
            <div className="flex justify-between">
              <span>🛠️ Supervisores:</span>
              <span className="font-medium">{realUsers.filter(u => u.role === 'supervisor').length}</span>
            </div>
            <div className="flex justify-between">
              <span>👨‍💼 Jefes de Obra:</span>
              <span className="font-medium">{realUsers.filter(u => u.role === 'jefe_obra').length}</span>
            </div>
            <div className="flex justify-between">
              <span>👷 Albañiles:</span>
              <span className="font-medium">{realUsers.filter(u => u.role === 'albañil').length}</span>
            </div>
            <div className="flex justify-between">
              <span>🚚 Logística:</span>
              <span className="font-medium">{realUsers.filter(u => u.role === 'logistica').length}</span>
            </div>
            <hr className="my-2"/>
            <div className="flex justify-between font-semibold">
              <span>🟢 En línea:</span>
              <span className="text-green-600">{onlineCount}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>🔴 Offline:</span>
              <span className="text-red-600">{realUsers.length - onlineCount}</span>
            </div>
          </div>
        </div>

        {/* Loading overlay si el mapa no está listo */}
        {!mapReady && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="spinner w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto animate-spin mb-4"></div>
              <div className="text-gray-700 font-medium">{loadingMessage}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// NO DEFINIR window.initMap - Esto causa el conflicto

// Exportar componente
window.AgentTrackingPanel = AgentTrackingPanel;