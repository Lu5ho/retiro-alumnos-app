/**
 * RUTAS DE RETIROS / INGRESOS
 * 
 * Define los endpoints para registrar retiros e ingresos de alumnos.
 * Requiere autenticación: inspectores y admins pueden registrar movimientos.
 */

const express = require('express');
const router = express.Router();
const { autorizarRetiro } = require('../controllers/retirosController');

// Importa el middleware de autenticación
const { requireAuth } = require('../middleware/authMiddleware');

/**
 * Protege TODAS las rutas de este router con autenticación
 * Sin header 'x-user-rut' válido, no se puede acceder a ningún endpoint
 */
router.use(requireAuth);

/**
 * POST /api/retiros
 * Registra un movimiento de retiro o ingreso de un alumno
 * 
 * Body esperado: {
 *   alumno_id: number,
 *   motivo: "Razón del retiro/ingreso",
 *   tipo_movimiento: "Salida" | "Ingreso"
 * }
 * 
 * Funcionalidad:
 * - Inserta el movimiento en la BD
 * - Se incluye en el reporte diario generado a las 14:00
 * 
 * Requiere: Usuario logueado (admin o inspector)
 * Nota: Ambos roles pueden registrar movimientos sin restricción
 */
router.post('/retiros', autorizarRetiro);

module.exports = router;
