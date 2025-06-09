// src/components/UserModal.js - Modal para crear/editar usuarios
const { useState } = React;

const UserModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    rol: user?.rol || 'albanil',
    activo: user?.activo !== undefined ? user.activo : true
  });
  const [loading, setLoading] = useState(false);

  const isEditing = !!user;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        // EDITAR USUARIO
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
      } else {
        // CREAR USUARIO
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
          
          // Crear en Firebase (sincronización)
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
          <h3 className="text-lg font-semibold">
            {isEditing ? '✏️ Editar Usuario' : '➕ Crear Nuevo Usuario'}
          </h3>
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
          
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!isEditing}
                minLength="6"
              />
            </div>
          )}
          
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

          {isEditing && (
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
          )}
          
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
              {loading ? 'Guardando...' : (isEditing ? '✏️ Actualizar Usuario' : '➕ Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.UserModal = UserModal;