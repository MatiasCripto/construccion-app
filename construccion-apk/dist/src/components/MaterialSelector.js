const { useState, useEffect } = React;

const MaterialSelector = ({ obraId, user }) => {
  const [materiales, setMateriales] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [selectedMateriales, setSelectedMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [obraId]);

  const loadData = async () => {
    try {
      const [materialesRes, solicitudesRes] = await Promise.all([
        fetch('/api/materiales', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(`/api/materiales/obra/${obraId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      const materialesData = await materialesRes.json();
      const solicitudesData = await solicitudesRes.json();

      if (materialesRes.ok) setMateriales(materialesData);
      if (solicitudesRes.ok) setSolicitudes(solicitudesData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = () => {
    setSelectedMateriales([...selectedMateriales, { material_id: '', cantidad: 1 }]);
  };

  const updateMaterial = (index, field, value) => {
    const updated = [...selectedMateriales];
    updated[index][field] = value;
    setSelectedMateriales(updated);
  };

  const removeMaterial = (index) => {
    setSelectedMateriales(selectedMateriales.filter((_, i) => i !== index));
  };

  const submitSolicitud = async () => {
    if (selectedMateriales.length === 0) {
      alert('Selecciona al menos un material');
      return;
    }

    const materialesValidos = selectedMateriales.filter(m => m.material_id && m.cantidad > 0);
    if (materialesValidos.length === 0) {
      alert('Completa la información de los materiales');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/materiales/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          obra_id: obraId,
          materiales: materialesValidos
        })
      });

      if (response.ok) {
        setSelectedMateriales([]);
        loadData();
        alert('Materiales solicitados exitosamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al solicitar materiales');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const updateSolicitud = async (solicitudId, estado, cantidadAprobada) => {
    try {
      const response = await fetch(`/api/materiales/solicitud/${solicitudId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ estado, cantidad_aprobada: cantidadAprobada })
      });

      if (response.ok) {
        loadData();
        alert('Solicitud actualizada');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar solicitud');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Solicitar nuevos materiales */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">🧱 Solicitar Materiales</h3>
        
        <div className="space-y-4">
          {selectedMateriales.map((item, index) => (
            <div key={index} className="flex space-x-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material
                </label>
                <select
                  value={item.material_id}
                  onChange={(e) => updateMaterial(index, 'material_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar material</option>
                  {materiales.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.nombre} ({material.unidad})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.cantidad}
                  onChange={(e) => updateMaterial(index, 'cantidad', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={() => removeMaterial(index)}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                ✕
              </button>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <button
              onClick={addMaterial}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Agregar Material
            </button>
            
            {selectedMateriales.length > 0 && (
              <button
                onClick={submitSolicitud}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Lista de solicitudes */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">📋 Solicitudes de Materiales</h3>
        
        {solicitudes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay solicitudes de materiales</p>
        ) : (
          <div className="space-y-4">
            {solicitudes.map(solicitud => (
              <div key={solicitud.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{solicitud.nombre}</h4>
                    <p className="text-sm text-gray-600">
                      Solicitado: {solicitud.cantidad_solicitada} {solicitud.unidad}
                    </p>
                    {solicitud.cantidad_aprobada > 0 && (
                      <p className="text-sm text-green-600">
                        Aprobado: {solicitud.cantidad_aprobada} {solicitud.unidad}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(solicitud.estado)}`}>
                    {solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1)}
                  </span>
                </div>
                
                {['admin', 'jefe_obra'].includes(user.rol) && solicitud.estado === 'pendiente' && (
                  <div className="flex space-x-2 mt-3">
                    <input
                      type="number"
                      min="0"
                      max={solicitud.cantidad_solicitada}
                      placeholder="Cantidad a aprobar"
                      className="px-3 py-1 border border-gray-300 rounded text-sm w-32"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const cantidad = parseInt(e.target.value) || 0;
                          updateSolicitud(solicitud.id, 'aprobado', cantidad);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector(`input[placeholder="Cantidad a aprobar"]`);
                        const cantidad = parseInt(input.value) || 0;
                        updateSolicitud(solicitud.id, 'aprobado', cantidad);
                        input.value = '';
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => updateSolicitud(solicitud.id, 'rechazado', 0)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

window.MaterialSelector = MaterialSelector;