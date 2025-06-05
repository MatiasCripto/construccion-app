// const express = require('express');
// const path = require('path');
// const { execSync } = require('child_process');

// const app = express();
// const PORT = 3001;

// // Middleware para servir archivos estáticos
// app.use(express.static(path.join(__dirname, 'public')));

// // Ruta principal
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Proxy para API (opcional si usas puerto diferente)
// app.use('/api', (req, res) => {
//   // Redirigir al servidor principal
//   const url = `http://localhost:3000${req.url}`;
//   // Implementar proxy si es necesario
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Servidor de desarrollo móvil en http://localhost:${PORT}`);
//   console.log(`📱 Simula Android abriendo Chrome DevTools`);
  
//   // Abrir automáticamente Chrome con emulación
//   const chromeCommand = process.platform === 'win32' 
//     ? `start chrome --user-agent="Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36" --window-size=360,800 --device-scale-factor=3 http://localhost:${PORT}`
//     : `open -a "Google Chrome" --args --user-agent="Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36" --window-size=360,800 http://localhost:${PORT}`;
  
//   try {
//     execSync(chromeCommand);
//   } catch (error) {
//     console.log('Abre manualmente Chrome en http://localhost:3001');
//   }
// });