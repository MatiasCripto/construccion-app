// src/components/WorkManagement.js - Gestión completa de obras
const { useState } = React;

const WorkManagement = ({ obras, albaniles, jefesDeObra, onDataChange, showNotification }) => {
  const [showCreateObra, setShowCreateObra] = useState(false);
  const [showEditObra, setShowEditObra] = useState(false);
  const [showDeleteObraModal, setShowDeleteObraModal] = useState(false);
  const [selectedObra, setSelectedObra] = useState(null);
  const [obraToDelete, setObraToDelete] = useState(null);
  const [isDeletingObra, setIsDeletingObra] = useState(false);

  const handleCreateObra = () => {
    setSelectedObra(null);
    setShowCreateObra(true);
  };

  const handleEditObra = (obra) => {
    setSelectedObra(obra);
    setShowEditObra(true);
  };

  const handleDeleteObra = (obra) => {
    setObraToDelete(obra);
    setShowDeleteObraModal(true);
  };

  const confirmDeleteObra = async () => {
    if (!obraToDelete) return;
    
    setIsDeletingObra(true);
    try {
      console.log('🗑️ Eliminando obra:', obraToDelete.id);
      
      const response = await fetch(`/api/obras/${obraToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar obra del backend');
      }

      // Eliminar de Firebase si existe
      if (window.db) {
        try {
          // Eliminar informes relacionados
          const informesSnapshot = await window.db.collection('informes_obra')
            .where('obra_id', '==', obraToDelete.id).get();
          
          const deletePromises = [];
          informesSnapshot.forEach(doc => {
            deletePromises.push(doc.ref.delete());
          });
          await Promise.all(deletePromises);

          // Eliminar fotos relacionadas
          const fotosSnapshot = await window.db.collection('fotos_obra')
            .where('obra_id', '==', obraToDelete.id).get();
          
          fotosSnapshot.forEach(doc => {
            deletePromises.push(doc.ref.delete());
          });
          await Promise.all(deletePromises);
          
        } catch (firebaseError) {
          console.warn('⚠️ Error eliminando datos relacionados de Firebase:', firebaseError);
        }
      }
      
      await onDataChange();
      setShowDeleteObraModal(false);
      setObraToDelete(null);
      
      console.log('✅ Obra eliminada completamente');
      showNotification('✅ Obra eliminada completamente', 'success');
      
    } catch (error) {
      console.error('❌ Error eliminando obra:', error);
      showNotification('❌ Error eliminando obra: ' + error.message, 'error');
    } finally {
      setIsDeletingObra(false);
    }
  };

  const cancelDeleteObra = () => {
    setShowDeleteObraModal(false);
    setObraToDelete(null);
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">🏗️ Gestión de Obras</h2>
          <p className="text-gray-600 text-sm mt-1">
            CRUD completo: Crear, Ver, Editar y Eliminar obras del sistema
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Total: <span className="font-medium">{obras.length}</span> obras
          </div>
          <button
            onClick={handleCreateObra}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Crear Obra</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {obras.map(obra => (
          <div key={obra.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">🏗️</span>
                  {obra.nombre}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(obra.estado)}`}>
                  {getEstadoLabel(obra.estado)}
                </span>
              </div>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-start">
                  <span className="text-gray-500 mr-2">📍</span>
                  <span className="text-gray-700">{obra.ubicacion}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">👷</span>
                  <span className="text-gray-700">
                    {obra.albanil_nombre} {obra.albanil_apellido}
                  </span>
                </div>
                {obra.jefe_nombre && (
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">🛠️</span>
                    <span className="text-gray-700">
                      {obra.jefe_nombre} {obra.jefe_apellido}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">📅</span>
                  <span className="text-gray-700">
                    Creada: {formatDate(obra.fecha_creacion)}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => console.log('Ver detalles:', obra.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  👁️ Ver
                </button>
                <button
                  onClick={() => handleEditObra(obra)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDeleteObra(obra)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {obras.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🏗️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay obras creadas</h3>
            <p className="text-gray-500 mb-4">Empieza creando tu primera obra</p>
            <button
              onClick={handleCreateObra}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              ➕ Crear Primera Obra
            </button>
          </div>
        )}
      </div>

      {/* MODALES */}
      {showCreateObra && (
        <WorkModal
          albaniles={albaniles}
          jefesDeObra={jefesDeObra}
          onClose={() => setShowCreateObra(false)}
          onSuccess={() => {
            setShowCreateObra(false);
            onDataChange();
            showNotification('Obra creada exitosamente', 'success');
          }}
        />
      )}

      {showEditObra && selectedObra && (
        <WorkModal
          obra={selectedObra}
          albaniles={albaniles}
          jefesDeObra={jefesDeObra}
          onClose={() => {
            setShowEditObra(false);
            setSelectedObra(null);
          }}
          onSuccess={() => {
            setShowEditObra(false);
            setSelectedObra(null);
            onDataChange();
            showNotification('Obra actualizada exitosamente', 'success');
          }}
        />
      )}

      {showDeleteObraModal && obraToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2 text-red-600">
                ¿Eliminar Obra Definitivamente?
              </h3>
              <div className="text-gray-700 mb-4">
                <p className="font-medium">{obraToDelete.nombre}</p>
                <p className="text-sm text-gray-500">{obraToDelete.ubicacion}</p>
                <p className="text-sm text-gray-500">Estado: {getEstadoLabel(obraToDelete.estado)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
                <p className="text-red-800 text-sm">
                  <strong>⚠️ ADVERTENCIA:</strong> Esta acción NO se puede deshacer.
                </p>
                <p className="text-red-700 text-xs mt-1">
                  Se eliminarán todos los datos relacionados: informes, fotos, etc.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteObra}
                disabled={isDeletingObra}
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isDeletingObra ? '🔄 Eliminando...' : '🗑️ SÍ, ELIMINAR'}
              </button>
              <button
                onClick={cancelDeleteObra}
                disabled={isDeletingObra}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hacer disponible globalmente
window.WorkManagement = WorkManagement;