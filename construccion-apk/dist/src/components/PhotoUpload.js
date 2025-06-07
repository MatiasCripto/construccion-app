const { useState, useEffect } = React;

const PhotoUpload = ({ obraId, user }) => {
  const [fotos, setFotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState('progreso');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    loadFotos();
  }, [obraId]);

  const loadFotos = async () => {
    try {
      const response = await fetch(`/api/obras/${obraId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.fotos) {
        setFotos(data.fotos);
      }
    } catch (err) {
      console.error('Error al cargar fotos:', err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('foto', file);

    try {
      // Subir la foto
      const uploadResponse = await fetch('/api/upload-foto', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();
      
      if (uploadResponse.ok) {
        // Guardar información de la foto en la base de datos
        const response = await fetch('/api/fotos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            obra_id: obraId,
            filename: uploadData.filename,
            tipo: selectedTipo,
            descripcion: descripcion
          })
        });

        if (response.ok) {
          loadFotos();
          setDescripcion('');
          event.target.value = '';
          alert('Foto subida exitosamente');
        } else {
          const error = await response.json();
          alert(error.error || 'Error al guardar información de la foto');
        }
      } else {
        alert(uploadData.error || 'Error al subir la foto');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES');
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      inicio: '🏁 Inicio',
      progreso: '🔄 Progreso', 
      final: '✅ Final'
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Subir nueva foto */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">📷 Subir Nueva Foto</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de foto
            </label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="inicio">Foto de inicio</option>
              <option value="progreso">Foto de progreso</option>
              <option value="final">Foto final</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Describe la foto..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          
          {uploading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Subiendo foto...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Lista de fotos */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">📸 Fotos de la Obra</h3>
        
        {fotos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay fotos disponibles</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fotos.map(foto => (
              <div key={foto.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={`/uploads/fotos/${foto.filename}`}
                  alt={foto.descripcion || 'Foto de obra'}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">{getTipoLabel(foto.tipo)}</span>
                    <span className="text-xs text-gray-500">{formatFecha(foto.created_at)}</span>
                  </div>
                  {foto.descripcion && (
                    <p className="text-sm text-gray-600">{foto.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

window.PhotoUpload = PhotoUpload;