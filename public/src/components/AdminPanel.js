// src/components/AdminPanel.js - VERSIÓN COMPLETA Y OPTIMIZADA
const { useState, useEffect } = React;

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [obras, setObras] = useState([]);
  const [albaniles, setAlbaniles] = useState([]);
  const [jefesDeObra, setJefesDeObra] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingObra, setEditingObra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    usuariosActivos: 0,
    totalObras: 0,
    obrasActivas: 0
  });

  useEffect(() => {
    loadData();
    // Actualizar estadísticas cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [usuariosRes, obrasRes, albanilesRes, jefesRes] = await Promise.all([
        fetch('/api/usuarios', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/obras', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/usuarios/albaniles', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/usuarios/jefes-obra', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      const usuariosData = await usuariosRes.json();
      const obrasData = await obrasRes.json();
      const albanilesData = await albanilesRes.json();
      const jefesData = await jefesRes.json();

      if (usuariosRes.ok) {
        setUsuarios(usuariosData);
        // Calcular estadísticas
        setStats(prev => ({
          ...prev,
          totalUsuarios: usuariosData.length,
          usuariosActivos: usuariosData.filter(u => u.activo).length
        }));
      }
      if (obrasRes.ok) {
        setObras(obrasData);
        setStats(prev => ({
          ...prev,
          totalObras: obrasData.length,
          obrasActivas: obrasData.filter(o => o.estado === 'en_progreso').length
        }));
      }
      if (albanilesRes.ok) setAlbaniles(albanilesData);
      if (jefesRes.ok) setJefesDeObra(jefesData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos del servidor');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (rol) => {
    const roles = {
      admin: 'Administrador',
      jefe_obra: 'Jefe de Obra',
      logistica: 'Logística',
      albanil: 'Albañil'
    };
    return roles[rol] || rol;
  };

  const getRoleIcon = (rol) => {
    const icons = {
      admin: '👑',
      jefe_obra: '🛠️',
      logistica: '🚚',
      albanil: '👷'
    };
    return icons[rol] || '👤';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_progreso: 'bg-blue-100 text-blue-800',
      completada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      cancelada: 'Cancelada'
    };
    return labels[estado] || estado;
  };

  const desactivarUsuario = async (userId) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    
    try {
      const response = await fetch(`/api/usuarios/${userId}/desactivar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        loadData();
        showNotification('Usuario desactivado exitosamente', 'success');
      } else {
        const error = await response.json();
        showNotification(error.error || 'Error al desactivar usuario', 'error');
      }
    } catch (err) {
      showNotification('Error de conexión', 'error');
    }
  };

  const handleEditObra = (obra) => {
    setEditingObra(obra);
  };

  const showNotification = (message, type = 'info') => {
    // Toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTabIcon = (section) => {
    const icons = {
      usuarios: '👥',
      obras: '🏗️',
      'crear-obra': '➕',
      tracking: '🗺️',
      reportes: '📊'
    };
    return icons[section] || '📋';
  };

  if (loading && usuarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-blue-100">Gestión completa del sistema</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Última actualización</div>
            <div className="text-lg font-medium">{new Date().toLocaleTimeString('es-ES')}</div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.usuariosActivos}</div>
            <div className="text-sm text-blue-100">Usuarios Activos</div>
            <div className="text-xs text-blue-200">de {stats.totalUsuarios} total</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.obrasActivas}</div>
            <div className="text-sm text-blue-100">Obras en Progreso</div>
            <div className="text-xs text-blue-200">de {stats.totalObras} total</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{albaniles.length}</div>
            <div className="text-sm text-blue-100">Albañiles</div>
            <div className="text-xs text-blue-200">disponibles</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{jefesDeObra.length}</div>
            <div className="text-sm text-blue-100">Jefes de Obra</div>
            <div className="text-xs text-blue-200">supervisores</div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Navegación del panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200 bg-gray-50">
          {[
            { key: 'usuarios', label: 'Usuarios' },
            { key: 'obras', label: 'Gestionar Obras' },
            { key: 'crear-obra', label: 'Crear Obra' },
            { key: 'tracking', label: 'Control de Agentes' },
            { key: 'reportes', label: 'Reportes' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`py-3 px-6 font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeSection === tab.key
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{getTabIcon(tab.key)}</span>
              <span>{tab.label}</span>
              {tab.key === 'usuarios' && (
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {stats.usuariosActivos}
                </span>
              )}
              {tab.key === 'obras' && (
                <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                  {stats.obrasActivas}
                </span>
              )}
              {tab.key === 'tracking' && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full animate-pulse">
                  LIVE
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenido del panel */}
        <div className="p-6">
          {activeSection === 'usuarios' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Administra usuarios, roles y permisos del sistema
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateUser(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>👤</span>
                  <span>Crear Usuario</span>
                </button>
              </div>
              
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Última conexión
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usuarios.map(usuario => (
                        <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-2xl mr-3">{getRoleIcon(usuario.rol)}</div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {usuario.nombre} {usuario.apellido}
                                </div>
                                <div className="text-sm text-gray-500">@{usuario.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {usuario.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {getRoleLabel(usuario.rol)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs leading-5 font-semibold rounded-full ${
                              usuario.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {usuario.activo ? '🟢 Activo' : '🔴 Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(usuario.ultima_conexion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => console.log('Ver perfil:', usuario.id)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="Ver perfil"
                              >
                                👁️
                              </button>
                              {usuario.activo && usuario.rol !== 'admin' && (
                                <button
                                  onClick={() => desactivarUsuario(usuario.id)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  title="Desactivar usuario"
                                >
                                  🚫
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {usuarios.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-gray-500">No hay usuarios registrados</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'obras' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Gestión de Obras</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Administra todas las obras del sistema
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-medium">{obras.length}</span> obras
                  </div>
                  <button
                    onClick={() => setActiveSection('crear-obra')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    ➕ Nueva Obra
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {obras.map(obra => (
                  <div key={obra.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <span className="mr-2">🏗️</span>
                          {obra.nombre}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(obra.estado)}`}>
                          {getEstadoLabel(obra.estado)}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-6 text-sm">
                        <div className="flex items-start">
                          <span className="text-gray-500 mr-2">📍</span>
                          <span className="text-gray-700">{obra.ubicacion}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">👷</span>
                          <span className="text-gray-700">
                            {obra.albanil_nombre} {obra.albanil_apellido}
                          </span>
                        </div>
                        {obra.jefe_nombre && (
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">🛠️</span>
                            <span className="text-gray-700">
                              {obra.jefe_nombre} {obra.jefe_apellido}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">📅</span>
                          <span className="text-gray-700">
                            Creada: {formatDate(obra.fecha_creacion)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditObra(obra)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => console.log('Ver detalles:', obra.id)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          👁️ Ver
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {obras.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">🏗️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay obras creadas</h3>
                    <p className="text-gray-500 mb-4">Empieza creando tu primera obra</p>
                    <button
                      onClick={() => setActiveSection('crear-obra')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      ➕ Crear Primera Obra
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'crear-obra' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Crear Nueva Obra</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Completa la información para crear una nueva obra
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('obras')}
                  className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded"
                >
                  ← Volver a obras
                </button>
              </div>
              <CreateObraForm 
                albaniles={albaniles} 
                jefesDeObra={jefesDeObra}
                onSuccess={() => {
                  loadData();
                  setActiveSection('obras');
                  showNotification('Obra creada exitosamente', 'success');
                }} 
              />
            </div>
          )}

          {activeSection === 'tracking' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    🗺️ Control de Agentes
                    <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full animate-pulse">
                      EN VIVO
                    </span>
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Monitoreo en tiempo real de ubicaciones de empleados
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Sistema activo</span>
                </div>
              </div>

              {/* Contenedor del mapa */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
                {window.AgentTrackingPanel ? (
                  <AgentTrackingPanel adminId="admin_sistema" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🗺️</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Panel de Control no disponible</h3>
                      <p className="text-gray-500 mb-4">
                        El componente AgentTrackingPanel no se ha cargado correctamente
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        🔄 Recargar página
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'reportes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Reportes y Análisis</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Estadísticas y reportes del sistema
                  </p>
                </div>
              </div>

              {/* Reportes rápidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">📊 Productividad</h3>
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
                    <h3 className="font-medium text-gray-900">👥 Personal</h3>
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

              {/* Botones de reportes detallados */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-4">📋 Reportes Detallados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 p-4 rounded-lg text-left transition-colors">
                    <div className="font-medium">📊 Reporte de Obras</div>
                    <div className="text-sm text-blue-600 mt-1">Estado detallado de todas las obras</div>
                  </button>
                  <button className="bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 p-4 rounded-lg text-left transition-colors">
                    <div className="font-medium">👥 Reporte de Personal</div>
                    <div className="text-sm text-green-600 mt-1">Rendimiento y asignaciones</div>
                  </button>
                  <button className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 p-4 rounded-lg text-left transition-colors">
                    <div className="font-medium">🗺️ Reporte de Ubicaciones</div>
                    <div className="text-sm text-purple-600 mt-1">Tracking y geolocalización</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modales */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => {
            setShowCreateUser(false);
            loadData();
            showNotification('Usuario creado exitosamente', 'success');
          }}
        />
      )}

      {editingObra && (
        <EditObraModal
          obra={editingObra}
          albaniles={albaniles}
          jefesDeObra={jefesDeObra}
          onClose={() => setEditingObra(null)}
          onSuccess={() => {
            setEditingObra(null);
            loadData();
            showNotification('Obra actualizada exitosamente', 'success');
          }}
        />
      )}
    </div>
  );
};

// Componentes auxiliares (CreateUserModal, CreateObraForm, EditObraModal)
const CreateUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    rol: 'albanil'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear usuario');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">👤 Crear Nuevo Usuario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength="6"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol *
            </label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="albanil">👷 Albañil</option>
              <option value="jefe_obra">🛠️ Jefe de Obra</option>
              <option value="logistica">🚚 Logística</option>
              <option value="admin">👑 Administrador</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateObraForm = ({ albaniles, jefesDeObra, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    descripcion: '',
    albanil_asignado: '',
    jefe_obra: '',
    latitud: null,
    longitud: null
  });
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      latitud: location.lat,
      longitud: location.lng
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.latitud || !formData.longitud) {
      alert('Por favor selecciona una ubicación en el mapa');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/obras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({
          nombre: '',
          ubicacion: '',
          descripcion: '',
          albanil_asignado: '',
          jefe_obra: '',
          latitud: null,
          longitud: null
        });
        if (onSuccess) onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear obra');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Obra *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción de Ubicación *
            </label>
            <input
              type="text"
              value={formData.ubicacion}
              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              placeholder="Ej: Av. Corrientes 1234, CABA"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción del Trabajo
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Describe el trabajo a realizar..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Albañil Asignado *
            </label>
            <select
              value={formData.albanil_asignado}
              onChange={(e) => setFormData({ ...formData, albanil_asignado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar albañil</option>
              {albaniles.map(albanil => (
                <option key={albanil.id} value={albanil.id}>
                  👷 {albanil.nombre} {albanil.apellido}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jefe de Obra
            </label>
            <select
              value={formData.jefe_obra}
              onChange={(e) => setFormData({ ...formData, jefe_obra: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar jefe de obra</option>
              {jefesDeObra.map(jefe => (
                <option key={jefe.id} value={jefe.id}>
                  🛠️ {jefe.nombre} {jefe.apellido}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de Mapa */}
        <div>
          {window.MapSelector ? (
            <MapSelector
              onLocationSelect={handleLocationSelect}
              initialLocation={formData.latitud && formData.longitud ? 
                { lat: formData.latitud, lng: formData.longitud } : null
              }
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                ⚠️ Componente MapSelector no está disponible. Asegúrate de que Google Maps esté cargado.
              </p>
            </div>
          )}
        </div>

        {(!formData.latitud || !formData.longitud) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Debes seleccionar una ubicación en el mapa antes de crear la obra
            </p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading || !formData.latitud || !formData.longitud}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : '🏗️ Crear Obra'}
        </button>
      </form>
    </div>
  );
};

const EditObraModal = ({ obra, albaniles, jefesDeObra, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: obra.nombre || '',
    ubicacion: obra.ubicacion || '',
    descripcion: obra.descripcion || '',
    albanil_asignado: obra.albanil_asignado || '',
    jefe_obra: obra.jefe_obra || '',
    latitud: obra.latitud || null,
    longitud: obra.longitud || null
  });
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      latitud: location.lat,
      longitud: location.lng
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.latitud || !formData.longitud) {
      alert('Por favor selecciona una ubicación en el mapa');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(`/api/obras/${obra.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar obra');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">✏️ Editar Obra: {obra.nombre}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Obra *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción de Ubicación *
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del Trabajo
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Describe el trabajo a realizar..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Albañil Asignado *
                </label>
                <select
                  value={formData.albanil_asignado}
                  onChange={(e) => setFormData({ ...formData, albanil_asignado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar albañil</option>
                  {albaniles.map(albanil => (
                    <option key={albanil.id} value={albanil.id}>
                      👷 {albanil.nombre} {albanil.apellido}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jefe de Obra
                </label>
                <select
                  value={formData.jefe_obra}
                  onChange={(e) => setFormData({ ...formData, jefe_obra: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar jefe de obra</option>
                  {jefesDeObra.map(jefe => (
                    <option key={jefe.id} value={jefe.id}>
                      🛠️ {jefe.nombre} {jefe.apellido}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Información de cambio de albañil */}
            {formData.albanil_asignado != obra.albanil_asignado && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                  <div>
                    <h4 className="text-yellow-800 font-medium">Cambio de Albañil Detectado</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      Al cambiar el albañil asignado, la obra se transferirá al nuevo empleado
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Selector de Mapa */}
            <div>
              {window.MapSelector ? (
                <MapSelector
                  onLocationSelect={handleLocationSelect}
                  initialLocation={formData.latitud && formData.longitud ? 
                    { lat: formData.latitud, lng: formData.longitud } : null
                  }
                />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    ⚠️ Componente MapSelector no está disponible.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.latitud || !formData.longitud}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Actualizando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.AdminPanel = AdminPanel;