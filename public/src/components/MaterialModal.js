// src/components/MaterialModal.js - ULTRA SIMPLIFICADO
const { useState, useEffect } = React;

const MaterialModal = ({ material, onSave, onClose, empresaData }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        disponible: true
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (material) {
            setFormData({
                nombre: material.nombre || '',
                descripcion: material.descripcion || '',
                disponible: material.disponible !== undefined ? material.disponible : true
            });
        }
    }, [material]);

    const validateForm = () => {
        const newErrors = {};

        // Solo validar nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        
        try {
            const materialData = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                disponible: formData.disponible,
                fechaActualizacion: new Date(),
                empresa: empresaData?.nombre || 'VIVEKA'
            };

            // Agregar campos de creación si es nuevo
            if (!material) {
                materialData.fechaCreacion = new Date();
                materialData.creadoPor = 'Admin VIVEKA';
            }

            await onSave(materialData);
            onClose();
        } catch (error) {
            console.error('Error saving material:', error);
            alert('Error al guardar el material');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Limpiar error del campo
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {material ? '✏️ Editar Material' : '➕ Nuevo Material'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Material *
                        </label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => handleChange('nombre', e.target.value)}
                            placeholder="Ej: Cemento, Ladrillos, Caños..."
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.nombre ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.nombre && (
                            <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción (opcional)
                        </label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) => handleChange('descripcion', e.target.value)}
                            placeholder="Descripción del material..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Disponible */}
                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={formData.disponible}
                                onChange={(e) => handleChange('disponible', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Material disponible para solicitudes
                            </span>
                        </label>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Vista previa:</h4>
                        <div className="text-sm text-gray-600">
                            <div><strong>Nombre:</strong> {formData.nombre || 'Sin nombre'}</div>
                            <div><strong>Estado:</strong> {formData.disponible ? '✅ Disponible' : '❌ No disponible'}</div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {loading 
                                ? 'Guardando...' 
                                : material 
                                    ? 'Actualizar' 
                                    : 'Crear Material'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

window.MaterialModal = MaterialModal;