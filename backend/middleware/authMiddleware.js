/**
 * MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
 * 
 * Este módulo proporciona middleware para proteger rutas del backend.
 * Valida que el usuario esté autenticado y tiene permisos específicos (admin).
 */

const db = require('../db');

/**
 * Normaliza un RUT removiendo puntos, guiones y espacios
 * Ejemplo: "19.462.699-1" → "194626991"
 * 
 * @param {string} rut - RUT a normalizar
 * @returns {string} RUT normalizado en mayúsculas sin caracteres especiales
 */
const normalizarRut = (rut = '') => rut
  .toString()
  .trim()
  .toUpperCase()
  .replace(/\./g, '')      // Remueve puntos
  .replace(/-/g, '')       // Remueve guiones
  .replace(/\s+/g, '');    // Remueve espacios

/**
 * MIDDLEWARE: Requiere autenticación
 * 
 * Valida que el cliente haya enviado un header 'x-user-rut' con un usuario válido.
 * Si pasa la validación, adjunta los datos del usuario a req.user para que
 * las funciones controladoras puedan acceder a ellos.
 * 
 * Uso en rutas:
 *   router.use(requireAuth);  // Protege todas las rutas del router
 * 
 * @param {object} req - Objeto de request HTTP (debe incluir header 'x-user-rut')
 * @param {object} res - Objeto de response HTTP
 * @param {function} next - Callback para continuar al siguiente middleware/controlador
 */
const requireAuth = (req, res, next) => {
  // Extrae el RUT del header 'x-user-rut' enviado por el frontend
  const rutHeader = req.headers['x-user-rut'];

  // Si no hay RUT en el header, rechaza la solicitud (no autenticado)
  if (!rutHeader) {
    return res.status(401).json({ mensaje: 'No autenticado' });
  }

  // Normaliza el RUT para compararlo con los de la BD (sin puntos, guiones, etc)
  const rutNormalizado = normalizarRut(rutHeader);
  
  // Query SQL que busca el usuario en la BD
  // Usa REPLACE para normalizar el RUT almacenado en la BD al comparar
  const sql = 'SELECT id, rut, nombre, rol FROM usuarios WHERE REPLACE(REPLACE(REPLACE(UPPER(rut), ".", ""), "-", ""), " ", "") = ? LIMIT 1';

  // Ejecuta la búsqueda en la BD
  db.query(sql, [rutNormalizado], (err, results) => {
    // Si hay error en la BD, devuelve error 500
    if (err) {
      return res.status(500).json({ mensaje: 'Error de autenticacion' });
    }

    // Si no encuentra el usuario, devuelve error 401 (no autorizado)
    if (results.length === 0) {
      return res.status(401).json({ mensaje: 'Usuario no valido' });
    }

    // Si todo está bien, adjunta los datos del usuario a req.user
    // Ahora el controlador puede acceder a: req.user.id, req.user.rut, req.user.rol, etc.
    req.user = results[0];
    
    // Continúa al siguiente middleware o controlador
    next();
  });
};

/**
 * MIDDLEWARE: Requiere rol de administrador
 * 
 * Valida que el usuario autenticado tenga rol='admin'.
 * DEBE usarse después de requireAuth en el mismo router.
 * 
 * Uso en rutas:
 *   router.use(requireAuth);  // Primero valida autenticación
 *   router.use(requireAdmin);  // Luego valida que sea admin
 * 
 * @param {object} req - Objeto de request (req.user debe estar populated por requireAuth)
 * @param {object} res - Objeto de response HTTP
 * @param {function} next - Callback para continuar
 */
const requireAdmin = (req, res, next) => {
  // Verifica que:
  // 1. req.user exista (middleware requireAuth se ejecutó)
  // 2. req.user.rol sea exactamente 'admin'
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ 
      mensaje: 'Solo el administrador puede realizar esta accion' 
    });
  }

  // Si es admin, continúa al siguiente middleware/controlador
  next();
};

/**
 * Exporta los dos middlewares para que se usen en las rutas
 */
module.exports = {
  requireAuth,
  requireAdmin
};
