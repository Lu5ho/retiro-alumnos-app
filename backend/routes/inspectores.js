/**
 * RUTAS DE INSPECTORES
 * 
 * Define los endpoints para gestionar inspectores.
 * TODAS estas rutas requieren:
 * 1. Autenticación (header x-user-rut válido)
 * 2. Rol de administrador
 * 
 * Endpoints:
 * - GET  /api/inspectores         → Listar inspectores
 * - POST /api/inspectores         → Crear nuevo inspector
 * - DELETE /api/inspectores/:id   → Eliminar inspector
 */

const express = require('express');
const router = express.Router();

// Importa los controladores
const { 
  listarInspectores, 
  crearInspector, 
  eliminarInspector 
} = require('../controllers/inspectoresController');

// Importa los middlewares de seguridad
const { 
  requireAuth,   // Valida que el usuario esté autenticado
  requireAdmin   // Valida que el usuario sea admin
} = require('../middleware/authMiddleware');

/**
 * Aplica requireAuth a TODAS las rutas de este router
 * Esto significa que sin header 'x-user-rut' válido, no se puede acceder a nada
 */
router.use(requireAuth);

/**
 * Aplica requireAdmin a TODAS las rutas de este router
 * Esto significa que solo usuarios con rol='admin' pueden acceder
 */
router.use(requireAdmin);

/**
 * GET /api/inspectores
 * Devuelve lista de todos los inspectores registrados
 */
router.get('/inspectores', listarInspectores);

/**
 * POST /api/inspectores
 * Crea un nuevo inspector
 * Body esperado: {rut: "XX.XXX.XXX-X", nombre: "Nombre", password: "securepass"}
 */
router.post('/inspectores', crearInspector);

/**
 * DELETE /api/inspectores/:id
 * Elimina un inspector por su ID
 * Ejemplo: /api/inspectores/5
 */
router.delete('/inspectores/:id', eliminarInspector);

module.exports = router;
