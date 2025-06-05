const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Guardar información de foto en la base de datos
router.post('/', authenticateToken, (req, res) => {
  const { obra_id, filename, tipo, descripcion } = req.body;
  
  // Verificar acceso a la obra
  let verificarAcceso = 'SELECT * FROM obras WHERE id = ?';
  let params = [obra_id];
  
  if (req.user.rol === 'albanil') {
    verificarAcceso += ' AND albanil_asignado = ?';
    params.push(req.user.id);
  }
  
  db.get(verificarAcceso, params, (err, obra) => {
    if (err || !obra) {
      return res.status(403).json({ error: 'No tienes acceso a esta obra' });
    }
    
    // Insertar información de la foto
    db.run(
      'INSERT INTO fotos (obra_id, usuario_id, filename, tipo, descripcion) VALUES (?, ?, ?, ?, ?)',
      [obra_id, req.user.id, filename, tipo, descripcion],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al guardar información de la foto' });
        }
        res.status(201).json({ 
          id: this.lastID, 
          message: 'Foto guardada exitosamente',
          foto: {
            id: this.lastID,
            obra_id,
            usuario_id: req.user.id,
            filename,
            tipo,
            descripcion,
            created_at: new Date().toISOString()
          }
        });
      }
    );
  });
});

// Obtener fotos de una obra
router.get('/obra/:id', authenticateToken, (req, res) => {
  const obraId = req.params.id;
  
  // Verificar acceso a la obra
  let verificarAcceso = 'SELECT * FROM obras WHERE id = ?';
  let params = [obraId];
  
  if (req.user.rol === 'albanil') {
    verificarAcceso += ' AND albanil_asignado = ?';
    params.push(req.user.id);
  }
  
  db.get(verificarAcceso, params, (err, obra) => {
    if (err || !obra) {
      return res.status(403).json({ error: 'No tienes acceso a esta obra' });
    }
    
    // Obtener fotos
    db.all(
      'SELECT f.*, u.nombre, u.apellido FROM fotos f JOIN usuarios u ON f.usuario_id = u.id WHERE f.obra_id = ? ORDER BY f.created_at DESC',
      [obraId],
      (err, fotos) => {
        if (err) {
          return res.status(500).json({ error: 'Error al obtener fotos' });
        }
        res.json(fotos);
      }
    );
  });
});

// Eliminar foto (solo admin)
router.delete('/:id', authenticateToken, (req, res) => {
  const fotoId = req.params.id;
  
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos para eliminar fotos' });
  }
  
  db.run('DELETE FROM fotos WHERE id = ?', [fotoId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar foto' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }
    res.json({ message: 'Foto eliminada exitosamente' });
  });
});

module.exports = router;