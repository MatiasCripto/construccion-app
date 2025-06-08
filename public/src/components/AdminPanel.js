// src/components/AdminPanel.js - VERSIÓN COMPLETA CON CRUD + EMPRESA VIVEKA
const { useState, useEffect } = React;

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [obras, setObras] = useState([]);
  const [albaniles, setAlbaniles] = useState([]);
  const [jefesDeObra, setJefesDeObra] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para CRUD de usuarios
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados para CRUD de obras
  const [showCreateObra, setShowCreateObra] = useState(false);
  const [showEditObra, setShowEditObra] = useState(false);
  const [showDeleteObraModal, setShowDeleteObraModal] = useState(false);
  const [selectedObra, setSelectedObra] = useState(null);
  const [obraToDelete, setObraToDelete] = useState(null);
  const [isDeletingObra, setIsDeletingObra] = useState(false);
  
  // Estados para nuevas funcionalidades
  const [materiales, setMateriales] = useState([]);
  const [herramientas, setHerramientas] = useState([]);
  const [informesObra, setInformesObra] = useState([]);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportData, setReportData] = useState({});
  
  // Estados para gestión de materiales
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialCategories, setMaterialCategories] = useState([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('');
  
  // Estados para gestión de herramientas
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [showEditToolModal, setShowEditToolModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolCategories, setToolCategories] = useState([]);
  const [toolSearch, setToolSearch] = useState('');
  const [toolCategoryFilter, setToolCategoryFilter] = useState('');
  
  // DATOS DE LA EMPRESA VIVEKA
  const empresaData = {
    nombre: 'VIVEKA',
    email: 'vivekaemuna@gmail.com',
    telefono: '11 24749240',
    direccion: 'Consultas por email',
    logo: '🏗️', // Puede ser reemplazado por logo real
    eslogan: 'Construcción Profesional',
    website: 'Contacto: vivekaemuna@gmail.com'
  };
  
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    usuariosActivos: 0,
    totalObras: 0,
    obrasActivas: 0,
    totalMateriales: 0,
    totalHerramientas: 0,
    informesPendientes: 0
  });

  useEffect(() => {
    loadData();
    loadMateriales();
    loadHerramientas();
    loadInformesObra();
    const interval = setInterval(() => {
      loadData();
      loadInformesObra();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [usuariosRes, obrasRes, albanilesRes, jefesRes] = await Promise.all([
        fetch('/api/usuarios', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/obras', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/usuarios/albaniles', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/usuarios/jefes-obra', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const usuariosData = await usuariosRes.json();
      const obrasData = await obrasRes.json();
      const albanilesData = await albanilesRes.json();
      const jefesData = await jefesRes.json();

      if (usuariosRes.ok) {
        setUsuarios(usuariosData);
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

  // ===== CRUD USUARIOS =====
  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowCreateUser(true);
  };

  const handleEditUser = (usuario) => {
    setSelectedUser(usuario);
    setShowEditUser(true);
  };

  const handleDeleteUser = (usuario) => {
    setUserToDelete(usuario);
    setShowDeleteUserModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log('🗑️ Eliminando usuario:', userToDelete.id);
      
      const response = await fetch(`/api/usuarios/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar del backend');
      }

      // Eliminar de Firebase si existe
      if (window.db && window.FirebaseService) {
        try {
          const locations = await window.FirebaseService.getUserLocations(userToDelete.id, 1000);
          for (const location of locations) {
            await window.db.collection('user_locations').doc(location.id).delete();
          }
        } catch (firebaseError) {
          console.warn('⚠️ Error eliminando ubicaciones:', firebaseError);
        }

        try {
          const messagesSnapshot = await window.db.collection('mensajes')
            .where('autorId', '==', userToDelete.id).get();
          
          const deletePromises = [];
          messagesSnapshot.forEach(doc => {
            deletePromises.push(doc.ref.delete());
          });
          await Promise.all(deletePromises);
        } catch (firebaseError) {
          console.warn('⚠️ Error eliminando mensajes:', firebaseError);
        }

        try {
          await window.db.collection('usuarios').doc(userToDelete.id).delete();
        } catch (firebaseError) {
          console.warn('⚠️ Error eliminando usuario de Firebase:', firebaseError);
        }
      }
      
      await loadData();
      setShowDeleteUserModal(false);
      setUserToDelete(null);
      
      console.log('✅ Usuario eliminado completamente');
      showNotification('✅ Usuario eliminado completamente', 'success');
      
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      showNotification('❌ Error eliminando usuario: ' + error.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteUserModal(false);
    setUserToDelete(null);
  };

  // ===== CRUD OBRAS =====
  const handleCreateObra = () => {
    setSelectedObra(null);
    setShowCreateObra(true);
  };

  const handleEditObra = (obra) => {
    setSelectedObra(obra);
    setShowEditObra(true);
  };

  const handleDeleteObra = (obra) => {
    setObraToDelete(obra);
    setShowDeleteObraModal(true);
  };

  const confirmDeleteObra = async () => {
    if (!obraToDelete) return;
    
    setIsDeletingObra(true);
    try {
      console.log('🗑️ Eliminando obra:', obraToDelete.id);
      
      const response = await fetch(`/api/obras/${obraToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar obra del backend');
      }

      // Eliminar de Firebase si existe
      if (window.db) {
        try {
          // Eliminar informes relacionados
          const informesSnapshot = await window.db.collection('informes_obra')
            .where('obra_id', '==', obraToDelete.id).get();
          
          const deletePromises = [];
          informesSnapshot.forEach(doc => {
            deletePromises.push(doc.ref.delete());
          });
          await Promise.all(deletePromises);

          // Eliminar fotos relacionadas
          const fotosSnapshot = await window.db.collection('fotos_obra')
            .where('obra_id', '==', obraToDelete.id).get();
          
          fotosSnapshot.forEach(doc => {
            deletePromises.push(doc.ref.delete());
          });
          await Promise.all(deletePromises);
          
        } catch (firebaseError) {
          console.warn('⚠️ Error eliminando datos relacionados de Firebase:', firebaseError);
        }
      }
      
      await loadData();
      setShowDeleteObraModal(false);
      setObraToDelete(null);
      
      console.log('✅ Obra eliminada completamente');
      showNotification('✅ Obra eliminada completamente', 'success');
      
    } catch (error) {
      console.error('❌ Error eliminando obra:', error);
      showNotification('❌ Error eliminando obra: ' + error.message, 'error');
    } finally {
      setIsDeletingObra(false);
    }
  };

  const cancelDeleteObra = () => {
    setShowDeleteObraModal(false);
    setObraToDelete(null);
  };

  // ===== FUNCIONES PARA MATERIALES =====
  const loadMateriales = async () => {
    try {
      if (window.db) {
        const snapshot = await window.db.collection('materiales').orderBy('nombre').get();
        const materialesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMateriales(materialesData);
        setStats(prev => ({ ...prev, totalMateriales: materialesData.length }));
        
        const categoriasUnicas = [...new Set(materialesData.map(m => m.categoria))].filter(Boolean);
        setMaterialCategories(categoriasUnicas);
      }
    } catch (error) {
      console.error('Error cargando materiales:', error);
    }
  };

  const deleteMaterial = async (materialId) => {
    if (!confirm('¿Está seguro de eliminar este material? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await window.db.collection('materiales').doc(materialId).delete();
      await loadMateriales();
      showNotification('✅ Material eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error eliminando material:', error);
      showNotification('❌ Error al eliminar material', 'error');
    }
  };

  // ===== FUNCIONES PARA HERRAMIENTAS =====
  const loadHerramientas = async () => {
    try {
      if (window.db) {
        const snapshot = await window.db.collection('herramientas').orderBy('nombre').get();
        const herramientasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHerramientas(herramientasData);
        setStats(prev => ({ ...prev, totalHerramientas: herramientasData.length }));
        
        const categoriasUnicas = [...new Set(herramientasData.map(h => h.categoria))].filter(Boolean);
        setToolCategories(categoriasUnicas);
      }
    } catch (error) {
      console.error('Error cargando herramientas:', error);
    }
  };

  const deleteTool = async (toolId) => {
    if (!confirm('¿Está seguro de eliminar esta herramienta?')) return;

    try {
      await window.db.collection('herramientas').doc(toolId).delete();
      await loadHerramientas();
      showNotification('✅ Herramienta eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error eliminando herramienta:', error);
      showNotification('❌ Error al eliminar herramienta', 'error');
    }
  };

  // ===== FUNCIONES PARA INFORMES DE OBRA =====
  const loadInformesObra = async () => {
    try {
      if (window.db) {
        const snapshot = await window.db.collection('informes_obra')
          .orderBy('fecha', 'desc')
          .limit(50)
          .get();
        const informesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fecha: doc.data().fecha?.toDate?.() || new Date(doc.data().fecha)
        }));
        setInformesObra(informesData);
        setStats(prev => ({ 
          ...prev, 
          informesPendientes: informesData.filter(i => !i.leido).length 
        }));
      }
    } catch (error) {
      console.error('Error cargando informes de obra:', error);
    }
  };

  // ===== FUNCIÓN PARA GENERAR REPORTES PDF CON DATOS VIVEKA =====
  const generateReport = (tipo, datos = {}) => {
    // Agregar datos de empresa VIVEKA a todos los reportes
    const datosConEmpresa = {
      ...datos,
      empresa: empresaData
    };
    setReportType(tipo);
    setReportData(datosConEmpresa);
    setShowReportGenerator(true);
  };

  // Funciones de utilidad
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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

  const showNotification = (message, type = 'info') => {
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
      reportes: '📊',
      materiales: '🧱',
      herramientas: '🔧',
      'informes-obra': '📋',
      'reportes-avanzados': '🎯'
    };
    return icons[section] || '📋';
  };

  // Filtros para materiales
  const materialesFiltrados = materiales.filter(material => {
    const matchCategoria = !materialCategoryFilter || material.categoria === materialCategoryFilter;
    const matchBusqueda = !materialSearch || 
      material.nombre.toLowerCase().includes(materialSearch.toLowerCase()) ||
      material.descripcion?.toLowerCase().includes(materialSearch.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  // Filtros para herramientas
  const herramientasFiltradas = herramientas.filter(herramienta => {
    const matchCategoria = !toolCategoryFilter || herramienta.categoria === toolCategoryFilter;
    const matchBusqueda = !toolSearch || 
      herramienta.nombre.toLowerCase().includes(toolSearch.toLowerCase()) ||
      herramienta.descripcion?.toLowerCase().includes(toolSearch.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  if (loading && usuarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
};
  }

  return (
    <div className="space-y-6">
      {/* Header con datos de empresa VIVEKA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              🏗️ {empresaData.nombre} - Panel de Administración
            </h1>
            <p className="text-blue-100">{empresaData.eslogan} | {empresaData.email}</p>
            <p className="text-blue-200 text-sm">📞 {empresaData.telefono}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Última actualización</div>
            <div className="text-lg font-medium">{new Date().toLocaleTimeString('es-ES')}</div>
          </div>
        </div>

        {/* Estadísticas expandidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.totalMateriales}</div>
            <div className="text-sm text-blue-100">Materiales</div>
            <div className="text-xs text-blue-200">registrados</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.totalHerramientas}</div>
            <div className="text-sm text-blue-100">Herramientas</div>
            <div className="text-xs text-blue-200">disponibles</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.informesPendientes}</div>
            <div className="text-sm text-blue-100">Informes</div>
            <div className="text-xs text-blue-200">pendientes</div>
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
        <div className="flex flex-wrap border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {[
            { key: 'usuarios', label: 'Usuarios' },
            { key: 'obras', label: 'Gestionar Obras' },
            { key: 'tracking', label: 'Control de Agentes' },
            { key: 'reportes', label: 'Reportes Básicos' },
            { key: 'materiales', label: 'Materiales' },
            { key: 'herramientas', label: 'Herramientas' },
            { key: 'informes-obra', label: 'Informes Diarios' },
            { key: 'reportes-avanzados', label: 'Reportes PDF' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`py-3 px-4 font-medium transition-all duration-200 flex items-center space-x-2 whitespace-nowrap ${
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
              {tab.key === 'materiales' && (
                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                  {stats.totalMateriales}
                </span>
              )}
              {tab.key === 'herramientas' && (
                <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                  {stats.totalHerramientas}
                </span>
              )}
              {tab.key === 'informes-obra' && stats.informesPendientes > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full animate-pulse">
                  {stats.informesPendientes}
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
          {/* SECCIÓN USUARIOS CON CRUD COMPLETO */}
          {activeSection === 'usuarios' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">👥 Gestión de Usuarios</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    CRUD completo: Crear, Ver, Editar y Eliminar usuarios del sistema
                  </p>
                </div>
                <button
                  onClick={handleCreateUser}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
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
                          Acciones CRUD
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
                              <button
                                onClick={() => handleEditUser(usuario)}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                title="Editar usuario"
                              >
                                ✏️
                              </button>
                              {usuario.activo && usuario.rol !== 'admin' && (
                                <button
                                  onClick={() => desactivarUsuario(usuario.id)}
                                  className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                                  title="Desactivar usuario"
                                >
                                  🚫
                                </button>
                              )}
                              {usuario.rol !== 'admin' && (
                                <button
                                  onClick={() => handleDeleteUser(usuario)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  title="Eliminar definitivamente"
                                >
                                  🗑️
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
                    <button
                      onClick={handleCreateUser}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      ➕ Crear Primer Usuario
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN OBRAS CON CRUD COMPLETO */}
          {activeSection === 'obras' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">🏗️ Gestión de Obras</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    CRUD completo: Crear, Ver, Editar y Eliminar obras del sistema
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-medium">{obras.length}</span> obras
                  </div>
                  <button
                    onClick={handleCreateObra}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <span>➕</span>
                    <span>Crear Obra</span>
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
                          onClick={() => console.log('Ver detalles:', obra.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          👁️ Ver
                        </button>
                        <button
                          onClick={() => handleEditObra(obra)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteObra(obra)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          🗑️ Eliminar
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
                      onClick={handleCreateObra}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      ➕ Crear Primera Obra
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN TRACKING */}
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

          {/* SECCIÓN REPORTES BÁSICOS CON DATOS VIVEKA */}
          {activeSection === 'reportes' && (
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
            </div>
          )}

          {/* SECCIÓN MATERIALES */}
          {activeSection === 'materiales' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">🧱 Gestión de Materiales - {empresaData.nombre}</h2>
                  <p className="text-gray-600">Administrar lista de materiales disponibles para los albañiles</p>
                </div>
                <button
                  onClick={() => setShowAddMaterialModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Agregar Material</span>
                </button>
              </div>

              {/* Filtros */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🔍 Buscar material
                    </label>
                    <input
                      type="text"
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      placeholder="Nombre o descripción..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📂 Filtrar por categoría
                    </label>
                    <select
                      value={materialCategoryFilter}
                      onChange={(e) => setMaterialCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas las categorías</option>
                      {materialCategories.map(categoria => (
                        <option key={categoria} value={categoria}>{categoria}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setMaterialSearch('');
                        setMaterialCategoryFilter('');
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      🔄 Limpiar filtros
                    </button>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl">📦</span>
                    <div className="ml-3">
                      <p className="text-sm text-blue-600">Total Materiales</p>
                      <p className="text-2xl font-bold text-blue-800">{materiales.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl">✅</span>
                    <div className="ml-3">
                      <p className="text-sm text-green-600">Disponibles</p>
                      <p className="text-2xl font-bold text-green-800">
                        {materiales.filter(m => m.disponible !== false).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl">📂</span>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-600">Categorías</p>
                      <p className="text-2xl font-bold text-yellow-800">{materialCategories.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl">🔍</span>
                    <div className="ml-3">
                      <p className="text-sm text-purple-600">Filtrados</p>
                      <p className="text-2xl font-bold text-purple-800">{materialesFiltrados.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de materiales */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Material
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio Est.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {materialesFiltrados.map((material) => (
                        <tr key={material.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {material.nombre}
                              </div>
                              {material.descripcion && (
                                <div className="text-sm text-gray-500">
                                  {material.descripcion}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {material.categoria || 'Sin categoría'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {material.unidad}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {material.precio_estimado ? `${material.precio_estimado}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              material.disponible !== false 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {material.disponible !== false ? '✅ Disponible' : '❌ No disponible'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => {
                                setSelectedMaterial(material);
                                setShowEditMaterialModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => deleteMaterial(material.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              🗑️ Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {materialesFiltrados.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🧱</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron materiales</h3>
                    <p className="text-gray-500 mb-4">
                      {materialSearch || materialCategoryFilter 
                        ? 'No hay materiales con los filtros aplicados' 
                        : 'Empieza agregando tu primer material'
                      }
                    </p>
                    {!materialSearch && !materialCategoryFilter && (
                      <button
                        onClick={() => setShowAddMaterialModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                      >
                        ➕ Agregar Primer Material
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN HERRAMIENTAS */}
          {activeSection === 'herramientas' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">🔧 Gestión de Herramientas - {empresaData.nombre}</h2>
                  <p className="text-gray-600">Administrar lista de herramientas disponibles para los trabajadores</p>
                </div>
                <button
                  onClick={() => setShowAddToolModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Agregar Herramienta</span>
                </button>
              </div>

              {/* Filtros */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🔍 Buscar herramienta
                    </label>
                    <input
                      type="text"
                      value={toolSearch}
                      onChange={(e) => setToolSearch(e.target.value)}
                      placeholder="Nombre o descripción..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📂 Filtrar por categoría
                    </label>
                    <select
                      value={toolCategoryFilter}
                      onChange={(e) => setToolCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Todas las categorías</option>
                      {toolCategories.map(categoria => (
                        <option key={categoria} value={categoria}>{categoria}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setToolSearch('');
                        setToolCategoryFilter('');
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      🔄 Limpiar filtros
                    </button>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl">🔧</span>
                    <div className="ml-3">
                      <p className="text-sm text-purple-600">Total Herramientas</p>
                      <p className="text-2xl font-bold text-purple-800">{herramientas.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl">✅</span>
                    <div className="ml-3">
                      <p className="text-sm text-green-600">Disponibles</p>
                      <p className="text-2xl font-bold text-green-800">
                        {herramientas.filter(h => h.disponible !== false).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl">📂</span>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-600">Categorías</p>
                      <p className="text-2xl font-bold text-yellow-800">{toolCategories.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl">🔍</span>
                    <div className="ml-3">
                      <p className="text-sm text-orange-600">Filtradas</p>
                      <p className="text-2xl font-bold text-orange-800">{herramientasFiltradas.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de herramientas */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Herramienta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Condición
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {herramientasFiltradas.map((herramienta) => (
                        <tr key={herramienta.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {herramienta.nombre}
                              </div>
                              {herramienta.descripcion && (
                                <div className="text-sm text-gray-500">
                                  {herramienta.descripcion}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {herramienta.categoria || 'Sin categoría'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {herramienta.codigo || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              herramienta.disponible !== false 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {herramienta.disponible !== false ? '✅ Disponible' : '❌ No disponible'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              herramienta.condicion === 'excelente' ? 'bg-green-100 text-green-800' :
                              herramienta.condicion === 'buena' ? 'bg-blue-100 text-blue-800' :
                              herramienta.condicion === 'regular' ? 'bg-yellow-100 text-yellow-800' :
                              herramienta.condicion === 'mala' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {herramienta.condicion || 'Sin evaluar'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => {
                                setSelectedTool(herramienta);
                                setShowEditToolModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => deleteTool(herramienta.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              🗑️ Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {herramientasFiltradas.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔧</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron herramientas</h3>
                    <p className="text-gray-500 mb-4">
                      {toolSearch || toolCategoryFilter 
                        ? 'No hay herramientas con los filtros aplicados' 
                        : 'Empieza agregando tu primera herramienta'
                      }
                    </p>
                    {!toolSearch && !toolCategoryFilter && (
                      <button
                        onClick={() => setShowAddToolModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                      >
                        ➕ Agregar Primera Herramienta
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN INFORMES DIARIOS */}
          {activeSection === 'informes-obra' && (
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
                  onClick={loadInformesObra}
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
                              await window.db.collection('informes_obra').doc(informe.id).update({
                                leido: true,
                                fecha_lectura: firebase.firestore.FieldValue.serverTimestamp()
                              });
                              loadInformesObra();
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
            </div>
          )}

          {/* SECCIÓN REPORTES AVANZADOS */}
          {activeSection === 'reportes-avanzados' && (
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
            </div>
          )}

        </div>
      </div>
      
      {/* TODOS LOS MODALES CRUD */}
      
      {/* Modal crear usuario */}
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

      {/* Modal editar usuario */}
      {showEditUser && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditUser(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditUser(false);
            setSelectedUser(null);
            loadData();
            showNotification('Usuario actualizado exitosamente', 'success');
          }}
        />
      )}

      {/* Modal eliminar usuario */}
      {showDeleteUserModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2 text-red-600">
                ¿Eliminar Usuario Definitivamente?
              </h3>
              <div className="text-gray-700 mb-4">
                <p className="font-medium">{userToDelete.nombre} {userToDelete.apellido}</p>
                <p className="text-sm text-gray-500">{userToDelete.email}</p>
                <p className="text-sm text-gray-500">@{userToDelete.username}</p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
                <p className="text-red-800 text-sm">
                  <strong>⚠️ ADVERTENCIA:</strong> Esta acción NO se puede deshacer.
                </p>
                <p className="text-red-700 text-xs mt-1">
                  Se eliminará el usuario del backend Y Firebase: ubicaciones, mensajes, etc.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? '🔄 Eliminando...' : '🗑️ SÍ, ELIMINAR'}
              </button>
              <button
                onClick={cancelDeleteUser}
                disabled={isDeleting}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear obra */}
      {showCreateObra && (
        <CreateObraModal
          albaniles={albaniles}
          jefesDeObra={jefesDeObra}
          onClose={() => setShowCreateObra(false)}
          onSuccess={() => {
            setShowCreateObra(false);
            loadData();
            showNotification('Obra creada exitosamente', 'success');
          }}
        />
      )}

      {/* Modal editar obra */}
      {showEditObra && selectedObra && (
        <EditObraModal
          obra={selectedObra}
          albaniles={albaniles}
          jefesDeObra={jefesDeObra}
          onClose={() => {
            setShowEditObra(false);
            setSelectedObra(null);
          }}
          onSuccess={() => {
            setShowEditObra(false);
            setSelectedObra(null);
            loadData();
            showNotification('Obra actualizada exitosamente', 'success');
          }}
        />
      )}

      {/* Modal eliminar obra */}
      {showDeleteObraModal && obraToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2 text-red-600">
                ¿Eliminar Obra Definitivamente?
              </h3>
              <div className="text-gray-700 mb-4">
                <p className="font-medium">{obraToDelete.nombre}</p>
                <p className="text-sm text-gray-500">{obraToDelete.ubicacion}</p>
                <p className="text-sm text-gray-500">Estado: {getEstadoLabel(obraToDelete.estado)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
                <p className="text-red-800 text-sm">
                  <strong>⚠️ ADVERTENCIA:</strong> Esta acción NO se puede deshacer.
                </p>
                <p className="text-red-700 text-xs mt-1">
                  Se eliminarán todos los datos relacionados: informes, fotos, etc.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteObra}
                disabled={isDeletingObra}
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isDeletingObra ? '🔄 Eliminando...' : '🗑️ SÍ, ELIMINAR'}
              </button>
              <button
                onClick={cancelDeleteObra}
                disabled={isDeletingObra}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal generador de reportes con datos VIVEKA */}
      {showReportGenerator && (
        <ReportGeneratorViveka 
          tipo={reportType}
          datos={reportData}
          empresa={empresaData}
          onClose={() => setShowReportGenerator(false)}
        />
      )}

      {/* Modal material */}
      {showAddMaterialModal && (
        <MaterialModal
          onClose={() => setShowAddMaterialModal(false)}
          onSave={loadMateriales}
          categorias={materialCategories}
        />
      )}
      
      {showEditMaterialModal && selectedMaterial && (
        <MaterialModal
          material={selectedMaterial}
          onClose={() => {
            setShowEditMaterialModal(false);
            setSelectedMaterial(null);
          }}
          onSave={loadMateriales}
          categorias={materialCategories}
        />
      )}

      {/* Modal herramienta */}
      {showAddToolModal && (
        <ToolModal
          onClose={() => setShowAddToolModal(false)}
          onSave={loadHerramientas}
          categorias={toolCategories}
        />
      )}
      
      {showEditToolModal && selectedTool && (
        <ToolModal
          tool={selectedTool}
          onClose={() => {
            setShowEditToolModal(false);
            setSelectedTool(null);
          }}
          onSave={loadHerramientas}
          categorias={toolCategories}
        />
      )}
    </div>
  );
};

// ===== COMPONENTES AUXILIARES CRUD =====

// Modal para materiales
const MaterialModal = ({ material, onClose, onSave, categorias }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    unidad: '',
    precio_estimado: '',
    disponible: true,
    codigo: '',
    proveedor: '',
    stock_minimo: '',
    ...material
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const materialData = {
        ...formData,
        precio_estimado: formData.precio_estimado ? parseFloat(formData.precio_estimado) : null,
        stock_minimo: formData.stock_minimo ? parseInt(formData.stock_minimo) : null,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (material?.id) {
        await window.db.collection('materiales').doc(material.id).update(materialData);
        showNotification('✅ Material actualizado exitosamente');
      } else {
        materialData.created_at = firebase.firestore.FieldValue.serverTimestamp();
        await window.db.collection('materiales').add(materialData);
        showNotification('✅ Material creado exitosamente');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error guardando material:', error);
      showNotification('❌ Error al guardar material');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {material ? '✏️ Editar Material' : '➕ Agregar Material'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Cemento Portland"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: CEM-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción detallada del material"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                required
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Cemento">Cemento</option>
                <option value="Arena">Arena</option>
                <option value="Hierro">Hierro</option>
                <option value="Ladrillo">Ladrillo</option>
                <option value="Pintura">Pintura</option>
                <option value="Electricidad">Electricidad</option>
                <option value="Plomería">Plomería</option>
                <option value="Aislamiento">Aislamiento</option>
                <option value="Adhesivos">Adhesivos</option>
                <option value="Acabados">Acabados</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de medida *
              </label>
              <select
                required
                value={formData.unidad}
                onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar unidad</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="bolsa">Bolsas</option>
                <option value="m3">Metros cúbicos (m³)</option>
                <option value="m2">Metros cuadrados (m²)</option>
                <option value="m">Metros (m)</option>
                <option value="litros">Litros</option>
                <option value="unidad">Unidades</option>
                <option value="cajas">Cajas</option>
                <option value="rollos">Rollos</option>
                <option value="placas">Placas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio estimado ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.precio_estimado}
                onChange={(e) => setFormData({...formData, precio_estimado: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock mínimo
              </label>
              <input
                type="number"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({...formData, stock_minimo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.disponible}
                onChange={(e) => setFormData({...formData, disponible: e.target.value === 'true'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">✅ Disponible</option>
                <option value="false">❌ No disponible</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor
            </label>
            <input
              type="text"
              value={formData.proveedor}
              onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Proveedor ABC S.A."
            />
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
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : (material ? 'Actualizar' : 'Crear Material')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para herramientas
const ToolModal = ({ tool, onClose, onSave, categorias }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    codigo: '',
    disponible: true,
    condicion: 'buena',
    ubicacion_actual: '',
    responsable_actual: '',
    fecha_mantenimiento: '',
    observaciones: '',
    ...tool
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const toolData = {
        ...formData,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (tool?.id) {
        await window.db.collection('herramientas').doc(tool.id).update(toolData);
        showNotification('✅ Herramienta actualizada exitosamente');
      } else {
        toolData.created_at = firebase.firestore.FieldValue.serverTimestamp();
        await window.db.collection('herramientas').add(toolData);
        showNotification('✅ Herramienta creada exitosamente');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error guardando herramienta:', error);
      showNotification('❌ Error al guardar herramienta');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {tool ? '✏️ Editar Herramienta' : '➕ Agregar Herramienta'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: Martillo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: HER-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Descripción detallada de la herramienta"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                required
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Manuales">Manuales</option>
                <option value="Eléctricas">Eléctricas</option>
                <option value="Medición">Medición</option>
                <option value="Corte">Corte</option>
                <option value="Fijación">Fijación</option>
                <option value="Soldadura">Soldadura</option>
                <option value="Seguridad">Seguridad</option>
                <option value="Transporte">Transporte</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condición *
              </label>
              <select
                required
                value={formData.condicion}
                onChange={(e) => setFormData({...formData, condicion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="excelente">🟢 Excelente</option>
                <option value="buena">🔵 Buena</option>
                <option value="regular">🟡 Regular</option>
                <option value="mala">🔴 Mala</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación actual
              </label>
              <input
                type="text"
                value={formData.ubicacion_actual}
                onChange={(e) => setFormData({...formData, ubicacion_actual: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: Depósito Central"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.disponible}
                onChange={(e) => setFormData({...formData, disponible: e.target.value === 'true'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="true">✅ Disponible</option>
                <option value="false">❌ No disponible</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsable actual
              </label>
              <input
                type="text"
                value={formData.responsable_actual}
                onChange={(e) => setFormData({...formData, responsable_actual: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Nombre del responsable"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Último mantenimiento
              </label>
              <input
                type="date"
                value={formData.fecha_mantenimiento}
                onChange={(e) => setFormData({...formData, fecha_mantenimiento: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Observaciones adicionales sobre la herramienta"
              rows="2"
            />
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
              disabled={isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : (tool ? 'Actualizar' : 'Crear Herramienta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
    </div>
  );
};

// ===== COMPONENTES AUXILIARES CRUD =====

// Modal para crear usuario
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
      // 1. CREAR EN BACKEND (como antes)
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const backendUser = await response.json();
        
        // 2. CREAR EN FIREBASE (NUEVO - SINCRONIZACIÓN)
        if (window.FirebaseService && window.db) {
          try {
            console.log('🔥 Sincronizando usuario con Firebase...');
            await window.db.collection('usuarios').add({
              nombre: formData.nombre,
              email: formData.email,
              rol: formData.rol,
              activo: true,
              backendId: backendUser.id,
              username: formData.username,
              apellido: formData.apellido,
              created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Usuario sincronizado con Firebase');
          } catch (firebaseError) {
            console.warn('⚠️ Error sincronizando con Firebase:', firebaseError);
          }
        }
        
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
          <h3 className="text-lg font-semibold">➕ Crear Nuevo Usuario</h3>
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Creando...' : '➕ Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para editar usuario
const EditUserModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    rol: user.rol || 'albanil',
    activo: user.activo !== undefined ? user.activo : true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Actualizar en Firebase si existe
        if (window.db) {
          try {
            const firebaseSnapshot = await window.db.collection('usuarios')
              .where('backendId', '==', user.id).get();
            
            if (!firebaseSnapshot.empty) {
              const firebaseDoc = firebaseSnapshot.docs[0];
              await firebaseDoc.ref.update({
                nombre: formData.nombre,
                email: formData.email,
                rol: formData.rol,
                activo: formData.activo,
                username: formData.username,
                apellido: formData.apellido,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
              });
              console.log('✅ Usuario actualizado en Firebase');
            }
          } catch (firebaseError) {
            console.warn('⚠️ Error actualizando Firebase:', firebaseError);
          }
        }
        
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar usuario');
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
          <h3 className="text-lg font-semibold">✏️ Editar Usuario</h3>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">🟢 Activo</option>
              <option value="false">🔴 Inactivo</option>
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : '✏️ Actualizar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para crear obra
const CreateObraModal = ({ albaniles, jefesDeObra, onClose, onSuccess }) => {
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
        onSuccess();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">➕ Crear Nueva Obra</h3>
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
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : '➕ Crear Obra'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal para editar obra
const EditObraModal = ({ obra, albaniles, jefesDeObra, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: obra.nombre || '',
    ubicacion: obra.ubicacion || '',
    descripcion: obra.descripcion || '',
    albanil_asignado: obra.albanil_asignado || '',
    jefe_obra: obra.jefe_obra || '',
    latitud: obra.latitud || null,
    longitud: obra.longitud || null,
    estado: obra.estado || 'pendiente'
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
                  Estado *
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pendiente">⏳ Pendiente</option>
                  <option value="en_progreso">🚧 En Progreso</option>
                  <option value="completada">✅ Completada</option>
                  <option value="cancelada">❌ Cancelada</option>
                </select>
              </div>
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
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Actualizando...' : '✏️ Actualizar Obra'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Generador de reportes con datos VIVEKA
const ReportGeneratorViveka = ({ tipo, datos, empresa, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Simular generación de PDF con datos de VIVEKA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileName = `${empresa.nombre}_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('📄 PDF generado para VIVEKA:', fileName);
      console.log('🏗️ Empresa:', empresa);
      console.log('📊 Datos:', datos);
      
      // Crear contenido del PDF con datos de empresa
      const pdfContent = `
📄 REPORTE ${tipo.toUpperCase()} - ${empresa.nombre}

🏗️ EMPRESA: ${empresa.nombre}
📧 EMAIL: ${empresa.email}  
📞 TELÉFONO: ${empresa.telefono}
💼 ESLOGAN: ${empresa.eslogan}

📊 DATOS DEL REPORTE:
${JSON.stringify(datos, null, 2)}

📅 GENERADO: ${new Date().toLocaleString('es-ES')}
`;
      
      // Simular descarga
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`✅ PDF de ${empresa.nombre} generado exitosamente`);
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert('❌ Error al generar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      reporte_obras: 'Reporte de Obras',
      reporte_personal: 'Reporte de Personal', 
      reporte_ubicaciones: 'Reporte de Ubicaciones',
      relevamiento: 'Relevamiento Fotográfico',
      presupuesto: 'Presupuesto',
      estadisticas: 'Estadísticas Avanzadas',
      trabajo_diario: 'Informes de Trabajo',
      informe_obra: 'Informe de Obra'
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🏗️</div>
          <h3 className="text-lg font-semibold mb-2">{empresa.nombre}</h3>
          <h4 className="text-md font-medium mb-4">📄 Generar Reporte PDF</h4>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="text-sm text-blue-800">
              <p><strong>Tipo:</strong> {getTipoLabel(tipo)}</p>
              <p><strong>Empresa:</strong> {empresa.nombre}</p>
              <p><strong>Email:</strong> {empresa.email}</p>
              <p><strong>Teléfono:</strong> {empresa.telefono}</p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Se generará un reporte profesional con el logo y datos de <strong>{empresa.nombre}</strong>
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold ${
                isGenerating 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <span className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Generando...
                </span>
              ) : (
                `📄 Generar PDF ${empresa.nombre}`
              )}
            </button>
            
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.AdminPanel = AdminPanel;