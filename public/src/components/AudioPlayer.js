const { useState, useRef, useEffect } = React;

const AudioPlayer = ({ audioUrl, duration = 0, className = "", autoPlay = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [playbackRate, setPlaybackRate] = useState(1);
    
    const audioRef = useRef(null);
    const progressRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Event listeners para el audio
        const handleLoadStart = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleLoadedMetadata = () => {
            setTotalDuration(audio.duration);
            setError(null);
        };
        
        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };
        
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };
        
        const handleError = (e) => {
            setError('Error al cargar el audio');
            setIsLoading(false);
            setIsPlaying(false);
            console.error('Audio error:', e);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        // Agregar event listeners
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        // Auto play si está habilitado
        if (autoPlay && audio.readyState >= 2) {
            togglePlay();
        }

        // Cleanup
        return () => {
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, [audioUrl, autoPlay]);

    // Formatear tiempo
    const formatTime = (time) => {
        if (isNaN(time)) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Toggle play/pause
    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        try {
            if (isPlaying) {
                audio.pause();
            } else {
                setError(null);
                await audio.play();
            }
        } catch (err) {
            console.error('Error al reproducir audio:', err);
            setError('Error al reproducir el audio');
            setIsPlaying(false);
        }
    };

    // Cambiar posición del audio
    const handleProgressClick = (e) => {
        const audio = audioRef.current;
        const progressBar = progressRef.current;
        if (!audio || !progressBar) return;

        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percentage = clickX / width;
        const newTime = percentage * totalDuration;
        
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    // Cambiar velocidad de reproducción
    const changePlaybackRate = () => {
        const audio = audioRef.current;
        if (!audio) return;

        const rates = [1, 1.25, 1.5, 2];
        const currentIndex = rates.indexOf(playbackRate);
        const nextIndex = (currentIndex + 1) % rates.length;
        const newRate = rates[nextIndex];
        
        audio.playbackRate = newRate;
        setPlaybackRate(newRate);
    };

    // Retroceder 15 segundos
    const skipBackward = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(0, audio.currentTime - 15);
    };

    // Avanzar 15 segundos
    const skipForward = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.min(totalDuration, audio.currentTime + 15);
    };

    // Calcular progreso
    const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

    if (error) {
        return (
            <div className={`audio-player-error p-3 bg-red-50 rounded-lg border border-red-200 ${className}`}>
                <div className="flex items-center space-x-2 text-red-700">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`audio-player bg-gray-50 rounded-lg p-3 border ${className}`}>
            {/* Audio element oculto */}
            <audio
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
            />

            <div className="flex items-center space-x-3">
                {/* Botón Play/Pause */}
                <button
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full p-2 transition-colors"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>

                {/* Controles adicionales en móvil */}
                <div className="hidden sm:flex items-center space-x-2">
                    <button
                        onClick={skipBackward}
                        className="text-gray-600 hover:text-gray-800 p-1"
                        title="Retroceder 15s"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2A5 5 0 0011 9H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>

                    <button
                        onClick={skipForward}
                        className="text-gray-600 hover:text-gray-800 p-1"
                        title="Avanzar 15s"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Barra de progreso y tiempo */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 font-mono">
                            {formatTime(currentTime)}
                        </span>
                        
                        <div 
                            ref={progressRef}
                            className="flex-1 bg-gray-300 rounded-full h-2 cursor-pointer"
                            onClick={handleProgressClick}
                        >
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        
                        <span className="text-xs text-gray-600 font-mono">
                            {formatTime(totalDuration)}
                        </span>
                    </div>
                </div>

                {/* Velocidad de reproducción */}
                <button
                    onClick={changePlaybackRate}
                    className="hidden sm:block text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded font-mono"
                    title="Cambiar velocidad"
                >
                    {playbackRate}x
                </button>
            </div>

            {/* Información del audio */}
            {totalDuration > 0 && (
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.797l-4-3A1 1 0 014 13V7a1 1 0 01.383-.924l4-3zM14 7a3 3 0 013 3v0a3 3 0 01-3 3" clipRule="evenodd" />
                        </svg>
                        <span>Audio • {formatTime(totalDuration)}</span>
                    </div>
                    
                    {isPlaying && (
                        <div className="flex items-center space-x-1">
                            <div className="w-1 h-3 bg-blue-500 rounded animate-pulse"></div>
                            <div className="w-1 h-2 bg-blue-400 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1 h-4 bg-blue-500 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-1 h-2 bg-blue-400 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

window.AudioPlayer = AudioPlayer;