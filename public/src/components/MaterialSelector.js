// src/components/MaterialSelector.js - VERSIÓN ADAPTADA A ESTRUCTURA REAL
const { useState, useEffect } = React;

const MaterialSelector = ({ user, currentWork, onMaterialRequest, workflowMode = false }) => {
    const [materiales, setMateriales] = useState([]);
    const [solicitudItems, setSolicitudItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('todas');
    const [showSolicitud, setShowSolicitud] = useState(false);
    const [solicitudes, setSolicitudes] = useState([]);

    useEffect(() => {
        loadMateriales();
        if (!workflowMode) {
            loadSolicitudes();
        }
    }, []);

    const loadMateriales = async () => {
        try {
            setLoading(true);
            if (window.db) {
                console.log('🔄 Cargando materiales...');
                
                const snapshot = await window.db.collection('materiales').get();
                
                const materialesData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    
                    // *** ADAPTAR ESTRUCTURA DE DATOS ***
                    return {
                        id: doc.id,
                        nombre: data.nombre,
                        descripcion: data.descripcion || '',
                        categoria: data.categoria,
                        unidad: data.unidad || 'unidad',
                        precio: data.precio || data.precio_estimado || 0, // ADAPTAR PRECIO
                        stock: data.stock || data.stock_minimo || 0, // ADAPTAR STOCK
                        disponible: data.disponible !== false, // true si no está definido
                        // Campos originales por si acaso
                        originalData: data
                    };
                });
                
                // Filtrar disponibles
                const materialesDisponibles = materialesData.filter(material => 
                    material.disponible && material.nombre // debe tener nombre
                );
                
                console.log('🧱 Materiales procesados:', materialesDisponibles);
                console.log('📋 Estructura primer material:', materialesDisponibles[0]);
                
                setMateriales(materialesDisponibles);
            }
        } catch (error) {
            console.error('❌ Error loading materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSolicitudes = async () => {
        try {
            if (window.db && user) {
                const snapshot = await window.db.collection('solicitudes_materiales')
                    .where('solicitanteId', '==', user.id)
                    .get();
                
                const solicitudesData = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .sort((a, b) => {
                        const dateA = a.fechaSolicitud?.toDate?.() || new Date(0);
                        const dateB = b.fechaSolicitud?.toDate?.() || new Date(0);
                        return dateB - dateA;
                    })
                    .slice(0, 10);
                
                setSolicitudes(solicitudesData);
            }
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    };

    const agregarASolicitud = (material) => {
        console.log('➕ Agregando material:', material);
        
        const existe = solicitudItems.find(item => item.id === material.id);
        
        if (existe) {
            setSolicitudItems(solicitudItems.map(item => 
                item.id === material.id 
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ));
        } else {
            setSolicitudItems([...solicitudItems, {
                ...material,
                cantidad: 1
            }]);
        }
    };

    const actualizarCantidad = (materialId, nuevaCantidad) => {
        if (nuevaCantidad <= 0) {
            setSolicitudItems(solicitudItems.filter(item => item.id !== materialId));
        } else {
            setSolicitudItems(solicitudItems.map(item => 
                item.id === materialId 
                    ? { ...item, cantidad: nuevaCantidad }
                    : item
            ));
        }
    };

    const eliminarDeSolicitud = (materialId) => {
        setSolicitudItems(solicitudItems.filter(item => item.id !== materialId));
    };

    const enviarSolicitud = async () => {
        if (solicitudItems.length === 0) {
            alert('Selecciona al menos un material');
            return;
        }

        if (!currentWork) {
            alert('No hay obra asignada');
            return;
        }

        setLoading(true);
        try {
            const solicitudData = {
                obraId: currentWork.id,
                obraNombre: currentWork.name || currentWork.nombre,
                solicitanteId: user.id,
                solicitanteNombre: user.name,
                items: solicitudItems,
                estado: 'pendiente',
                fechaSolicitud: new Date(),
                total: solicitudItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
                tipo: workflowMode ? 'workflow' : 'normal'
            };

            await window.db.collection('solicitudes_materiales').add(solicitudData);
            
            if (workflowMode && onMaterialRequest) {
                onMaterialRequest();
            }
            
            setSolicitudItems([]);
            alert('✅ Solicitud enviada exitosamente');
            
            setSearchTerm('');
            setSelectedCategory('todas');
            
            if (!workflowMode) {
                loadSolicitudes();
            }
            
        } catch (error) {
            console.error('Error enviando solicitud:', error);
            alert('❌ Error al enviar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set(materiales.map(m => m.categoria))].filter(Boolean);
    
    const filteredMateriales = materiales.filter(material => {
        const matchesSearch = material.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'todas' || material.categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'aprobado': return 'bg-green-100 text-green-800';
            case 'rechazado': return 'bg-red-100 text-red-800';
            case 'entregado': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading && materiales.length === 0) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Cargando materiales...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header especial para workflow mode */}
            {workflowMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-blue-800 font-semibold flex items-center">
                        🧱 Paso 2: Solicitar Materiales Necesarios
                    </h3>
                    <p className="text-blue-700 text-sm mt-1">
                        Selecciona los materiales que necesitas para realizar el trabajo
                    </p>
                </div>
            )}

            {/* Header normal */}
            {!workflowMode && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">🧱 Solicitar Materiales</h2>
                        <p className="text-gray-600">
                            {currentWork ? `Obra: ${currentWork.name || currentWork.nombre}` : 'No hay obra asignada'}
                        </p>
                    </div>
                    {solicitudItems.length > 0 && (
                        <button
                            onClick={() => setShowSolicitud(!showSolicitud)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            🛒 Ver Solicitud ({solicitudItems.length})
                        </button>
                    )}
                </div>
            )}

            {/* DEBUG INFO */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800">🔍 Debug Info:</h4>
                <p className="text-yellow-700 text-sm">
                    Materiales cargados: {materiales.length} | Filtrados: {filteredMateriales.length}
                </p>
                {materiales.length > 0 && (
                    <p className="text-yellow-600 text-xs">
                        Primer material: {materiales[0]?.nombre} - {materiales[0]?.categoria}
                    </p>
                )}
            </div>

            {/* Carrito de solicitud */}
            {solicitudItems.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            🛒 Materiales Seleccionados ({solicitudItems.length})
                        </h3>
                        {!workflowMode && (
                            <button
                                onClick={() => setShowSolicitud(!showSolicitud)}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                {showSolicitud ? 'Ocultar' : 'Mostrar'}
                            </button>
                        )}
                    </div>
                    
                    {(showSolicitud || workflowMode) && (
                        <div className="space-y-3">
                            {solicitudItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{item.nombre}</h4>
                                        <p className="text-sm text-gray-600">{item.categoria}</p>
                                        <p className="text-sm text-green-600">${item.precio} por {item.unidad}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                                        >
                                            -
                                        </button>
                                        <span className="w-12 text-center font-medium">{item.cantidad}</span>
                                        <button
                                            onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                                        >
                                            +
                                        </button>
                                        <span className="w-16 text-sm text-gray-600">{item.unidad}</span>
                                        <button
                                            onClick={() => eliminarDeSolicitud(item.id)}
                                            className="text-red-600 hover:text-red-800 ml-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-semibold">Total estimado:</span>
                                    <span className="text-xl font-bold text-green-600">
                                        ${solicitudItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0).toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    onClick={enviarSolicitud}
                                    disabled={loading}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Enviando...' : '📤 Enviar Solicitud'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="🔍 Buscar materiales..."
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
            </div>

            {/* Lista de materiales */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Materiales Disponibles ({filteredMateriales.length})
                    </h3>
                </div>
                
                {filteredMateriales.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">🧱</div>
                        {materiales.length === 0 ? (
                            <>
                                <p>No hay materiales disponibles</p>
                                <div className="mt-4 text-sm text-blue-600">
                                    💡 El admin debe crear materiales primero
                                </div>
                            </>
                        ) : (
                            <>
                                <p>No se encontraron materiales con los filtros aplicados</p>
                                <div className="mt-2 text-sm text-gray-400">
                                    Prueba cambiando la búsqueda o categoría
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMateriales.map((material) => (
                                <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="mb-3">
                                        <h4 className="font-medium text-gray-900 mb-1">{material.nombre}</h4>
                                        {material.descripcion && (
                                            <p className="text-sm text-gray-600 mb-2">{material.descripcion}</p>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {material.categoria}
                                            </span>
                                            <span className="text-sm font-medium text-green-600">
                                                ${material.precio}/{material.unidad}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">
                                            Stock: {material.stock} {material.unidad}
                                        </span>
                                        <button
                                            onClick={() => agregarASolicitud(material)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            + Agregar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Historial de solicitudes - Solo en modo normal */}
            {!workflowMode && solicitudes.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Mis Solicitudes Recientes</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {solicitudes.map((solicitud) => (
                            <div key={solicitud.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-medium text-gray-900">
                                            {solicitud.obraNombre}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {solicitud.fechaSolicitud?.toDate?.()?.toLocaleDateString()} - {solicitud.items?.length} items
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(solicitud.estado)}`}>
                                        {solicitud.estado}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-700">
                                    Total: <span className="font-medium text-green-600">${solicitud.total?.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

window.MaterialSelector = MaterialSelector;