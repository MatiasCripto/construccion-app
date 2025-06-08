// src/components/ChatComponent.js - CON VALIDACIÓN DE DATOS
const { useState, useEffect, useRef } = React;

const ChatComponent = ({ obraId, userId, userName, userRole }) => {
    // ==================== VALIDACIÓN INICIAL ====================
    
    // Generar datos por defecto si no se proporcionan
    const validUserId = userId || `user_${Date.now()}`;
    const validUserName = userName || 'Usuario Anónimo';
    const validUserRole = userRole || 'albañil';
    const validObraId = obraId || '1';

    // Log para debugging
    useEffect(() => {
        console.log('🔍 ChatComponent Props:', {
            originalUserId: userId,
            originalUserName: userName,
            originalUserRole: userRole,
            originalObraId: obraId,
            validUserId,
            validUserName,
            validUserRole,
            validObraId
        });
    }, []);

    // Estados principales
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    // Estados UI
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    
    // Referencias
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const unsubscribeRef = useRef(null);

    // Configuración
    const quickEmojis = ['👍', '👎', '✅', '❌', '⚠️', '🔧', '🏗️', '📐', '🎯', '💡', '🔥', '⭐'];

    // ==================== EFECTOS ====================
    
    useEffect(() => {
        if (validObraId && window.FirebaseService) {
            initializeChat();
        } else {
            setError('Firebase no está disponible o falta el ID de obra');
            setIsLoading(false);
        }

        return () => {
            cleanup();
        };
    }, [validObraId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ==================== FUNCIONES PRINCIPALES ====================

    const initializeChat = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            console.log('🚀 Inicializando chat para obra:', validObraId);
            
            await loadMessages();
            setupRealtimeListeners();
            setIsConnected(true);
            
        } catch (err) {
            console.error('❌ Error inicializando chat:', err);
            setError('Error conectando al chat: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async () => {
        try {
            console.log('📥 Cargando mensajes existentes...');
            
            const mensajes = await window.FirebaseService.getMensajes(validObraId);
            
            const mensajesConvertidos = mensajes
                .map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp?.toDate() || new Date(msg.timestamp) || new Date()
                }))
                .sort((a, b) => a.timestamp - b.timestamp);
            
            setMessages(mensajesConvertidos);
            console.log(`✅ ${mensajesConvertidos.length} mensajes cargados`);
            
        } catch (err) {
            console.error('❌ Error cargando mensajes:', err);
            // No lanzar error, solo mostrar aviso
            setError('No se pudieron cargar mensajes anteriores');
            setMessages([]); // Empezar con chat vacío
        }
    };

    const setupRealtimeListeners = () => {
        try {
            console.log('🔥 Configurando listeners en tiempo real...');
            
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
            
            unsubscribeRef.current = window.FirebaseService.listenToMensajes(validObraId, (snapshot) => {
                try {
                    console.log('📨 Actualización en tiempo real recibida');
                    
                    const mensajes = snapshot.docs
                        .map(doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                ...data,
                                timestamp: data.timestamp?.toDate() || new Date(data.timestamp) || new Date()
                            };
                        })
                        .sort((a, b) => a.timestamp - b.timestamp);
                    
                    setMessages(mensajes);
                    setIsConnected(true);
                    setError(null);
                    
                } catch (err) {
                    console.error('❌ Error procesando mensajes:', err);
                    setError('Error sincronizando mensajes');
                }
            });
            
            console.log('✅ Listeners configurados');
            
        } catch (err) {
            console.error('❌ Error configurando listeners:', err);
            setError('Error conectando tiempo real');
            setIsConnected(false);
        }
    };

    const cleanup = () => {
        console.log('🧹 Limpiando recursos del chat...');
        
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
    };

    // ==================== ENVÍO DE MENSAJES ====================

    const sendMessage = async (messageData) => {
        if (!validateMessage(messageData) || !validObraId) return;

        try {
            setIsSending(true);
            setError(null);
            
            // VALIDAR TODOS LOS CAMPOS REQUERIDOS
            const mensaje = {
                userId: validUserId,           // ✅ Siempre válido
                userName: validUserName,       // ✅ Siempre válido  
                userRole: validUserRole,       // ✅ Siempre válido
                obraId: validObraId,          // ✅ Siempre válido
                timestamp: new Date(),         // ✅ Siempre válido
                ...messageData
            };

            // Log para debugging
            console.log('📤 Enviando mensaje con datos:', {
                userId: mensaje.userId,
                userName: mensaje.userName,
                userRole: mensaje.userRole,
                obraId: mensaje.obraId,
                tipo: mensaje.type,
                tieneTimestamp: !!mensaje.timestamp
            });
            
            // VERIFICAR QUE NO HAY CAMPOS UNDEFINED
            for (const [key, value] of Object.entries(mensaje)) {
                if (value === undefined) {
                    throw new Error(`Campo ${key} es undefined - no se puede enviar`);
                }
            }

            // ENVÍO REAL A FIREBASE
            await window.FirebaseService.addMensaje(validObraId, mensaje);
            console.log('✅ Mensaje enviado exitosamente');
            
            setNewMessage('');
            setTimeout(scrollToBottom, 100);
            
        } catch (err) {
            console.error('❌ Error enviando mensaje:', err);
            setError(`Error enviando mensaje: ${err.message}`);
            showErrorToast('No se pudo enviar el mensaje. Verifica tu conexión.');
            
        } finally {
            setIsSending(false);
        }
    };

    const validateMessage = (messageData) => {
        return messageData.message?.trim() || 
               messageData.audioUrl || 
               messageData.fileUrl;
    };

    const handleSendText = () => {
        if (!newMessage.trim() || isSending) return;
        
        sendMessage({
            message: newMessage.trim(),
            type: 'text'
        });
    };

    const handleAudioRecorded = (audioData) => {
        console.log('🎙️ Audio grabado:', audioData);
        
        sendMessage({
            message: `🎙️ Audio (${Math.floor(audioData.duration)}s)`,
            type: 'audio',
            audioUrl: audioData.url,
            audioDuration: audioData.duration
        });
        
        setShowAudioRecorder(false);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showErrorToast('El archivo es muy grande (máximo 10MB)');
            return;
        }

        try {
            setIsLoading(true);
            console.log('📷 Subiendo archivo:', file.name);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'construccion_preset');
            formData.append('folder', `obra-${validObraId}`);
            
            const endpoint = file.type.startsWith('image/') 
                ? 'https://api.cloudinary.com/v1_1/dt6uqdij7/image/upload'
                : 'https://api.cloudinary.com/v1_1/dt6uqdij7/raw/upload';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.secure_url) {
                const fileType = file.type.startsWith('image/') ? 'image' : 'file';
                
                sendMessage({
                    message: `${fileType === 'image' ? '📷' : '📎'} ${file.name}`,
                    type: fileType,
                    fileUrl: result.secure_url,
                    fileName: file.name,
                    fileType: file.type
                });
                
                console.log('✅ Archivo subido:', result.secure_url);
            }
            
        } catch (err) {
            console.error('❌ Error subiendo archivo:', err);
            showErrorToast('Error subiendo archivo. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
            setShowAttachments(false);
            e.target.value = '';
        }
    };

    // ==================== FUNCIONES UI ====================

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
        messageInputRef.current?.focus();
    };

    const showErrorToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            return 'Ahora';
        } else if (diffInHours < 24) {
            return date.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const getUserColor = (role) => {
        const colors = {
            admin: 'bg-blue-500',
            supervisor: 'bg-green-500',
            albañil: 'bg-orange-500',
            cliente: 'bg-purple-500',
            default: 'bg-gray-500'
        };
        return colors[role] || colors.default;
    };

    const getUserBadge = (role) => {
        const badges = {
            admin: '👑',
            supervisor: '🛠️',
            albañil: '👷',
            cliente: '🏠'
        };
        return badges[role] || '👤';
    };

    // ==================== RENDER MENSAJES ====================

    const renderMessage = (msg) => {
        const isOwnMessage = msg.userId === validUserId;
        
        return (
            <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
            >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {!isOwnMessage && (
                        <div className="flex items-center mb-1">
                            <div className={`w-2 h-2 rounded-full mr-2 ${getUserColor(msg.userRole)}`}></div>
                            <span className="text-xs text-gray-600 font-medium">
                                {getUserBadge(msg.userRole)} {msg.userName}
                            </span>
                        </div>
                    )}
                    
                    <div className={`rounded-lg px-4 py-2 shadow-sm ${
                        isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white border'
                    }`}>
                        {msg.type === 'text' && (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        )}
                        
                        {msg.type === 'audio' && (
                            <div className="w-64 max-w-full">
                                <AudioPlayer 
                                    audioUrl={msg.audioUrl}
                                    duration={msg.audioDuration}
                                    className={isOwnMessage ? 'bg-blue-400' : 'bg-gray-50'}
                                />
                            </div>
                        )}
                        
                        {(msg.type === 'image' || msg.type === 'file') && (
                            <div>
                                {msg.type === 'image' ? (
                                    <div className="mb-2">
                                        <img 
                                            src={msg.fileUrl} 
                                            alt={msg.fileName}
                                            className="max-w-full h-auto rounded cursor-pointer"
                                            onClick={() => window.open(msg.fileUrl, '_blank')}
                                            loading="lazy"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2 mb-2">
                                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{msg.fileName}</p>
                                        </div>
                                        <button
                                            onClick={() => window.open(msg.fileUrl, '_blank')}
                                            className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded"
                                        >
                                            Ver
                                        </button>
                                    </div>
                                )}
                                <p className="text-xs opacity-90">{msg.message}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className={`text-xs text-gray-500 mt-1 ${
                        isOwnMessage ? 'text-right' : 'text-left'
                    }`}>
                        {formatTimestamp(msg.timestamp)}
                    </div>
                </div>
            </div>
        );
    };

    // ==================== RENDER PRINCIPAL ====================

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">🔥 Conectando con Firebase...</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Usuario: {validUserName} ({validUserRole})
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-component flex flex-col h-full bg-gray-50">
            {/* ==================== HEADER ==================== */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="font-semibold text-gray-800 flex items-center">
                        💬 Chat de Obra
                    </h3>
                    <p className="text-sm text-gray-600">
                        {validUserName} • {validUserRole} • {messages.length} mensaje(s)
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-500">
                        {isConnected ? 'En vivo' : 'Sin conexión'}
                    </span>
                </div>
            </div>

            {/* ==================== MENSAJES ==================== */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-red-700 text-sm">{error}</span>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-500 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {messages.length === 0 && !isLoading && (
                    <div className="text-center text-gray-500 py-12">
                        <div className="text-6xl mb-4">💬</div>
                        <h3 className="text-lg font-medium mb-2">¡Inicia la conversación!</h3>
                        <p className="text-sm mb-4">No hay mensajes aún en esta obra</p>
                        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-sm text-blue-700">
                                💡 Como <strong>{validUserName}</strong>, puedes enviar texto, fotos y audios
                            </p>
                        </div>
                    </div>
                )}

                {messages.map(renderMessage)}
                
                {isSending && (
                    <div className="flex justify-end mb-4">
                        <div className="bg-blue-100 border border-blue-200 rounded-lg px-4 py-2 max-w-xs">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-blue-700">Enviando...</span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* ==================== MODAL AUDIO ==================== */}
            {showAudioRecorder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">🎙️ Grabar Audio</h3>
                                <button
                                    onClick={() => setShowAudioRecorder(false)}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <AudioRecorder onAudioRecorded={handleAudioRecorded} />
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== INPUT AREA ==================== */}
            <div className="bg-white border-t p-4 shadow-lg">
                {showEmojiPicker && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                        <div className="grid grid-cols-6 gap-2">
                            {quickEmojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="text-2xl hover:bg-gray-200 rounded p-2 transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {showAttachments && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowAudioRecorder(true)}
                                className="flex items-center space-x-2 p-3 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">🎙️ Audio</span>
                            </button>
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2 p-3 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">📷 Foto</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-end space-x-2">
                    <button
                        onClick={() => setShowAttachments(!showAttachments)}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                    </button>

                    <div className="flex-1">
                        <textarea
                            ref={messageInputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Escribe un mensaje..."
                            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="1"
                            maxLength="1000"
                            disabled={isSending}
                        />
                    </div>

                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <span className="text-xl">😊</span>
                    </button>

                    <button
                        onClick={handleSendText}
                        disabled={!newMessage.trim() || isSending}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors flex items-center space-x-1"
                    >
                        {isSending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        )}
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                />
            </div>
        </div>
    );
};

window.ChatComponent = ChatComponent;