// firebase-config.js
// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDMIBS-LzegVdML_x37iPlA8gOqrs7Vkxk",
  authDomain: "construccion-pro-app.firebaseapp.com",
  projectId: "construccion-pro-app",
  storageBucket: "construccion-pro-app.firebasestorage.app",
  messagingSenderId: "1022663683741",
  appId: "1:1022663683741:web:32faecbc74e3f5895e6e74",
  measurementId: "G-947R11NCW6"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Servicios Firebase
const db = firebase.firestore();
const auth = firebase.auth();
const analytics = firebase.analytics();

// Configuración Cloudinary
const cloudinaryConfig = {
  cloudName: 'dt6uqdij7', // Pon tu cloud name aquí
  uploadPreset: 'construccion_preset'
};

// Funciones de Cloudinary
const cloudinaryWidget = cloudinary.createUploadWidget(
  {
    cloudName: cloudinaryConfig.cloudName,
    uploadPreset: cloudinaryConfig.uploadPreset,
    folder: 'construccion-app',
    multiple: false,
    maxFiles: 1,
    resourceType: 'image',
    maxImageFileSize: 5000000, // 5MB
    sources: ['local', 'camera'],
    showAdvancedOptions: false,
    cropping: false,
    theme: 'minimal'
  },
  (error, result) => {
    if (!error && result && result.event === "success") {
      console.log('Foto subida:', result.info);
      // Aquí manejaremos la foto subida
      window.lastUploadedPhoto = result.info;
      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('photoUploaded', {
        detail: result.info
      }));
    }
  }
);

// Funciones de utilidad
const FirebaseService = {
  // Autenticación
  async signIn(email, password) {
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async signUp(email, password, userData) {
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      // Guardar datos adicionales del usuario
      await this.createUserDocument(result.user.uid, userData);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async signOut() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Base de datos
  async createUserDocument(uid, userData) {
    return await db.collection('users').doc(uid).set({
      ...userData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async createObra(obraData) {
    return await db.collection('obras').add({
      ...obraData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async updateObra(obraId, updates) {
    return await db.collection('obras').doc(obraId).update({
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async getObras(userId = null, role = null) {
    let query = db.collection('obras');
    
    if (role === 'albañil') {
      query = query.where('albañilId', '==', userId);
    } else if (role === 'cliente') {
      query = query.where('clienteId', '==', userId);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addFotoToObra(obraId, fotoData) {
    const obraRef = db.collection('obras').doc(obraId);
    return await obraRef.update({
      fotos: firebase.firestore.FieldValue.arrayUnion(fotoData),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async addMensaje(obraId, mensaje) {
    return await db.collection('mensajes').add({
      obraId,
      ...mensaje,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async getMensajes(obraId) {
    const snapshot = await db.collection('mensajes')
      .where('obraId', '==', obraId)
      .orderBy('timestamp', 'asc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Listener en tiempo real para mensajes
  listenToMensajes(obraId, callback) {
    return db.collection('mensajes')
      .where('obraId', '==', obraId)
      .orderBy('timestamp', 'asc')
      .onSnapshot(callback);
  }
};

// Función para subir foto con Cloudinary
function uploadPhoto() {
  cloudinaryWidget.open();
}

// Hacer disponibles globalmente
window.FirebaseService = FirebaseService;
window.uploadPhoto = uploadPhoto;
window.db = db;
window.auth = auth;