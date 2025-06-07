const { useState, useEffect } = React;

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('obras');
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadObras();
  }, []);

  const loadObras = async () => {
    try {
      const response = await fetch('/api/obras', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setObras(data);
      }
    } catch (err) {
      console.error('Error al cargar obras:', err);
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'obras':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {obras.map(obra => (
              <ObraCard key={obra.id} obra={obra} user={user} onUpdate={loadObras} />
            ))}
            {obras.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No hay obras disponibles</p>
              </div>
            )}
          </div>
        );
      case 'admin':
        return user.rol === 'admin' ? <AdminPanel /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🏗️ Construcción App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.nombre} {user.apellido}
                </p>
                <p className="text-xs text-gray-500">{getRoleLabel(user.rol)}</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('obras')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'obras'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Obras
            </button>
            {user.rol === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⚙️ Administración
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

window.Dashboard = Dashboard;