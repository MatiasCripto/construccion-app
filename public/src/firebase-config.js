// firebase-config.js - PROYECTO: construccion-pro
const firebaseConfig = {
  apiKey: "AIzaSyC5CzhdmQ803qrXvXItmK-J6EwuKlTKVuo",
  authDomain: "construccion-pro.firebaseapp.com",
  projectId: "construccion-pro",
  storageBucket: "construccion-pro.firebasestorage.app",
  messagingSenderId: "724069842619",
  appId: "1:724069842619:web:9a472ca315f3ae7682339e",
  measurementId: "G-2Y6TG2PCQJ"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// SERVICIO FIREBASE COMPLETO
const FirebaseService = {
  // CREAR USUARIO DOCUMENT - ARREGLADO
  async createUserDocument(userData) {
    try {
      console.log('🔥 Creando usuario en Firebase:', userData);
      
      // VALIDAR Y LIMPIAR DATOS
      const cleanUserData = {
        nombre: String(userData.nombre || '').trim(),
        email: String(userData.email || '').trim().toLowerCase(),
        rol: String(userData.rol || 'albañil').trim(),
        obra: String(userData.obra || '').trim(),
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        activo: true,
        ultimaActividad: firebase.firestore.FieldValue.serverTimestamp()
      };

      // GENERAR ID ÚNICO VÁLIDO
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('📝 Datos limpiados:', cleanUserData);
      console.log('🆔 ID generado:', userId);

      // CREAR DOCUMENTO EN FIRESTORE
      const docRef = db.collection('usuarios').doc(userId);
      await docRef.set(cleanUserData);
      
      console.log('✅ Usuario creado exitosamente con ID:', userId);
      
      return {
        success: true,
        userId: userId,
        data: cleanUserData
      };
      
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      throw error;
    }
  },

  // OBTENER TODOS LOS USUARIOS
  async getAllUsers() {
    try {
      console.log('📥 Obteniendo todos los usuarios...');
      
      const snapshot = await db.collection('usuarios').get();
      const users = [];
      
      snapshot.forEach(doc => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`✅ ${users.length} usuarios obtenidos`);
      return users;
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      throw error;
    }
  },

  // ACTUALIZAR USUARIO
  async updateUser(userId, updateData) {
    try {
      console.log('📝 Actualizando usuario:', userId, updateData);
      
      // LIMPIAR DATOS DE ACTUALIZACIÓN
      const cleanUpdateData = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          cleanUpdateData[key] = String(updateData[key]).trim();
        }
      });
      
      cleanUpdateData.ultimaActividad = firebase.firestore.FieldValue.serverTimestamp();
      
      await db.collection('usuarios').doc(String(userId)).update(cleanUpdateData);
      
      console.log('✅ Usuario actualizado:', userId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      throw error;
    }
  },

  // ELIMINAR USUARIO
  async deleteUser(userId) {
    try {
      console.log('🗑️ Eliminando usuario:', userId);
      
      await db.collection('usuarios').doc(String(userId)).delete();
      
      console.log('✅ Usuario eliminado:', userId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      throw error;
    }
  },

  // CREAR OBRA
  async createObra(obraData) {
    try {
      console.log('🏗️ Creando obra:', obraData);
      
      const cleanObraData = {
        nombre: String(obraData.nombre || '').trim(),
        descripcion: String(obraData.descripcion || '').trim(),
        ubicacion: String(obraData.ubicacion || '').trim(),
        fechaInicio: obraData.fechaInicio || null,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        activa: true
      };

      const obraId = `obra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.collection('obras').doc(obraId).set(cleanObraData);
      
      console.log('✅ Obra creada:', obraId);
      return { success: true, obraId: obraId };
      
    } catch (error) {
      console.error('❌ Error creando obra:', error);
      throw error;
    }
  },

  // OBTENER OBRAS
  async getObras() {
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

  // AGREGAR MENSAJE AL CHAT
  async addMensaje(obraId, mensajeData) {
    try {
      console.log('💬 Agregando mensaje:', { obraId, mensajeData });
      
      const cleanMensajeData = {
        userId: String(mensajeData.userId || '').trim(),
        userName: String(mensajeData.userName || '').trim(),
        userRole: String(mensajeData.userRole || '').trim(),
        mensaje: String(mensajeData.mensaje || '').trim(),
        tipo: String(mensajeData.tipo || 'texto').trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        obraId: String(obraId).trim()
      };

      // Agregar campos específicos según el tipo
      if (mensajeData.audioUrl) {
        cleanMensajeData.audioUrl = String(mensajeData.audioUrl).trim();
      }
      if (mensajeData.duration) {
        cleanMensajeData.duration = Number(mensajeData.duration) || 0;
      }

      const mensajeId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.collection('mensajes').doc(mensajeId).set(cleanMensajeData);
      
      console.log('✅ Mensaje agregado:', mensajeId);
      return { success: true, mensajeId: mensajeId };
      
    } catch (error) {
      console.error('❌ Error agregando mensaje:', error);
      throw error;
    }
  },

  // OBTENER MENSAJES DE UNA OBRA
  async getMensajes(obraId) {
    try {
      console.log('📥 Obteniendo mensajes para obra:', obraId);
      
      const snapshot = await db.collection('mensajes')
        .where('obraId', '==', String(obraId))
        .get();
      
      const mensajes = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        mensajes.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
        });
      });
      
      // Ordenar por timestamp
      mensajes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      console.log(`✅ ${mensajes.length} mensajes obtenidos`);
      return mensajes;
      
    } catch (error) {
      console.error('❌ Error obteniendo mensajes:', error);
      throw error;
    }
  },

  // LISTENER EN TIEMPO REAL PARA MENSAJES
  listenToMensajes(obraId, callback) {
    console.log('👂 Configurando listener para obra:', obraId);
    
    return db.collection('mensajes')
      .where('obraId', '==', String(obraId))
      .onSnapshot(snapshot => {
        console.log('📨 Cambios detectados en mensajes');
        
        const mensajes = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          mensajes.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
          });
        });
        
        // Ordenar por timestamp
        mensajes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        callback(mensajes);
      }, error => {
        console.error('❌ Error en listener de mensajes:', error);
      });
  },

  // GUARDAR UBICACIÓN DE USUARIO
  async saveUserLocation(userId, locationData) {
    try {
      console.log('📍 Guardando ubicación:', { userId, locationData });
      
      const cleanLocationData = {
        userId: String(userId).trim(),
        latitude: Number(locationData.latitude),
        longitude: Number(locationData.longitude),
        accuracy: Number(locationData.accuracy || 0),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        source: String(locationData.source || 'manual').trim()
      };

      const locationId = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.collection('user_locations').doc(locationId).set(cleanLocationData);
      
      console.log('✅ Ubicación guardada:', locationId);
      return { success: true, locationId: locationId };
      
    } catch (error) {
      console.error('❌ Error guardando ubicación:', error);
      throw error;
    }
  },

  // OBTENER ÚLTIMA UBICACIÓN DE USUARIO
  async getUserLocation(userId) {
    try {
      const snapshot = await db.collection('user_locations')
        .where('userId', '==', String(userId))
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? data.timestamp.toDate() : null
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      return null;
    }
  },

  // SUBIR ARCHIVO A STORAGE
  async uploadFile(file, path) {
    try {
      console.log('📤 Subiendo archivo:', file.name, 'a', path);
      
      const storageRef = storage.ref().child(path);
      const uploadTask = await storageRef.put(file);
      const downloadURL = await uploadTask.ref.getDownloadURL();
      
      console.log('✅ Archivo subido:', downloadURL);
      return { success: true, url: downloadURL };
      
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      throw error;
    }
  }
};

// Exportar servicios globalmente
window.FirebaseService = FirebaseService;
window.db = db;
window.auth = auth;
window.storage = storage;
window.firebase = firebase;

console.log('✅ Firebase configurado correctamente para proyecto: construccion-pro');