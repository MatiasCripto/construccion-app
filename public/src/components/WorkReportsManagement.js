// src/components/WorkReportsManagement.js
const { useState, useEffect } = React;

const WorkReportsManagement = ({ user }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'todos',
        workId: 'todas',
        workerId: 'todos',
        dateFrom: '',
        dateTo: ''
    });
    const [works, setWorks] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Cargar reportes
            const reportsRef = window.db.collection('workReports');
            let query = reportsRef.orderBy('createdAt', 'desc');
            
            // Si es jefe, solo ver reportes de sus obras
            if (user.role === 'jefe') {
                query = query.where('workId', 'in', user.assignedWorks || []);
            }
            
            const reportsSnapshot = await query.limit(100).get();
            const reportsData = reportsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setReports(reportsData);

            // Cargar obras
            const worksRef = window.db.collection('works');
            const worksSnapshot = await worksRef.get();
            const worksData = worksSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWorks(worksData);

            // Cargar trabajadores
            const usersRef = window.db.collection('users');
            const usersSnapshot = await usersRef.where('role', '==', 'albañil').get();
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWorkers(usersData);

        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (reportId, newStatus) => {
        try {
            await window.db.collection('workReports').doc(reportId).update({
                status: newStatus,
                reviewedAt: new Date(),
                reviewedBy: user.name
            });
            
            setReports(reports.map(report => 
                report.id === reportId 
                    ? { ...report, status: newStatus, reviewedBy: user.name }
                    : report
            ));
            
            // Crear notificación para el trabajador
            const report = reports.find(r => r.id === reportId);
            if (report) {
                await window.db.collection('notifications').add({
                    type: 'report_status',
                    title: 'Estado de Reporte Actualizado',
                    message: `Tu reporte del ${report.createdAt?.toDate?.()?.toLocaleDateString()} está ${newStatus}`,
                    targetUserId: report.workerId,
                    reportId: reportId,
                    createdAt: new Date(),
                    read: false
                });
            }
            
            alert(`✅ Reporte marcado como ${newStatus}`);
        } catch (error) {
            console.error('Error updating report status:', error);
            alert('❌ Error al actualizar el estado');
        }
    };

    const handleViewDetails = (report) => {
        setSelectedReport(report);
        setShowDetailModal(true);
    };

    const exportToPDF = async (report) => {
        try {
            // Aquí implementarías la generación de PDF
            // Por ahora, mostrar un alert
            alert('Funcionalidad de exportar PDF será implementada');
        } catch (error) {
            console.error('Error exporting PDF:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'enviado': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'revisado': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'aprobado': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'enviado': return '📤';
            case 'revisado': return '👁️';
            case 'aprobado': return '✅';
            default: return '📄';
        }
    };

    // Filtrar reportes
    const filteredReports = reports.filter(report => {
        const matchesStatus = filters.status === 'todos' || report.status === filters.status;
        const matchesWork = filters.workId === 'todas' || report.workId === filters.workId;
        const matchesWorker = filters.workerId === 'todos' || report.workerId === filters.workerId;
        
        let matchesDate = true;
        if (filters.dateFrom || filters.dateTo) {
            const reportDate = report.createdAt?.toDate?.() || new Date();
            if (filters.dateFrom) {
                matchesDate = matchesDate && reportDate >= new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                matchesDate = matchesDate && reportDate <= new Date(filters.dateTo + 'T23:59:59');
            }
        }
        
        return matchesStatus && matchesWork && matchesWorker && matchesDate;
    });

    // Estadísticas
    const stats = {
        total: filteredReports.length,
        enviados: filteredReports.filter(r => r.status === 'enviado').length,
        revisados: filteredReports.filter(r => r.status === 'revisado').length,
        aprobados: filteredReports.filter(r => r.status === 'aprobado').length,
        totalItems: filteredReports.reduce((sum, r) => sum + (r.totalItems || 0), 0),
        totalQuantity: filteredReports.reduce((sum, r) => sum + (r.totalQuantity || 0), 0)
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Cargando reportes...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">📊 Gestión de Reportes</h2>
                    <p className="text-gray-600">
                        {user.role === 'admin' ? 'Todos los reportes' : 'Reportes de mis obras'}
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    🔄 Actualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-gray-600 text-sm">Total Reportes</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-yellow-600">{stats.enviados}</div>
                    <div className="text-gray-600 text-sm">Enviados</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{stats.revisados}</div>
                    <div className="text-gray-600 text-sm">Revisados</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{stats.aprobados}</div>
                    <div className="text-gray-600 text-sm">Aprobados</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalItems}</div>
                    <div className="text-gray-600 text-sm">Items Totales</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-indigo-600">{stats.totalQuantity.toFixed(1)}</div>
                    <div className="text-gray-600 text-sm">Cantidad Total</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="enviado">Enviados</option>
                        <option value="revisado">Revisados</option>
                        <option value="aprobado">Aprobados</option>
                    </select>
                    
                    <select
                        value={filters.workId}
                        onChange={(e) => setFilters({...filters, workId: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todas">Todas las obras</option>
                        {works.map(work => (
                            <option key={work.id} value={work.id}>{work.name}</option>
                        ))}
                    </select>
                    
                    <select
                        value={filters.workerId}
                        onChange={(e) => setFilters({...filters, workerId: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todos">Todos los trabajadores</option>
                        {workers.map(worker => (
                            <option key={worker.id} value={worker.id}>{worker.name}</option>
                        ))}
                    </select>
                    
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Desde"
                    />
                    
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Hasta"
                    />
                </div>
                
                {(filters.status !== 'todos' || filters.workId !== 'todas' || filters.workerId !== 'todos' || filters.dateFrom || filters.dateTo) && (
                    <button
                        onClick={() => setFilters({status: 'todos', workId: 'todas', workerId: 'todos', dateFrom: '', dateTo: ''})}
                        className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
                    >
                        🗑️ Limpiar filtros
                    </button>
                )}
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Reportes ({filteredReports.length})
                    </h3>
                </div>
                
                {filteredReports.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No se encontraron reportes con los filtros aplicados
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trabajador
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Obra
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {report.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                            <div className="text-xs text-gray-500">
                                                {report.createdAt?.toDate?.()?.toLocaleTimeString() || ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {report.workerName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{report.workName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {report.totalItems} items
                                            <div className="text-xs text-gray-500">
                                                {report.totalQuantity?.toFixed(1)} unidades
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={report.status}
                                                onChange={(e) => handleStatusChange(report.id, e.target.value)}
                                                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getStatusColor(report.status)}`}
                                            >
                                                <option value="enviado">📤 Enviado</option>
                                                <option value="revisado">👁️ Revisado</option>
                                                <option value="aprobado">✅ Aprobado</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleViewDetails(report)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                                title="Ver detalles"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                onClick={() => exportToPDF(report)}
                                                className="text-green-600 hover:text-green-900 transition-colors"
                                                title="Exportar PDF"
                                            >
                                                📄
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    onClose={() => setShowDetailModal(false)}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    );
};

// Modal para ver detalles del reporte
const ReportDetailModal = ({ report, onClose, onStatusChange }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        📋 Detalle del Reporte
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Info general */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Información General</h4>
                            <div className="space-y-2 text-sm">
                                <div><strong>Trabajador:</strong> {report.workerName}</div>
                                <div><strong>Obra:</strong> {report.workName}</div>
                                <div><strong>Fecha:</strong> {report.createdAt?.toDate?.()?.toLocaleString()}</div>
                                <div><strong>Estado:</strong> 
                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(report.status)}`}>
                                        {report.status}
                                    </span>
                                </div>
                                {report.reviewedBy && (
                                    <div><strong>Revisado por:</strong> {report.reviewedBy}</div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Resumen</h4>
                            <div className="space-y-2 text-sm">
                                <div><strong>Total Items:</strong> {report.totalItems}</div>
                                <div><strong>Cantidad Total:</strong> {report.totalQuantity?.toFixed(1)} unidades</div>
                                {report.photos?.length > 0 && (
                                    <div><strong>Fotos:</strong> {report.photos.length} adjunta(s)</div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Comentarios */}
                    {report.comment && (
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Comentarios</h4>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm">
                                {report.comment}
                            </div>
                        </div>
                    )}
                    
                    {/* Items */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Items Reportados</h4>
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {report.items?.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {item.quantity} {item.unit}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Fotos */}
                    {report.photos?.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Fotos Adjuntas</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {report.photos.map((photo, index) => (
                                    <img
                                        key={index}
                                        src={photo.url}
                                        alt={`Foto ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg border"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex justify-between items-center p-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        ID: {report.id}
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={report.status}
                            onChange={(e) => onStatusChange(report.id, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="enviado">📤 Enviado</option>
                            <option value="revisado">👁️ Revisado</option>
                            <option value="aprobado">✅ Aprobado</option>
                        </select>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.WorkReportsManagement = WorkReportsManagement;