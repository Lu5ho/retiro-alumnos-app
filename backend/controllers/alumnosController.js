const db = require('../db');

// Normaliza el RUT para compararlo sin puntos, guion ni espacios.
const normalizarRut = (rut = '') => rut
  .toString()
  .trim()
  .toUpperCase()
  .replace(/\./g, '')
  .replace(/-/g, '')
  .replace(/\s+/g, '');

exports.crearAlumno = (req, res) => {
  // Inserta un alumno nuevo en la base de datos.
  const { rut, nombre, apellidos, curso } = req.body;
  const rutNormalizado = normalizarRut(rut);

  const sql = 'INSERT INTO alumnos (rut, nombre, apellidos, curso) VALUES (?, ?, ?, ?)';

  db.query(sql, [rutNormalizado, nombre, apellidos, curso], (err, result) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al crear alumno' });
    }

    res.json({ mensaje: 'Alumno creado' });
  });
};

exports.obtenerAlumnos = (req, res) => {
  // Devuelve el listado completo de alumnos.
  db.query('SELECT * FROM alumnos', (err, results) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al obtener alumnos' });
    }

    res.json(results);
  });
};

exports.vaciarAlumnosYRetiros = (req, res) => {
  // Limpia primero retiros y luego alumnos para evitar conflictos por claves foráneas.
  db.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al iniciar la limpieza de datos' });
    }

    db.query('DELETE FROM retiros', deleteRetirosErr => {
      if (deleteRetirosErr) {
        return db.rollback(() => {
          res.status(500).json({ mensaje: 'Error al vaciar la tabla de retiros' });
        });
      }

      db.query('DELETE FROM alumnos', deleteAlumnosErr => {
        if (deleteAlumnosErr) {
          return db.rollback(() => {
            res.status(500).json({ mensaje: 'Error al vaciar la tabla de alumnos' });
          });
        }

        db.commit(commitErr => {
          if (commitErr) {
            return db.rollback(() => {
              res.status(500).json({ mensaje: 'Error al confirmar la limpieza de datos' });
            });
          }

          res.json({ mensaje: 'Tablas de retiros y alumnos vaciadas correctamente' });
        });
      });
    });
  });
};

exports.obtenerAlumnoPorRut = (req, res) => {
  // Busca un alumno por RUT usando la versión normalizada.
  const rutBuscado = normalizarRut(req.params.rut);

  const sql = `
    SELECT *
    FROM alumnos
    WHERE REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '') = ?
    LIMIT 1
  `;

  db.query(sql, [rutBuscado], (err, results) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al buscar alumno' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ mensaje: 'Alumno no encontrado' });
    }

    res.json(results[0]);
  });
};
