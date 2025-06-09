// src/components/ToolManagement.js - Gestión completa de herramientas
const { useState } = React;

const ToolManagement = ({ herramientas, toolCategories, onDataChange, showNotification, empresaData }) => {
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [showEditToolModal, setShowEditToolModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolSearch, setToolSearch] = useState('');
  const [toolCategoryFilter, setToolCategoryFilter] = useState('');

  const deleteTool = async (toolId) => {
    if (!confirm('¿Está seguro de eliminar esta herramienta?')) return;

    try {
      await window.db.collection('herramientas').doc(toolId).delete();
      await onDataChange();
      showNotification('✅ Herramienta eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error eliminando herramienta:', error);
      showNotification('❌ Error al eliminar herramienta', 'error');
    }
  };

  // Filtros para herramientas
  const herramientasFiltradas = herramientas.filter(herramienta => {
    const matchCategoria = !toolCategoryFilter || herramienta.categoria === toolCategoryFilter;
    const matchBusqueda = !toolSearch || 
      herramienta.nombre.toLowerCase().includes(toolSearch.toLowerCase()) ||
      herramienta.descripcion?.toLowerCase().includes(toolSearch.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔧 Gestión de Herramientas - {empresaData.nombre}</h2>
          <p className="text-gray-600">Administrar lista de herramientas disponibles para los trabajadores</p>
        </div>
        <button
          onClick={() => setShowAddToolModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Agregar Herramienta</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔍 Buscar herramienta
            </label>
            <input
              type="text"
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              placeholder="Nombre o descripción..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📂 Filtrar por categoría
            </label>
            <select
              value={toolCategoryFilter}
              onChange={(e) => setToolCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todas las categorías</option>
              {toolCategories.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setToolSearch('');
                setToolCategoryFilter('');
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
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">🔧</span>
            <div className="ml-3">
              <p className="text-sm text-purple-600">Total Herramientas</p>
              <p className="text-2xl font-bold text-purple-800">{herramientas.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">✅</span>
            <div className="ml-3">
              <p className="text-sm text-green-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-800">
                {herramientas.filter(h => h.disponible !== false).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">📂</span>
            <div className="ml-3">
              <p className="text-sm text-yellow-600">Categorías</p>
              <p className="text-2xl font-bold text-yellow-800">{toolCategories.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">🔍</span>
            <div className="ml-3">
              <p className="text-sm text-orange-600">Filtradas</p>
              <p className="text-2xl font-bold text-orange-800">{herramientasFiltradas.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de herramientas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Herramienta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {herramientasFiltradas.map((herramienta) => (
                <tr key={herramienta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {herramienta.nombre}
                      </div>
                      {herramienta.descripcion && (
                        <div className="text-sm text-gray-500">
                          {herramienta.descripcion}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {herramienta.categoria || 'Sin categoría'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {herramienta.codigo || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      herramienta.disponible !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {herramienta.disponible !== false ? '✅ Disponible' : '❌ No disponible'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      herramienta.condicion === 'excelente' ? 'bg-green-100 text-green-800' :
                      herramienta.condicion === 'buena' ? 'bg-blue-100 text-blue-800' :
                      herramienta.condicion === 'regular' ? 'bg-yellow-100 text-yellow-800' :
                      herramienta.condicion === 'mala' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {herramienta.condicion || 'Sin evaluar'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTool(herramienta);
                        setShowEditToolModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => deleteTool(herramienta.id)}
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
        
        {herramientasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron herramientas</h3>
            <p className="text-gray-500 mb-4">
              {toolSearch || toolCategoryFilter 
                ? 'No hay herramientas con los filtros aplicados' 
                : 'Empieza agregando tu primera herramienta'
              }
            </p>
            {!toolSearch && !toolCategoryFilter && (
              <button
                onClick={() => setShowAddToolModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                ➕ Agregar Primera Herramienta
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODALES */}
      {showAddToolModal && (
        <ToolModal
          onClose={() => setShowAddToolModal(false)}
          onSave={() => {
            onDataChange();
            setShowAddToolModal(false);
            showNotification('✅ Herramienta creada exitosamente', 'success');
          }}
          categorias={toolCategories}
        />
      )}
      
      {showEditToolModal && selectedTool && (
        <ToolModal
          tool={selectedTool}
          onClose={() => {
            setShowEditToolModal(false);
            setSelectedTool(null);
          }}
          onSave={() => {
            onDataChange();
            setShowEditToolModal(false);
            setSelectedTool(null);
            showNotification('✅ Herramienta actualizada exitosamente', 'success');
          }}
          categorias={toolCategories}
        />
      )}
    </div>
  );
};

// Hacer disponible globalmente
window.ToolManagement = ToolManagement;