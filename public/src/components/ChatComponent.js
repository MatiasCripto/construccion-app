const { useState, useEffect, useRef } = React;

const ChatComponent = ({ obraId, user }) => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Conectar Socket.IO
    const newSocket = io();
    setSocket(newSocket);
    
    // Unirse a la sala de la obra
    newSocket.emit('join-obra', obraId);
    
    // Escuchar nuevos mensajes
    newSocket.on('new-message', (mensaje) => {
      setMensajes(prev => [...prev, mensaje]);
    });
    
    loadMensajes();
    
    return () => {
      newSocket.disconnect();
    };
  }, [obraId]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMensajes = async () => {
    try {
      const response = await fetch(`/api/chat/obra/${obraId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMensajes(data);
      }
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
    } finally {
      setLoading(false);
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    try {
      const response = await fetch(`/api/chat/obra/${obraId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ mensaje: nuevoMensaje })
      });

      if (response.ok) {
        const mensaje = await response.json();
        
        // Emitir mensaje via Socket.IO
        if (socket) {
          socket.emit('send-message', {
            obraId,
            ...mensaje
          });
        }
        
        setNuevoMensaje('');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al enviar mensaje');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Hoy ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getRoleBadge = (rol) => {
    const badges = {
      admin: '👑 Admin',
      jefe_obra: '👨‍💼 Jefe',
      logistica: '📦 Logística',
      albanil: '👷 Albañil'
    };
    return badges[rol] || rol;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4">
        {mensajes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay mensajes aún. ¡Inicia la conversación!</p>
        ) : (
          mensajes.map(mensaje => (
            <div
              key={mensaje.id}
              className={`flex ${mensaje.usuario_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  mensaje.usuario_id === user.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {mensaje.usuario_id !== user.id && (
                  <div className="text-xs font-medium mb-1">
                    <span className="mr-2">{getRoleBadge(mensaje.rol)}</span>
                    {mensaje.nombre} {mensaje.apellido}
                  </div>
                )}
                <p className="text-sm">{mensaje.mensaje}</p>
                <p className={`text-xs mt-1 ${
                  mensaje.usuario_id === user.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatFecha(mensaje.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Formulario de envío */}
      <form onSubmit={enviarMensaje} className="flex space-x-2 mt-4">
        <input
          type="text"
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!nuevoMensaje.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          💬 Enviar
        </button>
      </form>
    </div>
  );
};

window.ChatComponent = ChatComponent;