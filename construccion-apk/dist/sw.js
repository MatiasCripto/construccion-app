const CACHE_NAME = 'construccion-pro-v1.0.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/src/App.js',
  '/src/index.js',
  '/src/components/Login.js',
  '/src/components/Dashboard.js',
  '/src/components/MobileInterface.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.socket.io/4.7.2/socket.io.min.js'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('📱 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📁 Archivos cacheados');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', event => {
  // Estrategia: Cache First para recursos estáticos
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' ||
      event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
  // Estrategia: Network First para API calls
  else if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si es exitoso, guardarlo en cache
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME + '-api')
              .then(cache => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, usar cache
          return caches.match(event.request);
        })
    );
  }
  // Para todo lo demás, usar cache first
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});

// Manejar notificaciones push
self.addEventListener('push', event => {
  console.log('📢 Push recibido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Construcción Pro',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/xmark.png'
      },
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Construcción Pro', options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notificación clickeada:', event);
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Sincronización en background
self.addEventListener('sync', event => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-fotos') {
    event.waitUntil(syncPendingPhotos());
  }
  
  if (event.tag === 'sync-mensajes') {
    event.waitUntil(syncPendingMessages());
  }
});

// Funciones de sincronización
async function syncPendingPhotos() {
  // Sincronizar fotos pendientes cuando haya conexión
  const pendingPhotos = await getStoredData('pending-photos');
  
  for (const photo of pendingPhotos) {
    try {
      await uploadPhoto(photo);
      await removeStoredData('pending-photos', photo.id);
    } catch (error) {
      console.error('Error syncing photo:', error);
    }
  }
}

async function syncPendingMessages() {
  // Sincronizar mensajes pendientes
  const pendingMessages = await getStoredData('pending-messages');
  
  for (const message of pendingMessages) {
    try {
      await sendMessage(message);
      await removeStoredData('pending-messages', message.id);
    } catch (error) {
      console.error('Error syncing message:', error);
    }
  }
}

// Helpers para IndexedDB
function getStoredData(storeName) {
  return new Promise((resolve) => {
    // Implementar IndexedDB para almacenamiento offline
    resolve([]);
  });
}

function removeStoredData(storeName, id) {
  // Remover item del almacenamiento local
  return Promise.resolve();
}