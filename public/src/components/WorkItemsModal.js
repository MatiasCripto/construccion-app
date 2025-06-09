// src/components/WorkItemsModal.js
const { useState, useEffect } = React;

const WorkItemsModal = ({ item, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        unit: 'unidad',
        active: true
    });
    const [errors, setErrors] = useState({});

    const categories = [
        'Albañilería',
        'Electricidad', 
        'Plomería',
        'Pintura',
        'Carpintería',
        'Herrería',
        'Techos',
        'Pisos',
        'Revestimientos',
        'Limpieza',
        'Otros'
    ];

    const units = [
        'unidad',
        'metro',
        'metro²',
        'metro³',
        'kilogramo',
        'litro',
        'bolsa',
        'lata',
        'rollo',
        'pieza',
        'hora',
        'día'
    ];

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                description: item.description || '',
                category: item.category || '',
                unit: item.unit || 'unidad',
                active: item.active !== undefined ? item.active : true
            });
        }
    }, [item]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.category.trim()) {
            newErrors.category = 'La categoría es requerida';
        }

        if (!formData.unit.trim()) {
            newErrors.unit = 'La unidad es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        onSave(formData);
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
                        {item ? '✏️ Editar Item' : '➕ Nuevo Item de Trabajo'}
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
                            Nombre del Item *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Ej: Colocar ladrillos"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Descripción opcional del trabajo..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría *
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.category ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Seleccionar categoría</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                        )}
                    </div>

                    {/* Unidad de medida */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unidad de Medida *
                        </label>
                        <select
                            value={formData.unit}
                            onChange={(e) => handleChange('unit', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.unit ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            {units.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                        {errors.unit && (
                            <p className="mt-1 text-xs text-red-600">{errors.unit}</p>
                        )}
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={(e) => handleChange('active', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Item activo (visible para albañiles)
                            </span>
                        </label>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Vista previa:</h4>
                        <div className="text-sm text-gray-600">
                            <div><strong>Nombre:</strong> {formData.name || 'Sin nombre'}</div>
                            <div><strong>Categoría:</strong> {formData.category || 'Sin categoría'}</div>
                            <div><strong>Unidad:</strong> {formData.unit}</div>
                            <div><strong>Estado:</strong> {formData.active ? '✅ Activo' : '❌ Inactivo'}</div>
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
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            {item ? 'Actualizar' : 'Crear'} Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

window.WorkItemsModal = WorkItemsModal;