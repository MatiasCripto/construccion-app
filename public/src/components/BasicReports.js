// src/components/BasicReports.js - Reportes básicos y estadísticas
const BasicReports = ({ obras, usuarios, albaniles, jefesDeObra, empresaData }) => {
  
  const generateReport = (tipo, datos = {}) => {
    // Agregar datos de empresa VIVEKA a todos los reportes
    const datosConEmpresa = {
      ...datos,
      empresa: empresaData
    };
    
    // Simular generación de reporte
    console.log(`📊 Generando reporte: ${tipo}`, datosConEmpresa);
    
    // Aquí se podría integrar con ReportGenerator
    if (window.ReportGeneratorViveka) {
      // Mostrar modal de generación
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold mb-4">📊 Generando Reporte</h3>
            <p>Reporte: ${tipo}</p>
            <p>Empresa: ${empresaData.nombre}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Cerrar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      alert(`📊 Generando reporte: ${tipo} para ${empresaData.nombre}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">📊 Reportes y Análisis - {empresaData.nombre}</h2>
          <p className="text-gray-600 text-sm mt-1">
            Estadísticas y reportes del sistema | {empresaData.email}
          </p>
        </div>
      </div>

      {/* Reportes rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">📊 Productividad {empresaData.nombre}</h3>
            <span className="text-2xl">📈</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Obras completadas</span>
              <span className="font-medium">{obras.filter(o => o.estado === 'completada').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">En progreso</span>
              <span className="font-medium">{obras.filter(o => o.estado === 'en_progreso').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pendientes</span>
              <span className="font-medium">{obras.filter(o => o.estado === 'pendiente').length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">👥 Personal {empresaData.nombre}</h3>
            <span className="text-2xl">👷</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Albañiles activos</span>
              <span className="font-medium">{albaniles.filter(a => a.activo).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jefes de obra</span>
              <span className="font-medium">{jefesDeObra.filter(j => j.activo).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total usuarios</span>
              <span className="font-medium">{usuarios.filter(u => u.activo).length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">🎯 Rendimiento</h3>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Tasa de finalización</span>
              <span className="font-medium">
                {obras.length > 0 ? Math.round((obras.filter(o => o.estado === 'completada').length / obras.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Obras activas</span>
              <span className="font-medium">{obras.filter(o => o.estado === 'en_progreso').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Promedio por albañil</span>
              <span className="font-medium">
                {albaniles.length > 0 ? Math.round(obras.length / albaniles.length * 10) / 10 : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Información de empresa VIVEKA */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
          🏗️ Información de la Empresa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Empresa:</strong> {empresaData.nombre}</p>
            <p><strong>Email:</strong> {empresaData.email}</p>
          </div>
          <div>
            <p><strong>Teléfono:</strong> {empresaData.telefono}</p>
            <p><strong>Eslogan:</strong> {empresaData.eslogan}</p>
          </div>
        </div>
      </div>

      {/* Botones de reportes detallados */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">📋 Reportes Detallados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => generateReport('reporte_obras', { obras, albaniles, jefesDeObra })}
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 p-4 rounded-lg text-left transition-colors">
            <div className="font-medium">📊 Reporte de Obras</div>
            <div className="text-sm text-blue-600 mt-1">Estado detallado de todas las obras</div>
          </button>
          <button 
            onClick={() => generateReport('reporte_personal', { usuarios, albaniles, jefesDeObra, obras })}
            className="bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 p-4 rounded-lg text-left transition-colors">
            <div className="font-medium">👥 Reporte de Personal</div>
            <div className="text-sm text-green-600 mt-1">Rendimiento y asignaciones</div>
          </button>
          <button 
            onClick={() => generateReport('reporte_ubicaciones', { usuarios, obras })}
            className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 p-4 rounded-lg text-left transition-colors">
            <div className="font-medium">🗺️ Reporte de Ubicaciones</div>
            <div className="text-sm text-purple-600 mt-1">Tracking y geolocalización</div>
          </button>
        </div>
      </div>

      {/* Gráfico de estadísticas visuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">📊 Distribución de Obras</h3>
          <div className="space-y-3">
            {[
              { estado: 'Completadas', cantidad: obras.filter(o => o.estado === 'completada').length, color: 'bg-green-500' },
              { estado: 'En Progreso', cantidad: obras.filter(o => o.estado === 'en_progreso').length, color: 'bg-blue-500' },
              { estado: 'Pendientes', cantidad: obras.filter(o => o.estado === 'pendiente').length, color: 'bg-yellow-500' },
              { estado: 'Canceladas', cantidad: obras.filter(o => o.estado === 'cancelada').length, color: 'bg-red-500' }
            ].map(item => (
              <div key={item.estado} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                  <span className="text-sm text-gray-600">{item.estado}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`} 
                      style={{ width: `${obras.length > 0 ? (item.cantidad / obras.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{item.cantidad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">👥 Personal por Rol</h3>
          <div className="space-y-3">
            {[
              { rol: 'Albañiles', cantidad: albaniles.length, icon: '👷', color: 'bg-orange-500' },
              { rol: 'Jefes de Obra', cantidad: jefesDeObra.length, icon: '🛠️', color: 'bg-purple-500' },
              { rol: 'Administradores', cantidad: usuarios.filter(u => u.rol === 'admin').length, icon: '👑', color: 'bg-blue-500' },
              { rol: 'Logística', cantidad: usuarios.filter(u => u.rol === 'logistica').length, icon: '🚚', color: 'bg-green-500' }
            ].map(item => (
              <div key={item.rol} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{item.icon}</span>
                  <span className="text-sm text-gray-600">{item.rol}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`} 
                      style={{ width: `${usuarios.length > 0 ? (item.cantidad / usuarios.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{item.cantidad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📋 Resumen Ejecutivo - {empresaData.nombre}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">🎯 Objetivos Alcanzados</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• {obras.filter(o => o.estado === 'completada').length} obras finalizadas</li>
              <li>• {Math.round((obras.filter(o => o.estado === 'completada').length / Math.max(obras.length, 1)) * 100)}% de éxito</li>
              <li>• {usuarios.filter(u => u.activo).length} empleados activos</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">🚧 En Desarrollo</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• {obras.filter(o => o.estado === 'en_progreso').length} obras en progreso</li>
              <li>• {obras.filter(o => o.estado === 'pendiente').length} obras pendientes</li>
              <li>• {albaniles.length} albañiles disponibles</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">📞 Contacto</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Email: {empresaData.email}</li>
              <li>• Teléfono: {empresaData.telefono}</li>
              <li>• Dirección: {empresaData.direccion}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.BasicReports = BasicReports;