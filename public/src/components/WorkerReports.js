// src/components/WorkerReports.js
const { useState, useEffect } = React;

const WorkerReports = ({ user, currentWork }) => {
    const [workItems, setWorkItems] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('todas');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Cargar items de trabajo activos
            const itemsRef = window.db.collection('workItems');
            const itemsSnapshot = await itemsRef.where('active', '==', true).get();
            
            const items = itemsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setWorkItems(items);

            // Cargar mis reportes
            const reportsRef = window.db.collection('workReports');
            const reportsSnapshot = await reportsRef
                .where('workerId', '==', user.id)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            
            const reports = reportsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setMyReports(reports);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReport = () => {
        if (!currentWork) {
            alert('Debes estar asignado a una obra para crear reportes');
            return;
        }
        setShowReportModal(true);
    };

    const handleSaveReport = async (reportData) => {
        try {
            const timestamp = new Date();
            
            const newReport = {
                ...reportData,
                workerId: user.id,
                workerName: user.name,
                workId: currentWork.id,
                workName: currentWork.name,
                createdAt: timestamp,
                status: 'enviado', // enviado, revisado, aprobado
                totalItems: reportData.items.length,
                totalQuantity: reportData.items.reduce((sum, item) => sum + item.quantity, 0)
            };
            
            const docRef = await window.db.collection('workReports').add(newReport);
            
            // Agregar a la lista local
            setMyReports([{ id: docRef.id, ...newReport }, ...myReports]);
            
            setShowReportModal(false);
            alert('✅ Reporte enviado exitosamente');
            
            // Enviar notificación al jefe (opcional)
            sendNotificationToSupervisor(newReport);
            
        } catch (error) {
            console.error('Error saving report:', error);
            alert('❌ Error al enviar el reporte');
        }
    };

    const sendNotificationToSupervisor = async (report) => {
        try {
            // Crear notificación para el jefe de obra
            await window.db.collection('notifications').add({
                type: 'work_report',
                title: 'Nuevo Reporte de Trabajo',
                message: `${report.workerName} envió un reporte con ${report.totalItems} items`,
                targetRole: 'jefe',
                workId: report.workId,
                reportId: report.id,
                createdAt: new Date(),
                read: false
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    const categories = [...new Set(workItems.map(item => item.category))];
    
    const filteredItems = workItems.filter(item => {
        const matchesCategory = selectedCategory === 'todas' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'enviado': return 'bg-yellow-100 text-yellow-800';
            case 'revisado': return 'bg-blue-100 text-blue-800';
            case 'aprobado': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Cargando datos...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">📝 Mis Reportes de Trabajo</h2>
                    <p className="text-gray-600">
                        {currentWork ? `Obra: ${currentWork.name}` : 'No asignado a ninguna obra'}
                    </p>
                </div>
                <button
                    onClick={handleCreateReport}
                    disabled={!currentWork}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        currentWork 
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    <span>📋</span>
                    Nuevo Reporte
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{myReports.length}</div>
                    <div className="text-gray-600">Reportes Enviados</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">
                        {myReports.filter(r => r.status === 'aprobado').length}
                    </div>
                    <div className="text-gray-600">Reportes Aprobados</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{workItems.length}</div>
                    <div className="text-gray-600">Items Disponibles</div>
                </div>
            </div>

            {/* Mis Reportes Recientes */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Reportes Recientes</h3>
                </div>
                
                {myReports.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No has enviado reportes aún
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {myReports.map((report) => (
                            <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-medium text-gray-900">
                                            Reporte del {report.createdAt?.toDate?.()?.toLocaleDateString()}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {report.totalItems} items • {report.totalQuantity} unidades totales
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                        {report.status}
                                    </span>
                                </div>
                                
                                {report.comment && (
                                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                        💬 {report.comment}
                                    </p>
                                )}
                                
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {report.items?.slice(0, 3).map((item, index) => (
                                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {item.name}: {item.quantity} {item.unit}
                                        </span>
                                    ))}
                                    {report.items?.length > 3 && (
                                        <span className="text-xs text-gray-500">
                                            +{report.items.length - 3} más
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Items Disponibles */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Items de Trabajo Disponibles</h3>
                </div>
                
                {/* Filtros */}
                <div className="p-6 border-b border-gray-200 space-y-4">
                    <input
                        type="text"
                        placeholder="🔍 Buscar items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todas">Todas las categorías</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                
                {/* Lista de Items */}
                <div className="p-6">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No se encontraron items
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="mb-2">
                                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                                        {item.description && (
                                            <p className="text-sm text-gray-600">{item.description}</p>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {item.category}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {item.unit}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showReportModal && (
                <WorkerReportModal
                    workItems={workItems}
                    currentWork={currentWork}
                    worker={user}
                    onSave={handleSaveReport}
                    onClose={() => setShowReportModal(false)}
                />
            )}
        </div>
    );
};

window.WorkerReports = WorkerReports;