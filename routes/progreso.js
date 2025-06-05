const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener progreso de una obra
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
    
    // Obtener progreso de pasos
    db.all(
      'SELECT * FROM obra_progreso WHERE obra_id = ? ORDER BY paso',
      [obraId],
      (err, progreso) => {
        if (err) {
          return res.status(500).json({ error: 'Error al obtener progreso' });
        }
        
        // Inicializar progreso si no existe
        if (progreso.length === 0) {
          const pasos = [1, 2, 3, 4];
          const stmt = db.prepare('INSERT INTO obra_progreso (obra_id, paso) VALUES (?, ?)');
          
          pasos.forEach(paso => {
            stmt.run([obraId, paso]);
          });
          
          stmt.finalize(() => {
            // Obtener progreso recién creado
            db.all(
              'SELECT * FROM obra_progreso WHERE obra_id = ? ORDER BY paso',
              [obraId],
              (err, nuevoProgreso) => {
                res.json(nuevoProgreso || []);
              }
            );
          });
        } else {
          res.json(progreso);
        }
      }
    );
  });
});

// Marcar paso como completado
router.post('/obra/:id/paso/:paso', authenticateToken, (req, res) => {
  const obraId = req.params.id;
  const paso = parseInt(req.params.paso);
  const { comentarios } = req.body;
  
  // Verificar que el albañil tenga acceso a la obra
  if (req.user.rol === 'albanil') {
    db.get('SELECT * FROM obras WHERE id = ? AND albanil_asignado = ?', [obraId, req.user.id], (err, obra) => {
      if (err || !obra) {
        return res.status(403).json({ error: 'No tienes acceso a esta obra' });
      }
      
      completarPaso(obraId, paso, comentarios, res);
    });
  } else {
    completarPaso(obraId, paso, comentarios, res);
  }
});

function completarPaso(obraId, paso, comentarios, res) {
  // Verificar que el paso anterior esté completado (excepto para el paso 1)
  if (paso > 1) {
    db.get(
      'SELECT * FROM obra_progreso WHERE obra_id = ? AND paso = ? AND completado = 1',
      [obraId, paso - 1],
      (err, pasoAnterior) => {
        if (err || !pasoAnterior) {
          return res.status(400).json({ 
            error: `Debes completar el paso ${paso - 1} antes de continuar` 
          });
        }
        
        actualizarPaso();
      }
    );
  } else {
    actualizarPaso();
  }
  
  function actualizarPaso() {
    db.run(
      'UPDATE obra_progreso SET completado = 1, fecha_completado = CURRENT_TIMESTAMP, comentarios = ? WHERE obra_id = ? AND paso = ?',
      [comentarios || null, obraId, paso],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al actualizar progreso' });
        }
        
        // Actualizar estado de la obra según el progreso
        if (paso === 1) {
          // Cuando completa fotos iniciales, la obra pasa a "en_progreso"
          db.run('UPDATE obras SET estado = ? WHERE id = ?', ['en_progreso', obraId]);
        } else if (paso === 4) {
          // Cuando completa fotos finales, la obra pasa a "completada"
          db.run('UPDATE obras SET estado = ? WHERE id = ?', ['completada', obraId]);
        }
        
        res.json({ message: 'Paso completado exitosamente' });
      }
    );
  }
}

// Validar si puede acceder a un paso
router.get('/obra/:id/validar-paso/:paso', authenticateToken, (req, res) => {
  const obraId = req.params.id;
  const paso = parseInt(req.params.paso);
  
  if (paso === 1) {
    return res.json({ puedeAcceder: true });
  }
  
  // Verificar que el paso anterior esté completado
  db.get(
    'SELECT * FROM obra_progreso WHERE obra_id = ? AND paso = ? AND completado = 1',
    [obraId, paso - 1],
    (err, pasoAnterior) => {
      if (err) {
        return res.status(500).json({ error: 'Error al validar paso' });
      }
      
      res.json({ puedeAcceder: !!pasoAnterior });
    }
  );
});

module.exports = router;