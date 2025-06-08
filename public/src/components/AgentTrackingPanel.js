// src/components/AgentTrackingPanel.js - INTEGRADO con LocationTrackingService
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
    withLocation: 0
  });
  const [debugInfo, setDebugInfo] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
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

  // Cargar empleados con ubicaciones REALES
  const loadEmployeesWithRealLocations = async () => {
    try {
      addDebug('📥 Cargando empleados con ubicaciones REALES...');
      
      if (!window.LocationTrackingService) {
        addDebug('❌ LocationTrackingService no disponible');
        return [];
      }

      // Usar el servicio de tracking para obtener empleados con ubicaciones
      const employeesWithLocations = await window.LocationTrackingService.getAllEmployeesWithLocations();
      
      addDebug(`✅ ${employeesWithLocations.length} empleados obtenidos del LocationTrackingService`);
      
      // Convertir al formato del mapa + agregar empleados del backend
      let allEmployees = [];

      // 1. Empleados con LocationTrackingService (ubicaciones reales)
      const realLocationEmployees = employeesWithLocations.map(emp => ({
        id: `tracking_${emp.id}`,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        obra: emp.currentObra,
        location: emp.location ? {
          lat: emp.location.latitude,
          lng: emp.location.longitude,
          accuracy: emp.location.accuracy,
          isReal: true
        } : null,
        isOnline: emp.location?.isOnline || false,
        lastSeen: emp.location?.lastSeen || new Date(0),
        source: 'tracking'
      }));

      allEmployees = allEmployees.concat(realLocationEmployees);

      // 2. Empleados del backend (AdminPanel) que NO están en tracking
      try {
        addDebug('🔧 Verificando usuarios del backend...');
        const backendResponse = await fetch('/api/usuarios', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (backendResponse.ok) {
          const backendUsers = await backendResponse.json();
          addDebug(`👥 Backend: ${backendUsers.length} usuarios encontrados`);
          
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
          addDebug(`✅ ${backendEmployees.length} usuarios del backend agregados`);
        }
      } catch (error) {
        addDebug(`⚠️ Error cargando backend: ${error.message}`);
      }

      // 3. Calcular estadísticas
      const statsData = {
        total: allEmployees.length,
        online: allEmployees.filter(emp => emp.isOnline).length,
        offline: allEmployees.filter(emp => !emp.isOnline).length,
        withLocation: allEmployees.filter(emp => emp.location).length,
        realLocations: allEmployees.filter(emp => emp.location?.isReal).length,
        simulatedLocations: allEmployees.filter(emp => emp.location && !emp.location?.isReal).length
      };

      setStats(statsData);
      setEmployees(allEmployees);
      setLastUpdate(new Date());

      addDebug(`📊 Estadísticas: ${statsData.total} total, ${statsData.online} online, ${statsData.realLocations} ubicaciones reales`);
      
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

      // Configurar listener que se ejecuta cuando hay cambios
      locationListener.current = window.LocationTrackingService.listenToEmployeeLocations(
        (locations, error) => {
          if (error) {
            addDebug(`❌ Error en listener: ${error.message}`);
            return;
          }

          addDebug(`🔄 Actualización en tiempo real: ${locations?.length || 0} ubicaciones`);
          
          // Recargar empleados cuando hay cambios
          loadEmployeesWithRealLocations().then(updatedEmployees => {
            if (mapReady && updatedEmployees.length > 0) {
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

      // Cargar Leaflet si no está disponible
      if (!window.L) {
        addDebug('📦 Cargando Leaflet...');
        await loadLeafletLibrary();
      }
      
      addDebug('🗺️ Creando mapa...');
      
      // Crear mapa centrado en Buenos Aires
      const map = window.L.map(mapRef.current).setView([-34.6118, -58.3960], 12);
      
      // Agregar tiles de OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      mapInstance.current = map;
      setMapReady(true);
      addDebug('✅ Mapa creado exitosamente');
      
      // Cargar empleados y configurar listener
      const employeesData = await loadEmployeesWithRealLocations();
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

    // Crear marcadores para empleados con ubicación
    const employeesWithLocation = employeesList.filter(emp => emp.location);
    
    employeesWithLocation.forEach(employee => {
      const color = getColorByRole(employee.role);
      const icon = getIconByRole(employee.role);
      const isReal = employee.location.isReal;
      
      // Icono con indicador de tipo de ubicación
      const customIcon = window.L.divIcon({
        html: `
          <div style="position: relative;">
            <div style="
              background-color: ${color}; 
              color: white; 
              border-radius: 50%; 
              width: 40px; 
              height: 40px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 18px; 
              border: 3px solid white; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              opacity: ${employee.isOnline ? 1 : 0.6};
            ">
              ${icon}
            </div>
            <!-- Indicador de ubicación real/simulada -->
            <div style="
              position: absolute;
              top: -2px;
              right: -2px;
              background-color: ${isReal ? '#10B981' : '#F59E0B'};
              color: white;
              border-radius: 50%;
              width: 14px;
              height: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              border: 2px solid white;
              font-weight: bold;
            ">
              ${isReal ? '📍' : '🎯'}
            </div>
            <!-- Indicador de fuente -->
            <div style="
              position: absolute;
              bottom: -2px;
              left: -2px;
              background-color: ${employee.source === 'tracking' ? '#3B82F6' : '#8B5CF6'};
              color: white;
              border-radius: 50%;
              width: 12px;
              height: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              border: 1px solid white;
              font-weight: bold;
            ">
              ${employee.source === 'tracking' ? 'T' : 'B'}
            </div>
          </div>
        `,
        className: 'custom-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = window.L.marker([employee.location.lat, employee.location.lng], {
        icon: customIcon
      }).addTo(mapInstance.current);

      // Popup informativo
      const timeSinceLastSeen = employee.lastSeen ? 
        Math.round((new Date() - employee.lastSeen) / 1000 / 60) : 0;

      const popupContent = `
        <div style="padding: 10px; min-width: 250px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 24px; margin-right: 8px;">${icon}</span>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${employee.name}</h3>
              <p style="margin: 0; color: ${color}; font-size: 14px;">${getRoleLabel(employee.role)}</p>
            </div>
          </div>
          
          <div style="font-size: 13px; line-height: 1.4;">
            <p style="margin: 4px 0;"><strong>📧 Email:</strong> ${employee.email}</p>
            <p style="margin: 4px 0;"><strong>🏗️ Obra:</strong> ${employee.obra || 'Sin asignar'}</p>
            <p style="margin: 4px 0;"><strong>📊 Estado:</strong> 
              <span style="color: ${employee.isOnline ? '#10B981' : '#EF4444'};">
                ${employee.isOnline ? '🟢 En línea' : '🔴 Desconectado'}
              </span>
            </p>
            <p style="margin: 4px 0;"><strong>🕐 Última vez:</strong> 
              ${timeSinceLastSeen < 60 ? `${timeSinceLastSeen}min` : `${Math.round(timeSinceLastSeen/60)}h`} atrás
            </p>
            <p style="margin: 4px 0;"><strong>📍 Ubicación:</strong> 
              <span style="padding: 2px 6px; border-radius: 12px; background-color: ${isReal ? '#10B981' : '#F59E0B'}; color: white; font-size: 11px;">
                ${isReal ? '🎯 GPS Real' : '📍 Simulada'}
              </span>
              ${employee.location.accuracy ? `(±${Math.round(employee.location.accuracy)}m)` : ''}
            </p>
            <p style="margin: 4px 0;"><strong>💾 Fuente:</strong> 
              <span style="padding: 2px 6px; border-radius: 12px; background-color: ${employee.source === 'tracking' ? '#3B82F6' : '#8B5CF6'}; color: white; font-size: 11px;">
                ${employee.source === 'tracking' ? '📡 Tracking' : '🔧 Backend'}
              </span>
            </p>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      markersRef.current[employee.id] = marker;
    });

    // Ajustar vista si hay marcadores
    if (employeesWithLocation.length > 0) {
      const group = new window.L.featureGroup(Object.values(markersRef.current));
      mapInstance.current.fitBounds(group.getBounds().pad(0.1));
      
      setTimeout(() => {
        if (mapInstance.current.getZoom() > 15) {
          mapInstance.current.setZoom(15);
        }
      }, 500);
    }

    addDebug(`✅ ${employeesWithLocation.length} marcadores actualizados`);
  };

  // Utilidades
  const getColorByRole = (role) => {
    const colors = {
      admin: '#8B5CF6',
      administrador: '#8B5CF6',
      jefe_obra: '#F59E0B',
      empleado: '#10B981',
      albañil: '#10B981',
      albanil: '#10B981',
      logistica: '#EF4444'
    };
    return colors[role] || '#6B7280';
  };

  const getIconByRole = (role) => {
    const icons = {
      admin: '👑',
      administrador: '👑',
      jefe_obra: '👨‍💼',
      empleado: '👷',
      albañil: '👷',
      albanil: '👷',
      logistica: '🚚'
    };
    return icons[role] || '👤';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      administrador: 'Administrador',
      jefe_obra: 'Jefe de Obra',
      empleado: 'Empleado',
      albañil: 'Albañil',
      albanil: 'Albañil',
      logistica: 'Logística'
    };
    return labels[role] || role;
  };

  // Inicialización
  useEffect(() => {
    addDebug('🚀 AgentTrackingPanel montado');
    
    setTimeout(() => {
      initMap();
    }, 1000);

    return () => {
      addDebug('🧹 Limpiando listener...');
      if (locationListener.current) {
        locationListener.current();
      }
    };
  }, []);

  // Actualización periódica adicional
  useEffect(() => {
    if (!loading && mapReady) {
      const interval = setInterval(() => {
        addDebug('🔄 Actualización periódica...');
        loadEmployeesWithRealLocations().then(updatedEmployees => {
          if (updatedEmployees.length > 0) {
            updateMapMarkers(updatedEmployees);
          }
        });
      }, 60000); // Cada minuto

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
              <h1 className="text-xl font-bold">Control de Agentes en Tiempo Real</h1>
              <p className="text-blue-100 text-sm">
                {stats.total} agentes • {stats.online} en línea • {stats.realLocations} ubicaciones reales
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
                addDebug('🔄 Actualización manual');
                loadEmployeesWithRealLocations().then(employees => {
                  if (employees.length > 0) {
                    updateMapMarkers(employees);
                  }
                });
              }}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* ESTADÍSTICAS DETALLADAS */}
      <div className="absolute top-20 right-4 z-50 bg-white rounded-lg shadow-lg p-3">
        <h4 className="font-medium text-gray-800 mb-2 text-sm">Estadísticas</h4>
        <div className="space-y-1 text-xs">
          <div>👥 Total: {stats.total}</div>
          <div>🟢 Online: {stats.online}</div>
          <div>🔴 Offline: {stats.offline}</div>
          <div>📍 Con ubicación: {stats.withLocation}</div>
          <div>🎯 GPS Real: {stats.realLocations}</div>
          <div>📍 Simulada: {stats.simulatedLocations}</div>
          <div className="pt-1 border-t">
            <div>🕐 {lastUpdate.toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* DEBUG PANEL */}
      <div className="absolute top-20 left-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold text-gray-800 mb-2">Estado del Sistema</h3>
        <div className="space-y-1 text-sm">
          <p>📍 Contenedor: {mapRef.current ? '✅ OK' : '❌ NULL'}</p>
          <p>🗺️ Mapa: {mapReady ? '✅ Listo' : '⏳ Cargando'}</p>
          <p>🍃 Leaflet: {window.L ? '✅ OK' : '❌ No'}</p>
          <p>📡 LocationService: {window.LocationTrackingService ? '✅ OK' : '❌ No'}</p>
          <p>🔄 Listener: {locationListener.current ? '✅ Activo' : '❌ Inactivo'}</p>
          <p>📍 Marcadores: {Object.keys(markersRef.current).length}</p>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-1 text-xs">Debug Log:</h4>
          <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
            {debugInfo.slice(-4).map((info, index) => (
              <div key={index} className="text-gray-600">{info}</div>
            ))}
          </div>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="absolute bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-3">
        <h4 className="font-medium text-gray-800 mb-2 text-sm">Leyenda</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center">
            <span className="mr-2">🎯</span>
            <span>GPS Real</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">📍</span>
            <span>Simulada</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-blue-600 font-bold">T</span>
            <span>Tracking System</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-purple-600 font-bold">B</span>
            <span>Backend/Admin</span>
          </div>
        </div>
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <div className="text-lg font-semibold mb-2">Cargando Sistema de Tracking</div>
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}

      {/* CONTENEDOR DEL MAPA */}
      <div
        ref={mapRef}
        className="w-full h-full bg-gray-200"
        style={{ 
          minHeight: '600px',
          marginTop: '80px' // Espacio para el header
        }}
      />
    </div>
  );
};

// Exportar
window.AgentTrackingPanel = AgentTrackingPanel;