// src/components/MaterialModal.js - Modal para crear/editar materiales
const { useState } = React;

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

  const isEditing = !!material;

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

      if (isEditing) {
        await window.db.collection('materiales').doc(material.id).update(materialData);
        showNotification('✅ Material actualizado exitosamente');
      } else {
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
          {isEditing ? '✏️ Editar Material' : '➕ Agregar Material'}
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
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Material')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.MaterialModal = MaterialModal;