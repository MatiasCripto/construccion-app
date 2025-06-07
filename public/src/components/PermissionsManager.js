const { useState, useEffect } = React;

const PermissionsManager = ({ children, requiredPermissions = [] }) => {
    const [permissionsGranted, setPermissionsGranted] = useState(false);
    const [showPermissions, setShowPermissions] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        initializePermissions();
    }, []);

    const initializePermissions = async () => {
        try {
            setIsChecking(true);
            setError(null);
            
            // Detectar si estamos en Capacitor (app nativa)
            if (window.Capacitor?.isNativePlatform()) {
                console.log('📱 App nativa detectada - verificando permisos...');
                await checkNativePermissions();
            } else {
                console.log('🌐 Entorno web - saltando verificación de permisos');
                setPermissionsGranted(true);
                setShowPermissions(false);
            }
        } catch (err) {
            console.error('Error inicializando permisos:', err);
            // En caso de error, permitir continuar
            setPermissionsGranted(true);
            setShowPermissions(false);
        } finally {
            setIsChecking(false);
        }
    };

    const checkNativePermissions = async () => {
        try {
            // Si no hay permisos requeridos, continuar
            if (requiredPermissions.length === 0) {
                setPermissionsGranted(true);
                setShowPermissions(false);
                return;
            }

            // Verificar si ya tenemos permisos básicos (método simple)
            const hasBasicPermissions = await checkBasicWebPermissions();
            
            if (hasBasicPermissions) {
                console.log('✅ Permisos básicos detectados');
                setPermissionsGranted(true);
                setShowPermissions(false);
            } else {
                console.log('⚠️ Solicitando permisos...');
                setShowPermissions(true);
            }
            
        } catch (err) {
            console.error('Error verificando permisos nativos:', err);
            // En caso de error, mostrar opción de continuar sin permisos
            setShowPermissions(true);
        }
    };

    const checkBasicWebPermissions = async () => {
        try {
            // Verificar si navigator.mediaDevices está disponible
            if (!navigator.mediaDevices) return false;

            // Intentar enumerar dispositivos (no requiere permisos explícitos)
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasAudio = devices.some(device => device.kind === 'audioinput');
            const hasVideo = devices.some(device => device.kind === 'videoinput');
            
            console.log(`📱 Dispositivos detectados - Audio: ${hasAudio}, Video: ${hasVideo}`);
            return hasAudio || hasVideo;
            
        } catch (err) {
            console.log('❌ Error verificando dispositivos:', err);
            return false;
        }
    };

    const requestPermissionsDirectly = async () => {
        try {
            setError(null);
            console.log('🔄 Solicitando permisos directamente...');

            let permissionsObtained = 0;
            let totalPermissions = requiredPermissions.length;

            // Solicitar permisos uno por uno
            for (const permission of requiredPermissions) {
                try {
                    const granted = await requestSinglePermission(permission);
                    if (granted) {
                        permissionsObtained++;
                        console.log(`✅ Permiso ${permission} concedido`);
                    } else {
                        console.log(`❌ Permiso ${permission} denegado`);
                    }
                } catch (err) {
                    console.log(`⚠️ Error solicitando ${permission}:`, err);
                }
            }

            // Si obtenemos al menos algunos permisos, continuar
            if (permissionsObtained > 0 || retryCount >= 2) {
                console.log(`✅ Permisos obtenidos: ${permissionsObtained}/${totalPermissions}`);
                setPermissionsGranted(true);
                setShowPermissions(false);
            } else {
                setRetryCount(prev => prev + 1);
                setError(`Solo se obtuvieron ${permissionsObtained} de ${totalPermissions} permisos. ¿Intentar de nuevo?`);
            }

        } catch (err) {
            console.error('❌ Error general solicitando permisos:', err);
            setError('Error al solicitar permisos. Puedes continuar sin ellos.');
        }
    };

    const requestSinglePermission = async (permission) => {
        try {
            switch (permission) {
                case 'microphone':
                    return await requestMicrophonePermission();
                case 'camera':
                    return await requestCameraPermission();
                case 'location':
                    return await requestLocationPermission();
                default:
                    return true;
            }
        } catch (err) {
            console.error(`Error solicitando ${permission}:`, err);
            return false;
        }
    };

    const requestMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            
            // Detener inmediatamente
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            console.log('❌ Permiso de micrófono denegado:', err.name);
            return false;
        }
    };

    const requestCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Detener inmediatamente
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            console.log('❌ Permiso de cámara denegado:', err.name);
            return false;
        }
    };

    const requestLocationPermission = async () => {
        try {
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        console.log('✅ Permiso de ubicación concedido');
                        resolve(true);
                    },
                    (err) => {
                        console.log('❌ Permiso de ubicación denegado:', err.code);
                        resolve(false);
                    },
                    { timeout: 5000 }
                );
            });
        } catch (err) {
            console.log('❌ Error solicitando ubicación:', err);
            return false;
        }
    };

    const skipPermissions = () => {
        console.log('⏭️ Usuario decidió continuar sin permisos');
        setPermissionsGranted(true);
        setShowPermissions(false);
    };

    const openAppSettings = () => {
        alert('Ve a Configuración > Apps > Construcción Pro > Permisos y activa manualmente los permisos de Micrófono y Cámara');
    };

    // Pantalla de carga
    if (isChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    // Si los permisos están concedidos o no son necesarios
    if (permissionsGranted || !showPermissions) {
        return children;
    }

    // Pantalla de solicitud de permisos
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 0118 8zM2 8a6 6 0 0116 0 6 6 0 01-16 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        🏗️ Construcción Pro
                    </h2>
                    <p className="text-gray-600">
                        Para usar todas las funciones necesitamos algunos permisos
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-yellow-800 text-sm">{error}</div>
                    </div>
                )}

                <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">🎙️</div>
                        <div>
                            <div className="font-medium">Micrófono</div>
                            <div className="text-sm text-gray-600">Para grabar audios en el chat</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">📷</div>
                        <div>
                            <div className="font-medium">Cámara</div>
                            <div className="text-sm text-gray-600">Para tomar fotos de la obra</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">📍</div>
                        <div>
                            <div className="font-medium">Ubicación</div>
                            <div className="text-sm text-gray-600">Para geolocalizar las obras</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={requestPermissionsDirectly}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                    >
                        🔓 Permitir Permisos
                    </button>
                    
                    <button
                        onClick={skipPermissions}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                        ⏭️ Continuar sin permisos
                    </button>

                    {retryCount > 0 && (
                        <button
                            onClick={openAppSettings}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
                        >
                            ⚙️ Abrir configuración manual
                        </button>
                    )}
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center">
                    Los permisos se pueden cambiar después en la configuración de Android
                </div>
            </div>
        </div>
    );
};

window.PermissionsManager = PermissionsManager;