const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const { initDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const obrasRoutes = require('./routes/obras');
const usuariosRoutes = require('./routes/usuarios');
const materialesRoutes = require('./routes/materiales');
const progresoRoutes = require('./routes/progreso');
const chatRoutes = require('./routes/chat');
const fotosRoutes = require('./routes/fotos');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/fotos';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Validar que sea una imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/materiales', materialesRoutes);
app.use('/api/progreso', progresoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/fotos', fotosRoutes);

// Ruta para subir fotos
app.post('/api/upload-foto', upload.single('foto'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna foto' });
  }
  res.json({ 
    message: 'Foto subida exitosamente',
    filename: req.file.filename,
    path: `/uploads/fotos/${req.file.filename}`
  });
});

// Socket.io para chat en tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  socket.on('join-obra', (obraId) => {
    socket.join(`obra-${obraId}`);
    console.log(`Usuario ${socket.id} se unió a obra-${obraId}`);
  });
  
  socket.on('send-message', (data) => {
    io.to(`obra-${data.obraId}`).emit('new-message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Manejo de errores de multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande (máximo 5MB)' });
    }
  }
  if (error.message === 'Solo se permiten archivos de imagen') {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para healthcheck
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


const PORT = process.env.PORT || 3000;

// Inicializar base de datos y servidor
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚧 Servidor de Construcción App ejecutándose en puerto ${PORT}`);
    console.log(`🌐 Accede a la aplicación en: http://localhost:${PORT}`);
    console.log(`📊 Health check disponible en: http://localhost:${PORT}/api/health`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
});