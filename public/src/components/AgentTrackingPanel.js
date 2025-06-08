// src/components/AgentTrackingPanel.js - SOLO UBICACIONES REALES
const { useState, useEffect, useRef } = React;

const AgentTrackingPanel = ({ adminId }) => {
  // Estados
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    withRealLocation: 0,
    backendUsers: 0
  });
  const [debugInfo, setDebugInfo] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showSimulated, setShowSimulated] = useState(false); // Toggle para mostrar simuladas
  
  // Referencias
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const locationListener = useRef(null);

  // Debug logger
  const addDebug = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setDebugInfo(prev => [...prev.slice(-6), logMessage]);
  };

  // Cargar SOLO empleados con ubicaciones REALES
  const loadRealLocationEmployees = async () => {
    try {
      addDebug('📥 Cargando SOLO empleados con ubicaciones REALES...');
      
      let allEmployees = [];

      // 1. EMPLEADOS CON TRACKING REAL
      if (window.LocationTrackingService) {
        try {
          const employeesWithLocations = await window.LocationTrackingService.getAllEmployeesWithLocations();
          
          // FILTRAR: Solo empleados que tienen ubicación real
          const realLocationEmployees = employeesWithLocations
            .filter(emp => emp.location && emp.location.latitude && emp.location.longitude)
            .map(emp => ({
              id: `tracking_${emp.id}`,
              name: emp.name,
              email: emp.email,
              role: emp.role,
              obra: emp.currentObra,
              location: {
                lat: emp.location.latitude,
                lng: emp.location.longitude,
                accuracy: emp.location.accuracy,
                isReal: true
              },
              isOnline: emp.location?.isOnline || false,
              lastSeen: emp.location?.lastSeen || new Date(0),
              source: 'tracking'
            }));

          allEmployees = allEmployees.concat(realLocationEmployees);
          addDebug(`✅ ${realLocationEmployees.length} empleados con ubicación GPS real encontrados`);
          
        } catch (error) {
          addDebug(`⚠️ Error cargando LocationTrackingService: ${error.message}`);
        }
      }

      // 2. USUARIOS DEL BACKEND - SOLO COMO REFERENCIA (sin ubicación simulada)
      let backendUsersCount = 0;
      try {
        const backendResponse = await fetch('/api/usuarios', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (backendResponse.ok) {
          const backendUsers = await backendResponse.json();
          backendUsersCount = backendUsers.length;
          addDebug(`📋 ${backendUsersCount} usuarios en backend (sin ubicación GPS)`);
          
          // SOLO agregar si el toggle está activado
          if (showSimulated) {
            const backendEmployees = backendUsers
              .filter(user => !allEmployees.find(emp => emp.email === user.email))
              .map(user => ({
                id: `backend_${user.id}`,
                name: `${user.nombre} ${user.apellido || ''}`.trim(),
                email: user.email,
                role: user.rol,
                obra: user.obra || 'Sin obra asignada',
                location: {
                  lat: -34.6118 + (Math.random() - 0.5) * 0.02,
                  lng: -58.3960 + (Math.random() - 0.5) * 0.02,
                  isReal: false
                },
                isOnline: user.activo || false,
                lastSeen: new Date(),
                source: 'backend'
              }));

            allEmployees = allEmployees.concat(backendEmployees);
            addDebug(`⚠️ ${backendEmployees.length} usuarios backend agregados como simulados`);
          }
        }
      } catch (error) {
        addDebug(`⚠️ Error cargando backend: ${error.message}`);
      }

      // 3. Calcular estadísticas
      const statsData = {
        total: allEmployees.length,
        online: allEmployees.filter(emp => emp.isOnline).length,
        offline: allEmployees.filter(emp => !emp.isOnline).length,
        withRealLocation: allEmployees.filter(emp => emp.location?.isReal).length,
        backendUsers: backendUsersCount
      };

      setStats(statsData);
      setEmployees(allEmployees);
      setLastUpdate(new Date());

      if (allEmployees.length === 0) {
        addDebug('⚠️ NO HAY EMPLEADOS CON UBICACIÓN GPS REAL');
        addDebug('💡 Los empleados deben activar tracking desde sus móviles');
      } else {
        addDebug(`📊 ${statsData.withRealLocation} empleados con GPS real visible en mapa`);
      }
      
      return allEmployees;

    } catch (error) {
      addDebug(`❌ Error cargando empleados: ${error.message}`);
      return [];
    }
  };

  // Configurar listener en tiempo real
  const setupRealTimeListener = () => {
    try {
      addDebug('🔄 Configurando listener de ubicaciones en tiempo real...');

      if (!window.LocationTrackingService) {
        addDebug('❌ LocationTrackingService no disponible para listener');
        return;
      }

      locationListener.current = window.LocationTrackingService.listenToEmployeeLocations(
        (locations, error) => {
          if (error) {
            addDebug(`❌ Error en listener: ${error.message}`);
            return;
          }

          addDebug(`🔄 Cambio detectado: ${locations?.length || 0} ubicaciones actualizadas`);
          
          // Recargar empleados cuando hay cambios
          loadRealLocationEmployees().then(updatedEmployees => {
            if (mapReady) {
              updateMapMarkers(updatedEmployees);
            }
          });
        }
      );

      addDebug('✅ Listener de tiempo real configurado');

    } catch (error) {
      addDebug(`❌ Error configurando listener: ${error.message}`);
    }
  };

  // Inicializar mapa
  const initMap = async () => {
    try {
      addDebug('🗺️ Iniciando inicialización del mapa...');
      
      if (!mapRef.current) {
        throw new Error('Contenedor del mapa no disponible');
      }

      if (!window.L) {
        addDebug('📦 Cargando Leaflet...');
        await loadLeafletLibrary();
      }
      
      addDebug('🗺️ Creando mapa...');
      
      // Crear mapa centrado en Buenos Aires
      const map = window.L.map(mapRef.current).setView([-34.6118, -58.3960], 12);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      mapInstance.current = map;
      setMapReady(true);
      addDebug('✅ Mapa creado exitosamente');
      
      // Cargar empleados y configurar listener
      const employeesData = await loadRealLocationEmployees();
      setupRealTimeListener();
      
      if (employeesData.length > 0) {
        updateMapMarkers(employeesData);
      }
      
      setLoading(false);
      
    } catch (error) {
      addDebug(`❌ Error inicializando mapa: ${error.message}`);
      setTimeout(() => {
        addDebug('🔄 Reintentando inicialización...');
        initMap();
      }, 3000);
    }
  };

  // Cargar Leaflet dinámicamente
  const loadLeafletLibrary = () => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Actualizar marcadores en el mapa
  const updateMapMarkers = (employeesList) => {
    if (!mapInstance.current || !window.L || !employeesList.length) {
      addDebug('⚠️ No se pueden actualizar marcadores');
      return;
    }

    addDebug(`📍 Actualizando ${employeesList.length} marcadores...`);

    // Limpiar marcadores existentes
    Object.values(markersRef.current).forEach(marker => {
      mapInstance.current.removeLayer(marker);
    });
    markersRef.current = {};

    // Crear marcadores solo para empleados con ubicación
    const employeesWithLocation = employeesList.filter(emp => emp.location);
    
    employeesWithLocation.forEach(employee => {
      const color = getColorByRole(employee.role);
      const icon = getIconByRole(employee.role);
      const isReal = employee.location.isReal;
      
      // Icono con indicadores claros
      const customIcon = window.L.divIcon({
        html: `
          <div style="position: relative;">
            <div style="
              background-color: ${color}; 
              color: white; 
              border-radius: 50%; 
              width: 45px; 
              height: 45px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 20px; 
              border: 4px solid ${isReal ? '#10B981' : '#F59E0B'}; 
              box-shadow: 0 3px 15px rgba(0,0,0,0.4);
              opacity: ${employee.isOnline ? 1 : 0.6};
            ">
              ${icon}
            </div>
            <!-- Indicador GPS REAL/SIMULADA más grande -->
            <div style="
              position: absolute;
              top: -3px;
              right: -3px;
              background-color: ${isReal ? '#10B981' : '#F59E0B'};
              color: white;
              border-radius: 50%;
              width: 18px;
              height: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              border: 2px solid white;
              font-weight: bold;
            ">
              ${isReal ? '📍' : '⚠️'}
            </div>
          </div>
        `,
        className: 'custom-marker',
        iconSize: [45, 45],
        iconAnchor: [22, 22]
      });

      const marker = window.L.marker([employee.location.lat, employee.location.lng], {
        icon: customIcon
      }).addTo(mapInstance.current);

      // Popup informativo mejorado
      const timeSinceLastSeen = employee.lastSeen ? 
        Math.round((new Date() - employee.lastSeen) / 1000 / 60) : 0;

      const popupContent = `
        <div style="padding: 12px; min-width: 280px;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 28px; margin-right: 10px;">${icon}</span>
            <div>
              <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: ${color};">${employee.name}</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">${getRoleLabel(employee.role)}</p>
            </div>
          </div>
          
          <div style="font-size: 14px; line-height: 1.5;">
            <p style="margin: 6px 0;"><strong>📧 Email:</strong> ${employee.email}</p>
            <p style="margin: 6px 0;"><strong>🏗️ Obra:</strong> ${employee.obra || 'Sin asignar'}</p>
            <p style="margin: 6px 0;"><strong>📊 Estado:</strong> 
              <span style="color: ${employee.isOnline ? '#10B981' : '#EF4444'}; font-weight: bold;">
                ${employee.isOnline ? '🟢 EN LÍNEA' : '🔴 DESCONECTADO'}
              </span>
            </p>
            <p style="margin: 6px 0;"><strong>🕐 Última actividad:</strong> 
              <span style="color: #666;">
                ${timeSinceLastSeen < 60 ? `${timeSinceLastSeen} min` : `${Math.round(timeSinceLastSeen/60)} h`} atrás
              </span>
            </p>
            <div style="margin: 8px 0; padding: 8px; border-radius: 8px; background-color: ${isReal ? '#F0FDF4' : '#FEF3C7'};">
              <p style="margin: 0; font-weight: bold; color: ${isReal ? '#059669' : '#D97706'};">
                📍 ${isReal ? '🎯 UBICACIÓN GPS REAL' : '⚠️ UBICACIÓN SIMULADA'}
              </p>
              ${employee.location.accuracy && isReal ? 
                `<p style="margin: 2px 0 0 0; font-size: 12px; color: #666;">Precisión: ±${Math.round(employee.location.accuracy)}m</p>` : 
                ''
              }
              ${!isReal ? 
                `<p style="margin: 2px 0 0 0; font-size: 12px; color: #D97706;">Usuario debe activar tracking desde móvil</p>` : 
                ''
              }
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: 'custom-popup'
      });

      markersRef.current[employee.id] = marker;
    });

    // Ajustar vista solo si hay marcadores reales
    const realLocationEmployees = employeesWithLocation.filter(emp => emp.location.isReal);
    if (realLocationEmployees.length > 0) {
      const realMarkers = realLocationEmployees.map(emp => markersRef.current[emp.id]);
      const group = new window.L.featureGroup(realMarkers);
      mapInstance.current.fitBounds(group.getBounds().pad(0.2));
      
      setTimeout(() => {
        if (mapInstance.current.getZoom() > 15) {
          mapInstance.current.setZoom(15);
        }
      }, 500);
    }

    addDebug(`✅ ${employeesWithLocation.length} marcadores actualizados (${employeesWithLocation.filter(e => e.location.isReal).length} reales)`);
  };

  // Utilidades
  const getColorByRole = (role) => {
    const colors = {
      admin: '#8B5CF6', administrador: '#8B5CF6',
      jefe_obra: '#F59E0B', empleado: '#10B981',
      albañil: '#10B981', albanil: '#10B981',
      logistica: '#EF4444'
    };
    return colors[role] || '#6B7280';
  };

  const getIconByRole = (role) => {
    const icons = {
      admin: '👑', administrador: '👑',
      jefe_obra: '👨‍💼', empleado: '👷',
      albañil: '👷', albanil: '👷',
      logistica: '🚚'
    };
    return icons[role] || '👤';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador', administrador: 'Administrador',
      jefe_obra: 'Jefe de Obra', empleado: 'Empleado',
      albañil: 'Albañil', albanil: 'Albañil',
      logistica: 'Logística'
    };
    return labels[role] || role;
  };

  // Inicialización
  useEffect(() => {
    addDebug('🚀 AgentTrackingPanel montado');
    setTimeout(() => { initMap(); }, 1000);

    return () => {
      addDebug('🧹 Limpiando listener...');
      if (locationListener.current) {
        locationListener.current();
      }
    };
  }, []);

  // Actualización cuando cambia el toggle
  useEffect(() => {
    if (mapReady) {
      loadRealLocationEmployees().then(updatedEmployees => {
        updateMapMarkers(updatedEmployees);
      });
    }
  }, [showSimulated, mapReady]);

  // Actualización periódica
  useEffect(() => {
    if (!loading && mapReady) {
      const interval = setInterval(() => {
        addDebug('🔄 Actualización periódica...');
        loadRealLocationEmployees().then(updatedEmployees => {
          if (updatedEmployees.length > 0) {
            updateMapMarkers(updatedEmployees);
          }
        });
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [loading, mapReady]);

  // Render
  return (
    <div className="w-full h-full relative" style={{ minHeight: '600px' }}>
      {/* HEADER MEJORADO */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h1 className="text-xl font-bold">Control de Agentes - Solo GPS Real</h1>
              <p className="text-blue-100 text-sm">
                {stats.withRealLocation} con GPS real • {stats.backendUsers} usuarios backend sin GPS
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={showSimulated}
                onChange={(e) => setShowSimulated(e.target.checked)}
                className="mr-2"
              />
              Mostrar simuladas
            </label>
            
            <div className="bg-green-500 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              GPS REAL
            </div>
            
            <button 
              onClick={() => {
                addDebug('🔄 Actualización manual');
                loadRealLocationEmployees().then(employees => {
                  updateMapMarkers(employees);
                });
              }}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* ESTADÍSTICAS REALES */}
      <div className="absolute top-20 right-4 z-50 bg-white rounded-lg shadow-lg p-3">
        <h4 className="font-medium text-gray-800 mb-2 text-sm">📊 Estado Real</h4>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-green-600">🎯 GPS Real: {stats.withRealLocation}</div>
          <div className="text-gray-600">👥 Backend sin GPS: {stats.backendUsers}</div>
          <div className="text-gray-600">🟢 Online: {stats.online}</div>
          <div className="text-gray-600">🔴 Offline: {stats.offline}</div>
          <div className="pt-1 border-t text-xs text-gray-500">
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* MENSAJE SIN UBICACIONES REALES */}
      {!loading && stats.withRealLocation === 0 && (
        <div className="absolute top-32 left-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ Sin Ubicaciones GPS Reales</h4>
          <p className="text-yellow-700 text-sm mb-2">
            No hay empleados con GPS activo. Para aparecer en el mapa:
          </p>
          <ol className="text-yellow-700 text-xs space-y-1">
            <li>1. Abrir app desde móvil</li>
            <li>2. Ejecutar código de activación GPS</li>
            <li>3. Aceptar permisos de ubicación</li>
          </ol>
        </div>
      )}

      {/* DEBUG PANEL */}
      <div className="absolute top-20 left-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold text-gray-800 mb-2">Estado del Sistema</h3>
        <div className="space-y-1 text-sm">
          <p>📍 Contenedor: {mapRef.current ? '✅ OK' : '❌ NULL'}</p>
          <p>🗺️ Mapa: {mapReady ? '✅ Listo' : '⏳ Cargando'}</p>
          <p>📡 LocationService: {window.LocationTrackingService ? '✅ OK' : '❌ No'}</p>
          <p>🔄 Listener: {locationListener.current ? '✅ Activo' : '❌ Inactivo'}</p>
          <p>📍 Marcadores: {Object.keys(markersRef.current).length}</p>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-1 text-xs">Log:</h4>
          <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
            {debugInfo.slice(-4).map((info, index) => (
              <div key={index} className="text-gray-600">{info}</div>
            ))}
          </div>
        </div>
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40">
          <div className="text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-lg font-semibold mb-2">Cargando Solo GPS Real</div>
            <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}

      {/* CONTENEDOR DEL MAPA */}
      <div
        ref={mapRef}
        className="w-full h-full bg-gray-200"
        style={{ 
          minHeight: '600px',
          marginTop: '80px'
        }}
      />
    </div>
  );
};

// Exportar
window.AgentTrackingPanel = AgentTrackingPanel;