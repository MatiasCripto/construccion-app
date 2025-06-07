// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDMIBS-LzegVdML_x37iPlA8gOqrs7Vkxk",
  authDomain: "construccion-pro-app.firebaseapp.com",
  projectId: "construccion-pro-app",
  storageBucket: "construccion-pro-app.firebasestorage.app",
  messagingSenderId: "1022663683741",
  appId: "1:1022663683741:web:32faecbc74e3f5895e6e74",
  measurementId: "G-947R11NCW6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

// Initialize Cloudinary
export const cloudinaryConfig = {
  cloudName: 'TU_CLOUD_NAME', // Reemplazar con tu cloud name
  uploadPreset: 'construccion_preset' // Crearemos este preset
};

export default app;