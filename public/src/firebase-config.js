// firebase-config.js - CONFIGURACIÓN FINAL: construccion-pro-3edcb
const firebaseConfig = {
  apiKey: "AIzaSyAuyZnuh4eGuDyoKJRQn1V2ZUQQksSipw0",
  authDomain: "construccion-pro-3edcb.firebaseapp.com",
  projectId: "construccion-pro-3edcb",
  storageBucket: "construccion-pro-3edcb.firebasestorage.app",
  messagingSenderId: "819477405278",
  appId: "1:819477405278:web:9cc8142f69455e76ca1ecf",
  measurementId: "G-6YBG0HTGVV"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar servicios
const db = firebase.firestore();
const storage = firebase.storage();

// Hacer disponible globalmente
window.db = db;
window.storage = storage;
window.firebase = firebase;

// Configurar configuraciones regionales si es necesario
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Servicio Firebase para operaciones comunes
const FirebaseService = {
  // ===== GESTIÓN DE USUARIOS =====
  async createUserDocument(userData) {
    try {
      console.log('🔨 Creando usuario:', userData);
      
      // Validar datos requeridos
      if (!userData.nombre || !userData.email || !userData.rol) {
        throw new Error('Faltan datos requeridos: nombre, email, rol');
      }

      // Limpiar y validar datos
      const cleanData = {
        nombre: String(userData.nombre || '').trim(),
        email: String(userData.email || '').trim().toLowerCase(),
        rol: String(userData.rol || '').trim().toLowerCase(),
        obra: userData.obra ? String(userData.obra).trim() : null,
        activo: userData.activo !== undefined ? Boolean(userData.activo) : true,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        ultimaActividad: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Validar rol
      const rolesValidos = ['administrador', 'logistica', 'jefe_obra', 'albañil'];
      if (!rolesValidos.includes(cleanData.rol)) {
        throw new Error(`Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}`);
      }

      // Generar ID único
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const userId = `user_${timestamp}_${randomString}`;

      console.log('📝 Datos limpios:', cleanData);
      console.log('🆔 ID generado:', userId);

      // Crear documento en Firestore
      await db.collection('usuarios').doc(userId).set(cleanData);

      console.log('✅ Usuario creado exitosamente con ID:', userId);
      return { id: userId, ...cleanData };
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      throw error;
    }
  },

  async getUserById(userId) {
    try {
      const doc = await db.collection('usuarios').doc(userId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      throw error;
    }
  },

  async getAllUsers() {
    try {
      const snapshot = await db.collection('usuarios').get();
      const users = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      return users;
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      throw error;
    }
  },

  async getUsersByRole(rol) {
    try {
      const snapshot = await db.collection('usuarios')
        .where('rol', '==', rol.toLowerCase())
        .get();
      const users = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      return users;
    } catch (error) {
      console.error('❌ Error obteniendo usuarios por rol:', error);
      throw error;
    }
  },

  async updateUser(userId, updates) {
    try {
      const cleanUpdates = {
        ...updates,
        ultimaActividad: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('usuarios').doc(userId).update(cleanUpdates);
      return { id: userId, ...cleanUpdates };
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      await db.collection('usuarios').doc(userId).delete();
      return true;
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      throw error;
    }
  },

  // ===== GESTIÓN DE OBRAS =====
  async createObra(obraData) {
    try {
      const cleanData = {
        nombre: String(obraData.nombre || '').trim(),
        descripcion: String(obraData.descripcion || '').trim(),
        ubicacion: obraData.ubicacion || null,
        fechaInicio: obraData.fechaInicio || null,
        fechaEstimadaFin: obraData.fechaEstimadaFin || null,
        estado: String(obraData.estado || 'planificacion').trim().toLowerCase(),
        presupuesto: obraData.presupuesto || null,
        responsable: obraData.responsable || null,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
      };

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const obraId = `obra_${timestamp}_${randomString}`;

      await db.collection('obras').doc(obraId).set(cleanData);
      return { id: obraId, ...cleanData };
    } catch (error) {
      console.error('❌ Error creando obra:', error);
      throw error;
    }
  },

  async getAllObras() {
    try {
      const snapshot = await db.collection('obras').get();
      const obras = [];
      snapshot.forEach(doc => {
        obras.push({ id: doc.id, ...doc.data() });
      });
      return obras;
    } catch (error) {
      console.error('❌ Error obteniendo obras:', error);
      throw error;
    }
  },

  // ===== GESTIÓN DE MENSAJES/CHAT =====
  async createMessage(messageData) {
    try {
      const cleanData = {
        contenido: String(messageData.contenido || '').trim(),
        tipo: String(messageData.tipo || 'texto').trim(), // 'texto', 'audio', 'imagen'
        autorId: String(messageData.autorId || '').trim(),
        autorNombre: String(messageData.autorNombre || '').trim(),
        obraId: messageData.obraId ? String(messageData.obraId).trim() : null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        leido: false,
        archivoUrl: messageData.archivoUrl || null
      };

      const messageRef = await db.collection('mensajes').add(cleanData);
      return { id: messageRef.id, ...cleanData };
    } catch (error) {
      console.error('❌ Error creando mensaje:', error);
      throw error;
    }
  },

  async getMessagesByObra(obraId) {
    try {
      const snapshot = await db.collection('mensajes')
        .where('obraId', '==', obraId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      return messages;
    } catch (error) {
      console.error('❌ Error obteniendo mensajes:', error);
      throw error;
    }
  },

  // ===== GESTIÓN DE UBICACIONES =====
  async saveUserLocation(userId, locationData) {
    try {
      const cleanData = {
        userId: String(userId).trim(),
        latitude: Number(locationData.latitude),
        longitude: Number(locationData.longitude),
        accuracy: locationData.accuracy || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        fecha: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      };

      const locationRef = await db.collection('user_locations').add(cleanData);
      return { id: locationRef.id, ...cleanData };
    } catch (error) {
      console.error('❌ Error guardando ubicación:', error);
      throw error;
    }
  },

  async getUserLocations(userId, limit = 10) {
    try {
      const snapshot = await db.collection('user_locations')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      const locations = [];
      snapshot.forEach(doc => {
        locations.push({ id: doc.id, ...doc.data() });
      });
      return locations;
    } catch (error) {
      console.error('❌ Error obteniendo ubicaciones:', error);
      throw error;
    }
  },

  async getLatestUserLocations() {
    try {
      // Obtener la ubicación más reciente de cada usuario
      const snapshot = await db.collection('user_locations')
        .orderBy('timestamp', 'desc')
        .get();
      
      const latestLocations = new Map();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!latestLocations.has(data.userId)) {
          latestLocations.set(data.userId, { id: doc.id, ...data });
        }
      });
      
      return Array.from(latestLocations.values());
    } catch (error) {
      console.error('❌ Error obteniendo ubicaciones recientes:', error);
      throw error;
    }
  },

  // ===== GESTIÓN DE ARCHIVOS (STORAGE) =====
  async uploadFile(file, path) {
    try {
      console.log('📁 Subiendo archivo:', file.name, 'a', path);
      
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const fullPath = `${path}/${fileName}`;
      
      const storageRef = storage.ref().child(fullPath);
      const uploadTask = await storageRef.put(file);
      
      const downloadURL = await uploadTask.ref.getDownloadURL();
      
      console.log('✅ Archivo subido exitosamente:', downloadURL);
      return {
        url: downloadURL,
        path: fullPath,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      throw error;
    }
  },

  async deleteFile(path) {
    try {
      const storageRef = storage.ref().child(path);
      await storageRef.delete();
      return true;
    } catch (error) {
      console.error('❌ Error eliminando archivo:', error);
      throw error;
    }
  },

  // ===== FUNCIONES DE UTILIDAD =====
  async asignarObraAUsuario(userId, obraId) {
    try {
      await this.updateUser(userId, { obra: obraId });
      return true;
    } catch (error) {
      console.error('❌ Error asignando obra:', error);
      throw error;
    }
  },

  async removerObraDeUsuario(userId) {
    try {
      await this.updateUser(userId, { obra: null });
      return true;
    } catch (error) {
      console.error('❌ Error removiendo obra:', error);
      throw error;
    }
  },

  async getUsuariosDisponibles() {
    try {
      const snapshot = await db.collection('usuarios')
        .where('obra', '==', null)
        .get();
      const users = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      return users;
    } catch (error) {
      console.error('❌ Error obteniendo usuarios disponibles:', error);
      throw error;
    }
  }
};

// Hacer disponible globalmente
window.FirebaseService = FirebaseService;

// Log de inicialización
console.log('🔥 Firebase inicializado correctamente');
console.log('📊 Proyecto:', firebaseConfig.projectId);
console.log('🗃️ Firestore habilitado');
console.log('📁 Storage habilitado');
console.log('✅ Todas las funciones disponibles');