// src/components/EmployeeLocationTracker.js - TRACKING DE UBICACIÓN PARA EMPLEADOS
const { useState, useEffect, useRef } = React;

const EmployeeLocationTracker = ({ employeeId, employeeName, employeeRole }) => {
    // Estados principales
    const [isTracking, setIsTracking] = useState(false);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [permissionStatus, setPermissionStatus] = useState('unknown');
    const [trackingStats, setTrackingStats] = useState({
        lastUpdate: null,
        totalUpdates: 0,
        errors: 0
    });
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [batteryOptimization, setBatteryOptimization] = useState(true);

    // Referencias
    const trackingIntervalRef = useRef(null);
    const lastLocationRef = useRef(null);
    const errorCountRef = useRef(0);

    // Configuración
    const TRACKING_INTERVAL = batteryOptimization ? 60000 : 30000; // 1 min / 30 seg
    const HIGH_ACCURACY = !batteryOptimization;
    const MAX_ERRORS = 5;

    // ==================== EFECTOS ====================

    useEffect(() => {
        checkInitialPermissions();
        
        // Listener para estado de conexión
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup al desmontar
        return () => {
            stopTracking();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        // Auto-restart con nueva configuración
        if (isTracking) {
            stopTracking();
            setTimeout(() => startTracking(), 1000);
        }
    }, [batteryOptimization]);

    // ==================== FUNCIONES PRINCIPALES ====================

    const checkInitialPermissions = async () => {
        try {
            if (!navigator.geolocation) {
                setError('Geolocalización no soportada en este dispositivo');
                setPermissionStatus('unsupported');
                return;
            }

            // Verificar permisos
            if (navigator.permissions) {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionStatus(result.state);
                
                result.addEventListener('change', () => {
                    setPermissionStatus(result.state);
                    if (result.state === 'denied' && isTracking) {
                        stopTracking();
                    }
                });
            }

            console.log('✅ Permisos verificados:', permissionStatus);

        } catch (err) {
            console.error('❌ Error verificando permisos:', err);
            setError('Error verificando permisos de ubicación');
        }
    };

    const startTracking = async () => {
        try {
            setError(null);
            console.log('▶️ Iniciando tracking para empleado:', employeeId);

            if (!window.LocationTrackingService) {
                throw new Error('Servicio de tracking no disponible');
            }

            // Verificar conectividad
            if (!isOnline) {
                throw new Error('Sin conexión a internet');
            }

            // Obtener ubicación inicial
            await getCurrentLocation();

            // Iniciar tracking automático
            const result = await window.LocationTrackingService.startEmployeeTracking(
                employeeId, 
                TRACKING_INTERVAL
            );

            if (result.success) {
                setIsTracking(true);
                trackingIntervalRef.current = result.interval;
                
                // Actualizar estadísticas
                setTrackingStats(prev => ({
                    ...prev,
                    lastUpdate: new Date()
                }));

                showNotification('🌍 Tracking activado', 'Tu ubicación se está compartiendo');
                console.log('✅ Tracking iniciado exitosamente');
            }

        } catch (err) {
            console.error('❌ Error iniciando tracking:', err);
            handleTrackingError(err);
        }
    };

    const stopTracking = async () => {
        try {
            console.log('⏹️ Deteniendo tracking para empleado:', employeeId);

            if (window.LocationTrackingService) {
                await window.LocationTrackingService.stopEmployeeTracking(employeeId);
            }

            if (trackingIntervalRef.current) {
                clearInterval(trackingIntervalRef.current);
                trackingIntervalRef.current = null;
            }

            setIsTracking(false);
            showNotification('📍 Tracking desactivado', 'Tu ubicación ya no se comparte');
            console.log('✅ Tracking detenido');

        } catch (err) {
            console.error('❌ Error deteniendo tracking:', err);
            setError('Error deteniendo el tracking');
        }
    };

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no soportada'));
                return;
            }

            const options = {
                enableHighAccuracy: HIGH_ACCURACY,
                timeout: 15000,
                maximumAge: batteryOptimization ? 60000 : 30000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date(position.timestamp)
                    };

                    setLocation(locationData);
                    lastLocationRef.current = locationData;
                    
                    // Incrementar contador de actualizaciones exitosas
                    setTrackingStats(prev => ({
                        ...prev,
                        totalUpdates: prev.totalUpdates + 1,
                        lastUpdate: new Date()
                    }));

                    // Reset contador de errores en caso de éxito
                    errorCountRef.current = 0;

                    console.log('📍 Ubicación obtenida:', {
                        lat: locationData.latitude.toFixed(6),
                        lng: locationData.longitude.toFixed(6),
                        accuracy: Math.round(locationData.accuracy) + 'm'
                    });

                    resolve(locationData);
                },
                (error) => {
                    handleLocationError(error);
                    reject(error);
                },
                options
            );
        });
    };

    const handleLocationError = (error) => {
        errorCountRef.current++;
        
        let errorMessage = 'Error de ubicación desconocido';
        let actionRequired = false;

        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Permiso de ubicación denegado. Ve a Configuración → Apps → Construcción Pro → Permisos';
                actionRequired = true;
                setPermissionStatus('denied');
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Ubicación no disponible. Verifica que el GPS esté activado';
                actionRequired = true;
                break;
            case error.TIMEOUT:
                errorMessage = 'Timeout obteniendo ubicación. Reintentando...';
                break;
        }

        console.error('❌ Error de ubicación:', errorMessage);
        setError(errorMessage);

        // Actualizar estadísticas de errores
        setTrackingStats(prev => ({
            ...prev,
            errors: prev.errors + 1
        }));

        // Si hay demasiados errores consecutivos, detener tracking
        if (errorCountRef.current >= MAX_ERRORS) {
            console.warn('⚠️ Demasiados errores, deteniendo tracking');
            stopTracking();
            setError('Tracking detenido por demasiados errores. Revisa la configuración.');
        }

        // Mostrar notificación en caso de error crítico
        if (actionRequired) {
            showNotification('⚠️ Acción requerida', errorMessage);
        }
    };

    const handleTrackingError = (error) => {
        console.error('❌ Error en tracking:', error);
        setError(error.message);
        setIsTracking(false);
        
        if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
            trackingIntervalRef.current = null;
        }
    };

    const showNotification = (title, message) => {
        // Notificación nativa si está disponible
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                silent: true
            });
        }

        // Toast alternativo
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.innerHTML = `<strong>${title}</strong><br>${message}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('Permiso de notificaciones:', permission);
        }
    };

    const toggleTracking = () => {
        if (isTracking) {
            stopTracking();
        } else {
            startTracking();
        }
    };

    const openLocationSettings = () => {
        // Instrucciones específicas para Android
        if (navigator.userAgent.includes('Android')) {
            alert(`📍 Para habilitar ubicación:

1. Ve a Configuración
2. Apps → Construcción Pro  
3. Permisos → Ubicación
4. Permitir solo mientras usas la app

También verifica que el GPS esté activado.`);
        } else {
            alert('Ve a la configuración de tu dispositivo para habilitar los permisos de ubicación.');
        }
    };

    const formatTime = (date) => {
        if (!date) return 'Nunca';
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getStatusColor = () => {
        if (!isOnline) return 'bg-gray-500';
        if (error) return 'bg-red-500';
        if (isTracking) return 'bg-green-500';
        return 'bg-yellow-500';
    };

    const getStatusText = () => {
        if (!isOnline) return 'Sin conexión';
        if (error) return 'Error';
        if (isTracking) return 'Activo';
        return 'Inactivo';
    };

    // ==================== RENDER ====================

    return (
        <div className="employee-location-tracker bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                    <div className={`w-4 h-4 rounded-full mr-2 ${getStatusColor()}`}></div>
                    <h2 className="text-xl font-bold text-gray-800">
                        📍 Tracking de Ubicación
                    </h2>
                </div>
                <p className="text-sm text-gray-600">
                    {employeeName} • {employeeRole}
                </p>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {getStatusText()}
                </div>
            </div>

            {/* Estado actual */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-700 mb-3">Estado Actual:</h3>
                
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Tracking:</span>
                        <span className={`font-medium ${isTracking ? 'text-green-600' : 'text-gray-600'}`}>
                            {isTracking ? '🟢 Activo' : '🔴 Inactivo'}
                        </span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="text-gray-600">Conexión:</span>
                        <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                            {isOnline ? '🌐 Conectado' : '❌ Sin conexión'}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-600">Permisos:</span>
                        <span className={`font-medium ${
                            permissionStatus === 'granted' ? 'text-green-600' : 
                            permissionStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                            {permissionStatus === 'granted' ? '✅ Concedidos' :
                             permissionStatus === 'denied' ? '❌ Denegados' : '⏳ Pendiente'}
                        </span>
                    </div>

                    {location && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Precisión:</span>
                            <span className="font-medium text-blue-600">
                                ~{Math.round(location.accuracy)}m
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-800 mb-3">📊 Estadísticas:</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {trackingStats.totalUpdates}
                        </div>
                        <div className="text-xs text-blue-700">Actualizaciones</div>
                    </div>
                    
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {trackingStats.errors}
                        </div>
                        <div className="text-xs text-blue-700">Errores</div>
                    </div>
                </div>

                <div className="mt-3 text-xs text-blue-700 text-center">
                    Última actualización: {formatTime(trackingStats.lastUpdate)}
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <div className="text-red-700 text-sm font-medium">Error de ubicación</div>
                            <div className="text-red-600 text-xs mt-1">{error}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Configuración */}
            <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">⚙️ Configuración:</h3>
                
                <div className="space-y-3">
                    <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Optimización de batería</span>
                        <button
                            onClick={() => setBatteryOptimization(!batteryOptimization)}
                            className={`w-12 h-6 rounded-full transition-colors ${
                                batteryOptimization ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                batteryOptimization ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                        </button>
                    </label>

                    <div className="text-xs text-gray-500">
                        {batteryOptimization 
                            ? '🔋 Actualiza cada 1 minuto (ahorra batería)'
                            : '⚡ Actualiza cada 30 segundos (más preciso)'
                        }
                    </div>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
                {/* Botón principal */}
                <button
                    onClick={toggleTracking}
                    disabled={!isOnline || permissionStatus === 'denied'}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        isTracking
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300'
                    }`}
                >
                    {isTracking ? '⏹️ Detener Tracking' : '▶️ Iniciar Tracking'}
                </button>

                {/* Botones secundarios */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={getCurrentLocation}
                        disabled={!isOnline || permissionStatus === 'denied'}
                        className="py-2 px-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm transition-colors"
                    >
                        📍 Ubicación Actual
                    </button>

                    {permissionStatus === 'denied' && (
                        <button
                            onClick={openLocationSettings}
                            className="py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors"
                        >
                            ⚙️ Configuración
                        </button>
                    )}

                    {permissionStatus !== 'denied' && (
                        <button
                            onClick={requestNotificationPermission}
                            className="py-2 px-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
                        >
                            🔔 Notificaciones
                        </button>
                    )}
                </div>
            </div>

            {/* Información adicional */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 text-center">
                    <div className="font-medium mb-1">💡 Información importante:</div>
                    <div>• Tu ubicación se comparte solo con administradores</div>
                    <div>• Los datos se almacenan de forma segura</div>
                    <div>• Puedes activar/desactivar cuando quieras</div>
                </div>
            </div>
        </div>
    );
};

// Hacer disponible globalmente
window.EmployeeLocationTracker = EmployeeLocationTracker;