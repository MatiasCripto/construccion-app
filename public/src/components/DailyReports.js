// src/components/DailyReports.js - Informes diarios de obra
const DailyReports = ({ informesObra, stats, onDataChange, empresaData }) => {
  
  const generateReport = (tipo, datos = {}) => {
    // Agregar datos de empresa VIVEKA a todos los reportes
    const datosConEmpresa = {
      ...datos,
      empresa: empresaData
    };
    
    // Simular generación de reporte
    console.log(`📄 Generando PDF: ${tipo}`, datosConEmpresa);
    alert(`📄 Generando PDF de ${tipo} para ${empresaData.nombre}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            📋 Informes Diarios de Obra - {empresaData.nombre}
            {stats.informesPendientes > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full animate-pulse">
                {stats.informesPendientes} nuevos
              </span>
            )}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Reportes diarios enviados por los jefes de obra
          </p>
        </div>
        <button
          onClick={onDataChange}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Actualizar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {informesObra.map(informe => (
          <div key={informe.id} className={`bg-white rounded-lg shadow border p-6 ${
            !informe.leido ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  🏗️ {informe.obra_nombre}
                  {!informe.leido && (
                    <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      NUEVO
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  📅 {informe.fecha?.toLocaleDateString('es-ES')} por {informe.jefe_nombre}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => generateReport('informe_obra', informe)}
                  className="text-green-600 hover:text-green-900 text-sm"
                  title="Generar PDF"
                >
                  📄 PDF
                </button>
                {!informe.leido && (
                  <button
                    onClick={async () => {
                      if (window.db) {
                        await window.db.collection('informes_obra').doc(informe.id).update({
                          leido: true,
                          fecha_lectura: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        onDataChange();
                      }
                    }}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                    title="Marcar como leído"
                  >
                    ✅ Leído
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <strong>📋 Avance del día:</strong>
                <p className="mt-1 text-gray-700">{informe.avance_descripcion}</p>
              </div>
              
              {informe.materiales_usados && informe.materiales_usados.length > 0 && (
                <div>
                  <strong>🧱 Materiales utilizados:</strong>
                  <ul className="mt-1 text-gray-700">
                    {informe.materiales_usados.map((material, index) => (
                      <li key={index}>• {material.nombre}: {material.cantidad} {material.unidad}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {informe.personal_presente && informe.personal_presente.length > 0 && (
                <div>
                  <strong>👷 Personal presente:</strong>
                  <p className="mt-1 text-gray-700">
                    {informe.personal_presente.map(p => p.nombre).join(', ')}
                  </p>
                </div>
              )}
              
              {informe.observaciones && (
                <div>
                  <strong>📝 Observaciones:</strong>
                  <p className="mt-1 text-gray-700">{informe.observaciones}</p>
                </div>
              )}
              
              {informe.porcentaje_avance && (
                <div>
                  <strong>📊 Progreso total:</strong>
                  <div className="mt-1 flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${informe.porcentaje_avance}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{informe.porcentaje_avance}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {informesObra.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay informes diarios</h3>
            <p className="text-gray-500">
              Los jefes de obra pueden enviar informes diarios desde la app móvil
            </p>
          </div>
        )}
      </div>

      {/* Estadísticas de informes */}
      {informesObra.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">📊 Estadísticas de Informes</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{informesObra.length}</div>
              <div className="text-sm text-gray-600">Total Informes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{informesObra.filter(i => i.leido).length}</div>
              <div className="text-sm text-gray-600">Leídos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.informesPendientes}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {informesObra.length > 0 ? Math.round((informesObra.filter(i => i.leido).length / informesObra.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Procesados</div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen por obra */}
      {informesObra.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">🏗️ Resumen por Obra</h3>
          <div className="space-y-2">
            {Object.entries(
              informesObra.reduce((acc, informe) => {
                const obraNombre = informe.obra_nombre || 'Sin nombre';
                if (!acc[obraNombre]) {
                  acc[obraNombre] = { total: 0, pendientes: 0 };
                }
                acc[obraNombre].total++;
                if (!informe.leido) acc[obraNombre].pendientes++;
                return acc;
              }, {})
            ).map(([obra, stats]) => (
              <div key={obra} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <span className="font-medium text-gray-900">{obra}</span>
                  {stats.pendientes > 0 && (
                    <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                      {stats.pendientes} nuevos
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {stats.total} informes
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Hacer disponible globalmente
window.DailyReports = DailyReports;