// src/components/MaterialSelector.js - VERSIÓN FINAL CORREGIDA
const { useState, useEffect } = React;

const MaterialSelector = ({ user, currentWork, onMaterialRequest, workflowMode = false }) => {
    const [materiales, setMateriales] = useState([]);
    const [solicitudItems, setSolicitudItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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
                console.log('🔄 Cargando materiales para solicitud...');
                
                const snapshot = await window.db.collection('materiales').get();
                
                const materialesData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    
                    return {
                        id: doc.id,
                        nombre: data.nombre,
                        descripcion: data.descripcion || '',
                        disponible: data.disponible !== false,
                        originalData: data
                    };
                });
                
                // Filtrar disponibles
                const materialesDisponibles = materialesData.filter(material => 
                    material.disponible && material.nombre
                );
                
                console.log('🧱 Materiales disponibles para solicitar:', materialesDisponibles.length);
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
            if (window.db && user && user.id) {
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
        console.log('➕ Agregando material a solicitud:', material.nombre);
        
        const existe = solicitudItems.find(item => item.id === material.id);
        
        if (existe) {
            setSolicitudItems(solicitudItems.map(item => 
                item.id === material.id 
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ));
        } else {
            setSolicitudItems([...solicitudItems, {
                id: material.id,
                nombre: material.nombre,
                descripcion: material.descripcion,
                cantidad: 1,
                unidad: '' // *** UNIDAD OPCIONAL DEL ALBAÑIL ***
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

    // *** NUEVA: Actualizar unidad ***
    const actualizarUnidad = (materialId, nuevaUnidad) => {
        setSolicitudItems(solicitudItems.map(item => 
            item.id === materialId 
                ? { ...item, unidad: nuevaUnidad.trim() }
                : item
        ));
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

        // *** VERIFICAR DATOS DEL USUARIO ***
        if (!user || !user.id) {
            alert('Error: Datos de usuario no válidos');
            return;
        }

        setLoading(true);
        try {
            const solicitudData = {
                obraId: currentWork.id,
                obraNombre: currentWork.name || currentWork.nombre || 'Obra sin nombre',
                solicitanteId: user.id,
                solicitanteNombre: user.name || user.nombre || user.email || 'Usuario sin nombre', // *** FALLBACK ***
                items: solicitudItems,
                estado: 'pendiente',
                fechaSolicitud: new Date(),
                tipo: workflowMode ? 'workflow' : 'normal'
            };

            console.log('📤 Enviando solicitud:', solicitudData);

            await window.db.collection('solicitudes_materiales').add(solicitudData);
            
            if (workflowMode && onMaterialRequest) {
                onMaterialRequest();
            }
            
            setSolicitudItems([]);
            alert('✅ Solicitud de materiales enviada exitosamente');
            
            setSearchTerm('');
            
            if (!workflowMode) {
                loadSolicitudes();
            }
            
        } catch (error) {
            console.error('❌ Error enviando solicitud:', error);
            alert('❌ Error al enviar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    const filteredMateriales = materiales.filter(material => {
        const matchesSearch = material.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
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
                        Solicita los materiales que necesitas para empezar el trabajo
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
                            onClick={() => console.log('Ver solicitud')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            🛒 Solicitud ({solicitudItems.length})
                        </button>
                    )}
                </div>
            )}

            {/* DEBUG INFO */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800">🔍 Info:</h4>
                <p className="text-yellow-700 text-sm">
                    Materiales disponibles: {materiales.length} | En solicitud: {solicitudItems.length}
                </p>
            </div>

            {/* Carrito de solicitud */}
            {solicitudItems.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            🛒 Materiales para Solicitar ({solicitudItems.length})
                        </h3>
                    </div>
                    
                    <div className="space-y-3">
                        {solicitudItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                <div className="flex-1 mr-4">
                                    <h4 className="font-medium text-gray-900">{item.nombre}</h4>
                                    {item.descripcion && (
                                        <p className="text-sm text-gray-600">{item.descripcion}</p>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    {/* Cantidad */}
                                    <div className="flex items-center space-x-2">
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
                                    </div>
                                    
                                    {/* *** UNIDAD OPCIONAL *** */}
                                    <input
                                        type="text"
                                        value={item.unidad}
                                        onChange={(e) => actualizarUnidad(item.id, e.target.value)}
                                        placeholder="unidad"
                                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                    
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
                            <button
                                onClick={enviarSolicitud}
                                disabled={loading}
                                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                            >
                                {loading ? 'Enviando...' : '📤 Enviar Solicitud de Materiales'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <input
                    type="text"
                    placeholder="🔍 Buscar materiales..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                                <p>No se encontraron materiales con la búsqueda</p>
                                <div className="mt-2 text-sm text-gray-400">
                                    Prueba con otros términos
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
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">
                                            Disponible para solicitar
                                        </span>
                                        <button
                                            onClick={() => agregarASolicitud(material)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            + Solicitar
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
                                            {solicitud.fechaSolicitud?.toDate?.()?.toLocaleDateString()} - {solicitud.items?.length} materiales
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(solicitud.estado)}`}>
                                        {solicitud.estado}
                                    </span>
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