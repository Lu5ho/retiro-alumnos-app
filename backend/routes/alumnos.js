/**
 * RUTAS DE ALUMNOS
 * 
 * Define los endpoints para gestionar alumnos del sistema.
 * Requiere autenticación: cualquier usuario logueado (admin o inspector) puede acceder.
 */

const express = require('express');
const router = express.Router();
const { 
  crearAlumno, 
  obtenerAlumnos, 
  vaciarAlumnosYRetiros,
  obtenerAlumnoPorRut 
} = require('../controllers/alumnosController');

// Importa el middleware de autenticación
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

/**
 * Protege TODAS las rutas de este router con autenticación
 * Sin header 'x-user-rut' válido, no se puede acceder a ningún endpoint
 */
router.use(requireAuth);

/**
 * POST /api/alumnos
 * Crea un nuevo alumno en el sistema
 * Body esperado: {rut: "XX.XXX.XXX-X", nombre: "", apellidos: "", curso: ""}
 * Requiere: Usuario logueado
 */
router.post('/alumnos', crearAlumno);

/**
 * DELETE /api/alumnos/limpiar-datos
 * Vacía las tablas de retiros y alumnos para preparar una nueva importación
 * Requiere: Usuario administrador
 */
router.delete('/alumnos/limpiar-datos', requireAdmin, vaciarAlumnosYRetiros);

/**
 * GET /api/alumnos
 * Obtiene la lista de todos los alumnos registrados
 * Requiere: Usuario logueado
 */
router.get('/alumnos', obtenerAlumnos);

/**
 * GET /api/alumnos/:rut
 * Busca un alumno específico por su RUT
 * Parámetro: rut (ejemplo: 19462699-1)
 * Se usa en la pantalla de retiros para obtener datos del alumno antes de autorizar
 * Requiere: Usuario logueado
 */
router.get('/alumnos/:rut', obtenerAlumnoPorRut);

module.exports = router;

