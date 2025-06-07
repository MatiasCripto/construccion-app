const { useState, useRef, useEffect } = React;

const CameraComponent = ({ onPhotoTaken, obraId, currentLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [tipoFoto, setTipoFoto] = useState('progreso');
  const [descripcion, setDescripcion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' para frontal, 'environment' para trasera
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const openCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsOpen(true);
      
      // Esperar a que el video esté listo
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('No se puede acceder a la cámara. Verifica los permisos.');
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsOpen(false);
    setPhoto(null);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Configurar el canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Agregar metadata de ubicación y timestamp
    addPhotoMetadata(context, canvas.width, canvas.height);

    // Convertir a blob
    canvas.toBlob((blob) => {
      setPhoto(blob);
    }, 'image/jpeg', 0.8);

    // Detener la cámara temporalmente
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const addPhotoMetadata = (context, width, height) => {
    // Agregar timestamp
    const now = new Date();
    const timestamp = now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES');
    
    // Configurar texto
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, height - 80, width, 80);
    
    context.fillStyle = 'white';
    context.font = '16px Arial';
    context.fillText(`📅 ${timestamp}`, 10, height - 50);
    
    if (currentLocation) {
      context.fillText(`📍 ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`, 10, height - 25);
    }
    
    // Agregar marca de agua
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.font = 'bold 20px Arial';
    context.fillText('🏗️ Construcción Pro', width - 200, 30);
  };

  const retakePhoto = async () => {
    setPhoto(null);
    await openCamera();
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    if (stream) {
      closeCamera();
      setTimeout(() => {
        openCamera();
      }, 500);
    }
  };

  const uploadPhoto = async () => {
    if (!photo) return;

    setUploading(true);
    try {
      // Crear FormData para la foto
      const formData = new FormData();
      formData.append('foto', photo, `foto-${Date.now()}.jpg`);

      // Subir foto al servidor
      const uploadResponse = await fetch('/api/upload-foto', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir foto');
      }

      const uploadData = await uploadResponse.json();

      // Guardar metadata en la base de datos
      const metadata = {
        obra_id: obraId,
        filename: uploadData.filename,
        tipo: tipoFoto,
        descripcion: descripcion,
        coordenadas: currentLocation ? JSON.stringify(currentLocation) : null,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          device: navigator.userAgent,
          facingMode: facingMode
        })
      };

      const saveResponse = await fetch('/api/fotos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(metadata)
      });

      if (saveResponse.ok) {
        onPhotoTaken && onPhotoTaken();
        closeCamera();
        setDescripcion('');
        
        // Mostrar notificación de éxito
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('📷 Foto subida', {
            body: 'La foto se ha guardado exitosamente',
            icon: '/icons/icon-192x192.png'
          });
        }
        
        // Vibración de confirmación
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } else {
        throw new Error('Error al guardar información de la foto');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error al subir la foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (!isOpen && !photo) {
    return (
      <div className="text-center py-8">
        <button
          onClick={openCamera}
          className="bg-blue-500 text-white px-6 py-4 rounded-xl font-medium text-lg touch-target"
        >
          📷 Abrir Cámara
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video preview */}
      {isOpen && !photo && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Camera controls overlay */}
          <div className="absolute inset-0 flex flex-col">
            {/* Top controls */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
              <button
                onClick={closeCamera}
                className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white touch-target"
              >
                ✕
              </button>
              
              <div className="flex items-center space-x-2">
                <select
                  value={tipoFoto}
                  onChange={(e) => setTipoFoto(e.target.value)}
                  className="bg-black/50 text-white border border-white/30 rounded px-2 py-1 text-sm"
                >
                  <option value="inicio">🏁 Inicio</option>
                  <option value="progreso">🔄 Progreso</option>
                  <option value="final">✅ Final</option>
                </select>
                
                <button
                  onClick={switchCamera}
                  className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white touch-target"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Center area - tap to focus (future feature) */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg pointer-events-none">
                <div className="w-full h-full border border-white/30 rounded-lg m-1"></div>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="p-6 bg-gradient-to-t from-black/50 to-transparent">
              <div className="flex justify-center items-center">
                <button
                  onClick={takePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg touch-target flex items-center justify-center"
                >
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo preview and upload */}
      {photo && (
        <div className="relative w-full h-full bg-black">
          <img
            src={URL.createObjectURL(photo)}
            alt="Foto tomada"
            className="w-full h-full object-contain"
          />
          
          {/* Photo controls overlay */}
          <div className="absolute inset-0 flex flex-col">
            {/* Top bar */}
            <div className="p-4 bg-gradient-to-b from-black/50 to-transparent">
              <div className="flex justify-between items-center">
                <button
                  onClick={retakePhoto}
                  className="bg-black/50 text-white px-4 py-2 rounded-lg touch-target"
                >
                  🔄 Repetir
                </button>
                <span className="text-white font-medium">{tipoFoto}</span>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="mt-auto p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="space-y-3">
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción de la foto (opcional)..."
                  className="w-full bg-black/50 text-white border border-white/30 rounded-lg p-3 resize-none"
                  rows="2"
                />
                
                <div className="flex space-x-3">
                  <button
                    onClick={closeCamera}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium touch-target"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={uploadPhoto}
                    disabled={uploading}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium touch-target disabled:opacity-50"
                  >
                    {uploading ? '⏳ Subiendo...' : '✅ Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

// Componente de vista de fotos móvil
const MobilePhotoView = ({ obraId, user }) => {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoTaken = () => {
    setShowCamera(false);
    loadFotos();
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      inicio: '🏁 Inicio',
      progreso: '🔄 Progreso',
      final: '✅ Final'
    };
    return labels[tipo] || tipo;
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showCamera) {
    return (
      <CameraComponent
        onPhotoTaken={handlePhotoTaken}
        obraId={obraId}
        currentLocation={null} // Se pasará desde el componente padre
      />
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando fotos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botón para tomar foto */}
      <button
        onClick={() => setShowCamera(true)}
        className="w-full bg-blue-500 text-white py-4 rounded-xl font-medium text-lg touch-target flex items-center justify-center space-x-2"
      >
        <span>📷</span>
        <span>Tomar Nueva Foto</span>
      </button>

      {/* Lista de fotos */}
      {fotos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-gray-500 mb-4">No hay fotos aún</p>
          <button
            onClick={() => setShowCamera(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium"
          >
            Tomar Primera Foto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {fotos.map(foto => (
            <MobilePhotoCard key={foto.id} foto={foto} />
          ))}
        </div>
      )}
    </div>
  );
};

const MobilePhotoCard = ({ foto }) => {
  const [showFullscreen, setShowFullscreen] = useState(false);

  const getTipoLabel = (tipo) => {
    const labels = {
      inicio: '🏁',
      progreso: '🔄',
      final: '✅'
    };
    return labels[tipo] || '📷';
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div 
        className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square cursor-pointer"
        onClick={() => setShowFullscreen(true)}
      >
        <img
          src={`/uploads/fotos/${foto.filename}`}
          alt={foto.descripcion || 'Foto de obra'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Overlay con información */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex justify-between items-end">
              <span className="text-white text-lg">
                {getTipoLabel(foto.tipo)}
              </span>
              <span className="text-white text-xs">
                {formatFecha(foto.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de foto completa */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black z-50" onClick={() => setShowFullscreen(false)}>
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={`/uploads/fotos/${foto.filename}`}
              alt={foto.descripcion || 'Foto de obra'}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close button */}
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white touch-target"
            >
              ✕
            </button>
            
            {/* Info overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">
                  {getTipoLabel(foto.tipo)} {foto.tipo}
                </span>
                <span className="text-white text-sm">
                  {formatFecha(foto.created_at)}
                </span>
              </div>
              {foto.descripcion && (
                <p className="text-white text-sm">{foto.descripcion}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

window.CameraComponent = CameraComponent;
window.MobilePhotoView = MobilePhotoView;