const { useState, useEffect, useRef } = React;

const ChatComponent = ({ obraId, userId, userName, userRole }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [error, setError] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Emojis comunes para construcción
    const quickEmojis = ['👍', '👎', '✅', '❌', '⚠️', '🔧', '🏗️', '📐', '🎯', '💡', '🔥', '⭐'];

    useEffect(() => {
        if (obraId) {
            loadMessages();
            // Configurar listeners en tiempo real si usas Firebase
            setupRealtimeListeners();
        }
    }, [obraId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Simular carga de mensajes - reemplazar con Firebase
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const mockMessages = [
                {
                    id: 1,
                    userId: 'admin',
                    userName: 'Carlos Admin',
                    message: 'Buen trabajo en el avance de hoy',
                    timestamp: new Date(Date.now() - 3600000),
                    type: 'text',
                    userRole: 'admin'
                },
                {
                    id: 2,
                    userId: userId,
                    userName: userName,
                    message: 'Gracias! ¿Revisaste las fotos que subí?',
                    timestamp: new Date(Date.now() - 3000000),
                    type: 'text',
                    userRole: userRole
                },
                {
                    id: 3,
                    userId: 'admin',
                    userName: 'Carlos Admin',
                    message: '',
                    timestamp: new Date(Date.now() - 1800000),
                    type: 'audio',
                    audioUrl: 'https://res.cloudinary.com/dt6uqdij7/video/upload/v1234567890/sample_audio.webm',
                    audioDuration: 45,
                    userRole: 'admin'
                }
            ];
            
            setMessages(mockMessages);
        } catch (err) {
            console.error('Error cargando mensajes:', err);
            setError('Error al cargar mensajes');
        } finally {
            setIsLoading(false);
        }
    };

    const setupRealtimeListeners = () => {
        // Implementar listeners de Firebase aquí
        console.log('Setting up realtime listeners for obra:', obraId);
    };

    const sendMessage = async (messageData) => {
        if ((!messageData.message?.trim() && !messageData.audioUrl) || !obraId) return;

        try {
            const newMsg = {
                id: Date.now(),
                userId,
                userName,
                userRole,
                timestamp: new Date(),
                ...messageData
            };

            // Agregar mensaje optimistamente
            setMessages(prev => [...prev, newMsg]);
            setNewMessage('');
            
            // Aquí enviarías a Firebase
            console.log('Enviando mensaje:', newMsg);
            
            // Simular respuesta del servidor
            // await sendToFirebase(newMsg);
            
        } catch (err) {
            console.error('Error enviando mensaje:', err);
            setError('Error al enviar mensaje');
        }
    };

    const handleSendText = () => {
        sendMessage({
            message: newMessage.trim(),
            type: 'text'
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

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsLoading(true);
            
            // Subir archivo a Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'construccion_preset');
            
            const response = await fetch(
                'https://api.cloudinary.com/v1_1/dt6uqdij7/image/upload',
                {
                    method: 'POST',
                    body: formData
                }
            );
            
            const result = await response.json();
            
            if (result.secure_url) {
                sendMessage({
                    message: `Archivo: ${file.name}`,
                    type: 'file',
                    fileUrl: result.secure_url,
                    fileName: file.name,
                    fileType: file.type
                });
            }
        } catch (err) {
            console.error('Error subiendo archivo:', err);
            setError('Error al subir archivo');
        } finally {
            setIsLoading(false);
            setShowAttachments(false);
        }
    };

    const handleAudioRecorded = (audioData) => {
        sendMessage({
            message: '',
            type: 'audio',
            audioUrl: audioData.url,
            audioDuration: audioData.duration
        });
        setShowAudioRecorder(false);
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
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
        switch (role) {
            case 'admin': return 'bg-blue-500';
            case 'supervisor': return 'bg-green-500';
            case 'albañil': return 'bg-orange-500';
            default: return 'bg-gray-500';
        }
    };

    const renderMessage = (msg) => {
        const isOwnMessage = msg.userId === userId;
        
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
                                {msg.userName}
                            </span>
                        </div>
                    )}
                    
                    <div className={`rounded-lg px-4 py-2 ${
                        isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white border'
                    }`}>
                        {msg.type === 'text' && (
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        )}
                        
                        {msg.type === 'audio' && (
                            <div className="w-64">
                                <AudioPlayer 
                                    audioUrl={msg.audioUrl}
                                    duration={msg.audioDuration}
                                    className={isOwnMessage ? 'bg-blue-400' : 'bg-gray-50'}
                                />
                            </div>
                        )}
                        
                        {msg.type === 'file' && (
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium">{msg.fileName}</p>
                                    <p className="text-xs opacity-75">{msg.message}</p>
                                </div>
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

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando mensajes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-component flex flex-col h-full bg-gray-50">
            {/* Header del chat */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-800">Chat de Obra</h3>
                    <p className="text-sm text-gray-600">
                        {onlineUsers.length > 0 ? `${onlineUsers.length} usuario(s) en línea` : 'Chat grupal'}
                    </p>
                </div>
                <div className="flex space-x-2">
                    <button className="text-gray-600 hover:text-gray-800">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {messages.map(renderMessage)}
                
                {isTyping && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-white border rounded-lg px-4 py-2 max-w-xs">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Grabador de audio modal */}
            {showAudioRecorder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Grabar Audio</h3>
                                <button
                                    onClick={() => setShowAudioRecorder(false)}
                                    className="text-gray-500 hover:text-gray-700"
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

            {/* Input area */}
            <div className="bg-white border-t p-4">
                {/* Emoji picker */}
                {showEmojiPicker && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-6 gap-2">
                            {quickEmojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="text-2xl hover:bg-gray-200 rounded p-1 transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Attachments menu */}
                {showAttachments && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowAudioRecorder(true)}
                                className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm">Audio</span>
                            </button>
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm">Foto</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Main input area */}
                <div className="flex items-end space-x-2">
                    <button
                        onClick={() => setShowAttachments(!showAttachments)}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
                            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="1"
                            maxLength="1000"
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
                        disabled={!newMessage.trim() || isLoading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </div>

                {/* File input oculto */}
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                />
            </div>
        </div>
    );
};

window.ChatComponent = ChatComponent;