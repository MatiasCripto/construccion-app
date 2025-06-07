const { useState, useRef, useEffect } = React;

const AudioRecorder = ({ onAudioRecorded, disabled = false }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [hasPermissions, setHasPermissions] = useState(null); // null = checking, true = yes, false = no
    const [showPermissionRequest, setShowPermissionRequest] = useState(false);
    
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    // Verificar permisos al cargar
    useEffect(() => {
        checkPermissionsOnLoad();
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

    const checkPermissionsOnLoad = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setHasPermissions(false);
                setError('Tu dispositivo no soporta grabación de audio');
                return;
            }

            // Verificar si hay dispositivos de audio disponibles
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasAudioInput = devices.some(device => device.kind === 'audioinput');
            
            if (!hasAudioInput) {
                setHasPermissions(false);
                setError('No se encontró micrófono en el dispositivo');
                return;
            }

            // Intentar verificar permisos sin solicitar acceso
            if (navigator.permissions) {
                try {
                    const result = await navigator.permissions.query({ name: 'microphone' });
                    if (result.state === 'granted') {
                        setHasPermissions(true);
                    } else if (result.state === 'denied') {
                        setHasPermissions(false);
                        setError('Permisos de micrófono denegados. Ve a configuración para habilitarlos.');
                    } else {
                        setHasPermissions(null); // Necesita solicitar permisos
                    }
                } catch (err) {
                    setHasPermissions(null); // No se puede verificar, solicitar cuando sea necesario
                }
            } else {
                setHasPermissions(null); // No se puede verificar, solicitar cuando sea necesario
            }
        } catch (err) {
            console.error('Error verificando permisos:', err);
            setHasPermissions(null);
        }
    };

    const requestPermissions = async () => {
        try {
            setError(null);
            setShowPermissionRequest(false);
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                } 
            });
            
            // Detener inmediatamente, solo estamos verificando permisos
            stream.getTracks().forEach(track => track.stop());
            
            setHasPermissions(true);
            console.log('✅ Permisos de micrófono concedidos');
            
        } catch (err) {
            console.error('❌ Error solicitando permisos:', err);
            setHasPermissions(false);
            
            if (err.name === 'NotAllowedError') {
                setError('Permisos de micrófono denegados. Ve a configuración de la app para habilitarlos.');
            } else if (err.name === 'NotFoundError') {
                setError('No se encontró micrófono en el dispositivo');
            } else {
                setError('Error al acceder al micrófono: ' + err.message);
            }
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            setError(null);
            
            // Si no sabemos el estado de permisos o están denegados, solicitar
            if (hasPermissions === null || hasPermissions === false) {
                setShowPermissionRequest(true);
                return;
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                } 
            });
            
            streamRef.current = stream;
            chunksRef.current = [];

            // Configurar MediaRecorder
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = '';
                    }
                }
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType || undefined,
                audioBitsPerSecond: 128000
            });

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
                setAudioBlob(blob);
                
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            setRecordingTime(0);

        } catch (err) {
            console.error('Error al iniciar grabación:', err);
            if (err.name === 'NotAllowedError') {
                setHasPermissions(false);
                setError('Permisos de micrófono denegados. Ve a configuración para habilitarlos.');
            } else if (err.name === 'NotFoundError') {
                setError('No se encontró micrófono en el dispositivo');
            } else {
                setError('Error al iniciar grabación: ' + err.message);
            }
        }
    };

    const togglePause = () => {
        if (!mediaRecorderRef.current) return;

        if (isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
        } else {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsPaused(false);
        
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
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
                throw new Error('Error al subir audio');
            }

            const result = await response.json();
            
            onAudioRecorded({
                url: result.secure_url,
                duration: recordingTime,
                publicId: result.public_id,
                format: result.format
            });

            setAudioBlob(null);
            setRecordingTime(0);

        } catch (err) {
            console.error('Error al subir audio:', err);
            setError('Error al subir el audio. Intenta nuevamente.');
        } finally {
            setIsUploading(false);
        }
    };

    const playPreview = () => {
        if (!audioBlob) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch(err => {
            console.error('Error al reproducir preview:', err);
        });

        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };
    };

    const openSettings = () => {
        if (window.Capacitor?.isNativePlatform()) {
            alert('Ve a Configuración > Apps > Construcción Pro > Permisos > Micrófono y actívalo');
        } else {
            alert('Ve a configuración del navegador y permite el acceso al micrófono para este sitio');
        }
    };

    // Pantalla de solicitud de permisos
    if (showPermissionRequest) {
        return (
            <div className="audio-recorder bg-white rounded-lg p-4 shadow-lg border">
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="w-16 h-16 mx-auto text-orange-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg font-semibold mb-2">🎙️ Permiso de Micrófono</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Para grabar audios necesitamos acceso al micrófono
                        </p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={requestPermissions}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                🔓 Permitir Micrófono
                            </button>
                            
                            <button
                                onClick={() => setShowPermissionRequest(false)}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Pantalla de error sin permisos
    if (hasPermissions === false) {
        return (
            <div className="audio-recorder bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-center">
                    <div className="text-red-500 text-4xl mb-2">🚫</div>
                    <h3 className="font-semibold text-red-800 mb-2">Micrófono no disponible</h3>
                    <p className="text-red-700 text-sm mb-4">{error}</p>
                    
                    <div className="space-y-2">
                        <button
                            onClick={checkPermissionsOnLoad}
                            className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            🔄 Reintentar
                        </button>
                        
                        <button
                            onClick={openSettings}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            ⚙️ Ir a Configuración
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Interfaz normal de grabación
    return (
        <div className="audio-recorder bg-white rounded-lg p-4 shadow-lg border">
            {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                </div>
            )}

            {!isRecording && !audioBlob && (
                <div className="text-center">
                    <button
                        onClick={startRecording}
                        disabled={disabled || isUploading}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-full p-4 transition-colors"
                        title="Iniciar grabación"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="mt-2 text-sm text-gray-600">
                        Toca para grabar audio
                    </div>
                </div>
            )}

            {isRecording && (
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-lg font-mono font-bold">
                                {formatTime(recordingTime)}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-center space-x-3">
                        <button
                            onClick={togglePause}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-3 transition-colors"
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
                            className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-3 transition-colors"
                            title="Detener grabación"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <button
                            onClick={cancelRecording}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 transition-colors"
                            title="Cancelar grabación"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                        {isPaused ? "Grabación pausada" : "Grabando..."}
                    </div>
                </div>
            )}

            {audioBlob && !isRecording && (
                <div className="text-center">
                    <div className="mb-4">
                        <div className="text-lg font-semibold mb-2">
                            Audio grabado - {formatTime(recordingTime)}
                        </div>
                        
                        <div className="flex justify-center space-x-3 mb-4">
                            <button
                                onClick={playPreview}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 transition-colors"
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
                                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
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
                                        <span>Enviar</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={cancelRecording}
                                disabled={isUploading}
                                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
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