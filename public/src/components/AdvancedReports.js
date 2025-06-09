// src/components/AdvancedReports.js - Reportes avanzados y PDFs
const AdvancedReports = ({ 
  usuarios, obras, albaniles, jefesDeObra, 
  informesObra, materiales, herramientas, stats, empresaData 
}) => {
  
  const generateReport = (tipo, datos = {}) => {
    // Agregar datos de empresa VIVEKA a todos los reportes
    const datosConEmpresa = {
      ...datos,
      empresa: empresaData
    };
    
    // Simular generación de reporte
    console.log(`🎯 Generando reporte PDF: ${tipo}`, datosConEmpresa);
    
    // Crear contenido del PDF con datos de empresa
    const pdfContent = `
📄 REPORTE ${tipo.toUpperCase()} - ${empresaData.nombre}

🏗️ EMPRESA: ${empresaData.nombre}
📧 EMAIL: ${empresaData.email}  
📞 TELÉFONO: ${empresaData.telefono}
💼 ESLOGAN: ${empresaData.eslogan}

📊 DATOS DEL REPORTE:
${JSON.stringify(datos, null, 2)}

📅 GENERADO: ${new Date().toLocaleString('es-ES')}
`;
    
    // Simular descarga
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const fileName = `${empresaData.nombre}_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`✅ PDF de ${empresaData.nombre} generado exitosamente: ${fileName}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">🎯 Reportes Avanzados y PDFs - {empresaData.nombre}</h2>
          <p className="text-gray-600 text-sm mt-1">
            Genera reportes profesionales con formato de empresa | {empresaData.email}
          </p>
        </div>
      </div>

      {/* Reportes rápidos con PDFs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-900">📊 Reporte de Obras</h3>
            <span className="text-3xl">🏗️</span>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            Estado detallado de todas las obras con logos y formato profesional de {empresaData.nombre}
          </p>
          <button
            onClick={() => generateReport('informe_obras', { obras, albaniles, jefesDeObra })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            📄 Generar PDF
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-green-900">👥 Reporte de Personal</h3>
            <span className="text-3xl">👷</span>
          </div>
          <p className="text-sm text-green-700 mb-4">
            Estadísticas de rendimiento y asignaciones del personal de {empresaData.nombre}
          </p>
          <button
            onClick={() => generateReport('reporte_personal', { usuarios, albaniles, jefesDeObra, obras })}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            📄 Generar PDF
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-purple-900">📸 Relevamiento Fotográfico</h3>
            <span className="text-3xl">📷</span>
          </div>
          <p className="text-sm text-purple-700 mb-4">
            Reporte con todas las fotos de obras con formato profesional y logo de {empresaData.nombre}
          </p>
          <button
            onClick={() => generateReport('relevamiento', { obras, fotos: [] })}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            📄 Generar PDF
          </button>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-orange-900">💰 Presupuestos</h3>
            <span className="text-3xl">📋</span>
          </div>
          <p className="text-sm text-orange-700 mb-4">
            Presupuestos con formato remito y logo de {empresaData.nombre}
          </p>
          <button
            onClick={() => generateReport('presupuesto', { materiales, obras })}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            📄 Generar PDF
          </button>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-red-900">📈 Estadísticas Avanzadas</h3>
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-sm text-red-700 mb-4">
            Métricas completas de productividad y rendimiento de {empresaData.nombre}
          </p>
          <button
            onClick={() => generateReport('estadisticas', { 
              usuarios, obras, albaniles, jefesDeObra, 
              informesObra, materiales, herramientas, stats 
            })}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            📄 Generar PDF
          </button>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-yellow-900">📝 Informes de Trabajo</h3>
            <span className="text-3xl">⚡</span>
          </div>
          <p className="text-sm text-yellow-700 mb-4">
            Trabajos realizados por fecha y empleado para {empresaData.nombre}
          </p>
          <button
            onClick={() => generateReport('trabajo_diario', { informesObra, albaniles, obras })}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            📄 Generar PDF
          </button>
        </div>
      </div>

      {/* Información de empresa VIVEKA en reportes */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
          🏗️ Todos los PDFs incluyen datos de {empresaData.nombre}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>🏢 Empresa:</strong> {empresaData.nombre}</p>
            <p><strong>📧 Email:</strong> {empresaData.email}</p>
          </div>
          <div>
            <p><strong>📞 Teléfono:</strong> {empresaData.telefono}</p>
            <p><strong>💼 Eslogan:</strong> {empresaData.eslogan}</p>
          </div>
        </div>
      </div>

      {/* Estadísticas visuales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">📊 Eficiencia General</h3>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Obras completadas</span>
              <span className="font-medium">{obras.filter(o => o.estado === 'completada').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tasa de finalización</span>
              <span className="font-medium">
                {obras.length > 0 ? Math.round((obras.filter(o => o.estado === 'completada').length / obras.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Personal activo</span>
              <span className="font-medium">{stats.usuariosActivos}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">🧱 Recursos</h3>
            <span className="text-2xl">📦</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Materiales registrados</span>
              <span className="font-medium">{stats.totalMateriales}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Herramientas disponibles</span>
              <span className="font-medium">{stats.totalHerramientas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Informes pendientes</span>
              <span className="font-medium">{stats.informesPendientes}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">📈 Productividad</h3>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Obras por albañil</span>
              <span className="font-medium">
                {albaniles.length > 0 ? Math.round(obras.length / albaniles.length * 10) / 10 : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Obras en progreso</span>
              <span className="font-medium">{stats.obrasActivas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jefes supervisando</span>
              <span className="font-medium">{jefesDeObra.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview de reportes */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">👁️ Vista Previa de Datos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">🏗️ Obras</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Total: {obras.length}</li>
              <li>• Completadas: {obras.filter(o => o.estado === 'completada').length}</li>
              <li>• En progreso: {obras.filter(o => o.estado === 'en_progreso').length}</li>
              <li>• Pendientes: {obras.filter(o => o.estado === 'pendiente').length}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">👥 Personal</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Total usuarios: {usuarios.length}</li>
              <li>• Usuarios activos: {stats.usuariosActivos}</li>
              <li>• Albañiles: {albaniles.length}</li>
              <li>• Jefes de obra: {jefesDeObra.length}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">📦 Recursos</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Materiales: {materiales.length}</li>
              <li>• Herramientas: {herramientas.length}</li>
              <li>• Informes: {informesObra.length}</li>
              <li>• Pendientes: {stats.informesPendientes}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">📊 Rendimiento</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Tasa éxito: {obras.length > 0 ? Math.round((obras.filter(o => o.estado === 'completada').length / obras.length) * 100) : 0}%</li>
              <li>• Obras/albañil: {albaniles.length > 0 ? Math.round(obras.length / albaniles.length * 10) / 10 : 0}</li>
              <li>• Eficiencia: {stats.usuariosActivos > 0 ? Math.round((stats.obrasActivas / stats.usuariosActivos) * 100) : 0}%</li>
              <li>• Productividad: Alta</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botones de acción rápida */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">⚡ Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              // Generar todos los reportes
              const reportes = [
                'informe_obras',
                'reporte_personal', 
                'relevamiento',
                'presupuesto',
                'estadisticas',
                'trabajo_diario'
              ];
              reportes.forEach(tipo => {
                setTimeout(() => generateReport(tipo, { usuarios, obras, albaniles, jefesDeObra, informesObra, materiales, herramientas, stats }), 1000);
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            📄 Generar Todos los PDFs
          </button>
          <button
            onClick={() => generateReport('reporte_completo', { usuarios, obras, albaniles, jefesDeObra, informesObra, materiales, herramientas, stats })}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            📊 Reporte Ejecutivo Completo
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify({ usuarios, obras, albaniles, jefesDeObra, informesObra, materiales, herramientas, stats, empresa: empresaData }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${empresaData.nombre}_datos_completos_${new Date().toISOString().split('T')[0]}.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            💾 Exportar Datos JSON
          </button>
        </div>
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.AdvancedReports = AdvancedReports;