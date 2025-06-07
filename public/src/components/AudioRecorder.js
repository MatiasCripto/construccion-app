// src/components/AudioRecorder.js - VERSIÓN OPTIMIZADA FINAL
const { useState, useRef, useEffect } = React;

const AudioRecorder = ({ onAudioRecorded, disabled = false }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
    
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const isCleaningUpRef = useRef(false);

    // CLEANUP AGRESIVO al desmontar
    useEffect(() => {
        return () => {
            console.log('🧹 DESMONTANDO AudioRecorder - Cleanup total');
            forceCleanup();
        };
    }, []);

    // Timer para grabación
    useEffect(() => {
        if (isRecording && !isPaused) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRecording, isPaused]);

    // FUNCIÓN DE CLEANUP AGRESIVO
    const forceCleanup = () => {
        if (isCleaningUpRef.current) return;
        isCleaningUpRef.current = true;
        
        console.log('🔧 FORZANDO cleanup completo...');
        
        // 1. Detener MediaRecorder
        try {
            if (mediaRecorderRef.current) {
                if (mediaRecorderRef.current.state !== 'inactive') {
                    console.log('Deteniendo MediaRecorder:', mediaRecorderRef.current.state);
                    mediaRecorderRef.current.stop();
                }
                mediaRecorderRef.current = null;
            }
        } catch (e) {
            console.log('Error deteniendo MediaRecorder:', e);
        }
        
        // 2. Liberar stream AGRESIVAMENTE
        try {
            if (streamRef.current) {
                console.log('Liberando stream tracks...');
                streamRef.current.getTracks().forEach((track, index) => {
                    console.log(`Track ${index}: ${track.kind}, estado: ${track.readyState}`);
                    if (track.readyState === 'live') {
                        track.stop();
                        track.enabled = false;
                    }
                });
                streamRef.current = null;
            }
        } catch (e) {
            console.log('Error liberando stream:', e);
        }
        
        // 3. Limpiar timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        // 4. Resetear estado
        setIsRecording(false);
        setIsPaused(false);
        
        console.log('✅ Cleanup completado');
        
        // Permitir cleanup futuro
        setTimeout(() => {
            isCleaningUpRef.current = false;
        }, 1000);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // VERIFICAR PERMISOS
    const checkMicrophonePermission = async () => {
        try {
            if (navigator.permissions) {
                const result = await navigator.permissions.query({ name: 'microphone' });
                console.log('Estado del permiso:', result.state);
                setPermissionStatus(result.state);
                return result.state === 'granted';
            }
            return false;
        } catch (err) {
            console.log('No se puede verificar permisos:', err);
            return false;
        }
    };

    // INICIAR GRABACIÓN OPTIMIZADA
    const startRecording = async () => {
        try {
            setError(null);
            console.log('🎙️ === INICIANDO GRABACIÓN ===');
            
            // Cleanup previo por si hay restos
            forceCleanup();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verificar permisos primero
            const hasPermission = await checkMicrophonePermission();
            console.log('Permiso verificado:', hasPermission);
            
            // Solicitar micrófono con configuración optimizada para Android
            console.log('Solicitando acceso al micrófono...');
            
            const constraints = {
                audio: {
                    echoCancellation: false, // Simplificar para Android
                    noiseSuppression: false, // Simplificar para Android
                    autoGainControl: false,  // Simplificar para Android
                    sampleRate: 44100
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Stream obtenido:', stream.getTracks().length, 'tracks');
            
            // Verificar que el stream está activo
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                throw new Error('No se encontraron tracks de audio');
            }
            
            console.log('Track de audio:', audioTracks[0].kind, audioTracks[0].readyState);
            streamRef.current = stream;
            chunksRef.current = [];

            // Detectar mejor formato para Android
            let mimeType = '';
            const testTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg',
                'audio/wav'
            ];
            
            for (const type of testTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    break;
                }
            }
            
            console.log('🎵 Formato seleccionado:', mimeType || 'default');

            // Configurar MediaRecorder
            const recorderOptions = {
                audioBitsPerSecond: 64000 // Reducir bitrate para Android
            };
            
            if (mimeType) {
                recorderOptions.mimeType = mimeType;
            }

            const mediaRecorder = new MediaRecorder(stream, recorderOptions);
            mediaRecorderRef.current = mediaRecorder;

            // Event listeners
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                    console.log('📦 Chunk:', event.data.size, 'bytes');
                }
            };

            mediaRecorder.onstop = () => {
                console.log('⏹️ MediaRecorder detenido');
                try {
                    const blob = new Blob(chunksRef.current, { 
                        type: mimeType || 'audio/webm' 
                    });
                    console.log('✅ Blob creado:', blob.size, 'bytes');
                    setAudioBlob(blob);
                } catch (err) {
                    console.error('Error creando blob:', err);
                    setError('Error procesando audio grabado');
                }
                
                // Limpiar stream después de crear blob
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => {
                        track.stop();
                        track.enabled = false;
                    });
                    streamRef.current = null;
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('❌ Error MediaRecorder:', event.error);
                setError('Error durante grabación: ' + event.error);
                forceCleanup();
            };

            // Iniciar grabación
            mediaRecorder.start(1000);
            setIsRecording(true);
            setRecordingTime(0);
            setPermissionStatus('granted');
            
            console.log('🔴 GRABACIÓN INICIADA');

        } catch (err) {
            console.error('❌ Error completo:', err);
            
            // Cleanup en caso de error
            forceCleanup();
            
            // Mensajes específicos de error
            if (err.name === 'NotAllowedError') {
                setError('🚫 Permiso denegado. Ve a Configuración → Apps → Construcción Pro → Permisos → Micrófono');
                setPermissionStatus('denied');
            } else if (err.name === 'NotFoundError') {
                setError('🎙️ No se encontró micrófono');
            } else if (err.name === 'NotSupportedError') {
                setError('📱 Grabación no soportada');
            } else if (err.name === 'NotReadableError') {
                setError('🔧 Micrófono ocupado. Cierra otras apps y reinicia el teléfono.');
            } else if (err.name === 'AbortError') {
                setError('⏹️ Grabación interrumpida');
            } else {
                setError('❌ Error: ' + err.message);
            }
        }
    };

    const stopRecording = () => {
        try {
            console.log('🛑 Deteniendo grabación...');
            
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            
            setIsRecording(false);
            setIsPaused(false);
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            
        } catch (err) {
            console.error('Error al detener:', err);
            forceCleanup();
        }
    };

    const cancelRecording = () => {
        console.log('❌ CANCELANDO grabación');
        forceCleanup();
        setAudioBlob(null);
        setRecordingTime(0);
        setError(null);
    };

    const togglePause = () => {
        if (!mediaRecorderRef.current) return;

        try {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                setIsPaused(false);
                console.log('▶️ Reanudado');
            } else {
                mediaRecorderRef.current.pause();
                setIsPaused(true);
                console.log('⏸️ Pausado');
            }
        } catch (err) {
            console.error('Error pause/resume:', err);
            setError('Error al pausar');
        }
    };

    const uploadAudio = async () => {
        if (!audioBlob) return;

        setIsUploading(true);
        setError(null);

        try {
            console.log('☁️ Subiendo audio...', audioBlob.size, 'bytes');
            
            const formData = new FormData();
            formData.append('file', audioBlob, `audio_${Date.now()}.webm`);
            formData.append('upload_preset', 'construccion_preset');
            formData.append('resource_type', 'video');

            const response = await fetch(
                'https://api.cloudinary.com/v1_1/dt6uqdij7/video/upload',
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Subido:', result.secure_url);
            
            onAudioRecorded({
                url: result.secure_url,
                duration: recordingTime,
                publicId: result.public_id,
                format: result.format
            });

            setAudioBlob(null);
            setRecordingTime(0);

        } catch (err) {
            console.error('❌ Error subida:', err);
            setError('Error al subir. Verifica conexión.');
        } finally {
            setIsUploading(false);
        }
    };

    const playPreview = () => {
        if (!audioBlob) return;

        try {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.play().catch(err => {
                console.error('Error preview:', err);
                setError('Error reproduciendo preview');
            });

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };
        } catch (err) {
            console.error('Error creando preview:', err);
        }
    };

    const openMicrophoneSettings = () => {
        alert('Ve a:\nConfiguración → Apps → Construcción Pro → Permisos → Micrófono\n\nActívalo y reinicia la app');
    };

    // Verificar soporte
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return (
            <div className="audio-recorder bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-center">
                    <div className="text-red-500 text-4xl mb-2">🚫</div>
                    <h3 className="font-semibold text-red-800 mb-2">No compatible</h3>
                    <p className="text-red-700 text-sm">Dispositivo no soporta grabación</p>
                </div>
            </div>
        );
    }

    return (
        <div className="audio-recorder bg-white rounded-lg p-4 shadow-lg border">
            {/* Error Display */}
            {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-700 text-sm mb-2">{error}</div>
                    <div className="flex space-x-2">
                        <button
                            onClick={openMicrophoneSettings}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                            ⚙️ Configuración
                        </button>
                        <button
                            onClick={() => setError(null)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                            ✕ Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* Estado inicial */}
            {!isRecording && !audioBlob && (
                <div className="text-center">
                    <button
                        onClick={startRecording}
                        disabled={disabled || isUploading}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-full p-4 transition-colors touch-target"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="mt-2 text-sm text-gray-600">Toca para grabar</div>
                    <div className="mt-1 text-xs text-gray-500">
                        Estado: {permissionStatus === 'granted' ? '✅ Listo' : '🔄 Requiere permiso'}
                    </div>
                </div>
            )}

            {/* Grabando */}
            {isRecording && (
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-lg font-mono font-bold text-red-600">
                                {formatTime(recordingTime)}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-center space-x-3">
                        <button
                            onClick={togglePause}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-3 transition-colors"
                        >
                            {isPaused ? '▶️' : '⏸️'}
                        </button>

                        <button
                            onClick={stopRecording}
                            className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-3 transition-colors"
                        >
                            ⏹️
                        </button>

                        <button
                            onClick={cancelRecording}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 transition-colors"
                        >
                            ❌
                        </button>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                        {isPaused ? "⏸️ Pausado" : "🔴 Grabando..."}
                    </div>
                </div>
            )}

            {/* Audio grabado */}
            {audioBlob && !isRecording && (
                <div className="text-center">
                    <div className="text-lg font-semibold mb-2 text-green-600">
                        ✅ Audio listo - {formatTime(recordingTime)}
                    </div>
                    
                    <div className="flex justify-center space-x-3 mb-4">
                        <button
                            onClick={playPreview}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 transition-colors"
                        >
                            ▶️
                        </button>
                    </div>

                    <div className="flex justify-center space-x-3">
                        <button
                            onClick={uploadAudio}
                            disabled={isUploading}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Enviando...</span>
                                </>
                            ) : (
                                <>
                                    <span>📤</span>
                                    <span>Enviar</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={cancelRecording}
                            disabled={isUploading}
                            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

window.AudioRecorder = AudioRecorder;