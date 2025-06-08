// src/components/MaterialManager.js - GESTIÓN COMPLETA DE MATERIALES Y HERRAMIENTAS
const { useState, useEffect } = React;

const MaterialManager = () => {
  const [materiales, setMateriales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Cargar materiales al iniciar
  useEffect(() => {
    loadMateriales();
  }, []);

  const loadMateriales = async () => {
    setIsLoading(true);
    try {
      if (window.db) {
        const snapshot = await window.db.collection('materiales').orderBy('nombre').get();
        const materialesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMateriales(materialesData);
        
        // Extraer categorías únicas
        const categoriasUnicas = [...new Set(materialesData.map(m => m.categoria))].filter(Boolean);
        setCategorias(categoriasUnicas);
      }
    } catch (error) {
      console.error('Error cargando materiales:', error);
      alert('Error al cargar materiales');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMaterial = async (materialId) => {
    if (!confirm('¿Está seguro de eliminar este material? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await window.db.collection('materiales').doc(materialId).delete();
      await loadMateriales();
      showNotification('✅ Material eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando material:', error);
      showNotification('❌ Error al eliminar material');
    }
  };

  const showNotification = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Filtrar materiales
  const materialesFiltrados = materiales.filter(material => {
    const matchCategoria = !filtroCategoria || material.categoria === filtroCategoria;
    const matchBusqueda = !busqueda || 
      material.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      material.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Cargando materiales...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🧱 Gestión de Materiales</h2>
          <p className="text-gray-600">Administrar lista de materiales disponibles para los albañiles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
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
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o descripción..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📂 Filtrar por categoría
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroCategoria('');
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
              <p className="text-2xl font-bold text-yellow-800">{categorias.length}</p>
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
                        setShowEditModal(true);
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
              {busqueda || filtroCategoria 
                ? 'No hay materiales con los filtros aplicados' 
                : 'Empieza agregando tu primer material'
              }
            </p>
            {!busqueda && !filtroCategoria && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                ➕ Agregar Primer Material
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <MaterialModal
          onClose={() => setShowAddModal(false)}
          onSave={loadMateriales}
          categorias={categorias}
        />
      )}
      
      {showEditModal && selectedMaterial && (
        <MaterialModal
          material={selectedMaterial}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMaterial(null);
          }}
          onSave={loadMateriales}
          categorias={categorias}
        />
      )}
    </div>
  );
};

// Modal para agregar/editar material
const MaterialModal = ({ material, onClose, onSave, categorias }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    unidad: '',
    precio_estimado: '',
    disponible: true,
    codigo: '',
    proveedor: '',
    stock_minimo: '',
    ...material
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const materialData = {
        ...formData,
        precio_estimado: formData.precio_estimado ? parseFloat(formData.precio_estimado) : null,
        stock_minimo: formData.stock_minimo ? parseInt(formData.stock_minimo) : null,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (material?.id) {
        // Editar
        await window.db.collection('materiales').doc(material.id).update(materialData);
        showNotification('✅ Material actualizado exitosamente');
      } else {
        // Crear
        materialData.created_at = firebase.firestore.FieldValue.serverTimestamp();
        await window.db.collection('materiales').add(materialData);
        showNotification('✅ Material creado exitosamente');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error guardando material:', error);
      showNotification('❌ Error al guardar material');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {material ? '✏️ Editar Material' : '➕ Agregar Material'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Cemento Portland"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: CEM-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción detallada del material"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                required
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Cemento">Cemento</option>
                <option value="Arena">Arena</option>
                <option value="Hierro">Hierro</option>
                <option value="Ladrillo">Ladrillo</option>
                <option value="Pintura">Pintura</option>
                <option value="Electricidad">Electricidad</option>
                <option value="Plomería">Plomería</option>
                <option value="Aislamiento">Aislamiento</option>
                <option value="Adhesivos">Adhesivos</option>
                <option value="Acabados">Acabados</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de medida *
              </label>
              <select
                required
                value={formData.unidad}
                onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar unidad</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="bolsa">Bolsas</option>
                <option value="m3">Metros cúbicos (m³)</option>
                <option value="m2">Metros cuadrados (m²)</option>
                <option value="m">Metros (m)</option>
                <option value="litros">Litros</option>
                <option value="unidad">Unidades</option>
                <option value="cajas">Cajas</option>
                <option value="rollos">Rollos</option>
                <option value="placas">Placas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio estimado ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.precio_estimado}
                onChange={(e) => setFormData({...formData, precio_estimado: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock mínimo
              </label>
              <input
                type="number"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({...formData, stock_minimo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.disponible}
                onChange={(e) => setFormData({...formData, disponible: e.target.value === 'true'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">✅ Disponible</option>
                <option value="false">❌ No disponible</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor
            </label>
            <input
              type="text"
              value={formData.proveedor}
              onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Proveedor ABC S.A."
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : (material ? 'Actualizar' : 'Crear Material')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== GESTIÓN DE HERRAMIENTAS =====
const ToolManager = () => {
  const [herramientas, setHerramientas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    loadHerramientas();
  }, []);

  const loadHerramientas = async () => {
    setIsLoading(true);
    try {
      if (window.db) {
        const snapshot = await window.db.collection('herramientas').orderBy('nombre').get();
        const herramientasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHerramientas(herramientasData);
        
        const categoriasUnicas = [...new Set(herramientasData.map(h => h.categoria))].filter(Boolean);
        setCategorias(categoriasUnicas);
      }
    } catch (error) {
      console.error('Error cargando herramientas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTool = async (toolId) => {
    if (!confirm('¿Está seguro de eliminar esta herramienta?')) return;

    try {
      await window.db.collection('herramientas').doc(toolId).delete();
      await loadHerramientas();
      showNotification('✅ Herramienta eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando herramienta:', error);
      showNotification('❌ Error al eliminar herramienta');
    }
  };

  const showNotification = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const herramientasFiltradas = herramientas.filter(herramienta => {
    const matchCategoria = !filtroCategoria || herramienta.categoria === filtroCategoria;
    const matchBusqueda = !busqueda || 
      herramienta.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      herramienta.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Cargando herramientas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔧 Gestión de Herramientas</h2>
          <p className="text-gray-600">Administrar lista de herramientas disponibles para los trabajadores</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
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
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o descripción..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📂 Filtrar por categoría
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroCategoria('');
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
              <p className="text-2xl font-bold text-yellow-800">{categorias.length}</p>
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
                        setShowEditModal(true);
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
              {busqueda || filtroCategoria 
                ? 'No hay herramientas con los filtros aplicados' 
                : 'Empieza agregando tu primera herramienta'
              }
            </p>
            {!busqueda && !filtroCategoria && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                ➕ Agregar Primera Herramienta
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <ToolModal
          onClose={() => setShowAddModal(false)}
          onSave={loadHerramientas}
          categorias={categorias}
        />
      )}
      
      {showEditModal && selectedTool && (
        <ToolModal
          tool={selectedTool}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTool(null);
          }}
          onSave={loadHerramientas}
          categorias={categorias}
        />
      )}
    </div>
  );
};

// Modal para herramientas
const ToolModal = ({ tool, onClose, onSave, categorias }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    codigo: '',
    disponible: true,
    condicion: 'buena',
    ubicacion_actual: '',
    responsable_actual: '',
    fecha_mantenimiento: '',
    observaciones: '',
    ...tool
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const toolData = {
        ...formData,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (tool?.id) {
        await window.db.collection('herramientas').doc(tool.id).update(toolData);
        showNotification('✅ Herramienta actualizada exitosamente');
      } else {
        toolData.created_at = firebase.firestore.FieldValue.serverTimestamp();
        await window.db.collection('herramientas').add(toolData);
        showNotification('✅ Herramienta creada exitosamente');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error guardando herramienta:', error);
      showNotification('❌ Error al guardar herramienta');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {tool ? '✏️ Editar Herramienta' : '➕ Agregar Herramienta'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: Martillo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: HER-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Descripción detallada de la herramienta"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                required
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Manuales">Manuales</option>
                <option value="Eléctricas">Eléctricas</option>
                <option value="Medición">Medición</option>
                <option value="Corte">Corte</option>
                <option value="Fijación">Fijación</option>
                <option value="Soldadura">Soldadura</option>
                <option value="Seguridad">Seguridad</option>
                <option value="Transporte">Transporte</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condición *
              </label>
              <select
                required
                value={formData.condicion}
                onChange={(e) => setFormData({...formData, condicion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="excelente">🟢 Excelente</option>
                <option value="buena">🔵 Buena</option>
                <option value="regular">🟡 Regular</option>
                <option value="mala">🔴 Mala</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación actual
              </label>
              <input
                type="text"
                value={formData.ubicacion_actual}
                onChange={(e) => setFormData({...formData, ubicacion_actual: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: Depósito Central"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.disponible}
                onChange={(e) => setFormData({...formData, disponible: e.target.value === 'true'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="true">✅ Disponible</option>
                <option value="false">❌ No disponible</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsable actual
              </label>
              <input
                type="text"
                value={formData.responsable_actual}
                onChange={(e) => setFormData({...formData, responsable_actual: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Nombre del responsable"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Último mantenimiento
              </label>
              <input
                type="date"
                value={formData.fecha_mantenimiento}
                onChange={(e) => setFormData({...formData, fecha_mantenimiento: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Observaciones adicionales sobre la herramienta"
              rows="2"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : (tool ? 'Actualizar' : 'Crear Herramienta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hacer disponibles globalmente
window.MaterialManager = MaterialManager;
window.ToolManager = ToolManager;