const { useState, useEffect } = React;

const AlbanilWorkflow = ({ obra, user, onUpdate }) => {
  const [progreso, setProgreso] = useState([]);
  const [pasoActual, setPasoActual] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadProgreso();
  }, [obra.id]);

  const loadProgreso = async () => {
    try {
      const response = await fetch(`/api/progreso/obra/${obra.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProgreso(data);
        // Determinar paso actual (primer paso no completado)
        const siguientePaso = data.find(p => !p.completado);
        if (siguientePaso) {
          setPasoActual(siguientePaso.paso);
        } else {
          setPasoActual(5); // Todos los pasos completados
        }
      }
    } catch (err) {
      console.error('Error al cargar progreso:', err);
    } finally {
      setLoading(false);
    }
  };

  const completarPaso = async (paso, comentarios = '') => {
    try {
      const response = await fetch(`/api/progreso/obra/${obra.id}/paso/${paso}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ comentarios })
      });

      if (response.ok) {
        loadProgreso();
        onUpdate();
        alert('¡Paso completado exitosamente!');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al completar paso');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const getPasoInfo = (numeroP) => {
    const pasos = {
      1: {
        titulo: '📷 Paso 1: Fotos de Llegada',
        descripcion: 'Toma fotos del estado inicial del área de trabajo antes de comenzar',
        instrucciones: 'Saca al menos 2 fotos del área donde vas a trabajar para documentar el estado inicial.',
        icono: '🏁'
      },
      2: {
        titulo: '🧱 Paso 2: Solicitar Materiales',
        descripcion: 'Solicita todos los materiales que necesitarás para realizar el trabajo',
        instrucciones: 'Revisa la lista de materiales disponibles y solicita las cantidades que necesites.',
        icono: '📋'
      },
      3: {
        titulo: '🔨 Paso 3: Realizar Trabajo',
        descripcion: 'Ejecuta el trabajo asignado. Puedes chatear con el jefe de obra si tienes dudas',
        instrucciones: 'Realiza el trabajo según las especificaciones. Usa el chat si necesitas ayuda.',
        icono: '⚒️'
      },
      4: {
        titulo: '✅ Paso 4: Fotos Finales',
        descripcion: 'Documenta el trabajo completado con fotos finales',
        instrucciones: 'Toma fotos del trabajo terminado para confirmar que está completo.',
        icono: '🎯'
      }
    };
    return pasos[numeroP] || {};
  };

  const isPasoCompletado = (numero) => {
    const paso = progreso.find(p => p.paso === numero);
    return paso && paso.completado;
  };

  const isPasoActivo = (numero) => {
    return pasoActual === numero;
  };

  const isPasoDisponible = (numero) => {
    if (numero === 1) return true;
    return isPasoCompletado(numero - 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pasoActual === 5) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">¡Trabajo Completado!</h2>
          <p className="text-green-600">Has completado todos los pasos correctamente.</p>
        </div>
        <button
          onClick={() => setShowChat(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          💬 Chat con Jefe de Obra
        </button>
        
        {showChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Chat - {obra.nombre}</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <ChatComponent obraId={obra.id} user={user} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Indicador de Progreso */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map(numero => {
            const completado = isPasoCompletado(numero);
            const activo = isPasoActivo(numero);
            const disponible = isPasoDisponible(numero);
            
            return (
              <div key={numero} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  completado 
                    ? 'bg-green-500 text-white' 
                    : activo 
                      ? 'bg-blue-500 text-white'
                      : disponible
                        ? 'bg-gray-300 text-gray-600'
                        : 'bg-gray-200 text-gray-400'
                }`}>
                  {completado ? '✓' : numero}
                </div>
                {numero < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    isPasoCompletado(numero) ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenido del Paso Actual */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{getPasoInfo(pasoActual).icono}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getPasoInfo(pasoActual).titulo}
          </h2>
          <p className="text-gray-600 mb-4">
            {getPasoInfo(pasoActual).descripcion}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              📝 {getPasoInfo(pasoActual).instrucciones}
            </p>
          </div>
        </div>

        {/* Contenido específico del paso */}
        <div className="mb-6">
          {pasoActual === 1 && (
            <Paso1FotosIniciales 
              obra={obra} 
              user={user} 
              onCompletar={() => completarPaso(1)}
            />
          )}
          
          {pasoActual === 2 && (
            <Paso2SolicitarMateriales 
              obra={obra} 
              user={user} 
              onCompletar={() => completarPaso(2)}
            />
          )}
          
          {pasoActual === 3 && (
            <Paso3RealizarTrabajo 
              obra={obra} 
              user={user} 
              onCompletar={() => completarPaso(3)}
            />
          )}
          
          {pasoActual === 4 && (
            <Paso4FotosFinales 
              obra={obra} 
              user={user} 
              onCompletar={() => completarPaso(4)}
            />
          )}
        </div>

        {/* Chat siempre disponible */}
        <div className="border-t pt-6">
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center"
          >
            💬 {showChat ? 'Ocultar Chat' : 'Chat con Jefe de Obra'}
          </button>
          
          {showChat && (
            <div className="mt-4 border border-gray-200 rounded-lg p-4">
              <ChatComponent obraId={obra.id} user={user} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para Paso 1: Fotos Iniciales
const Paso1FotosIniciales = ({ obra, user, onCompletar }) => {
  const [fotosSubidas, setFotosSubidas] = useState(0);
  
  return (
    <div>
      <PhotoUploadStep 
        obraId={obra.id} 
        user={user} 
        tipoRequired="inicio"
        minFotos={2}
        onFotosChange={setFotosSubidas}
      />
      
      {fotosSubidas >= 2 && (
        <div className="mt-6 text-center">
          <button
            onClick={onCompletar}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg"
          >
            ✅ Completar Paso 1
          </button>
        </div>
      )}
    </div>
  );
};

// Componente para Paso 2: Solicitar Materiales
const Paso2SolicitarMateriales = ({ obra, user, onCompletar }) => {
  const [materialesSolicitados, setMaterialesSolicitados] = useState(false);
  
  return (
    <div>
      <MaterialSelectorStep 
        obraId={obra.id} 
        user={user}
        onMaterialesSolicitados={() => setMaterialesSolicitados(true)}
      />
      
      {materialesSolicitados && (
        <div className="mt-6 text-center">
          <button
            onClick={onCompletar}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg"
          >
            ✅ Completar Paso 2
          </button>
        </div>
      )}
    </div>
  );
};

// Componente para Paso 3: Realizar Trabajo
const Paso3RealizarTrabajo = ({ obra, user, onCompletar }) => {
  return (
    <div className="text-center space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-yellow-800 mb-2">
          🔨 Tiempo de Trabajar
        </h3>
        <p className="text-yellow-700">
          Realiza el trabajo según las especificaciones. Usa el chat si necesitas ayuda del jefe de obra.
        </p>
      </div>
      
      <div>
        <PhotoUploadStep 
          obraId={obra.id} 
          user={user} 
          tipoRequired="progreso"
          minFotos={0}
          opcional={true}
          titulo="Fotos de Progreso (Opcional)"
        />
      </div>
      
      <button
        onClick={onCompletar}
        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg"
      >
        ✅ Trabajo Terminado - Ir al Paso 4
      </button>
    </div>
  );
};

// Componente para Paso 4: Fotos Finales
const Paso4FotosFinales = ({ obra, user, onCompletar }) => {
  const [fotosSubidas, setFotosSubidas] = useState(0);
  
  return (
    <div>
      <PhotoUploadStep 
        obraId={obra.id} 
        user={user} 
        tipoRequired="final"
        minFotos={2}
        onFotosChange={setFotosSubidas}
        titulo="Fotos del Trabajo Completado"
      />
      
      {fotosSubidas >= 2 && (
        <div className="mt-6 text-center">
          <button
            onClick={onCompletar}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg"
          >
            🎉 ¡Finalizar Obra!
          </button>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para subir fotos con validación
const PhotoUploadStep = ({ obraId, user, tipoRequired, minFotos, onFotosChange, opcional = false, titulo }) => {
  const [fotos, setFotos] = useState([]);
  const [uploading, setUploading] = useState(false);

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
        const fotosTipo = data.fotos.filter(f => f.tipo === tipoRequired);
        setFotos(fotosTipo);
        if (onFotosChange) {
          onFotosChange(fotosTipo.length);
        }
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
      const uploadResponse = await fetch('/api/upload-foto', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();
      
      if (uploadResponse.ok) {
        const response = await fetch('/api/fotos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            obra_id: obraId,
            filename: uploadData.filename,
            tipo: tipoRequired,
            descripcion: `Foto de ${tipoRequired}`
          })
        });

        if (response.ok) {
          loadFotos();
          event.target.value = '';
          alert('Foto subida exitosamente');
        }
      }
    } catch (err) {
      alert('Error al subir foto');
    } finally {
      setUploading(false);
    }
  };

  const fotosRestantes = Math.max(0, minFotos - fotos.length);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {titulo || `📷 Fotos de ${tipoRequired}`}
        {!opcional && minFotos > 0 && (
          <span className="text-sm text-gray-600 ml-2">
            (Mínimo {minFotos} fotos)
          </span>
        )}
      </h3>
      
      {fotosRestantes > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            📸 Necesitas subir {fotosRestantes} foto{fotosRestantes > 1 ? 's' : ''} más
          </p>
        </div>
      )}
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="w-full"
        />
        {uploading && (
          <div className="mt-2 text-blue-600">Subiendo foto...</div>
        )}
      </div>
      
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {fotos.map(foto => (
            <div key={foto.id} className="relative">
              <img
                src={`/uploads/fotos/${foto.filename}`}
                alt="Foto de obra"
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                ✓
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para solicitar materiales
const MaterialSelectorStep = ({ obraId, user, onMaterialesSolicitados }) => {
  return (
    <div>
      <MaterialSelectorSimplified 
        obraId={obraId} 
        user={user}
        onSolicitudEnviada={onMaterialesSolicitados}
      />
    </div>
  );
};

// Versión simplificada del MaterialSelector para el workflow
const MaterialSelectorSimplified = ({ obraId, user, onSolicitudEnviada }) => {
  const [materiales, setMateriales] = useState([]);
  const [selectedMateriales, setSelectedMateriales] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMateriales();
  }, []);

  const loadMateriales = async () => {
    try {
      const response = await fetch('/api/materiales', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMateriales(data);
      }
    } catch (err) {
      console.error('Error al cargar materiales:', err);
    }
  };

  const addMaterial = () => {
    setSelectedMateriales([...selectedMateriales, { material_id: '', cantidad: 1 }]);
  };

  const updateMaterial = (index, field, value) => {
    const updated = [...selectedMateriales];
    updated[index][field] = value;
    setSelectedMateriales(updated);
  };

  const removeMaterial = (index) => {
    setSelectedMateriales(selectedMateriales.filter((_, i) => i !== index));
  };

  const submitSolicitud = async () => {
    if (selectedMateriales.length === 0) {
      alert('Selecciona al menos un material');
      return;
    }

    const materialesValidos = selectedMateriales.filter(m => m.material_id && m.cantidad > 0);
    if (materialesValidos.length === 0) {
      alert('Completa la información de los materiales');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/materiales/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          obra_id: obraId,
          materiales: materialesValidos
        })
      });

      if (response.ok) {
        setSelectedMateriales([]);
        alert('Materiales solicitados exitosamente');
        onSolicitudEnviada();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al solicitar materiales');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">🧱 Seleccionar Materiales Necesarios</h3>
      
      <div className="space-y-4">
        {selectedMateriales.map((item, index) => (
          <div key={index} className="flex space-x-4 items-end p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <select
                value={item.material_id}
                onChange={(e) => updateMaterial(index, 'material_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar material</option>
                {materiales.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.nombre} ({material.unidad})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                value={item.cantidad}
                onChange={(e) => updateMaterial(index, 'cantidad', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={() => removeMaterial(index)}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ✕
            </button>
          </div>
        ))}
        
        <div className="flex space-x-2">
          <button
            onClick={addMaterial}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Agregar Material
          </button>
          
          {selectedMateriales.length > 0 && (
            <button
              onClick={submitSolicitud}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Enviando...' : '📨 Enviar Solicitud'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

window.AlbanilWorkflow = AlbanilWorkflow;