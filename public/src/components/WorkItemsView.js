// src/components/WorkItemsView.js
const { useState, useEffect } = React;

const WorkItemsView = ({ user }) => {
    const [workItems, setWorkItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('todas');

    useEffect(() => {
        loadWorkItems();
    }, []);

    const loadWorkItems = async () => {
        try {
            setLoading(true);
            
            // Cargar items activos desde Firebase
            const itemsRef = window.db.collection('workItems');
            const snapshot = await itemsRef
                .where('active', '==', true)
                .orderBy('category')
                .orderBy('name')
                .get();
            
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setWorkItems(items);
        } catch (error) {
            console.error('Error loading work items:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set(workItems.map(item => item.category))];
    
    const filteredItems = workItems.filter(item => {
        const matchesCategory = selectedCategory === 'todas' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const groupedItems = filteredItems.reduce((groups, item) => {
        const category = item.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
        return groups;
    }, {});

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Cargando items...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">📋 Items de Trabajo Disponibles</h2>
                    <p className="text-gray-600">Items que los albañiles pueden reportar</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>👁️</span>
                    <span>Solo lectura</span>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="🔍 Buscar items..."
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{workItems.length}</div>
                    <div className="text-gray-600">Total Items</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{filteredItems.length}</div>
                    <div className="text-gray-600">Items Filtrados</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
                    <div className="text-gray-600">Categorías</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-orange-600">
                        {Object.keys(groupedItems).length}
                    </div>
                    <div className="text-gray-600">Categorías Activas</div>
                </div>
            </div>

            {/* Items by Category */}
            <div className="space-y-6">
                {Object.keys(groupedItems).length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                        {searchTerm || selectedCategory !== 'todas' 
                            ? 'No se encontraron items con los filtros aplicados'
                            : 'No hay items de trabajo disponibles'
                        }
                    </div>
                ) : (
                    Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category} className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                    {category}
                                    <span className="ml-auto text-sm font-normal text-gray-600">
                                        {items.length} items
                                    </span>
                                </h3>
                            </div>
                            
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="mb-3">
                                                <h4 className="font-medium text-gray-900 mb-1">
                                                    {item.name}
                                                </h4>
                                                {item.description && (
                                                    <p className="text-sm text-gray-600">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {item.unit}
                                                </span>
                                                <div className="text-xs text-gray-500">
                                                    {item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                                </div>
                                            </div>
                                            
                                            {item.createdBy && (
                                                <div className="mt-2 text-xs text-gray-500">
                                                    Creado por: {item.createdBy}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3">💡 Información</h4>
                <div className="text-sm text-blue-800 space-y-2">
                    <p>• Los albañiles pueden ver estos items al crear sus reportes de trabajo</p>
                    <p>• Solo los administradores pueden crear, editar o eliminar items</p>
                    <p>• Los items inactivos no aparecen en esta vista</p>
                    <p>• Puedes sugerir nuevos items contactando al administrador</p>
                </div>
            </div>

            {/* Contact Admin */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-gray-900">¿Necesitas un nuevo item?</h4>
                        <p className="text-sm text-gray-600">
                            Solicita al administrador agregar nuevos items de trabajo
                        </p>
                    </div>
                    <button
                        onClick={() => alert('Funcionalidad de contacto será implementada')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        📧 Contactar Admin
                    </button>
                </div>
            </div>
        </div>
    );
};

window.WorkItemsView = WorkItemsView;