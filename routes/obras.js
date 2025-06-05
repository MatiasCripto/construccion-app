const express = require('express');
const { db } = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Obtener obras según el rol del usuario
router.get('/', authenticateToken, (req, res) => {
  let query = '';
  let params = [];
  
  if (req.user.rol === 'albanil') {
    // Los albañiles solo ven sus obras asignadas
    query = `SELECT o.*, u1.nombre as albanil_nombre, u1.apellido as albanil_apellido,
                    u2.nombre as jefe_nombre, u2.apellido as jefe_apellido
             FROM obras o
             LEFT JOIN usuarios u1 ON o.albanil_asignado = u1.id
             LEFT JOIN usuarios u2 ON o.jefe_obra = u2.id
             WHERE o.albanil_asignado = ?
             ORDER BY o.created_at DESC`;
    params = [req.user.id];
  } else {
    // Admin, jefe de obra y logística ven todas las obras
    query = `SELECT o.*, u1.nombre as albanil_nombre, u1.apellido as albanil_apellido,
                    u2.nombre as jefe_nombre, u2.apellido as jefe_apellido
             FROM obras o
             LEFT JOIN usuarios u1 ON o.albanil_asignado = u1.id
             LEFT JOIN usuarios u2 ON o.jefe_obra = u2.id
             ORDER BY o.created_at DESC`;
  }
  
  db.all(query, params, (err, obras) => {
    if (err) {
      console.error('Error al obtener obras:', err);
      return res.status(500).json({ error: 'Error al obtener obras' });
    }
    res.json(obras);
  });
});

// Crear nueva obra (solo admin)
router.post('/', authenticateToken, authorizeRoles(['admin']), (req, res) => {
  const { nombre, ubicacion, descripcion, albanil_asignado, jefe_obra, latitud, longitud } = req.body;
  
  // Validar datos requeridos
  if (!nombre || !ubicacion || !albanil_asignado) {
    return res.status(400).json({ error: 'Nombre, ubicación y albañil asignado son requeridos' });
  }
  
  db.run(
    'INSERT INTO obras (nombre, ubicacion, latitud, longitud, descripcion, albanil_asignado, jefe_obra) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombre, ubicacion, latitud, longitud, descripcion, albanil_asignado, jefe_obra],
    function(err) {
      if (err) {
        console.error('Error al crear obra:', err);
        return res.status(500).json({ error: 'Error al crear obra' });
      }
      res.status(201).json({ 
        id: this.lastID, 
        message: 'Obra creada exitosamente',
        obra_id: this.lastID
      });
    }
  );
});

// Actualizar obra completa (solo admin)
router.put('/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
  const obraId = req.params.id;
  const { nombre, ubicacion, descripcion, albanil_asignado, jefe_obra, latitud, longitud } = req.body;
  
  // Validar datos requeridos
  if (!nombre || !ubicacion || !albanil_asignado) {
    return res.status(400).json({ error: 'Nombre, ubicación y albañil asignado son requeridos' });
  }
  
  // Verificar que la obra existe
  db.get('SELECT * FROM obras WHERE id = ?', [obraId], (err, obra) => {
    if (err) {
      console.error('Error al verificar obra:', err);
      return res.status(500).json({ error: 'Error al verificar obra' });
    }
    
    if (!obra) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    // Actualizar la obra
    db.run(
      'UPDATE obras SET nombre = ?, ubicacion = ?, latitud = ?, longitud = ?, descripcion = ?, albanil_asignado = ?, jefe_obra = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nombre, ubicacion, latitud, longitud, descripcion, albanil_asignado, jefe_obra, obraId],
      function(err) {
        if (err) {
          console.error('Error al actualizar obra:', err);
          return res.status(500).json({ error: 'Error al actualizar obra' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'No se pudo actualizar la obra' });
        }
        
        res.json({ 
          message: 'Obra actualizada exitosamente',
          changes: this.changes,
          obra_id: obraId
        });
      }
    );
  });
});

// Actualizar estado de obra
router.put('/:id/estado', authenticateToken, (req, res) => {
  const { estado } = req.body;
  const obraId = req.params.id;
  
  // Validar estado
  const estadosValidos = ['pendiente', 'en_progreso', 'completada', 'cancelada'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }
  
  // Verificar permisos
  if (req.user.rol === 'albanil') {
    // Los albañiles solo pueden cambiar el estado de sus obras asignadas
    db.get('SELECT * FROM obras WHERE id = ? AND albanil_asignado = ?', [obraId, req.user.id], (err, obra) => {
      if (err) {
        console.error('Error al verificar obra del albañil:', err);
        return res.status(500).json({ error: 'Error al verificar permisos' });
      }
      
      if (!obra) {
        return res.status(403).json({ error: 'No tienes permisos para modificar esta obra' });
      }
      
      actualizarEstado(obraId, estado, res);
    });
  } else if (['admin', 'jefe_obra'].includes(req.user.rol)) {
    actualizarEstado(obraId, estado, res);
  } else {
    return res.status(403).json({ error: 'No tienes permisos para modificar obras' });
  }
});

function actualizarEstado(obraId, estado, res) {
  db.run(
    'UPDATE obras SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [estado, obraId], 
    function(err) {
      if (err) {
        console.error('Error al actualizar estado:', err);
        return res.status(500).json({ error: 'Error al actualizar estado' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Obra no encontrada' });
      }
      res.json({ 
        message: 'Estado actualizado exitosamente',
        nuevo_estado: estado,
        obra_id: obraId
      });
    }
  );
}

// Obtener detalles de una obra específica
router.get('/:id', authenticateToken, (req, res) => {
  const obraId = req.params.id;
  
  let query = `SELECT o.*, u1.nombre as albanil_nombre, u1.apellido as albanil_apellido,
                      u2.nombre as jefe_nombre, u2.apellido as jefe_apellido
               FROM obras o
               LEFT JOIN usuarios u1 ON o.albanil_asignado = u1.id
               LEFT JOIN usuarios u2 ON o.jefe_obra = u2.id
               WHERE o.id = ?`;
  
  let params = [obraId];
  
  // Si es albañil, verificar que sea su obra asignada
  if (req.user.rol === 'albanil') {
    query += ' AND o.albanil_asignado = ?';
    params.push(req.user.id);
  }
  
  db.get(query, params, (err, obra) => {
    if (err) {
      console.error('Error al obtener obra:', err);
      return res.status(500).json({ error: 'Error al obtener obra' });
    }
    if (!obra) {
      return res.status(404).json({ error: 'Obra no encontrada o no tienes acceso' });
    }
    
    // Obtener fotos de la obra
    db.all('SELECT * FROM fotos WHERE obra_id = ? ORDER BY created_at DESC', [obraId], (err, fotos) => {
      if (err) {
        console.error('Error al obtener fotos:', err);
        fotos = [];
      }
      
      obra.fotos = fotos;
      res.json(obra);
    });
  });
});

// Eliminar obra (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
  const obraId = req.params.id;
  
  // Verificar que la obra existe
  db.get('SELECT * FROM obras WHERE id = ?', [obraId], (err, obra) => {
    if (err) {
      console.error('Error al verificar obra:', err);
      return res.status(500).json({ error: 'Error al verificar obra' });
    }
    
    if (!obra) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    // Eliminar la obra (esto también eliminará registros relacionados si hay CASCADE configurado)
    db.run('DELETE FROM obras WHERE id = ?', [obraId], function(err) {
      if (err) {
        console.error('Error al eliminar obra:', err);
        return res.status(500).json({ error: 'Error al eliminar obra' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'No se pudo eliminar la obra' });
      }
      
      res.json({ 
        message: 'Obra eliminada exitosamente',
        obra_eliminada: obra.nombre
      });
    });
  });
});

// Obtener estadísticas de obras (para admin y jefe de obra)
router.get('/stats/resumen', authenticateToken, authorizeRoles(['admin', 'jefe_obra']), (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM obras',
    'SELECT COUNT(*) as pendientes FROM obras WHERE estado = "pendiente"',
    'SELECT COUNT(*) as en_progreso FROM obras WHERE estado = "en_progreso"',
    'SELECT COUNT(*) as completadas FROM obras WHERE estado = "completada"',
    'SELECT COUNT(*) as canceladas FROM obras WHERE estado = "cancelada"'
  ];
  
  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, [], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  )).then(results => {
    res.json({
      total: results[0].total,
      pendientes: results[1].pendientes,
      en_progreso: results[2].en_progreso,
      completadas: results[3].completadas,
      canceladas: results[4].canceladas
    });
  }).catch(err => {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  });
});

// Obtener obras por albañil (para reportes)
router.get('/albanil/:albanilId', authenticateToken, authorizeRoles(['admin', 'jefe_obra']), (req, res) => {
  const albanilId = req.params.albanilId;
  
  const query = `SELECT o.*, u1.nombre as albanil_nombre, u1.apellido as albanil_apellido,
                        u2.nombre as jefe_nombre, u2.apellido as jefe_apellido
                 FROM obras o
                 LEFT JOIN usuarios u1 ON o.albanil_asignado = u1.id
                 LEFT JOIN usuarios u2 ON o.jefe_obra = u2.id
                 WHERE o.albanil_asignado = ?
                 ORDER BY o.created_at DESC`;
  
  db.all(query, [albanilId], (err, obras) => {
    if (err) {
      console.error('Error al obtener obras del albañil:', err);
      return res.status(500).json({ error: 'Error al obtener obras del albañil' });
    }
    res.json(obras);
  });
});

module.exports = router;