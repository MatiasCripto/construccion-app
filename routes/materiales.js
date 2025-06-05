const express = require('express');
const { db } = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los materiales
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM materiales ORDER BY nombre', [], (err, materiales) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener materiales' });
    }
    res.json(materiales);
  });
});

// Solicitar materiales para una obra
router.post('/solicitar', authenticateToken, (req, res) => {
  const { obra_id, materiales } = req.body;
  
  // Verificar que el usuario tenga acceso a la obra
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
    
    // Insertar solicitudes de materiales
    const stmt = db.prepare('INSERT INTO obra_materiales (obra_id, material_id, cantidad_solicitada) VALUES (?, ?, ?)');
    
    materiales.forEach(material => {
      stmt.run([obra_id, material.material_id, material.cantidad]);
    });
    
    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al solicitar materiales' });
      }
      res.json({ message: 'Materiales solicitados exitosamente' });
    });
  });
});

// Obtener solicitudes de materiales de una obra
router.get('/obra/:id', authenticateToken, (req, res) => {
  const obraId = req.params.id;
  
  const query = `SELECT om.*, m.nombre, m.unidad, m.precio_unitario
                 FROM obra_materiales om
                 JOIN materiales m ON om.material_id = m.id
                 WHERE om.obra_id = ?
                 ORDER BY om.created_at DESC`;
  
  db.all(query, [obraId], (err, solicitudes) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
    res.json(solicitudes);
  });
});

// Aprobar/rechazar solicitud de material (solo admin y jefe de obra)
router.put('/solicitud/:id', authenticateToken, authorizeRoles(['admin', 'jefe_obra']), (req, res) => {
  const { estado, cantidad_aprobada } = req.body;
  const solicitudId = req.params.id;
  
  db.run(
    'UPDATE obra_materiales SET estado = ?, cantidad_aprobada = ? WHERE id = ?',
    [estado, cantidad_aprobada || 0, solicitudId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al actualizar solicitud' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }
      res.json({ message: 'Solicitud actualizada exitosamente' });
    }
  );
});

module.exports = router;