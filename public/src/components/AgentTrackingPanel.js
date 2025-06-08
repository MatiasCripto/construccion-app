// src/components/AgentTrackingPanel.js - VERSIÓN SIMPLE SIN API KEY
const { useState, useEffect, useRef } = React;

const AgentTrackingPanel = ({ adminId }) => {
    // Estados principales
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trackingActive, setTrackingActive] = useState(true);
    const [filters, setFilters] = useState({
        albañil: true,
        supervisor: true,
        logistica: true,
        admin: true
    });

    // Referencias
    const mapRef = useRef(null);
    const leafletMapRef = useRef(null);
    const markersRef = useRef(new Map());
    const trackingIntervalRef = useRef(null);

    // Configuración
    const TRACKING_INTERVAL = 30000; // 30 segundos

    // Iconos por rol
    const getRoleIcon = (role, isOnline = true) => {
        const baseIcons = {
            admin: '👑',
            supervisor: '🛠️', 
            albañil: '👷',
            logistica: '🚚',
            default: '👤'
        };
        
        const icon = baseIcons[role] || baseIcons.default;
        return isOnline ? icon : '⚪'; // Gris si está offline
    };

    const getRoleColor = (role, isOnline = true) => {
        const colors = {
            admin: '#3B82F6',      // Azul
            supervisor: '#10B981',  // Verde
            albañil: '#F59E0B',     // Naranja
            logistica: '#8B5CF6',   // Púrpura
            default: '#6B7280'      // Gris
        };
        
        return isOnline ? colors[role] || colors.default : '#9CA3AF';
    };

    // ==================== EFECTOS ====================

    useEffect(() => {
        initializeTracking();
        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (trackingActive) {
            startRealTimeTracking();
        } else {
            stopRealTimeTracking();
        }
    }, [trackingActive]);

    useEffect(() => {
        if (leafletMapRef.current && agents.length > 0) {
            updateMapMarkers();
        }
    }, [agents, filters]);

    // ==================== INICIALIZACIÓN ====================

    const initializeTracking = async () => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('🗺️ Inicializando panel de control de agentes...');

            // Cargar Leaflet (OpenStreetMap)
            await loadLeafletMap();
            
            // Cargar agentes iniciales
            await loadAgents();
            
            console.log('✅ Panel de control inicializado');

        } catch (err) {
            console.error('❌ Error inicializando tracking:', err);
            setError('Error inicializando panel de control: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadLeafletMap = async () => {
        return new Promise((resolve, reject) => {
            // Verificar si Leaflet ya está cargado
            if (window.L) {
                initializeMap();
                resolve();
                return;
            }

            // Cargar CSS de Leaflet
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(css);

            // Cargar JS de Leaflet
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                initializeMap();
                resolve();
            };
            script.onerror = () => reject(new Error('Error cargando Leaflet/OpenStreetMap'));
            document.head.appendChild(script);
        });
    };

    const initializeMap = () => {
        // Centrar en Buenos Aires
        const buenosAires = [-34.6037, -58.3816];

        leafletMapRef.current = L.map(mapRef.current).setView(buenosAires, 12);

        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMapRef.current);

        console.log('✅ OpenStreetMap inicializado');
    };

    // ==================== GESTIÓN DE AGENTES ====================

    const loadAgents = async () => {
        try {
            console.log('👥 Cargando agentes...');

            // Datos de ejemplo con ubicaciones en Buenos Aires
            const mockAgents = [
                {
                    id: 'agent_001',
                    name: 'Carlos Rodríguez',
                    role: 'supervisor',
                    location: { lat: -34.6118, lng: -58.3960 },
                    lastUpdate: new Date(),
                    isOnline: true,
                    currentObra: 'Edificio Central',
                    status: 'En obra'
                },
                {
                    id: 'agent_002', 
                    name: 'Miguel Torres',
                    role: 'albañil',
                    location: { lat: -34.5998, lng: -58.3731 },
                    lastUpdate: new Date(Date.now() - 120000), // 2 min ago
                    isOnline: true,
                    currentObra: 'Casa Familiar',
                    status: 'Trabajando'
                },
                {
                    id: 'agent_003',
                    name: 'Ana Martínez',
                    role: 'logistica',
                    location: { lat: -34.6092, lng: -58.3842 },
                    lastUpdate: new Date(Date.now() - 300000), // 5 min ago
                    isOnline: true,
                    currentObra: 'En tránsito',
                    status: 'Entregando materiales'
                },
                {
                    id: 'agent_004',
                    name: 'Roberto Silva',
                    role: 'albañil',
                    location: { lat: -34.6037, lng: -58.3816 },
                    lastUpdate: new Date(Date.now() - 1800000), // 30 min ago
                    isOnline: false,
                    currentObra: 'Oficinas Norte',
                    status: 'Desconectado'
                },
                {
                    id: 'agent_005',
                    name: 'Laura González',
                    role: 'supervisor',
                    location: { lat: -34.6150, lng: -58.3700 },
                    lastUpdate: new Date(Date.now() - 600000), // 10 min ago
                    isOnline: true,
                    currentObra: 'Plaza San Martín',
                    status: 'Supervisando'
                }
            ];

            setAgents(mockAgents);
            console.log(`✅ ${mockAgents.length} agentes cargados`);

        } catch (err) {
            console.error('❌ Error cargando agentes:', err);
            throw new Error('No se pudieron cargar los agentes');
        }
    };

    const startRealTimeTracking = () => {
        console.log('▶️ Iniciando tracking en tiempo real...');
        
        trackingIntervalRef.current = setInterval(() => {
            updateAgentLocations();
        }, TRACKING_INTERVAL);
    };

    const stopRealTimeTracking = () => {
        console.log('⏸️ Pausando tracking en tiempo real...');
        
        if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
            trackingIntervalRef.current = null;
        }
    };

    const updateAgentLocations = () => {
        console.log('📍 Actualizando ubicaciones...');
        
        // Simular movimiento de agentes
        setAgents(prevAgents => 
            prevAgents.map(agent => {
                if (!agent.isOnline) return agent;

                // Simular movimiento aleatorio pequeño (~200m)
                const deltaLat = (Math.random() - 0.5) * 0.002;
                const deltaLng = (Math.random() - 0.5) * 0.002;

                return {
                    ...agent,
                    location: {
                        lat: agent.location.lat + deltaLat,
                        lng: agent.location.lng + deltaLng
                    },
                    lastUpdate: new Date()
                };
            })
        );
    };

    // ==================== GESTIÓN DEL MAPA ====================

    const updateMapMarkers = () => {
        if (!leafletMapRef.current) return;

        // Limpiar marcadores existentes
        markersRef.current.forEach(marker => leafletMapRef.current.removeLayer(marker));
        markersRef.current.clear();

        // Crear nuevos marcadores
        agents.forEach(agent => {
            if (!filters[agent.role]) return; // Filtro aplicado

            const marker = L.marker([agent.location.lat, agent.location.lng], {
                icon: createCustomIcon(agent)
            }).addTo(leafletMapRef.current);

            // Popup con información del agente
            const popupContent = createPopupContent(agent);
            marker.bindPopup(popupContent);

            marker.on('click', () => {
                setSelectedAgent(agent);
            });

            markersRef.current.set(agent.id, marker);
        });

        // Ajustar vista del mapa para mostrar todos los marcadores
        fitMapToMarkers();
    };

    const createCustomIcon = (agent) => {
        const color = getRoleColor(agent.role, agent.isOnline);
        const emoji = getRoleIcon(agent.role, agent.isOnline);
        const size = agent.isOnline ? 40 : 30;

        return L.divIcon({
            html: `
                <div style="
                    background: ${color};
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    border: 3px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    cursor: pointer;
                ">
                    ${emoji}
                </div>
            `,
            className: 'custom-marker',
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });
    };

    const createPopupContent = (agent) => {
        const timeSinceUpdate = Math.floor((new Date() - agent.lastUpdate) / 60000);
        
        return `
            <div style="padding: 10px; font-family: Arial, sans-serif; min-width: 200px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 8px;">${getRoleIcon(agent.role, agent.isOnline)}</span>
                    <h3 style="margin: 0; color: #333;">${agent.name}</h3>
                </div>
                <div style="color: #666; font-size: 14px; line-height: 1.4;">
                    <div><strong>Rol:</strong> ${agent.role.charAt(0).toUpperCase() + agent.role.slice(1)}</div>
                    <div><strong>Estado:</strong> <span style="color: ${agent.isOnline ? '#10B981' : '#EF4444'}">${agent.status}</span></div>
                    <div><strong>Obra actual:</strong> ${agent.currentObra}</div>
                    <div><strong>Última actualización:</strong> hace ${timeSinceUpdate} min</div>
                    <div><strong>Coordenadas:</strong> ${agent.location.lat.toFixed(5)}, ${agent.location.lng.toFixed(5)}</div>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button onclick="alert('📞 Contactando a ${agent.name}...')" style="
                        background: #3B82F6; 
                        color: white; 
                        border: none; 
                        padding: 6px 12px; 
                        border-radius: 4px; 
                        cursor: pointer;
                        font-size: 12px;
                    ">📞 Contactar</button>
                    <button onclick="alert('📍 Historial de ${agent.name} del día')" style="
                        background: #6B7280; 
                        color: white; 
                        border: none; 
                        padding: 6px 12px; 
                        border-radius: 4px; 
                        cursor: pointer;
                        font-size: 12px;
                    ">📍 Historial</button>
                </div>
            </div>
        `;
    };

    const fitMapToMarkers = () => {
        if (!leafletMapRef.current || markersRef.current.size === 0) return;

        const group = new L.featureGroup(Array.from(markersRef.current.values()));
        leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
    };

    // ==================== FUNCIONES DE CONTROL ====================

    const centerOnAgent = (agent) => {
        if (leafletMapRef.current) {
            leafletMapRef.current.setView([agent.location.lat, agent.location.lng], 16);
            setSelectedAgent(agent);
        }
    };

    const toggleFilter = (role) => {
        setFilters(prev => ({
            ...prev,
            [role]: !prev[role]
        }));
    };

    const cleanup = () => {
        console.log('🧹 Limpiando recursos del tracking...');
        
        if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
        }
        
        if (markersRef.current) {
            markersRef.current.forEach(marker => {
                if (leafletMapRef.current) {
                    leafletMapRef.current.removeLayer(marker);
                }
            });
            markersRef.current.clear();
        }
    };

    const getAgentStats = () => {
        const total = agents.length;
        const online = agents.filter(a => a.isOnline).length;
        const byRole = agents.reduce((acc, agent) => {
            acc[agent.role] = (acc[agent.role] || 0) + 1;
            return acc;
        }, {});

        return { total, online, offline: total - online, byRole };
    };

    // ==================== RENDER ====================

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">🗺️ Inicializando Control de Agentes</h2>
                    <p className="text-gray-500">Cargando OpenStreetMap y ubicaciones...</p>
                </div>
            </div>
        );
    }

    const stats = getAgentStats();

    return (
        <div className="agent-tracking-panel h-screen flex bg-gray-50">
            {/* Panel lateral */}
            <div className="w-80 bg-white shadow-lg flex flex-col">
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <h1 className="text-xl font-bold flex items-center">
                        🗺️ Control de Agentes
                    </h1>
                    <p className="text-blue-100 text-sm mt-1">
                        Seguimiento en tiempo real • OpenStreetMap
                    </p>
                </div>

                {/* Estadísticas */}
                <div className="p-4 border-b bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="text-2xl font-bold text-green-600">{stats.online}</div>
                            <div className="text-xs text-gray-500">En línea</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="text-2xl font-bold text-gray-600">{stats.offline}</div>
                            <div className="text-xs text-gray-500">Desconectados</div>
                        </div>
                    </div>

                    {/* Controles de tracking */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700">Tracking automático</span>
                        <button
                            onClick={() => setTrackingActive(!trackingActive)}
                            className={`w-12 h-6 rounded-full transition-colors ${
                                trackingActive ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                trackingActive ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                        </button>
                    </div>

                    {/* Filtros por rol */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 mb-2">Filtros por rol:</div>
                        {Object.entries(filters).map(([role, active]) => (
                            <label key={role} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={active}
                                    onChange={() => toggleFilter(role)}
                                    className="mr-2"
                                />
                                <span className="text-sm mr-2">{getRoleIcon(role)}</span>
                                <span className="text-sm capitalize">{role}</span>
                                <span className="ml-auto text-xs text-gray-500">
                                    ({stats.byRole[role] || 0})
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Lista de agentes */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                            Agentes activos ({agents.filter(a => filters[a.role]).length})
                        </h3>
                        
                        <div className="space-y-2">
                            {agents
                                .filter(agent => filters[agent.role])
                                .map(agent => (
                                <div
                                    key={agent.id}
                                    onClick={() => centerOnAgent(agent)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                        selectedAgent?.id === agent.id 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="text-lg mr-2">
                                                {getRoleIcon(agent.role, agent.isOnline)}
                                            </span>
                                            <div>
                                                <div className="font-medium text-gray-900 text-sm">
                                                    {agent.name}
                                                </div>
                                                <div className="text-xs text-gray-500 capitalize">
                                                    {agent.role}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${
                                            agent.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                        }`} />
                                    </div>
                                    
                                    <div className="mt-2 text-xs text-gray-600">
                                        <div className="truncate">{agent.currentObra}</div>
                                        <div className={`${
                                            agent.isOnline ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                            {agent.status}
                                        </div>
                                        <div className="text-gray-400">
                                            {Math.floor((new Date() - agent.lastUpdate) / 60000)} min ago
                                        </div>
                                        <div className="text-gray-500 font-mono text-xs">
                                            {agent.location.lat.toFixed(4)}, {agent.location.lng.toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer con acciones */}
                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={() => updateAgentLocations()}
                        disabled={!trackingActive}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                        🔄 Actualizar ubicaciones
                    </button>
                    
                    <div className="mt-2 text-xs text-center text-gray-500">
                        🌍 Powered by OpenStreetMap
                    </div>
                </div>
            </div>

            {/* Mapa principal */}
            <div className="flex-1 relative">
                {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 z-10">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {/* Indicador de tracking activo */}
                {trackingActive && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm z-10 flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                        Tracking activo
                    </div>
                )}

                {/* Contenedor del mapa */}
                <div ref={mapRef} className="w-full h-full" />

                {/* Leyenda */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
                    <div className="text-xs font-medium text-gray-700 mb-2">Leyenda:</div>
                    <div className="space-y-1">
                        <div className="flex items-center text-xs">
                            <span className="mr-2">👑</span>
                            <span>Admin</span>
                        </div>
                        <div className="flex items-center text-xs">
                            <span className="mr-2">🛠️</span>
                            <span>Supervisor</span>
                        </div>
                        <div className="flex items-center text-xs">
                            <span className="mr-2">👷</span>
                            <span>Albañil</span>
                        </div>
                        <div className="flex items-center text-xs">
                            <span className="mr-2">🚚</span>
                            <span>Logística</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-2">⚪</span>
                            <span>Desconectado</span>
                        </div>
                    </div>
                </div>

                {/* Información del agente seleccionado */}
                {selectedAgent && (
                    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-800">
                                {getRoleIcon(selectedAgent.role, selectedAgent.isOnline)} {selectedAgent.name}
                            </h3>
                            <button
                                onClick={() => setSelectedAgent(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Rol:</strong> {selectedAgent.role}</div>
                            <div><strong>Estado:</strong> <span className={selectedAgent.isOnline ? 'text-green-600' : 'text-red-600'}>{selectedAgent.status}</span></div>
                            <div><strong>Obra:</strong> {selectedAgent.currentObra}</div>
                            <div><strong>Ubicación:</strong> {selectedAgent.location.lat.toFixed(5)}, {selectedAgent.location.lng.toFixed(5)}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Hacer disponible globalmente
window.AgentTrackingPanel = AgentTrackingPanel;