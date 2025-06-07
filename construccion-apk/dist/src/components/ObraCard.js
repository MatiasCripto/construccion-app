const { useState } = React;

const ObraCard = ({ obra, user, onUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_progreso: 'bg-blue-100 text-blue-800',
      completada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      cancelada: 'Cancelada'
    };
    return labels[estado] || estado;
  };

  const handleEstadoChange = async (nuevoEstado) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/obras/${obra.id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      
      if (response.ok) {
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar estado');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-gray-900">{obra.nombre}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(obra.estado)}`}>
              {getEstadoLabel(obra.estado)}
            </span>
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="text-gray-600">
              <span className="font-medium">📍 Ubicación:</span> {obra.ubicacion}
            </p>
            {obra.descripcion && (
              <p className="text-gray-600">
                <span className="font-medium">📝 Descripción:</span> {obra.descripcion}
              </p>
            )}
            {obra.albanil_nombre && (
              <p className="text-gray-600">
                <span className="font-medium">👷 Albañil:</span> {obra.albanil_nombre} {obra.albanil_apellido}
              </p>
            )}
            {obra.jefe_nombre && (
              <p className="text-gray-600">
                <span className="font-medium">👨‍💼 Jefe de Obra:</span> {obra.jefe_nombre} {obra.jefe_apellido}
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setShowDetails(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
            >
              Ver Detalles
            </button>
            
            {(user.rol === 'albanil' && obra.albanil_asignado === user.id) || ['admin', 'jefe_obra'].includes(user.rol) ? (
              <div className="flex space-x-2">
                {obra.estado === 'pendiente' && (
                  <button
                    onClick={() => handleEstadoChange('en_progreso')}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50"
                  >
                    Iniciar
                  </button>
                )}
                {obra.estado === 'en_progreso' && (
                  <button
                    onClick={() => handleEstadoChange('completada')}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50"
                  >
                    Completar
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Modal de detalles */}
      {showDetails && (
        <ObraDetailsModal 
          obra={obra} 
          user={user} 
          onClose={() => setShowDetails(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

const ObraDetailsModal = ({ obra, user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState(user.rol === 'albanil' ? 'workflow' : 'general');
  
  // Para albañiles, mostrar directamente el workflow
  if (user.rol === 'albanil' && obra.albanil_asignado === user.id) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{obra.nombre}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            {window.AlbanilWorkflow ? (
              <AlbanilWorkflow obra={obra} user={user} onUpdate={onUpdate} />
            ) : (
              <div className="text-center py-12">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    🔧 Flujo de Trabajo en Desarrollo
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    El componente AlbanilWorkflow no está disponible todavía.
                  </p>
                  
                  {/* Vista básica para albañiles mientras tanto */}
                  <div className="bg-white rounded-lg p-6 text-left">
                    <h4 className="font-semibold text-gray-900 mb-4">📋 Información de la Obra</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Ubicación:</span> {obra.ubicacion}</p>
                      <p><span className="font-medium">Estado:</span> {obra.estado}</p>
                      <p><span className="font-medium">Descripción:</span> {obra.descripcion || 'Sin descripción'}</p>
                    </div>
                    
                    {/* Mostrar mapa si hay coordenadas */}
                    {obra.latitud && obra.longitud && window.MapViewer && (
                      <div className="mt-6">
                        <MapViewer 
                          location={{ lat: obra.latitud, lng: obra.longitud }}
                          title={obra.nombre}
                          height="300px"
                        />
                      </div>
                    )}
                    
                    {/* Chat básico */}
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-2">💬 Chat</h4>
                      {window.ChatComponent ? (
                        <ChatComponent obraId={obra.id} user={user} />
                      ) : (
                        <p className="text-gray-500">Chat no disponible</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Para otros roles, mantener el diseño original con tabs
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">{obra.nombre}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs para otros roles */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'general'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('fotos')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'fotos'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Fotos
            </button>
            <button
              onClick={() => setActiveTab('materiales')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'materiales'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Materiales
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'chat'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Chat
            </button>
            {obra.latitud && obra.longitud && (
              <button
                onClick={() => setActiveTab('ubicacion')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'ubicacion'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📍 Ubicación
              </button>
            )}
            {['admin', 'jefe_obra'].includes(user.rol) && (
              <button
                onClick={() => setActiveTab('progreso')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'progreso'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Progreso
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Información General</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Ubicación:</span> {obra.ubicacion}</p>
                    <p><span className="font-medium">Estado:</span> {obra.estado}</p>
                    <p><span className="font-medium">Descripción:</span> {obra.descripcion || 'Sin descripción'}</p>
                    {obra.latitud && obra.longitud && (
                      <p><span className="font-medium">Coordenadas:</span> {obra.latitud.toFixed(6)}, {obra.longitud.toFixed(6)}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Personal Asignado</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Albañil:</span> {obra.albanil_nombre} {obra.albanil_apellido}</p>
                    <p><span className="font-medium">Jefe de Obra:</span> {obra.jefe_nombre} {obra.jefe_apellido}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'fotos' && (
            window.PhotoUpload ? (
              <PhotoUpload obraId={obra.id} user={user} />
            ) : (
              <p className="text-gray-500">Componente de fotos no disponible</p>
            )
          )}
          
          {activeTab === 'materiales' && (
            window.MaterialSelector ? (
              <MaterialSelector obraId={obra.id} user={user} />
            ) : (
              <p className="text-gray-500">Componente de materiales no disponible</p>
            )
          )}
          
          {activeTab === 'chat' && (
            window.ChatComponent ? (
              <ChatComponent obraId={obra.id} user={user} />
            ) : (
              <p className="text-gray-500">Chat no disponible</p>
            )
          )}
          
          {activeTab === 'ubicacion' && (
            <div>
              {obra.latitud && obra.longitud ? (
                window.MapViewer ? (
                  <MapViewer 
                    location={{ lat: obra.latitud, lng: obra.longitud }}
                    title={obra.nombre}
                    height="500px"
                  />
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-500 text-lg">🗺️ Componente de mapa no disponible</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Coordenadas: {obra.latitud.toFixed(6)}, {obra.longitud.toFixed(6)}
                    </p>
                  </div>
                )
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-500 text-lg">📍 No hay ubicación GPS disponible para esta obra</p>
                  <p className="text-gray-400 text-sm mt-2">La obra fue creada antes de implementar la funcionalidad de mapas</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'progreso' && (
            <ProgresoView obraId={obra.id} user={user} />
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para ver el progreso (para admins y jefes de obra)
const ProgresoView = ({ obraId, user }) => {
  const [progreso, setProgreso] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgreso();
  }, [obraId]);

  const loadProgreso = async () => {
    try {
      const response = await fetch(`/api/progreso/obra/${obraId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProgreso(data);
      }
    } catch (err) {
      console.error('Error al cargar progreso:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPasoNombre = (paso) => {
    const nombres = {
      1: '📷 Fotos de Llegada',
      2: '🧱 Solicitar Materiales', 
      3: '🔨 Realizar Trabajo',
      4: '✅ Fotos Finales'
    };
    return nombres[paso] || `Paso ${paso}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">📊 Progreso de la Obra</h3>
      
      <div className="space-y-3">
        {progreso.map(paso => (
          <div key={paso.id} className={`p-4 rounded-lg border-2 ${
            paso.completado 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  paso.completado 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {paso.completado ? '✓' : paso.paso}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {getPasoNombre(paso.paso)}
                  </h4>
                  {paso.fecha_completado && (
                    <p className="text-sm text-gray-600">
                      Completado: {new Date(paso.fecha_completado).toLocaleString('es-ES')}
                    </p>
                  )}
                  {paso.comentarios && (
                    <p className="text-sm text-gray-600 mt-1">
                      Comentarios: {paso.comentarios}
                    </p>
                  )}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                paso.completado 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {paso.completado ? 'Completado' : 'Pendiente'}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {progreso.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No hay información de progreso disponible
        </p>
      )}
    </div>
  );
};

window.ObraCard = ObraCard;