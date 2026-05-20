/**
 * CONTROLADOR DE INSPECTORES
 * 
 * Maneja todas las operaciones relacionadas con inspectores (CRUD):
 * - Listar inspectores existentes
 * - Crear nuevos inspectores
 * - Eliminar inspectores
 * 
 * Solo el admin puede acceder a estos endpoints (validado por middleware).
 */

const db = require('../db');

/**
 * Normaliza un RUT removiendo caracteres especiales
 * Permite comparar RUTs con diferentes formatos
 * Ejemplo: "19.462.699-1" = "194626991"
 * 
 * @param {string} rut - RUT a normalizar
 * @returns {string} RUT normalizado sin puntos, guiones ni espacios
 */
const normalizarRut = (rut = '') => rut
  .toString()
  .trim()
  .toUpperCase()
  .replace(/\./g, '')      // Remueve puntos
  .replace(/-/g, '')       // Remueve guiones
  .replace(/\s+/g, '');    // Remueve espacios

/**
 * CONTROLADOR: Listar inspectores
 * 
 * Obtiene todos los usuarios con rol='inspector' de la base de datos.
 * Devuelve: id, rut, nombre, rol
 * Ordenados por ID descendente (más nuevos primero)
 * 
 * Ruta: GET /api/inspectores
 * Requiere: Autenticación (header x-user-rut) + rol=admin
 * Responde: Array de inspectores [{id, rut, nombre, rol}, ...]
 * 
 * @param {object} req - Request HTTP
 * @param {object} res - Response HTTP
 */
exports.listarInspectores = (req, res) => {
  // Query SQL que obtiene todos los inspectores
  // COALESCE devuelve '' si nombre es NULL (evita valores nulos en respuesta)
  const sql = "SELECT id, rut, COALESCE(nombre, '') AS nombre, rol FROM usuarios WHERE rol = 'inspector' ORDER BY id DESC";

  db.query(sql, (err, results) => {
    // Si hay error en la BD, devuelve error 500
    if (err) {
      return res.status(500).json({ mensaje: 'Error al listar inspectores' });
    }

    // Devuelve la lista de inspectores en formato JSON
    res.json(results);
  });
};

/**
 * CONTROLADOR: Crear inspector
 * 
 * Crea un nuevo usuario con rol='inspector' en la base de datos.
 * Validaciones:
 * - RUT y password son obligatorios
 * - No puede haber dos usuarios con el mismo RUT
 * - Password se guarda en texto plano
 * 
 * Ruta: POST /api/inspectores
 * Requiere: Autenticación + rol=admin
 * Body esperado: {rut: string, nombre?: string, password: string}
 * Responde: {mensaje: "Inspector creado correctamente"} o error
 * 
 * @param {object} req - Request HTTP con body
 * @param {object} res - Response HTTP
 */
exports.crearInspector = async (req, res) => {
  try {
    // Extrae los datos del body del request
    const { rut, nombre, password } = req.body;

    // Valida que RUT y password sean proporcionados
    if (!rut || !password) {
      return res.status(400).json({ mensaje: 'RUT y password son obligatorios' });
    }

    // Normaliza el RUT para compararlo con los de la BD
    const rutNormalizado = normalizarRut(rut);

    // Busca si ya existe un usuario con ese RUT normalizado
    db.query(
      'SELECT id FROM usuarios WHERE REPLACE(REPLACE(REPLACE(UPPER(rut), ".", ""), "-", ""), " ", "") = ?',
      [rutNormalizado],
      async (err, results) => {
        // Si hay error en la BD
        if (err) {
          return res.status(500).json({ mensaje: 'Error al validar inspector' });
        }

        // Si ya existe un usuario con ese RUT, devuelve error 409 (conflicto)
        if (results.length > 0) {
          return res.status(409).json({ mensaje: 'Ya existe un usuario con ese RUT' });
        }

        // Inserta el nuevo inspector en la BD
        db.query(
          'INSERT INTO usuarios (rut, nombre, password, rol) VALUES (?, ?, ?, ?)',
          [
            rut.trim(),              // RUT sin espacios
            (nombre || '').trim(),   // Nombre (vacío si no se proporciona)
            password,                // Password en texto plano
            'inspector'              // Rol fijo como 'inspector'
          ],
          insertErr => {
            // Si hay error al insertar
            if (insertErr) {
              return res.status(500).json({ mensaje: 'Error al crear inspector' });
            }

            // Devuelve 201 (Created) indicando éxito
            res.status(201).json({ mensaje: 'Inspector creado correctamente' });
          }
        );
      }
    );
  } catch {
    // Captura cualquier error no controlado
    res.status(500).json({ mensaje: 'Error al crear inspector' });
  }
};

/**
 * CONTROLADOR: Eliminar inspector
 * 
 * Elimina un usuario inspector de la base de datos por su ID.
 * Validaciones:
 * - El usuario debe existir
 * - El usuario debe tener rol='inspector' (no se pueden eliminar admins)
 * 
 * Ruta: DELETE /api/inspectores/:id
 * Requiere: Autenticación + rol=admin
 * Parámetros: id (ID del inspector a eliminar)
 * Responde: {mensaje: "Inspector eliminado correctamente"} o error
 * 
 * @param {object} req - Request HTTP con parámetro :id
 * @param {object} res - Response HTTP
 */
exports.eliminarInspector = (req, res) => {
  // Extrae el ID del parámetro de la URL (/inspectores/:id)
  const { id } = req.params;

  // Busca el usuario por ID para verificar que es un inspector
  db.query('SELECT rol FROM usuarios WHERE id = ?', [id], (err, results) => {
    // Si hay error en la BD
    if (err) {
      return res.status(500).json({ mensaje: 'Error al validar inspector' });
    }

    // Si no existe el usuario, devuelve error 404 (no encontrado)
    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Inspector no encontrado' });
    }

    // Si el usuario existe pero NO es inspector (es admin), rechaza la eliminación
    if (results[0].rol !== 'inspector') {
      return res.status(400).json({ mensaje: 'Solo se pueden eliminar inspectores' });
    }

    // Elimina el inspector de la BD
    db.query('DELETE FROM usuarios WHERE id = ?', [id], deleteErr => {
      // Si hay error al eliminar
      if (deleteErr) {
        return res.status(500).json({ mensaje: 'Error al eliminar inspector' });
      }

      // Devuelve mensaje de éxito
      res.json({ mensaje: 'Inspector eliminado correctamente' });
    });
  });
};
