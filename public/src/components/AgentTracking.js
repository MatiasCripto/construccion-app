// src/components/AgentTracking.js - Control de agentes en tiempo real
const AgentTracking = () => {
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            🗺️ Control de Agentes
            <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full animate-pulse">
              EN VIVO
            </span>
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Monitoreo en tiempo real de ubicaciones de empleados
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Sistema activo</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {window.AgentTrackingPanel ? (
          <AgentTrackingPanel adminId="admin_sistema" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Panel de Control no disponible</h3>
              <p className="text-gray-500 mb-4">
                El componente AgentTrackingPanel no se ha cargado correctamente
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                🔄 Recargar página
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.AgentTracking = AgentTracking;