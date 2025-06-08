// src/components/AgentTrackingPanel.js - VERSIÓN ESTABLE SIN MAPA
const { useState, useEffect, useRef } = React;

const AgentTrackingPanel = ({ adminId }) => {
    // Estados principales
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trackingActive, setTrackingActive] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [filters, setFilters] = useState({
        albañil: true,
        supervisor: true,
        logistica: true,
        admin: true
    });

    // Referencias
    const trackingIntervalRef = useRef(null);

    // Configuración
    const TRACKING_INTERVAL = 30000; // 30 segundos

    // Iconos y colores por rol
    const getRoleIcon = (role, isOnline = true) => {
        const baseIcons = {
            admin: '👑',
            supervisor: '🛠️', 
            albañil: '👷',
            logistica: '🚚',
            default: '👤'
        };
        
        const icon = baseIcons[role] || baseIcons.default;
        return isOnline ? icon : '⚪';
    };

    const getRoleColor = (role, isOnline = true) => {
        if (!isOnline) return '#9CA3AF';
        
        const colors = {
            admin: '#3B82F6',
            supervisor: '#10B981',
            albañil: '#F59E0B',
            logistica: '#8B5CF6',
            default: '#6B7280'
        };
        
        return colors[role] || colors.default;
    };

    const getRoleName = (role) => {
        const names = {
            admin: 'Administrador',
            supervisor: 'Supervisor',
            albañil: 'Albañil',
            logistica: 'Logística'
        };
        return names[role] || role;
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

    // ==================== INICIALIZACIÓN ====================

    const initializeTracking = async () => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('🗺️ Inicializando panel de control de agentes...');
            
            // Cargar agentes de ejemplo
            await loadAgents();
            
            console.log('✅ Panel de control inicializado');

        } catch (err) {
            console.error('❌ Error inicializando tracking:', err);
            setError('Error inicializando panel de control: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAgents = async () => {
        try {
            console.log('👥 Cargando agentes...');

            // Simular delay de carga
            await new Promise(resolve => setTimeout(resolve, 500));

            // Datos de ejemplo con ubicaciones en Buenos Aires
            const mockAgents = [
                {
                    id: 'agent_001',
                    name: 'Carlos Rodríguez',
                    role: 'supervisor',
                    location: { lat: -34.6118, lng: -58.3960 },
                    address: 'Puerto Madero, CABA',
                    lastUpdate: new Date(),
                    isOnline: true,
                    currentObra: 'Edificio Central',
                    status: 'En obra',
                    battery: 85,
                    speed: 0
                },
                {
                    id: 'agent_002', 
                    name: 'Miguel Torres',
                    role: 'albañil',
                    location: { lat: -34.5998, lng: -58.3731 },
                    address: 'Recoleta, CABA',
                    lastUpdate: new Date(Date.now() - 120000), // 2 min ago
                    isOnline: true,
                    currentObra: 'Casa Familiar',
                    status: 'Trabajando',
                    battery: 92,
                    speed: 0
                },
                {
                    id: 'agent_003',
                    name: 'Ana Martínez',
                    role: 'logistica',
                    location: { lat: -34.6092, lng: -58.3842 },
                    address: 'San Telmo, CABA',
                    lastUpdate: new Date(Date.now() - 300000), // 5 min ago
                    isOnline: true,
                    currentObra: 'En tránsito',
                    status: 'Entregando materiales',
                    battery: 67,
                    speed: 25
                },
                {
                    id: 'agent_004',
                    name: 'Roberto Silva',
                    role: 'albañil',
                    location: { lat: -34.6037, lng: -58.3816 },
                    address: 'Microcentro, CABA',
                    lastUpdate: new Date(Date.now() - 1800000), // 30 min ago
                    isOnline: false,
                    currentObra: 'Oficinas Norte',
                    status: 'Desconectado',
                    battery: 0,
                    speed: 0
                },
                {
                    id: 'agent_005',
                    name: 'Laura González',
                    role: 'supervisor',
                    location: { lat: -34.6150, lng: -58.3700 },
                    address: 'Barrio Norte, CABA',
                    lastUpdate: new Date(Date.now() - 600000), // 10 min ago
                    isOnline: true,
                    currentObra: 'Plaza San Martín',
                    status: 'Supervisando',
                    battery: 78,
                    speed: 0
                },
                {
                    id: 'agent_006',
                    name: 'Diego Fernández',
                    role: 'logistica',
                    location: { lat: -34.6200, lng: -58.3950 },
                    address: 'Palermo, CABA',
                    lastUpdate: new Date(Date.now() - 900000), // 15 min ago
                    isOnline: true,
                    currentObra: 'Almacén Central',
                    status: 'Cargando materiales',
                    battery: 54,
                    speed: 15
                }
            ];

            setAgents(mockAgents);
            setLastUpdate(new Date());
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
        
        setAgents(prevAgents => 
            prevAgents.map(agent => {
                if (!agent.isOnline) return agent;

                // Simular movimiento aleatorio pequeño (~100m)
                const deltaLat = (Math.random() - 0.5) * 0.001;
                const deltaLng = (Math.random() - 0.5) * 0.001;

                return {
                    ...agent,
                    location: {
                        lat: agent.location.lat + deltaLat,
                        lng: agent.location.lng + deltaLng
                    },
                    lastUpdate: new Date(),
                    battery: Math.max(0, agent.battery - Math.random() * 2), // Simular descarga
                    speed: agent.role === 'logistica' ? Math.random() * 40 : 0 // Solo logística se mueve
                };
            })
        );
        
        setLastUpdate(new Date());
    };

    const cleanup = () => {
        console.log('🧹 Limpiando recursos del tracking...');
        
        if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
        }
    };

    const toggleFilter = (role) => {
        setFilters(prev => ({
            ...prev,
            [role]: !prev[role]
        }));
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

    const formatTime = (date) => {
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatTimeSince = (date) => {
        const diffInMinutes = Math.floor((new Date() - date) / 60000);
        if (diffInMinutes < 1) return 'Ahora';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}h ${diffInMinutes % 60}m`;
    };

    const openGoogleMaps = (lat, lng, name) => {
        const url = `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=16`;
        window.open(url, '_blank');
    };

    // ==================== RENDER ====================

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">🗺️ Inicializando Control de Agentes</h2>
                    <p className="text-gray-500">Cargando datos de ubicación...</p>
                </div>
            </div>
        );
    }

    const stats = getAgentStats();
    const filteredAgents = agents.filter(agent => filters[agent.role]);

    return (
        <div className="agent-tracking-panel h-full bg-gray-50 p-6">
            {/* Header con estadísticas */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg text-white p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center">
                            🗺️ Control de Agentes
                            {trackingActive && (
                                <span className="ml-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                    EN VIVO
                                </span>
                            )}
                        </h1>
                        <p className="text-blue-100 text-sm mt-1">
                            Monitoreo en tiempo real de ubicaciones de empleados
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-blue-100">Última actualización</div>
                        <div className="text-lg font-medium">{formatTime(lastUpdate)}</div>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-300">{stats.online}</div>
                        <div className="text-sm text-blue-100">En línea</div>
                        <div className="text-xs text-blue-200">de {stats.total} total</div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                        <div className="text-2xl font-bold text-red-300">{stats.offline}</div>
                        <div className="text-sm text-blue-100">Desconectados</div>
                        <div className="text-xs text-blue-200">sin ubicación</div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                        <div className="text-2xl font-bold text-yellow-300">{stats.byRole.logistica || 0}</div>
                        <div className="text-sm text-blue-100">En movimiento</div>
                        <div className="text-xs text-blue-200">logística activa</div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-300">{filteredAgents.length}</div>
                        <div className="text-sm text-blue-100">Mostrados</div>
                        <div className="text-xs text-blue-200">filtro aplicado</div>
                    </div>
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-700 text-sm">{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-500 hover:text-red-700"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel de control */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            ⚙️ Controles del Sistema
                        </h3>

                        {/* Control de tracking */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
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
                            <p className="text-xs text-gray-500">
                                {trackingActive ? 'Actualizando cada 30 segundos' : 'Pausado'}
                            </p>
                        </div>

                        {/* Filtros */}
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Filtros por rol:</h4>
                            <div className="space-y-2">
                                {Object.entries(filters).map(([role, active]) => (
                                    <label key={role} className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={active}
                                            onChange={() => toggleFilter(role)}
                                            className="mr-3 w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-lg mr-2">{getRoleIcon(role)}</span>
                                        <span className="text-sm capitalize flex-1">{getRoleName(role)}</span>
                                        <span className="text-xs text-gray-500">
                                            ({stats.byRole[role] || 0})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="space-y-3">
                            <button
                                onClick={() => updateAgentLocations()}
                                disabled={!trackingActive}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                            >
                                🔄 Actualizar ahora
                            </button>
                            
                            <button
                                onClick={() => window.open('https://www.google.com/maps/@-34.6037,-58.3816,12z', '_blank')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                            >
                                🗺️ Ver en Google Maps
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lista de agentes */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-lg">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">
                                👥 Agentes Activos ({filteredAgents.length})
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Click en las coordenadas para abrir en Google Maps
                            </p>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {filteredAgents.map(agent => (
                                <div
                                    key={agent.id}
                                    onClick={() => setSelectedAgent(agent)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
                                        selectedAgent?.id === agent.id ? 'bg-blue-50 border-blue-200' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-3" style={{ color: getRoleColor(agent.role, agent.isOnline) }}>
                                                {getRoleIcon(agent.role, agent.isOnline)}
                                            </span>
                                            <div>
                                                <div className="font-medium text-gray-900">{agent.name}</div>
                                                <div className="text-sm text-gray-500 capitalize">{getRoleName(agent.role)}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-medium ${
                                                agent.isOnline ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {agent.isOnline ? '🟢 En línea' : '🔴 Desconectado'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatTimeSince(agent.lastUpdate)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-gray-600 mb-1">
                                                <strong>📍 Ubicación:</strong> {agent.address}
                                            </div>
                                            <div className="text-gray-600 mb-1">
                                                <strong>🏗️ Obra:</strong> {agent.currentObra}
                                            </div>
                                            <div className="text-gray-600">
                                                <strong>📊 Estado:</strong> 
                                                <span className={`ml-1 ${agent.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                                                    {agent.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-gray-600 mb-1">
                                                <strong>🌍 Coordenadas:</strong> 
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openGoogleMaps(agent.location.lat, agent.location.lng, agent.name);
                                                    }}
                                                    className="ml-1 text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    {agent.location.lat.toFixed(4)}, {agent.location.lng.toFixed(4)}
                                                </button>
                                            </div>
                                            {agent.isOnline && (
                                                <>
                                                    <div className="text-gray-600 mb-1">
                                                        <strong>🔋 Batería:</strong> 
                                                        <span className={`ml-1 ${
                                                            agent.battery > 50 ? 'text-green-600' : 
                                                            agent.battery > 20 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                            {Math.round(agent.battery)}%
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-600">
                                                        <strong>🚗 Velocidad:</strong> 
                                                        <span className="ml-1">
                                                            {Math.round(agent.speed)} km/h
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Acciones rápidas */}
                                    <div className="mt-3 flex space-x-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openGoogleMaps(agent.location.lat, agent.location.lng, agent.name);
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                        >
                                            🗺️ Ver en mapa
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                alert(`📞 Contactando a ${agent.name}...\n\n(Aquí se abriría WhatsApp o sistema de llamadas)`);
                                            }}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                        >
                                            📞 Contactar
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                alert(`📍 Historial de ${agent.name}\n\n(Aquí se mostraría el recorrido del día)`);
                                            }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                        >
                                            📊 Historial
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {filteredAgents.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay agentes para mostrar</h3>
                                    <p className="text-gray-500">Ajusta los filtros para ver más empleados</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Información del agente seleccionado */}
            {selectedAgent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                <span className="text-2xl mr-2" style={{ color: getRoleColor(selectedAgent.role, selectedAgent.isOnline) }}>
                                    {getRoleIcon(selectedAgent.role, selectedAgent.isOnline)}
                                </span>
                                {selectedAgent.name}
                            </h3>
                            <button
                                onClick={() => setSelectedAgent(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div><strong>Rol:</strong> {getRoleName(selectedAgent.role)}</div>
                            <div><strong>Estado:</strong> <span className={selectedAgent.isOnline ? 'text-green-600' : 'text-red-600'}>{selectedAgent.status}</span></div>
                            <div><strong>Obra actual:</strong> {selectedAgent.currentObra}</div>
                            <div><strong>Ubicación:</strong> {selectedAgent.address}</div>
                            <div>
                                <strong>Coordenadas:</strong> 
                                <button
                                    onClick={() => openGoogleMaps(selectedAgent.location.lat, selectedAgent.location.lng, selectedAgent.name)}
                                    className="ml-1 text-blue-600 hover:text-blue-800 underline"
                                >
                                    {selectedAgent.location.lat.toFixed(6)}, {selectedAgent.location.lng.toFixed(6)}
                                </button>
                            </div>
                            <div><strong>Última actualización:</strong> {formatTime(selectedAgent.lastUpdate)}</div>
                            {selectedAgent.isOnline && (
                                <>
                                    <div><strong>Batería:</strong> <span className={selectedAgent.battery > 50 ? 'text-green-600' : selectedAgent.battery > 20 ? 'text-yellow-600' : 'text-red-600'}>{Math.round(selectedAgent.battery)}%</span></div>
                                    <div><strong>Velocidad:</strong> {Math.round(selectedAgent.speed)} km/h</div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => openGoogleMaps(selectedAgent.location.lat, selectedAgent.location.lng, selectedAgent.name)}
                                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                            >
                                🗺️ Ver en mapa
                            </button>
                            <button
                                onClick={() => alert(`📞 Contactando a ${selectedAgent.name}...`)}
                                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                            >
                                📞 Contactar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Hacer disponible globalmente
window.AgentTrackingPanel = AgentTrackingPanel;