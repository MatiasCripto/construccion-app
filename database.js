const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'construccion.db');
const db = new sqlite3.Database(dbPath);

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      // Tabla de usuarios
      db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        rol TEXT NOT NULL CHECK(rol IN ('admin', 'jefe_obra', 'logistica', 'albanil')),
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      // Tabla de obras (con coordenadas GPS)
      db.run(`CREATE TABLE IF NOT EXISTS obras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        ubicacion TEXT NOT NULL,
        latitud REAL,
        longitud REAL,
        descripcion TEXT,
        estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
        fecha_inicio DATE,
        fecha_fin DATE,
        albanil_asignado INTEGER,
        jefe_obra INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (albanil_asignado) REFERENCES usuarios(id),
        FOREIGN KEY (jefe_obra) REFERENCES usuarios(id)
      )`);
      
      // Tabla de materiales
      db.run(`CREATE TABLE IF NOT EXISTS materiales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        unidad TEXT NOT NULL,
        precio_unitario REAL DEFAULT 0,
        stock_disponible INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      // Tabla de materiales por obra
      db.run(`CREATE TABLE IF NOT EXISTS obra_materiales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        obra_id INTEGER,
        material_id INTEGER,
        cantidad_solicitada INTEGER,
        cantidad_aprobada INTEGER DEFAULT 0,
        estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aprobado', 'rechazado')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (obra_id) REFERENCES obras(id),
        FOREIGN KEY (material_id) REFERENCES materiales(id)
      )`);
      
      // Tabla de fotos
      db.run(`CREATE TABLE IF NOT EXISTS fotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        obra_id INTEGER,
        usuario_id INTEGER,
        filename TEXT NOT NULL,
        tipo TEXT CHECK(tipo IN ('inicio', 'progreso', 'final')),
        descripcion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (obra_id) REFERENCES obras(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )`);
      
      // Tabla de mensajes de chat
      db.run(`CREATE TABLE IF NOT EXISTS mensajes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        obra_id INTEGER,
        usuario_id INTEGER,
        mensaje TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (obra_id) REFERENCES obras(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS obra_progreso (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        obra_id INTEGER,
        paso INTEGER CHECK(paso IN (1, 2, 3, 4)),
        completado INTEGER DEFAULT 0,
        fecha_completado DATETIME,
        comentarios TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (obra_id) REFERENCES obras(id)
      )`);

      // Agregar después de la tabla de mensajes en database.js
      db.run(`CREATE TABLE IF NOT EXISTS obra_progreso (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        obra_id INTEGER,
        paso INTEGER CHECK(paso IN (1, 2, 3, 4)),
        completado INTEGER DEFAULT 0,
        fecha_completado DATETIME,
        comentarios TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (obra_id) REFERENCES obras(id)
      )`);
      
      // Crear usuario admin por defecto
      const adminPassword = await bcrypt.hash('admin123', 10);
      db.run(`INSERT OR IGNORE INTO usuarios (username, email, password, nombre, apellido, rol) 
              VALUES ('admin', 'admin@construccion.com', ?, 'Administrador', 'Sistema', 'admin')`, 
              [adminPassword]);
      
      // Crear materiales básicos
      const materiales = [
        ['Cemento', 'bolsa', 15.50, 100],
        ['Arena', 'm³', 25.00, 50],
        ['Grava', 'm³', 30.00, 40],
        ['Ladrillo', 'unidad', 0.75, 5000],
        ['Varilla de hierro', 'metro', 8.20, 200],
        ['Cal', 'bolsa', 12.00, 80]
      ];
      
      materiales.forEach(material => {
        db.run(`INSERT OR IGNORE INTO materiales (nombre, unidad, precio_unitario, stock_disponible) 
                VALUES (?, ?, ?, ?)`, material);
      });
      
      console.log('✅ Base de datos inicializada correctamente');
      resolve();
    });
  });
};

module.exports = { db, initDatabase };