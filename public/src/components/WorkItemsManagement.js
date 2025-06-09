// src/components/WorkItemsManagement.js
const { useState, useEffect } = React;

const WorkItemsManagement = ({ user }) => {
    const [workItems, setWorkItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadWorkItems();
    }, []);

    const loadWorkItems = async () => {
        try {
            setLoading(true);
            // Cargar desde Firebase
            const itemsRef = window.db.collection('workItems');
            const snapshot = await itemsRef.orderBy('createdAt', 'desc').get();
            
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

    const handleAddItem = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleDeleteItem = async (itemId) => {
        if (!confirm('¿Estás seguro de eliminar este item?')) return;
        
        try {
            await window.db.collection('workItems').doc(itemId).delete();
            setWorkItems(workItems.filter(item => item.id !== itemId));
            
            // Mostrar notificación
            alert('Item eliminado exitosamente');
        } catch (error) {
            console.error('Error deleting work item:', error);
            alert('Error al eliminar el item');
        }
    };

    const handleSaveItem = async (itemData) => {
        try {
            const timestamp = new Date();
            
            if (editingItem) {
                // Actualizar item existente
                await window.db.collection('workItems').doc(editingItem.id).update({
                    ...itemData,
                    updatedAt: timestamp,
                    updatedBy: user.name
                });
                
                setWorkItems(workItems.map(item => 
                    item.id === editingItem.id 
                        ? { ...item, ...itemData, updatedAt: timestamp }
                        : item
                ));
            } else {
                // Crear nuevo item
                const newItem = {
                    ...itemData,
                    createdAt: timestamp,
                    createdBy: user.name,
                    active: true
                };
                
                const docRef = await window.db.collection('workItems').add(newItem);
                setWorkItems([{ id: docRef.id, ...newItem }, ...workItems]);
            }
            
            setShowModal(false);
            alert(editingItem ? 'Item actualizado' : 'Item creado exitosamente');
        } catch (error) {
            console.error('Error saving work item:', error);
            alert('Error al guardar el item');
        }
    };

    const toggleItemStatus = async (itemId, currentStatus) => {
        try {
            await window.db.collection('workItems').doc(itemId).update({
                active: !currentStatus,
                updatedAt: new Date(),
                updatedBy: user.name
            });
            
            setWorkItems(workItems.map(item => 
                item.id === itemId 
                    ? { ...item, active: !currentStatus }
                    : item
            ));
        } catch (error) {
            console.error('Error updating item status:', error);
        }
    };

    const filteredItems = workItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h2 className="text-2xl font-bold text-gray-800">📋 Items de Trabajo</h2>
                    <p className="text-gray-600">Gestiona los items que los albañiles pueden reportar</p>
                </div>
                <button
                    onClick={handleAddItem}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <span>➕</span>
                    Nuevo Item
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <input
                    type="text"
                    placeholder="🔍 Buscar items por nombre o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{workItems.length}</div>
                    <div className="text-gray-600">Total Items</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">
                        {workItems.filter(item => item.active).length}
                    </div>
                    <div className="text-gray-600">Items Activos</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-red-600">
                        {workItems.filter(item => !item.active).length}
                    </div>
                    <div className="text-gray-600">Items Inactivos</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">
                        {[...new Set(workItems.map(item => item.category))].length}
                    </div>
                    <div className="text-gray-600">Categorías</div>
                </div>
            </div>

            {/* Items List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Items de Trabajo ({filteredItems.length})
                    </h3>
                </div>

                {filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'No se encontraron items' : 'No hay items creados'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Item
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Categoría
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Unidad
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Creado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.name}
                                                </div>
                                                {item.description && (
                                                    <div className="text-sm text-gray-500">
                                                        {item.description}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {item.unit}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleItemStatus(item.id, item.active)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    item.active
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                } transition-colors`}
                                            >
                                                {item.active ? '✅ Activo' : '❌ Inactivo'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEditItem(item)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <WorkItemsModal
                    item={editingItem}
                    onSave={handleSaveItem}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

window.WorkItemsManagement = WorkItemsManagement;