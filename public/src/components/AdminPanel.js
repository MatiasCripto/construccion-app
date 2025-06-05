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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
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

      if (usuariosRes.ok) setUsuarios(usuariosData);
      if (obrasRes.ok) setObras(obrasData);
      if (albanilesRes.ok) setAlbaniles(albanilesData);
      if (jefesRes.ok) setJefesDeObra(jefesData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
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
        alert('Usuario desactivado exitosamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al desactivar usuario');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleEditObra = (obra) => {
    setEditingObra(obra);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navegación del panel */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('usuarios')}
          className={`py-2 px-4 font-medium ${
            activeSection === 'usuarios'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 Usuarios
        </button>
        <button
          onClick={() => setActiveSection('obras')}
          className={`py-2 px-4 font-medium ${
            activeSection === 'obras'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏗️ Gestionar Obras
        </button>
        <button
          onClick={() => setActiveSection('crear-obra')}
          className={`py-2 px-4 font-medium ${
            activeSection === 'crear-obra'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ➕ Crear Obra
        </button>
      </div>

      {/* Contenido del panel */}
      {activeSection === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h2>
            <button
              onClick={() => setShowCreateUser(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              + Crear Usuario
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map(usuario => (
                  <tr key={usuario.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {usuario.nombre} {usuario.apellido}
                        </div>
                        <div className="text-sm text-gray-500">{usuario.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getRoleLabel(usuario.rol)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {usuario.activo && usuario.rol !== 'admin' && (
                        <button
                          onClick={() => desactivarUsuario(usuario.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'obras' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Gestión de Obras</h2>
            <div className="text-sm text-gray-600">
              Total: {obras.length} obras
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {obras.map(obra => (
              <div key={obra.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{obra.nombre}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(obra.estado)}`}>
                      {getEstadoLabel(obra.estado)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">📍 Ubicación:</span> {obra.ubicacion}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">👷 Albañil:</span> {obra.albanil_nombre} {obra.albanil_apellido}
                    </p>
                    {obra.jefe_nombre && (
                      <p className="text-gray-600">
                        <span className="font-medium">👨‍💼 Jefe:</span> {obra.jefe_nombre} {obra.jefe_apellido}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleEditObra(obra)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                  >
                    ✏️ Editar Obra
                  </button>
                </div>
              </div>
            ))}
            
            {obras.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No hay obras creadas aún</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'crear-obra' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Crear Nueva Obra</h2>
          </div>
          <CreateObraForm 
            albaniles={albaniles} 
            jefesDeObra={jefesDeObra}
            onSuccess={loadData} 
          />
        </div>
      )}
      
      {/* Modal crear usuario */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => {
            setShowCreateUser(false);
            loadData();
          }}
        />
      )}

      {/* Modal editar obra */}
      {editingObra && (
        <EditObraModal
          obra={editingObra}
          albaniles={albaniles}
          jefesDeObra={jefesDeObra}
          onClose={() => setEditingObra(null)}
          onSuccess={() => {
            setEditingObra(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

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
        alert('Usuario creado exitosamente');
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
          <h3 className="text-lg font-semibold">Crear Nuevo Usuario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
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
                Apellido
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
              Usuario
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
              Email
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
              Contraseña
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
              Rol
            </label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="albanil">Albañil</option>
              <option value="jefe_obra">Jefe de Obra</option>
              <option value="logistica">Logística</option>
              <option value="admin">Administrador</option>
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
        alert('Obra creada exitosamente');
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
    <div className="bg-white rounded-lg shadow p-6">
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
                  {albanil.nombre} {albanil.apellido}
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
                  {jefe.nombre} {jefe.apellido}
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
        alert('Obra actualizada exitosamente');
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
                      {albanil.nombre} {albanil.apellido}
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
                      {jefe.nombre} {jefe.apellido}
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
                      Al cambiar el albañil asignado:
                    </p>
                    <ul className="text-yellow-700 text-sm mt-2 list-disc list-inside">
                      <li>La obra ya no aparecerá para el albañil anterior</li>
                      <li>El nuevo albañil podrá ver y trabajar en esta obra</li>
                      <li>Se mantendrá todo el historial de la obra</li>
                    </ul>
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

            {(!formData.latitud || !formData.longitud) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Debes seleccionar una ubicación en el mapa
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

window.AdminPanel = AdminPanel;