const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los usuarios (solo admin)
router.get('/', authenticateToken, authorizeRoles(['admin']), (req, res) => {
  db.all('SELECT id, username, email, nombre, apellido, rol, activo, created_at FROM usuarios', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
    res.json(users);
  });
});

// Crear nuevo usuario (solo admin)
router.post('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { username, email, password, nombre, apellido, rol } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO usuarios (username, email, password, nombre, apellido, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, nombre, apellido, rol],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'El usuario o email ya existe' });
          }
          return res.status(500).json({ error: 'Error al crear usuario' });
        }
        res.status(201).json({ id: this.lastID, message: 'Usuario creado exitosamente' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Obtener albañiles para asignar obras
router.get('/albaniles', authenticateToken, authorizeRoles(['admin', 'jefe_obra']), (req, res) => {
  db.all('SELECT id, nombre, apellido FROM usuarios WHERE rol = "albanil" AND activo = 1', [], (err, albaniles) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener albañiles' });
    }
    res.json(albaniles);
  });
});
// Obtener jefes de obra para asignar obras
router.get('/jefes-obra', authenticateToken, authorizeRoles(['admin', 'jefe_obra']), (req, res) => {
  db.all('SELECT id, nombre, apellido FROM usuarios WHERE rol = "jefe_obra" AND activo = 1', [], (err, jefes) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener jefes de obra' });
    }
    res.json(jefes);
  });
});

// Desactivar usuario
router.put('/:id/desactivar', authenticateToken, authorizeRoles(['admin']), (req, res) => {
  const userId = req.params.id;
  
  db.run('UPDATE usuarios SET activo = 0 WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al desactivar usuario' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario desactivado exitosamente' });
  });
});

module.exports = router;