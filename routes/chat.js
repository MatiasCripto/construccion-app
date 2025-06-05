const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener mensajes de una obra
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
    
    // Obtener mensajes
    const query = `SELECT m.*, u.nombre, u.apellido, u.rol
                   FROM mensajes m
                   JOIN usuarios u ON m.usuario_id = u.id
                   WHERE m.obra_id = ?
                   ORDER BY m.created_at ASC`;
    
    db.all(query, [obraId], (err, mensajes) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener mensajes' });
      }
      res.json(mensajes);
    });
  });
});

// Enviar mensaje
router.post('/obra/:id', authenticateToken, (req, res) => {
  const obraId = req.params.id;
  const { mensaje } = req.body;
  
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
    
    // Insertar mensaje
    db.run(
      'INSERT INTO mensajes (obra_id, usuario_id, mensaje) VALUES (?, ?, ?)',
      [obraId, req.user.id, mensaje],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al enviar mensaje' });
        }
        
        // Obtener el mensaje completo con datos del usuario
        db.get(
          `SELECT m.*, u.nombre, u.apellido, u.rol
           FROM mensajes m
           JOIN usuarios u ON m.usuario_id = u.id
           WHERE m.id = ?`,
          [this.lastID],
          (err, mensajeCompleto) => {
            if (err) {
              return res.status(500).json({ error: 'Error al obtener mensaje' });
            }
            res.status(201).json(mensajeCompleto);
          }
        );
      }
    );
  });
});

module.exports = router;