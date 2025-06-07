const { useState, useRef, useEffect } = React;

const AudioRecorder = ({ onAudioRecorded, disabled = false }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    // Limpiar al desmontar
    useEffect(() => {
        return () => {
            stopRecording();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            setError(null);
            
            console.log('🎙️ Solicitando permiso de micrófono...');
            
            // Solicitar acceso al micrófono JUSTO cuando se necesita
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                } 
            });
            
            console.log('✅ Permiso de micrófono concedido');
            
            streamRef.current = stream;
            chunksRef.current = [];

            // Detectar mejor formato soportado
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = 'audio/wav';
                        if (!MediaRecorder.isTypeSupported(mimeType)) {
                            mimeType = ''; // Usar default
                        }
                    }
                }
            }

            console.log('🎵 Usando formato:', mimeType || 'default');

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType || undefined,
                audioBitsPerSecond: 128000
            });

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                    console.log('📦 Chunk grabado:', event.data.size, 'bytes');
                }
            };

            mediaRecorder.onstop = () => {
                console.log('⏹️ Grabación detenida, creando blob...');
                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
                console.log('✅ Blob creado:', blob.size, 'bytes');
                setAudioBlob(blob);
                
                // Detener stream
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('❌ Error en MediaRecorder:', event.error);
                setError('Error durante la grabación: ' + event.error);
            };

            mediaRecorder.start(1000); // Chunk cada segundo
            setIsRecording(true);
            setRecordingTime(0);
            console.log('🔴 Grabación iniciada');

        } catch (err) {
            console.error('❌ Error al iniciar grabación:', err);
            
            if (err.name === 'NotAllowedError') {
                setError('🚫 Permiso de micrófono denegado. Ve a configuración de la app y permite el acceso al micrófono.');
            } else if (err.name === 'NotFoundError') {
                setError('🎙️ No se encontró micrófono en el dispositivo');
            } else if (err.name === 'NotSupportedError') {
                setError('📱 Tu dispositivo no soporta grabación de audio');
            } else if (err.name === 'NotReadableError') {
                setError('🔧 El micrófono está siendo usado por otra app');
            } else {
                setError('❌ Error inesperado: ' + err.message);
            }
        }
    };

    const togglePause = () => {
        if (!mediaRecorderRef.current) return;

        try {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                setIsPaused(false);
                console.log('▶️ Grabación reanudada');
            } else {
                mediaRecorderRef.current.pause();
                setIsPaused(true);
                console.log('⏸️ Grabación pausada');
            }
        } catch (err) {
            console.error('Error al pausar/reanudar:', err);
            setError('Error al pausar grabación');
        }
    };

    const stopRecording = () => {
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                console.log('🛑 Deteniendo grabación...');
            }
            setIsRecording(false);
            setIsPaused(false);
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        } catch (err) {
            console.error('Error al detener grabación:', err);
        }
    };

    const cancelRecording = () => {
        console.log('❌ Cancelando grabación...');
        stopRecording();
        setAudioBlob(null);
        setRecordingTime(0);
        setError(null);
    };

    const uploadAudio = async () => {
        if (!audioBlob) return;

        setIsUploading(true);
        setError(null);

        try {
            console.log('☁️ Subiendo audio a Cloudinary...', audioBlob.size, 'bytes');
            
            const formData = new FormData();
            formData.append('file', audioBlob, `audio_${Date.now()}.webm`);
            formData.append('upload_preset', 'construccion_preset');
            formData.append('resource_type', 'video'); // Para audio

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
            console.log('✅ Audio subido exitosamente:', result.secure_url);
            
            // Llamar callback con información del audio
            onAudioRecorded({
                url: result.secure_url,
                duration: recordingTime,
                publicId: result.public_id,
                format: result.format
            });

            // Limpiar estado
            setAudioBlob(null);
            setRecordingTime(0);

        } catch (err) {
            console.error('❌ Error al subir audio:', err);
            setError('Error al subir el audio. Verifica tu conexión e intenta nuevamente.');
        } finally {
            setIsUploading(false);
        }
    };

    const playPreview = () => {
        if (!audioBlob) return;

        try {
            console.log('🔊 Reproduciendo preview...');
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.play().catch(err => {
                console.error('Error reproduciendo preview:', err);
                setError('Error al reproducir audio');
            });

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                console.log('🔇 Preview terminado');
            };
        } catch (err) {
            console.error('Error creando preview:', err);
            setError('Error al crear preview del audio');
        }
    };

    const openMicrophoneSettings = () => {
        if (window.Capacitor?.isNativePlatform()) {
            alert('Ve a:\nConfiguración → Apps → Construcción Pro → Permisos → Micrófono\n\nY activa el permiso manualmente');
        } else {
            alert('En tu navegador:\n1. Toca el icono de candado 🔒 en la barra de direcciones\n2. Permite el acceso al micrófono\n3. Recarga la página');
        }
    };

    // Verificar si el navegador soporta grabación
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return (
            <div className="audio-recorder bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-center">
                    <div className="text-red-500 text-4xl mb-2">🚫</div>
                    <h3 className="font-semibold text-red-800 mb-2">No compatible</h3>
                    <p className="text-red-700 text-sm">Tu dispositivo no soporta grabación de audio</p>
                </div>
            </div>
        );
    }

    return (
        <div className="audio-recorder bg-white rounded-lg p-4 shadow-lg border">
            {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-700 text-sm mb-2">{error}</div>
                    <button
                        onClick={openMicrophoneSettings}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                        ⚙️ Ir a Configuración
                    </button>
                </div>
            )}

            {!isRecording && !audioBlob && (
                <div className="text-center">
                    <button
                        onClick={startRecording}
                        disabled={disabled || isUploading}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-full p-4 transition-colors touch-target"
                        title="Iniciar grabación"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="mt-2 text-sm text-gray-600">
                        Toca para grabar audio
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        Se solicitará permiso de micrófono
                    </div>
                </div>
            )}

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
                            className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-3 transition-colors touch-target"
                            title={isPaused ? "Reanudar" : "Pausar"}
                        >
                            {isPaused ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={stopRecording}
                            className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-3 transition-colors touch-target"
                            title="Detener grabación"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <button
                            onClick={cancelRecording}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 transition-colors touch-target"
                            title="Cancelar grabación"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                        {isPaused ? "⏸️ Grabación pausada" : "🔴 Grabando..."}
                    </div>
                </div>
            )}

            {audioBlob && !isRecording && (
                <div className="text-center">
                    <div className="mb-4">
                        <div className="text-lg font-semibold mb-2 text-green-600">
                            ✅ Audio grabado - {formatTime(recordingTime)}
                        </div>
                        
                        <div className="flex justify-center space-x-3 mb-4">
                            <button
                                onClick={playPreview}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 transition-colors touch-target"
                                title="Reproducir preview"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
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
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>Enviar Audio</span>
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
                </div>
            )}
        </div>
    );
};

window.AudioRecorder = AudioRecorder;