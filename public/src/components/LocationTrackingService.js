// src/services/LocationTrackingService.js - Servicio completo de tracking GPS
class LocationTrackingService {
    constructor() {
        this.activeTrackings = new Map(); // Map de intervalos activos
        this.listeners = new Set(); // Set de listeners
        this.isInitialized = false;
        this.db = null;
        
        console.log('🚀 LocationTrackingService inicializando...');
        this.init();
    }

    // ==================== INICIALIZACIÓN ====================
    
    async init() {
        try {
            // Verificar Firebase
            if (!window.db) {
                throw new Error('Firebase no está disponible');
            }
            
            this.db = window.db;
            this.isInitialized = true;
            
            console.log('✅ LocationTrackingService inicializado correctamente');
            
            // Limpiar ubicaciones antiguas al iniciar
            await this.cleanupOldLocations();
            
        } catch (error) {
            console.error('❌ Error inicializando LocationTrackingService:', error);
            this.isInitialized = false;
        }
    }

    // ==================== TRACKING DE EMPLEADOS ====================
    
    async startEmployeeTracking(employeeId, interval = 60000) {
        try {
            if (!this.isInitialized) {
                throw new Error('Servicio no inicializado');
            }

            console.log(`📍 Iniciando tracking para empleado: ${employeeId}`);

            // Detener tracking existente si lo hay
            if (this.activeTrackings.has(employeeId)) {
                this.stopEmployeeTracking(employeeId);
            }

            // Obtener ubicación inicial
            const initialLocation = await this.getCurrentPosition();
            await this.saveEmployeeLocation(employeeId, initialLocation);

            // Configurar tracking automático
            const trackingInterval = setInterval(async () => {
                try {
                    const location = await this.getCurrentPosition();
                    await this.saveEmployeeLocation(employeeId, location);
                    console.log(`📍 Ubicación actualizada para ${employeeId}`);
                } catch (error) {
                    console.error(`❌ Error actualizando ubicación para ${employeeId}:`, error);
                }
            }, interval);

            // Guardar referencia del interval
            this.activeTrackings.set(employeeId, trackingInterval);

            // Marcar empleado como online
            await this.updateEmployeeStatus(employeeId, true);

            return {
                success: true,
                interval: trackingInterval,
                message: 'Tracking iniciado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error iniciando tracking:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async stopEmployeeTracking(employeeId) {
        try {
            console.log(`⏹️ Deteniendo tracking para empleado: ${employeeId}`);

            // Limpiar interval si existe
            if (this.activeTrackings.has(employeeId)) {
                clearInterval(this.activeTrackings.get(employeeId));
                this.activeTrackings.delete(employeeId);
            }

            // Marcar empleado como offline
            await this.updateEmployeeStatus(employeeId, false);

            console.log(`✅ Tracking detenido para ${employeeId}`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error deteniendo tracking:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== MANEJO DE UBICACIONES ====================

    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no soportada'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date(),
                        speed: position.coords.speed || null,
                        heading: position.coords.heading || null
                    };
                    resolve(locationData);
                },
                (error) => {
                    reject(error);
                },
                options
            );
        });
    }

    async saveEmployeeLocation(employeeId, location) {
        try {
            const locationDoc = {
                employeeId: employeeId,
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: location.timestamp,
                speed: location.speed,
                heading: location.heading,
                isOnline: true,
                lastSeen: new Date()
            };

            // Guardar en Firestore
            await this.db.collection('employee_locations').doc(employeeId).set(locationDoc);
            
            // Notificar a listeners
            this.notifyListeners();

            return { success: true };

        } catch (error) {
            console.error('❌ Error guardando ubicación:', error);
            throw error;
        }
    }

    async updateEmployeeStatus(employeeId, isOnline) {
        try {
            await this.db.collection('employee_locations').doc(employeeId).update({
                isOnline: isOnline,
                lastSeen: new Date()
            });
        } catch (error) {
            console.error('❌ Error actualizando estado:', error);
        }
    }

    // ==================== OBTENER DATOS ====================

    async getAllEmployeesWithLocations() {
        try {
            if (!this.isInitialized) {
                console.warn('⚠️ Servicio no inicializado');
                return [];
            }

            const snapshot = await this.db.collection('employee_locations').get();
            const employees = [];

            for (const doc of snapshot.docs) {
                const locationData = doc.data();
                
                // Obtener datos del empleado desde users collection
                let employeeInfo = await this.getEmployeeInfo(locationData.employeeId);
                
                employees.push({
                    id: locationData.employeeId,
                    name: employeeInfo.name || 'Empleado sin nombre',
                    email: employeeInfo.email || 'Sin email',
                    role: employeeInfo.role || 'empleado',
                    currentObra: employeeInfo.obra || 'Sin obra asignada',
                    location: {
                        latitude: locationData.latitude,
                        longitude: locationData.longitude,
                        accuracy: locationData.accuracy,
                        timestamp: locationData.timestamp,
                        isOnline: locationData.isOnline,
                        lastSeen: locationData.lastSeen
                    }
                });
            }

            console.log(`📍 ${employees.length} empleados con ubicación encontrados`);
            return employees;

        } catch (error) {
            console.error('❌ Error obteniendo empleados con ubicaciones:', error);
            return [];
        }
    }

    async getEmployeeInfo(employeeId) {
        try {
            // Primero buscar en collection usuarios
            const userDoc = await this.db.collection('usuarios').doc(employeeId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                return {
                    name: `${userData.nombre || ''} ${userData.apellido || ''}`.trim(),
                    email: userData.email,
                    role: userData.rol || userData.role,
                    obra: userData.obra
                };
            }

            // Si no existe, buscar por email en collection users (fallback)
            const usersSnapshot = await this.db.collection('users')
                .where('id', '==', employeeId)
                .limit(1)
                .get();

            if (!usersSnapshot.empty) {
                const userData = usersSnapshot.docs[0].data();
                return {
                    name: userData.name || userData.nombre,
                    email: userData.email,
                    role: userData.role || userData.rol,
                    obra: userData.currentWork || userData.obra
                };
            }

            // Fallback genérico
            return {
                name: `Empleado ${employeeId}`,
                email: 'email@ejemplo.com',
                role: 'empleado',
                obra: 'Sin asignar'
            };

        } catch (error) {
            console.error('❌ Error obteniendo info del empleado:', error);
            return {
                name: `Empleado ${employeeId}`,
                email: 'email@ejemplo.com',
                role: 'empleado',
                obra: 'Sin asignar'
            };
        }
    }

    // ==================== LISTENERS EN TIEMPO REAL ====================

    listenToEmployeeLocations(callback) {
        try {
            if (!this.isInitialized) {
                callback([], new Error('Servicio no inicializado'));
                return null;
            }

            console.log('🔄 Configurando listener de ubicaciones en tiempo real...');

            const unsubscribe = this.db.collection('employee_locations')
                .onSnapshot(
                    async (snapshot) => {
                        try {
                            const locations = [];
                            
                            for (const doc of snapshot.docs) {
                                const data = doc.data();
                                locations.push({
                                    employeeId: doc.id,
                                    ...data
                                });
                            }

                            console.log(`🔄 Listener: ${locations.length} ubicaciones actualizadas`);
                            callback(locations, null);
                            
                        } catch (error) {
                            console.error('❌ Error en listener:', error);
                            callback([], error);
                        }
                    },
                    (error) => {
                        console.error('❌ Error en listener Firebase:', error);
                        callback([], error);
                    }
                );

            return unsubscribe;

        } catch (error) {
            console.error('❌ Error configurando listener:', error);
            callback([], error);
            return null;
        }
    }

    notifyListeners() {
        // Método para notificar cambios a listeners internos
        this.listeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error('❌ Error en listener interno:', error);
            }
        });
    }

    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    // ==================== UTILIDADES ====================

    async cleanupOldLocations() {
        try {
            const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
            
            const oldLocations = await this.db.collection('employee_locations')
                .where('lastSeen', '<', cutoffTime)
                .get();

            const batch = this.db.batch();
            oldLocations.docs.forEach(doc => {
                batch.update(doc.ref, { isOnline: false });
            });

            if (oldLocations.docs.length > 0) {
                await batch.commit();
                console.log(`🧹 ${oldLocations.docs.length} ubicaciones antiguas marcadas como offline`);
            }

        } catch (error) {
            console.error('❌ Error limpiando ubicaciones antiguas:', error);
        }
    }

    getActiveTrackings() {
        return Array.from(this.activeTrackings.keys());
    }

    getTrackingCount() {
        return this.activeTrackings.size;
    }

    isEmployeeTracking(employeeId) {
        return this.activeTrackings.has(employeeId);
    }

    // ==================== MÉTODO DE PRUEBA ====================

    async testLocationService() {
        console.log('🧪 Iniciando test del LocationTrackingService...');
        
        try {
            // Test 1: Verificar inicialización
            console.log('Test 1 - Inicialización:', this.isInitialized ? '✅' : '❌');
            
            // Test 2: Obtener ubicación actual
            try {
                const location = await this.getCurrentPosition();
                console.log('Test 2 - Obtener ubicación:', '✅', location);
            } catch (error) {
                console.log('Test 2 - Obtener ubicación:', '❌', error.message);
            }
            
            // Test 3: Obtener empleados con ubicaciones
            const employees = await this.getAllEmployeesWithLocations();
            console.log('Test 3 - Empleados con ubicaciones:', '✅', `${employees.length} encontrados`);
            
            console.log('🧪 Test completado');
            return true;
            
        } catch (error) {
            console.error('❌ Error en test:', error);
            return false;
        }
    }
}

// ==================== INICIALIZACIÓN GLOBAL ====================

// Inicializar el servicio cuando Firebase esté listo
const initLocationTrackingService = () => {
    if (window.db && !window.LocationTrackingService) {
        window.LocationTrackingService = new LocationTrackingService();
        console.log('✅ LocationTrackingService disponible globalmente');
    } else if (!window.db) {
        console.log('⏳ Esperando Firebase para inicializar LocationTrackingService...');
        setTimeout(initLocationTrackingService, 1000);
    }
};

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLocationTrackingService);
} else {
    initLocationTrackingService();
}

// También intentar cuando Firebase se cargue
window.addEventListener('firebaseReady', initLocationTrackingService);

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocationTrackingService;
}