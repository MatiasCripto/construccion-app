const { useState, useEffect, useRef } = React;

const GeolocationComponent = ({ onLocationUpdate, autoTrack = false, highAccuracy = true }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (autoTrack) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [autoTrack]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      return;
    }

    const options = {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 30000 // Cache por 30 segundos
    };

    setTracking(true);
    setError(null);

    // Obtener ubicación inmediata
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );

    // Iniciar seguimiento continuo
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  };

  const handleLocationSuccess = async (position) => {
    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: new Date(position.timestamp)
    };

    setCurrentLocation(location);
    setAccuracy(position.coords.accuracy);
    setError(null);

    // Actualizar historial (mantener solo las últimas 50 ubicaciones)
    setLocationHistory(prev => {
      const updated = [...prev, location];
      return updated.slice(-50);
    });

    // Callback para el componente padre
    onLocationUpdate && onLocationUpdate(location);

    // Guardar en almacenamiento local para uso offline
    localStorage.setItem('lastKnownLocation', JSON.stringify(location));

    // *** NUEVO: Guardar también en Firebase para el admin ***
    if (window.LocationTrackingService && window.user?.id) {
      try {
        await window.LocationTrackingService.saveEmployeeLocation(window.user.id, location);
        console.log('📍 Ubicación guardada para admin');
      } catch (error) {
        console.error('Error guardando en Firebase:', error);
      }
    }
  };

  const handleLocationError = (error) => {
    let errorMessage = 'Error desconocido';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permisos de ubicación denegados';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Ubicación no disponible';
        break;
      case error.TIMEOUT:
        errorMessage = 'Tiempo de espera agotado';
        break;
    }

    setError(errorMessage);
    setTracking(false);

    // Intentar usar última ubicación conocida
    const lastLocation = localStorage.getItem('lastKnownLocation');
    if (lastLocation) {
      const location = JSON.parse(lastLocation);
      setCurrentLocation(location);
    }
  };

  const getAccuracyLevel = () => {
    if (!accuracy) return 'Desconocida';
    if (accuracy <= 5) return 'Excelente';
    if (accuracy <= 10) return 'Buena';
    if (accuracy <= 20) return 'Regular';
    return 'Baja';
  };

  const getAccuracyColor = () => {
    if (!accuracy) return 'gray';
    if (accuracy <= 5) return 'green';
    if (accuracy <= 10) return 'blue';
    if (accuracy <= 20) return 'yellow';
    return 'red';
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  };

  const getTotalDistance = () => {
    if (locationHistory.length < 2) return 0;

    let total = 0;
    for (let i = 1; i < locationHistory.length; i++) {
      const prev = locationHistory[i - 1];
      const curr = locationHistory[i];
      total += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }

    return total;
  };

  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters.toFixed(1)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const shareLocation = async () => {
    if (!currentLocation) return;

    const locationText = `📍 Mi ubicación: ${formatCoordinates(currentLocation.lat, currentLocation.lng)}\n🗺️ Ver en Maps: https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi ubicación actual',
          text: locationText
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(locationText);
      alert('Ubicación copiada al portapapeles');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📍 Mi Ubicación</h3>
        <button
          onClick={tracking ? stopTracking : startTracking}
          className={`px-3 py-1 rounded-lg text-sm font-medium ${tracking
              ? 'bg-red-500 text-white'
              : 'bg-green-500 text-white'
            }`}
        >
          {tracking ? '⏹️ Parar' : '▶️ Iniciar'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">
          <p className="text-sm">❌ {error}</p>
        </div>
      )}

      {currentLocation && (
        <div className="space-y-3">
          {/* Coordenadas actuales */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Coordenadas</p>
                <p className="text-xs text-gray-600 font-mono">
                  {formatCoordinates(currentLocation.lat, currentLocation.lng)}
                </p>
              </div>
              <button
                onClick={shareLocation}
                className="bg-blue-500 text-white p-2 rounded-lg touch-target"
              >
                📤
              </button>
            </div>
          </div>

          {/* Precisión */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Precisión:</span>
            <span className={`text-sm font-medium text-${getAccuracyColor()}-600`}>
              {getAccuracyLevel()} ({accuracy?.toFixed(0)}m)
            </span>
          </div>

          {/* Información adicional */}
          {currentLocation.speed !== null && currentLocation.speed > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Velocidad:</span>
              <span className="text-sm font-medium">
                {(currentLocation.speed * 3.6).toFixed(1)} km/h
              </span>
            </div>
          )}

          {locationHistory.length > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Distancia recorrida:</span>
              <span className="text-sm font-medium">
                {formatDistance(getTotalDistance())}
              </span>
            </div>
          )}

          {/* Última actualización */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Última actualización:</span>
            <span className="text-sm font-medium">
              {currentLocation.timestamp.toLocaleTimeString('es-ES')}
            </span>
          </div>

          {/* Mini mapa */}
          <div className="mt-4">
            <MiniMap
              location={currentLocation}
              height="150px"
              showUserLocation={true}
              locationHistory={locationHistory}
            />
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => window.open(`https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`, '_blank')}
              className="bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium"
            >
              🗺️ Ver en Maps
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${currentLocation.lat},${currentLocation.lng}`);
                alert('Coordenadas copiadas');
              }}
              className="bg-gray-500 text-white py-2 px-3 rounded-lg text-sm font-medium"
            >
              📋 Copiar
            </button>
          </div>
        </div>
      )}

      {tracking && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Rastreando ubicación...</span>
        </div>
      )}
    </div>
  );
};

// Hook personalizado para geolocalización
const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      return;
    }

    setLoading(true);
    setError(null);

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        });
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      },
      defaultOptions
    );
  };

  return {
    location,
    error,
    loading,
    getCurrentLocation
  };
};

// Componente para botón de ubicación rápida
const QuickLocationButton = ({ onLocationGet, className = "" }) => {
  const { location, error, loading, getCurrentLocation } = useGeolocation();

  useEffect(() => {
    if (location) {
      onLocationGet(location);
    }
  }, [location, onLocationGet]);

  return (
    <button
      onClick={getCurrentLocation}
      disabled={loading}
      className={`flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Obteniendo...</span>
        </>
      ) : (
        <>
          <span>📍</span>
          <span>Mi Ubicación</span>
        </>
      )}
    </button>
  );
};

// Utilidad para verificar si una ubicación está dentro de un radio
const isLocationWithinRadius = (userLat, userLng, targetLat, targetLng, radiusInMeters) => {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
  return distance <= radiusInMeters;
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

window.GeolocationComponent = GeolocationComponent;
window.useGeolocation = useGeolocation;
window.QuickLocationButton = QuickLocationButton;
window.isLocationWithinRadius = isLocationWithinRadius;