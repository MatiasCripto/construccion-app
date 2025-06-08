// src/firebase-tracking.js - FUNCIONES DE TRACKING EN FIREBASE
// Funciones para gestionar ubicaciones de empleados en tiempo real

const LocationTrackingService = {
    
    // ==================== FUNCIONES PARA EMPLEADOS ====================
    
    // Enviar ubicación actual del empleado
    async updateEmployeeLocation(employeeId, locationData) {
        try {
            console.log('📍 Actualizando ubicación de empleado:', employeeId);
            
            const locationDoc = {
                employeeId,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                accuracy: locationData.accuracy || null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                isOnline: true,
                speed: locationData.speed || null,
                heading: locationData.heading || null
            };

            // Guardar en colección de ubicaciones actuales
            await db.collection('employee_locations').doc(employeeId).set(locationDoc);
            
            // Guardar en historial (para tracking diario)
            await db.collection('location_history').add({
                ...locationDoc,
                date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
            });

            console.log('✅ Ubicación actualizada correctamente');
            return { success: true };

        } catch (error) {
            console.error('❌ Error actualizando ubicación:', error);
            throw new Error('No se pudo actualizar la ubicación');
        }
    },

    // Iniciar tracking automático del empleado
    async startEmployeeTracking(employeeId, interval = 30000) {
        try {
            console.log('▶️ Iniciando tracking automático para:', employeeId);

            // Verificar soporte de geolocalización
            if (!navigator.geolocation) {
                throw new Error('Geolocalización no soportada en este dispositivo');
            }

            // Configuración de geolocalización
            const geoOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            };

            // Función para obtener y enviar ubicación
            const trackLocation = () => {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const locationData = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            speed: position.coords.speed,
                            heading: position.coords.heading
                        };

                        await this.updateEmployeeLocation(employeeId, locationData);
                    },
                    (error) => {
                        console.error('❌ Error obteniendo ubicación:', error);
                        this.handleGeolocationError(employeeId, error);
                    },
                    geoOptions
                );
            };

            // Enviar ubicación inicial
            trackLocation();

            // Configurar intervalo de tracking
            const trackingInterval = setInterval(trackLocation, interval);

            // Guardar referencia para poder detener el tracking
            window.employeeTrackingInterval = trackingInterval;

            console.log('✅ Tracking automático iniciado');
            return { success: true, interval: trackingInterval };

        } catch (error) {
            console.error('❌ Error iniciando tracking:', error);
            throw error;
        }
    },

    // Detener tracking automático
    stopEmployeeTracking(employeeId) {
        try {
            console.log('⏹️ Deteniendo tracking para:', employeeId);

            if (window.employeeTrackingInterval) {
                clearInterval(window.employeeTrackingInterval);
                window.employeeTrackingInterval = null;
            }

            // Marcar como offline
            this.setEmployeeOffline(employeeId);

            console.log('✅ Tracking detenido');
            return { success: true };

        } catch (error) {
            console.error('❌ Error deteniendo tracking:', error);
            throw error;
        }
    },

    // Marcar empleado como offline
    async setEmployeeOffline(employeeId) {
        try {
            await db.collection('employee_locations').doc(employeeId).update({
                isOnline: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('📴 Empleado marcado como offline:', employeeId);

        } catch (error) {
            console.error('❌ Error marcando offline:', error);
        }
    },

    // Manejar errores de geolocalización
    async handleGeolocationError(employeeId, error) {
        let errorMessage = 'Error de ubicación desconocido';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Permiso de ubicación denegado';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Ubicación no disponible';
                break;
            case error.TIMEOUT:
                errorMessage = 'Timeout obteniendo ubicación';
                break;
        }

        console.error('❌ Error geolocalización:', errorMessage);

        // Guardar error en Firebase para que el admin lo vea
        await db.collection('tracking_errors').add({
            employeeId,
            error: errorMessage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    // ==================== FUNCIONES PARA ADMIN ====================

    // Obtener todas las ubicaciones actuales de empleados
    async getAllEmployeeLocations() {
        try {
            console.log('👥 Obteniendo ubicaciones de todos los empleados...');

            const snapshot = await db.collection('employee_locations').get();
            
            const locations = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    employeeId: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date(0),
                    lastSeen: data.lastSeen?.toDate() || new Date(0)
                };
            });

            console.log(`✅ ${locations.length} ubicaciones obtenidas`);
            return locations;

        } catch (error) {
            console.error('❌ Error obteniendo ubicaciones:', error);
            throw new Error('No se pudieron obtener las ubicaciones');
        }
    },

    // Escuchar cambios en tiempo real de ubicaciones
    listenToEmployeeLocations(callback) {
        try {
            console.log('🔄 Configurando listener de ubicaciones en tiempo real...');

            return db.collection('employee_locations')
                .onSnapshot((snapshot) => {
                    console.log('📍 Cambios en ubicaciones detectados');

                    const locations = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            employeeId: doc.id,
                            ...data,
                            timestamp: data.timestamp?.toDate() || new Date(0),
                            lastSeen: data.lastSeen?.toDate() || new Date(0)
                        };
                    });

                    callback(locations);
                }, (error) => {
                    console.error('❌ Error en listener de ubicaciones:', error);
                    callback(null, error);
                });

        } catch (error) {
            console.error('❌ Error configurando listener:', error);
            throw error;
        }
    },

    // Obtener historial de ubicaciones de un empleado
    async getEmployeeLocationHistory(employeeId, date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            console.log('📊 Obteniendo historial de:', employeeId, 'fecha:', targetDate);

            const snapshot = await db.collection('location_history')
                .where('employeeId', '==', employeeId)
                .where('date', '==', targetDate)
                .orderBy('timestamp', 'asc')
                .get();

            const history = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date(0)
                };
            });

            console.log(`✅ ${history.length} registros de historial obtenidos`);
            return history;

        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            throw new Error('No se pudo obtener el historial');
        }
    },

    // Obtener información del empleado
    async getEmployeeInfo(employeeId) {
        try {
            console.log('👤 Obteniendo información de empleado:', employeeId);

            const snapshot = await db.collection('users').doc(employeeId).get();
            
            if (!snapshot.exists) {
                throw new Error('Empleado no encontrado');
            }

            const employeeData = snapshot.data();
            console.log('✅ Información de empleado obtenida');

            return {
                id: employeeId,
                name: employeeData.name || 'Sin nombre',
                role: employeeData.role || 'empleado',
                email: employeeData.email,
                phone: employeeData.phone,
                currentObra: employeeData.currentObra || 'No asignado',
                createdAt: employeeData.createdAt?.toDate() || new Date(0)
            };

        } catch (error) {
            console.error('❌ Error obteniendo info de empleado:', error);
            throw error;
        }
    },

    // Combinar ubicación con información del empleado
    async getEmployeeWithLocation(employeeId) {
        try {
            const [locationData, employeeInfo] = await Promise.all([
                db.collection('employee_locations').doc(employeeId).get(),
                this.getEmployeeInfo(employeeId)
            ]);

            const location = locationData.exists ? locationData.data() : null;

            return {
                ...employeeInfo,
                location: location ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy,
                    timestamp: location.timestamp?.toDate() || new Date(0),
                    lastSeen: location.lastSeen?.toDate() || new Date(0),
                    isOnline: location.isOnline || false
                } : null
            };

        } catch (error) {
            console.error('❌ Error obteniendo empleado con ubicación:', error);
            throw error;
        }
    },

    // Obtener todos los empleados con sus ubicaciones
    async getAllEmployeesWithLocations() {
        try {
            console.log('👥 Obteniendo todos los empleados con ubicaciones...');

            // Obtener todos los usuarios
            const usersSnapshot = await db.collection('users').get();
            const employees = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Obtener ubicaciones actuales
            const locationsSnapshot = await db.collection('employee_locations').get();
            const locations = new Map();
            
            locationsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                locations.set(doc.id, {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    accuracy: data.accuracy,
                    timestamp: data.timestamp?.toDate() || new Date(0),
                    lastSeen: data.lastSeen?.toDate() || new Date(0),
                    isOnline: data.isOnline || false
                });
            });

            // Combinar empleados con ubicaciones
            const employeesWithLocations = employees.map(employee => ({
                id: employee.id,
                name: employee.name || 'Sin nombre',
                role: employee.role || 'empleado',
                email: employee.email,
                phone: employee.phone,
                currentObra: employee.currentObra || 'No asignado',
                location: locations.get(employee.id) || null
            }));

            console.log(`✅ ${employeesWithLocations.length} empleados obtenidos`);
            return employeesWithLocations;

        } catch (error) {
            console.error('❌ Error obteniendo empleados con ubicaciones:', error);
            throw error;
        }
    },

    // ==================== FUNCIONES DE GEOFENCING ====================

    // Verificar si empleado está dentro de zona permitida
    async checkGeofence(employeeId, centerLat, centerLng, radiusMeters = 5000) {
        try {
            const locationDoc = await db.collection('employee_locations').doc(employeeId).get();
            
            if (!locationDoc.exists) {
                return { inZone: false, distance: null, error: 'Ubicación no encontrada' };
            }

            const location = locationDoc.data();
            const distance = this.calculateDistance(
                location.latitude, 
                location.longitude, 
                centerLat, 
                centerLng
            );

            const inZone = distance <= radiusMeters;

            return {
                inZone,
                distance: Math.round(distance),
                radiusMeters,
                employeeLocation: {
                    lat: location.latitude,
                    lng: location.longitude
                },
                centerLocation: {
                    lat: centerLat,
                    lng: centerLng
                }
            };

        } catch (error) {
            console.error('❌ Error verificando geofence:', error);
            return { inZone: false, distance: null, error: error.message };
        }
    },

    // Calcular distancia entre dos puntos (fórmula de Haversine)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance;
    },

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    // ==================== FUNCIONES DE UTILIDAD ====================

    // Limpiar ubicaciones antiguas (llamar diariamente)
    async cleanupOldLocations(daysToKeep = 30) {
        try {
            console.log('🧹 Limpiando ubicaciones antiguas...');

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const snapshot = await db.collection('location_history')
                .where('timestamp', '<', cutoffDate)
                .get();

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`✅ ${snapshot.docs.length} registros antiguos eliminados`);

        } catch (error) {
            console.error('❌ Error limpiando ubicaciones:', error);
        }
    },

    // Obtener estadísticas de tracking
    async getTrackingStats() {
        try {
            const [locationsSnapshot, errorsSnapshot] = await Promise.all([
                db.collection('employee_locations').get(),
                db.collection('tracking_errors')
                    .where('timestamp', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
                    .get()
            ]);

            const locations = locationsSnapshot.docs.map(doc => doc.data());
            const onlineCount = locations.filter(loc => loc.isOnline).length;
            const totalCount = locations.length;
            const errorsCount = errorsSnapshot.docs.length;

            return {
                totalEmployees: totalCount,
                onlineEmployees: onlineCount,
                offlineEmployees: totalCount - onlineCount,
                errorsLast24h: errorsCount,
                lastUpdate: new Date()
            };

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return null;
        }
    }
};

// Hacer disponible globalmente
window.LocationTrackingService = LocationTrackingService;