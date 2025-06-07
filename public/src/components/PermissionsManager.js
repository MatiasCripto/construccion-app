const { useState, useEffect } = React;

const PermissionsManager = ({ children, requiredPermissions = [] }) => {
    const [permissions, setPermissions] = useState({});
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        setIsChecking(true);
        setError(null);

        try {
            const permissionStatus = {};
            
            // Si estamos en Capacitor (app nativa)
            if (window.Capacitor?.isNativePlatform()) {
                
                // Verificar cada permiso requerido
                for (const permission of requiredPermissions) {
                    switch (permission) {
                        case 'camera':
                            permissionStatus.camera = await checkCameraPermission();
                            break;
                        case 'microphone':
                            permissionStatus.microphone = await checkMicrophonePermission();
                            break;
                        case 'location':
                            permissionStatus.location = await checkLocationPermission();
                            break;
                        default:
                            permissionStatus[permission] = 'granted'; // Fallback
                    }
                }
            } else {
                // En navegador web, usar APIs estándar
                for (const permission of requiredPermissions) {
                    permissionStatus[permission] = await checkWebPermission(permission);
                }
            }

            setPermissions(permissionStatus);
        } catch (err) {
            console.error('Error verificando permisos:', err);
            setError('Error al verificar permisos: ' + err.message);
        } finally {
            setIsChecking(false);
        }
    };

    const checkCameraPermission = async () => {
        try {
            if (window.Capacitor?.Plugins?.Camera) {
                const { Camera } = window.Capacitor.Plugins;
                const status = await Camera.checkPermissions();
                return status.camera;
            } else {
                // Fallback para web
                return await checkWebPermission('camera');
            }
        } catch (err) {
            console.error('Error verificando permiso de cámara:', err);
            return 'denied';
        }
    };

    const checkMicrophonePermission = async () => {
        try {
            // Capacitor no tiene plugin nativo para micrófono, usar API web
            if (navigator.permissions) {
                const result = await navigator.permissions.query({ name: 'microphone' });
                return result.state;
            } else {
                // Intentar acceder directamente
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop());
                    return 'granted';
                } catch (err) {
                    return 'denied';
                }
            }
        } catch (err) {
            console.error('Error verificando permiso de micrófono:', err);
            return 'denied';
        }
    };

    const checkLocationPermission = async () => {
        try {
            if (window.Capacitor?.Plugins?.Geolocation) {
                const { Geolocation } = window.Capacitor.Plugins;
                const status = await Geolocation.checkPermissions();
                return status.location;
            } else {
                return await checkWebPermission('geolocation');
            }
        } catch (err) {
            console.error('Error verificando permiso de ubicación:', err);
            return 'denied';
        }
    };

    const checkWebPermission = async (permission) => {
        try {
            if (!navigator.permissions) {
                return 'granted'; // Asumir concedido si no hay API
            }

            let permissionName = permission;
            if (permission === 'location') permissionName = 'geolocation';

            const result = await navigator.permissions.query({ name: permissionName });
            return result.state;
        } catch (err) {
            console.error(`Error verificando permiso web ${permission}:`, err);
            return 'prompt'; // Requerir solicitud
        }
    };

    const requestPermission = async (permission) => {
        try {
            setError(null);

            if (window.Capacitor?.isNativePlatform()) {
                switch (permission) {
                    case 'camera':
                        return await requestCameraPermission();
                    case 'microphone':
                        return await requestMicrophonePermission();
                    case 'location':
                        return await requestLocationPermission();
                    default:
                        return 'denied';
                }
            } else {
                return await requestWebPermission(permission);
            }
        } catch (err) {
            console.error(`Error solicitando permiso ${permission}:`, err);
            setError(`Error al solicitar permiso de ${permission}`);
            return 'denied';
        }
    };

    const requestCameraPermission = async () => {
        try {
            if (window.Capacitor?.Plugins?.Camera) {
                const { Camera } = window.Capacitor.Plugins;
                const status = await Camera.requestPermissions();
                return status.camera;
            } else {
                return await requestWebPermission('camera');
            }
        } catch (err) {
            console.error('Error solicitando permiso de cámara:', err);
            return 'denied';
        }
    };

    const requestMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return 'granted';
        } catch (err) {
            console.error('Error solicitando permiso de micrófono:', err);
            return 'denied';
        }
    };

    const requestLocationPermission = async () => {
        try {
            if (window.Capacitor?.Plugins?.Geolocation) {
                const { Geolocation } = window.Capacitor.Plugins;
                const status = await Geolocation.requestPermissions();
                return status.location;
            } else {
                return await requestWebPermission('geolocation');
            }
        } catch (err) {
            console.error('Error solicitando permiso de ubicación:', err);
            return 'denied';
        }
    };

    const requestWebPermission = async (permission) => {
        try {
            switch (permission) {
                case 'camera':
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    stream.getTracks().forEach(track => track.stop());
                    return 'granted';
                case 'microphone':
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    audioStream.getTracks().forEach(track => track.stop());
                    return 'granted';
                case 'geolocation':
                    return new Promise((resolve) => {
                        navigator.geolocation.getCurrentPosition(
                            () => resolve('granted'),
                            () => resolve('denied')
                        );
                    });
                default:
                    return 'granted';
            }
        } catch (err) {
            console.error(`Error en permiso web ${permission}:`, err);
            return 'denied';
        }
    };

    const requestAllPermissions = async () => {
        const updatedPermissions = { ...permissions };
        
        for (const permission of requiredPermissions) {
            if (permissions[permission] !== 'granted') {
                const result = await requestPermission(permission);
                updatedPermissions[permission] = result;
            }
        }
        
        setPermissions(updatedPermissions);
        return updatedPermissions;
    };

    const areAllPermissionsGranted = () => {
        return requiredPermissions.every(permission => permissions[permission] === 'granted');
    };

    const getPermissionIcon = (permission, status) => {
        const baseClasses = "w-8 h-8 mx-auto mb-2";
        
        if (status === 'granted') {
            return <div className={`${baseClasses} text-green-500`}>✅</div>;
        } else if (status === 'denied') {
            return <div className={`${baseClasses} text-red-500`}>❌</div>;
        } else {
            return <div className={`${baseClasses} text-yellow-500`}>⚠️</div>;
        }
    };

    const getPermissionName = (permission) => {
        switch (permission) {
            case 'camera': return 'Cámara';
            case 'microphone': return 'Micrófono';
            case 'location': return 'Ubicación';
            default: return permission;
        }
    };

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    if (requiredPermissions.length === 0 || areAllPermissionsGranted()) {
        return children;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 0118 8zM2 8a6 6 0 0116 0 6 6 0 01-16 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        Permisos Requeridos
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Para usar todas las funciones de la app, necesitamos estos permisos:
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4 mb-6">
                    {requiredPermissions.map(permission => (
                        <div key={permission} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                {getPermissionIcon(permission, permissions[permission])}
                                <div>
                                    <div className="font-medium text-gray-800">
                                        {getPermissionName(permission)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {permissions[permission] === 'granted' ? 'Concedido' :
                                         permissions[permission] === 'denied' ? 'Denegado' : 'Pendiente'}
                                    </div>
                                </div>
                            </div>
                            
                            {permissions[permission] !== 'granted' && (
                                <button
                                    onClick={() => requestPermission(permission)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                >
                                    Permitir
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={requestAllPermissions}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                    >
                        Permitir Todos
                    </button>
                    
                    <button
                        onClick={checkPermissions}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors"
                    >
                        Verificar
                    </button>
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center">
                    Puedes cambiar estos permisos más tarde en la configuración de la app
                </div>
            </div>
        </div>
    );
};

window.PermissionsManager = PermissionsManager;