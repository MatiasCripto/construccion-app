// src/components/WorkModal.js - Modal para crear/editar obras
const { useState } = React;

const WorkModal = ({ obra, albaniles, jefesDeObra, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: obra?.nombre || '',
    ubicacion: obra?.ubicacion || '',
    descripcion: obra?.descripcion || '',
    albanil_asignado: obra?.albanil_asignado || '',
    jefe_obra: obra?.jefe_obra || '',
    latitud: obra?.latitud || null,
    longitud: obra?.longitud || null,
    estado: obra?.estado || 'pendiente'
  });
  const [loading, setLoading] = useState(false);

  const isEditing = !!obra;

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      latitud: location.lat,
      longitud: location.lng
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.latitud || !formData.longitud) {
      alert('Por favor selecciona una ubicación en el mapa');
      return;
    }
    
    setLoading(true);

    try {
      if (isEditing) {
        // EDITAR OBRA
        const response = await fetch(`/api/obras/${obra.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          onSuccess();
        } else {
          const error = await response.json();
          alert(error.error || 'Error al actualizar obra');
        }
      } else {
        // CREAR OBRA
        const response = await fetch('/api/obras', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          setFormData({
            nombre: '',
            ubicacion: '',
            descripcion: '',
            albanil_asignado: '',
            jefe_obra: '',
            latitud: null,
            longitud: null,
            estado: 'pendiente'
          });
          onSuccess();
        } else {
          const error = await response.json();
          alert(error.error || 'Error al crear obra');
        }
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {isEditing ? `✏️ Editar Obra: ${obra.nombre}` : '➕ Crear Nueva Obra'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Obra *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="en_progreso">🚧 En Progreso</option>
                    <option value="completada">✅ Completada</option>
                    <option value="cancelada">❌ Cancelada</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción de Ubicación *
              </label>
              <input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Ej: Av. Corrientes 1234, CABA"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del Trabajo
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Describe el trabajo a realizar..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Albañil Asignado *
                </label>
                <select
                  value={formData.albanil_asignado}
                  onChange={(e) => setFormData({ ...formData, albanil_asignado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar albañil</option>
                  {albaniles.map(albanil => (
                    <option key={albanil.id} value={albanil.id}>
                      👷 {albanil.nombre} {albanil.apellido}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jefe de Obra
                </label>
                <select
                  value={formData.jefe_obra}
                  onChange={(e) => setFormData({ ...formData, jefe_obra: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar jefe de obra</option>
                  {jefesDeObra.map(jefe => (
                    <option key={jefe.id} value={jefe.id}>
                      🛠️ {jefe.nombre} {jefe.apellido}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Información de cambio de albañil */}
            {isEditing && formData.albanil_asignado != obra.albanil_asignado && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                  <div>
                    <h4 className="text-yellow-800 font-medium">Cambio de Albañil Detectado</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      Al cambiar el albañil asignado, la obra se transferirá al nuevo empleado
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Selector de Mapa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación en el Mapa *
              </label>
              {window.MapSelector ? (
                <MapSelector
                  onLocationSelect={handleLocationSelect}
                  initialLocation={formData.latitud && formData.longitud ? 
                    { lat: formData.latitud, lng: formData.longitud } : null
                  }
                />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    ⚠️ Componente MapSelector no está disponible. Asegúrate de que Google Maps esté cargado.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitud
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitud || ''}
                        onChange={(e) => setFormData({ ...formData, latitud: parseFloat(e.target.value) || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="-34.6037"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitud
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitud || ''}
                        onChange={(e) => setFormData({ ...formData, longitud: parseFloat(e.target.value) || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="-58.3816"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(!formData.latitud || !formData.longitud) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Debes seleccionar una ubicación en el mapa antes de {isEditing ? 'actualizar' : 'crear'} la obra
                </p>
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.latitud || !formData.longitud}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : (isEditing ? '✏️ Actualizar Obra' : '➕ Crear Obra')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.WorkModal = WorkModal;