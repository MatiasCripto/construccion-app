// src/components/MaterialModal.js - Modal simplificado para materiales
const { useState, useEffect } = React;

const MaterialModal = ({ material, onClose, onSave, categorias }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [materialesExistentes, setMaterialesExistentes] = useState([]);

  // Cargar materiales existentes para validación
  useEffect(() => {
    const cargarMateriales = async () => {
      try {
        const snapshot = await window.db.collection('materiales').get();
        const materiales = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMaterialesExistentes(materiales);
        
        // Si es edición, cargar datos del material
        if (material) {
          setFormData({
            codigo: material.codigo || '',
            nombre: material.nombre || '',
            descripcion: material.descripcion || '',
            categoria: material.categoria || ''
          });
        } else {
          // Si es nuevo, generar código automático
          generarCodigoAutomatico(materiales);
        }
      } catch (error) {
        console.error('Error cargando materiales:', error);
      }
    };

    cargarMateriales();
  }, [material]);

  // Generar código automático incremental
  const generarCodigoAutomatico = (materiales) => {
    // Obtener todos los códigos numéricos existentes
    const codigosExistentes = materiales
      .map(m => m.codigo)
      .filter(codigo => codigo && /^MAT\d+$/.test(codigo))
      .map(codigo => parseInt(codigo.replace('MAT', '')))
      .filter(num => !isNaN(num));

    // Encontrar el siguiente número disponible
    const siguienteNumero = codigosExistentes.length > 0 
      ? Math.max(...codigosExistentes) + 1 
      : 1;

    const nuevoCodigo = `MAT${siguienteNumero.toString().padStart(3, '0')}`;
    
    setFormData(prev => ({
      ...prev,
      codigo: nuevoCodigo
    }));
  };

  // Validar si el material ya existe
  const validarMaterialDuplicado = (nombre) => {
    if (!nombre.trim()) return false;
    
    const nombreLimpio = nombre.trim().toLowerCase();
    const existe = materialesExistentes.some(m => 
      m.nombre.toLowerCase() === nombreLimpio && 
      (!material || m.id !== material.id)
    );
    
    return existe;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validar duplicados en tiempo real para el nombre
    if (name === 'nombre') {
      if (validarMaterialDuplicado(value)) {
        setError('⚠️ Ya existe un material con este nombre');
      } else {
        setError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre del material es obligatorio');
      return;
    }

    if (validarMaterialDuplicado(formData.nombre)) {
      setError('Ya existe un material con este nombre');
      return;
    }

    if (!formData.categoria) {
      setError('La categoría es obligatoria');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const datosParaGuardar = {
        codigo: formData.codigo,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        categoria: formData.categoria,
        disponible: true,
        fechaActualizacion: new Date()
      };

      if (material) {
        // Actualizar material existente
        await window.db.collection('materiales').doc(material.id).update(datosParaGuardar);
      } else {
        // Crear nuevo material
        datosParaGuardar.fechaCreacion = new Date();
        await window.db.collection('materiales').add(datosParaGuardar);
      }

      onSave();
    } catch (error) {
      console.error('Error guardando material:', error);
      setError('Error al guardar el material. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {material ? '✏️ Editar Material' : '➕ Agregar Material'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Código automático (solo lectura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🏷️ Código (Automático)
            </label>
            <input
              type="text"
              value={formData.codigo}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 focus:outline-none"
              placeholder="Se genera automáticamente..."
            />
            <p className="text-xs text-gray-500 mt-1">
              El código se genera automáticamente y es único
            </p>
          </div>

          {/* Nombre del material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📦 Nombre del Material *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Cemento Portland, Ladrillo común, etc."
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📝 Descripción (opcional)
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción adicional del material..."
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📂 Categoría *
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar categoría...</option>
              
              {/* Categorías predefinidas de construcción */}
              <option value="⚡ Electricidad">⚡ Electricidad</option>
              <option value="🔧 Plomería">🔧 Plomería</option>
              <option value="🧱 Albañilería">🧱 Albañilería</option>
              <option value="🔩 Herrería">🔩 Herrería</option>
              <option value="🎨 Pintura y Acabados">🎨 Pintura y Acabados</option>
              <option value="🪵 Carpintería">🪵 Carpintería</option>
              <option value="🏠 Techado">🏠 Techado</option>
              <option value="💧 Impermeabilización">💧 Impermeabilización</option>
              <option value="🏛️ Pisos y Revestimientos">🏛️ Pisos y Revestimientos</option>
              <option value="🪟 Vidriería">🪟 Vidriería</option>
              <option value="🔑 Cerrajería">🔑 Cerrajería</option>
              <option value="🌡️ Aislación Térmica">🌡️ Aislación Térmica</option>
              <option value="🔥 Instalaciones de Gas">🔥 Instalaciones de Gas</option>
              <option value="❄️ Climatización">❄️ Climatización</option>
              <option value="🏗️ Estructuras">🏗️ Estructuras</option>
              <option value="🕳️ Cimentación">🕳️ Cimentación</option>
              <option value="⚠️ Seguridad e Higiene">⚠️ Seguridad e Higiene</option>
              <option value="🔨 Herramientas y Equipos">🔨 Herramientas y Equipos</option>
              <option value="🧹 Limpieza y Mantenimiento">🧹 Limpieza y Mantenimiento</option>
              <option value="📦 General">📦 General</option>
              
              {/* Categorías personalizadas del usuario (si existen) */}
              {categorias && categorias.length > 0 && (
                <>
                  <option disabled>─────────────────</option>
                  <option disabled>Categorías Personalizadas:</option>
                  {categorias
                    .filter(cat => !cat.includes('⚡') && !cat.includes('🔧') && !cat.includes('🧱') && !cat.includes('🔩'))
                    .map(categoria => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </>
              )}
            </select>
            
            <p className="text-xs text-gray-500 mt-1">
              💡 Selecciona la categoría que mejor describa el material
            </p>
          </div>

          {/* Vista previa */}
          {formData.nombre && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                👁️ Vista Previa:
              </h4>
              <div className="text-sm text-blue-700">
                <p><strong>Código:</strong> {formData.codigo}</p>
                <p><strong>Material:</strong> {formData.nombre}</p>
                {formData.descripcion && (
                  <p><strong>Descripción:</strong> {formData.descripcion}</p>
                )}
                <p><strong>Categoría:</strong> {formData.categoria || 'Sin categoría'}</p>
              </div>
            </div>
          )}

          {/* Información de materiales existentes */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              📊 Estadísticas:
            </h4>
            <p className="text-xs text-gray-600">
              Total de materiales: {materialesExistentes.length}
            </p>
            <p className="text-xs text-gray-600">
              Próximo código: {formData.codigo}
            </p>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!error}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ Guardando...' : (material ? 'Actualizar' : 'Crear Material')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.MaterialModal = MaterialModal;