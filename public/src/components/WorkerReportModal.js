// src/components/WorkerReportModal.js - CORREGIDO para cantidades de trabajo
const { useState, useEffect } = React;

const WorkerReportModal = ({ workItems, currentWork, worker, onSave, onClose }) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('todas');
    const [comment, setComment] = useState('');
    const [photos, setPhotos] = useState([]);
    const [step, setStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState({});

    const categories = [...new Set(workItems.map(item => item.category))];
    
    const filteredItems = workItems.filter(item => {
        const matchesCategory = selectedCategory === 'todas' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleItemToggle = (item) => {
        const isSelected = selectedItems.find(selected => selected.id === item.id);
        
        if (isSelected) {
            setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, {
                id: item.id,
                name: item.name,
                category: item.category,
                unit: item.unit, // Unidad predefinida del item
                quantity: '', // Cantidad vacía para forzar input
                customUnit: item.unit // Unidad editable (opcional)
            }]);
        }
        
        setValidationErrors({});
    };

    const handleQuantityChange = (itemId, quantity) => {
        const numQuantity = quantity === '' ? '' : parseFloat(quantity) || '';
        setSelectedItems(selectedItems.map(item => 
            item.id === itemId 
                ? { ...item, quantity: numQuantity }
                : item
        ));
        
        if (validationErrors[itemId]) {
            setValidationErrors(prev => ({
                ...prev,
                [itemId]: ''
            }));
        }
    };

    // *** NUEVA: Cambiar unidad (opcional) ***
    const handleUnitChange = (itemId, newUnit) => {
        setSelectedItems(selectedItems.map(item => 
            item.id === itemId 
                ? { ...item, customUnit: newUnit.trim() || item.unit }
                : item
        ));
    };

    const validateQuantities = () => {
        const errors = {};
        let hasErrors = false;
        
        selectedItems.forEach(item => {
            if (item.quantity === '' || item.quantity <= 0) {
                errors[item.id] = 'Debes especificar cuánto trabajo realizaste';
                hasErrors = true;
            }
        });
        
        setValidationErrors(errors);
        return !hasErrors;
    };

    const handlePhotoCapture = async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setPhotos([...photos, {
                            id: Date.now(),
                            url: e.target.result,
                            file: file,
                            timestamp: new Date()
                        }]);
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            input.click();
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('No se pudo acceder a la cámara');
        }
    };

    const handleNextStep = () => {
        if (step === 1 && selectedItems.length === 0) {
            alert('Debes seleccionar al menos un item de trabajo');
            return;
        }
        
        if (step === 2 && !validateQuantities()) {
            alert('Todas las cantidades son obligatorias');
            return;
        }
        
        setStep(step + 1);
    };

    const handleSubmit = () => {
        if (!validateQuantities()) {
            alert('Verifica que todas las cantidades sean válidas');
            return;
        }

        // Preparar datos con unidades finales
        const itemsWithFinalUnits = selectedItems.map(item => ({
            ...item,
            unit: item.customUnit || item.unit // Usar unidad custom o la original
        }));

        const reportData = {
            items: itemsWithFinalUnits,
            comment: comment.trim(),
            photos: photos,
            location: null
        };

        onSave(reportData);
    };

    const getTotalItems = () => selectedItems.length;
    const getTotalQuantity = () => selectedItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            📋 Nuevo Reporte de Trabajo
                        </h3>
                        <p className="text-sm text-gray-600">
                            Obra: {currentWork.name} • Paso {step} de 3
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        {[1, 2, 3].map((stepNum) => (
                            <div key={stepNum} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    stepNum <= step 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {stepNum}
                                </div>
                                {stepNum < 3 && (
                                    <div className={`w-12 h-1 mx-2 ${
                                        stepNum < step ? 'bg-blue-500' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        {step === 1 && 'Selecciona los trabajos que realizaste'}
                        {step === 2 && 'Especifica cuánto trabajo hiciste de cada item'}
                        {step === 3 && 'Revisa y confirma tu reporte'}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            {/* Filtros */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar trabajos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="todas">Todas las categorías</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Items Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                {filteredItems.map((item) => {
                                    const isSelected = selectedItems.find(selected => selected.id === item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleItemToggle(item)}
                                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                                }`}>
                                                    {isSelected && <span className="text-white text-xs">✓</span>}
                                                </div>
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                            )}
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                                    {item.category}
                                                </span>
                                                <span className="text-gray-500">se mide en {item.unit}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Selected Count */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-blue-800">
                                    📋 Trabajos seleccionados: {selectedItems.length}
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <h4 className="font-semibold text-yellow-800 mb-1">⚠️ Cantidades Obligatorias</h4>
                                <p className="text-yellow-700 text-sm">
                                    Especifica cuánto trabajo realizaste de cada item. Las cantidades son obligatorias.
                                </p>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-4">
                                {selectedItems.map((item) => (
                                    <div key={item.id} className={`border rounded-lg p-4 ${
                                        validationErrors[item.id] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                                <p className="text-sm text-gray-600">{item.category}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* *** CANTIDAD (OBLIGATORIA) *** */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    ¿Cuánto trabajaste? *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                    placeholder="Ej: 15.5"
                                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        validationErrors[item.id] ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                                {validationErrors[item.id] && (
                                                    <p className="mt-1 text-xs text-red-600">{validationErrors[item.id]}</p>
                                                )}
                                            </div>

                                            {/* *** UNIDAD (OPCIONAL) *** */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unidad 
                                                    <span className="text-gray-400 text-xs ml-1">(opcional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.customUnit}
                                                    onChange={(e) => handleUnitChange(item.id, e.target.value)}
                                                    placeholder={item.unit}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Por defecto: {item.unit}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Preview */}
                                        {item.quantity && (
                                            <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                                                <p className="text-green-800 text-sm">
                                                    ✅ {item.quantity} {item.customUnit || item.unit} de "{item.name}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Comentarios adicionales (opcional)
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Describe detalles adicionales del trabajo realizado..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Photos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fotos del trabajo (opcional)
                                </label>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        type="button"
                                        onClick={handlePhotoCapture}
                                        className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors"
                                    >
                                        <span className="text-2xl">📷</span>
                                    </button>
                                    {photos.map((photo) => (
                                        <div key={photo.id} className="relative">
                                            <img
                                                src={photo.url}
                                                alt="Foto del trabajo"
                                                className="w-24 h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-4">Resumen del Reporte</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <span className="text-sm text-gray-600">Obra:</span>
                                        <p className="font-medium">{currentWork.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Trabajador:</span>
                                        <p className="font-medium">{worker.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Trabajos reportados:</span>
                                        <p className="font-medium">{getTotalItems()}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Cantidad total:</span>
                                        <p className="font-medium">{getTotalQuantity().toFixed(1)} unidades</p>
                                    </div>
                                </div>
                                
                                {comment && (
                                    <div className="mb-4">
                                        <span className="text-sm text-gray-600">Comentarios:</span>
                                        <p className="text-gray-900 bg-white p-2 rounded border">{comment}</p>
                                    </div>
                                )}
                                
                                {photos.length > 0 && (
                                    <div>
                                        <span className="text-sm text-gray-600">Fotos adjuntas:</span>
                                        <p className="font-medium">{photos.length} foto(s)</p>
                                    </div>
                                )}
                            </div>

                            {/* Items Detail */}
                            <div>
                                <h5 className="font-medium text-gray-900 mb-3">Trabajos Reportados:</h5>
                                <div className="space-y-2">
                                    {selectedItems.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center py-2 px-4 bg-white border border-gray-200 rounded">
                                            <div>
                                                <span className="font-medium">{item.name}</span>
                                                <span className="text-sm text-gray-600 ml-2">({item.category})</span>
                                            </div>
                                            <span className="font-medium text-blue-600">
                                                {item.quantity} {item.customUnit || item.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        {step === 1 && `${selectedItems.length} trabajos seleccionados`}
                        {step === 2 && `${getTotalItems()} trabajos • ${getTotalQuantity().toFixed(1)} unidades totales`}
                        {step === 3 && 'Listo para enviar'}
                    </div>
                    
                    <div className="flex gap-3">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                ← Anterior
                            </button>
                        )}
                        
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        
                        {step < 3 ? (
                            <button
                                onClick={handleNextStep}
                                disabled={step === 1 && selectedItems.length === 0}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    (step === 1 && selectedItems.length === 0)
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                                Siguiente →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                            >
                                📤 Enviar Reporte
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.WorkerReportModal = WorkerReportModal;