const { useState, useEffect } = React;

const MapViewer = ({ location, title = 'Ubicación de la obra', height = '300px' }) => {
  if (!location || !location.lat || !location.lng) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">📍 No hay ubicación disponible para esta obra</p>
      </div>
    );
  }

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  const openInWaze = () => {
    const url = `https://waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">🗺️ Ubicación</h3>
        <div className="flex space-x-2">
          <button
            onClick={openInGoogleMaps}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            🗺️ Google Maps
          </button>
          <button
            onClick={openInWaze}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            🚗 Waze
          </button>
        </div>
      </div>

      {/* Mapa estático */}
      <div 
        className="border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center text-center p-8"
        style={{ height: height }}
      >
        <div>
          <h4 className="text-xl font-semibold text-gray-700 mb-2">📍 {title}</h4>
          <p className="text-gray-600 mb-4">
            <strong>Coordenadas:</strong><br/>
            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
          <div className="space-x-2">
            <button
              onClick={openInGoogleMaps}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              🧭 Cómo llegar
            </button>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-blue-800">
          <span>💡</span>
          <span className="text-sm font-medium">Navegación:</span>
        </div>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>• Usa "Google Maps" para navegación detallada</li>
          <li>• Usa "Waze" para evitar tráfico en tiempo real</li>
          <li>• Las coordenadas funcionan en cualquier app de mapas</li>
        </ul>
      </div>
    </div>
  );
};

window.MapViewer = MapViewer;