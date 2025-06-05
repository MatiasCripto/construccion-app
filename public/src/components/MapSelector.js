const { useState, useEffect, useRef } = React;

const MapSelector = ({ onLocationSelect, initialLocation = null }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [address, setAddress] = useState('');
  const [manualCoords, setManualCoords] = useState({
    lat: initialLocation?.lat || '',
    lng: initialLocation?.lng || ''
  });

  useEffect(() => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect(selectedLocation);
    }
  }, [selectedLocation]);

  const handleManualInput = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Por favor ingresa coordenadas válidas');
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Coordenadas fuera de rango válido');
      return;
    }
    
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    setAddress(`${lat}, ${lng}`);
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newLocation = { lat, lng };
          
          setSelectedLocation(newLocation);
          setManualCoords({ lat: lat.toString(), lng: lng.toString() });
          setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        },
        (error) => {
          console.error('Error al obtener ubicación:', error);
          alert('No se pudo obtener la ubicación actual');
        }
      );
    } else {
      alert('Geolocalización no es soportada por este navegador');
    }
  };

  // Ubicaciones predefinidas para Buenos Aires
  const ubicacionesComunes = [
    { nombre: 'Centro de Buenos Aires', lat: -34.6118, lng: -58.3960 },
    { nombre: 'Palermo', lat: -34.5731, lng: -58.4276 },
    { nombre: 'San Telmo', lat: -34.6211, lng: -58.3731 },
    { nombre: 'Recoleta', lat: -34.5877, lng: -58.3974 },
    { nombre: 'La Boca', lat: -34.6378, lng: -58.3668 }
  ];

  const seleccionarUbicacionComun = (ubicacion) => {
    setSelectedLocation(ubicacion);
    setManualCoords({ lat: ubicacion.lat.toString(), lng: ubicacion.lng.toString() });
    setAddress(ubicacion.nombre);
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-yellow-600 text-lg mr-2">🗺️</span>
          <div>
            <h3 className="text-yellow-800 font-medium">Selector de Ubicación</h3>
            <p className="text-yellow-700 text-sm mt-1">
              Google Maps no está disponible. Usa las opciones alternativas.
            </p>
          </div>
        </div>
      </div>

      {/* Ubicaciones comunes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Ubicaciones Comunes (Buenos Aires)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ubicacionesComunes.map((ubicacion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => seleccionarUbicacionComun(ubicacion)}
              className="text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-800 text-sm"
            >
              {ubicacion.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Coordenadas manuales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🎯 Ingresar Coordenadas Manualmente
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="number"
              step="any"
              value={manualCoords.lat}
              onChange={(e) => setManualCoords({ ...manualCoords, lat: e.target.value })}
              placeholder="Latitud (ej: -34.6118)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="number"
              step="any"
              value={manualCoords.lng}
              onChange={(e) => setManualCoords({ ...manualCoords, lng: e.target.value })}
              placeholder="Longitud (ej: -58.3960)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex space-x-2 mt-2">
          <button
            type="button"
            onClick={handleManualInput}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📍 Usar Coordenadas
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📱 Mi Ubicación
          </button>
        </div>
      </div>

      {/* Información de la ubicación seleccionada */}
      {selectedLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">✅ Ubicación Seleccionada:</h4>
          <div className="space-y-1 text-sm text-green-700">
            <p><strong>Descripción:</strong> {address || 'Ubicación personalizada'}</p>
            <p><strong>Coordenadas:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
          </div>
        </div>
      )}

      {/* Ayuda */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">💡 Cómo obtener coordenadas:</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Ve a <a href="https://maps.google.com" target="_blank" className="text-blue-600 underline">Google Maps</a></li>
          <li>Busca la dirección o haz clic derecho en el mapa</li>
          <li>Selecciona "¿Qué hay aquí?" para ver las coordenadas</li>
          <li>Copia los números y pégalos arriba</li>
        </ol>
      </div>
    </div>
  );
};

window.MapSelector = MapSelector;