// src/components/ToolModal.js - Modal para crear/editar herramientas
const { useState } = React;

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

  const isEditing = !!tool;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const toolData = {
        ...formData,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (isEditing) {
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
          {isEditing ? '✏️ Editar Herramienta' : '➕ Agregar Herramienta'}
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
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Herramienta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.ToolModal = ToolModal;