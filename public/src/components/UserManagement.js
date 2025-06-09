// src/components/UserManagement.js - Gestión completa de usuarios
const { useState } = React;

const UserManagement = ({ usuarios, onDataChange, showNotification }) => {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      
      await onDataChange();
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

  const desactivarUsuario = async (userId) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    
    try {
      const response = await fetch(`/api/usuarios/${userId}/desactivar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        onDataChange();
        showNotification('Usuario desactivado exitosamente', 'success');
      } else {
        const error = await response.json();
        showNotification(error.error || 'Error al desactivar usuario', 'error');
      }
    } catch (err) {
      showNotification('Error de conexión', 'error');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
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

      {/* MODALES */}
      {showCreateUser && (
        <UserModal
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => {
            setShowCreateUser(false);
            onDataChange();
            showNotification('Usuario creado exitosamente', 'success');
          }}
        />
      )}

      {showEditUser && selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowEditUser(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditUser(false);
            setSelectedUser(null);
            onDataChange();
            showNotification('Usuario actualizado exitosamente', 'success');
          }}
        />
      )}

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
    </div>
  );
};

// Hacer disponible globalmente
window.UserManagement = UserManagement;