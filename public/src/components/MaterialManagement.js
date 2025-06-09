// src/components/MaterialManagement.js - Gestión completa de materiales
const { useState } = React;

const MaterialManagement = ({ materiales, materialCategories, onDataChange, showNotification, empresaData }) => {
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('');

  const deleteMaterial = async (materialId) => {
    if (!confirm('¿Está seguro de eliminar este material? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await window.db.collection('materiales').doc(materialId).delete();
      await onDataChange();
      showNotification('✅ Material eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error eliminando material:', error);
      showNotification('❌ Error al eliminar material', 'error');
    }
  };

  // Filtros para materiales
  const materialesFiltrados = materiales.filter(material => {
    const matchCategoria = !materialCategoryFilter || material.categoria === materialCategoryFilter;
    const matchBusqueda = !materialSearch || 
      material.nombre.toLowerCase().includes(materialSearch.toLowerCase()) ||
      material.descripcion?.toLowerCase().includes(materialSearch.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🧱 Gestión de Materiales - {empresaData.nombre}</h2>
          <p className="text-gray-600">Administrar lista de materiales disponibles para los albañiles</p>
        </div>
        <button
          onClick={() => setShowAddMaterialModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Agregar Material</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔍 Buscar material
            </label>
            <input
              type="text"
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              placeholder="Nombre o descripción..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📂 Filtrar por categoría
            </label>
            <select
              value={materialCategoryFilter}
              onChange={(e) => setMaterialCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {materialCategories.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setMaterialSearch('');
                setMaterialCategoryFilter('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              🔄 Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">📦</span>
            <div className="ml-3">
              <p className="text-sm text-blue-600">Total Materiales</p>
              <p className="text-2xl font-bold text-blue-800">{materiales.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">✅</span>
            <div className="ml-3">
              <p className="text-sm text-green-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-800">
                {materiales.filter(m => m.disponible !== false).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">📂</span>
            <div className="ml-3">
              <p className="text-sm text-yellow-600">Categorías</p>
              <p className="text-2xl font-bold text-yellow-800">{materialCategories.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">🔍</span>
            <div className="ml-3">
              <p className="text-sm text-purple-600">Filtrados</p>
              <p className="text-2xl font-bold text-purple-800">{materialesFiltrados.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de materiales */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Est.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materialesFiltrados.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {material.nombre}
                      </div>
                      {material.descripcion && (
                        <div className="text-sm text-gray-500">
                          {material.descripcion}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {material.categoria || 'Sin categoría'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {material.unidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {material.precio_estimado ? `$${material.precio_estimado}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      material.disponible !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {material.disponible !== false ? '✅ Disponible' : '❌ No disponible'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedMaterial(material);
                        setShowEditMaterialModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => deleteMaterial(material.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {materialesFiltrados.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron materiales</h3>
            <p className="text-gray-500 mb-4">
              {materialSearch || materialCategoryFilter 
                ? 'No hay materiales con los filtros aplicados' 
                : 'Empieza agregando tu primer material'
              }
            </p>
            {!materialSearch && !materialCategoryFilter && (
              <button
                onClick={() => setShowAddMaterialModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                ➕ Agregar Primer Material
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODALES */}
      {showAddMaterialModal && (
        <MaterialModal
          onClose={() => setShowAddMaterialModal(false)}
          onSave={() => {
            onDataChange();
            setShowAddMaterialModal(false);
            showNotification('✅ Material creado exitosamente', 'success');
          }}
          categorias={materialCategories}
        />
      )}
      
      {showEditMaterialModal && selectedMaterial && (
        <MaterialModal
          material={selectedMaterial}
          onClose={() => {
            setShowEditMaterialModal(false);
            setSelectedMaterial(null);
          }}
          onSave={() => {
            onDataChange();
            setShowEditMaterialModal(false);
            setSelectedMaterial(null);
            showNotification('✅ Material actualizado exitosamente', 'success');
          }}
          categorias={materialCategories}
        />
      )}
    </div>
  );
};

// Hacer disponible globalmente
window.MaterialManagement = MaterialManagement;