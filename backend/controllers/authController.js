/**
 * CONTROLADOR DE AUTENTICACIÓN
 * 
 * Maneja:
 * 1. Login de usuarios (validación de credenciales)
 * 2. Inicialización del sistema de usuarios (migrations y admin por defecto)
 */

const db = require('../db');

/**
 * Constantes del admin por defecto
 * Estos valores se usan para crear el usuario admin la primera vez que corre la app
 */
const RUT_ADMIN_POR_DEFECTO = '19462699-1';
const PASSWORD_ADMIN_POR_DEFECTO = '1234';

/**
 * Normaliza un RUT removiendo caracteres especiales
 * Permite comparar RUTs con diferentes formatos
 * Ejemplo: "19.462.699-1" → "194626991"
 * 
 * @param {string} rut - RUT a normalizar
 * @returns {string} RUT sin puntos, guiones ni espacios, en mayúsculas
 */
const normalizarRut = (rut = '') => rut
  .toString()
  .trim()
  .toUpperCase()
  .replace(/\./g, '')      // Remueve puntos
  .replace(/-/g, '')       // Remueve guiones
  .replace(/\s+/g, '');    // Remueve espacios

/**
 * Convierte callbacks de MySQL a Promesas
 * Permite usar async/await en lugar de callbacks
 * 
 * Ejemplo uso:
 *   const results = await query('SELECT * FROM usuarios WHERE id = ?', [1]);
 * 
 * @param {string} sql - Query SQL con placeholders (?)
 * @param {array} params - Parámetros para los placeholders
 * @returns {Promise} Resuelve con los resultados o rechaza con error
 */
const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, results) => {
    // Si hay error, rechaza la promesa
    if (err) {
      reject(err);
      return;
    }
    // Si todo va bien, resuelve con los resultados
    resolve(results);
  });
});

/**
 * Asegura que una columna existe en la tabla usuarios
 * Si no existe, la crea con ALTER TABLE
 * Sirve para migraciones automáticas
 * 
 * Ejemplo:
 *   await asegurarColumna('rol', "rol VARCHAR(20) NOT NULL DEFAULT 'inspector'");
 * 
 * @param {string} nombreColumna - Nombre de la columna a verificar
 * @param {string} definicion - Definición SQL completa de la columna
 */
const asegurarColumna = async (nombreColumna, definicion) => {
  // Consulta si la columna ya existe en la tabla
  const existe = await query(
    `
      SELECT COUNT(*) AS total
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'usuarios'
        AND COLUMN_NAME = ?
    `,
    [nombreColumna]
  );

  // Si la columna ya existe, no hace nada (evita errores)
  if (existe[0].total > 0) {
    return;
  }

  // Si no existe, la agrega a la tabla
  await query(`ALTER TABLE usuarios ADD COLUMN ${definicion}`);
};

/**
 * Asegura que existe el usuario admin por defecto
 * 
 * Lógica:
 * 1. Busca si existe un usuario con RUT = RUT_ADMIN_POR_DEFECTO
 * 2. Si NO existe: lo crea con rol='admin'
 * 3. Si SÍ existe: actualiza su rol y contraseña por defecto
 */
const asegurarAdminPorDefecto = async () => {
  // Normaliza el RUT del admin para búsqueda
  const rutAdminNormalizado = normalizarRut(RUT_ADMIN_POR_DEFECTO);
  
  // Busca si ya existe un usuario con ese RUT
  const usuarios = await query(
    'SELECT id, rut FROM usuarios WHERE REPLACE(REPLACE(REPLACE(UPPER(rut), ".", ""), "-", ""), " ", "") = ?',
    [rutAdminNormalizado]
  );

  // Si NO existe, lo crea como admin
  if (usuarios.length === 0) {
    // Inserta el nuevo usuario admin
    await query(
      'INSERT INTO usuarios (rut, nombre, password, rol) VALUES (?, ?, ?, ?)',
      [RUT_ADMIN_POR_DEFECTO, 'Administrador', PASSWORD_ADMIN_POR_DEFECTO, 'admin']
    );
    return;
  }

  // Si SÍ existe, se asegura que tenga rol='admin' y contraseña por defecto
  // (útil si el usuario fue creado manualmente con otro rol o con hash previo)
  await query('UPDATE usuarios SET rol = ?, password = ? WHERE id = ?', ['admin', PASSWORD_ADMIN_POR_DEFECTO, usuarios[0].id]);
};

/**
 * Inicializa el sistema de usuarios en el arranque de la app
 * 
 * Se ejecuta una sola vez al iniciar el servidor y:
 * 1. Crea columna 'nombre' si no existe
 * 2. Crea columna 'rol' si no existe
 * 3. Crea el usuario admin por defecto si no existe
 * 
 * Se llama desde server.js en Promise.all()
 */
exports.asegurarSistemaUsuarios = async () => {
  // Crea columna nombre para guardar el nombre completo del usuario
  await asegurarColumna('nombre', "nombre VARCHAR(120) NULL AFTER rut");
  
  // Crea columna rol para distinguir admin vs inspector
  await asegurarColumna('rol', "rol VARCHAR(20) NOT NULL DEFAULT 'inspector' AFTER password");
  
  // Crea el usuario admin por defecto
  await asegurarAdminPorDefecto();
};

/**
 * CONTROLADOR: Login
 * 
 * Valida las credenciales del usuario y devuelve su información
 * si la autenticación es exitosa
 * 
 * Ruta: POST /api/login
 * Body esperado: {rut: "XX.XXX.XXX-X", password: "contraseña"}
 * Responde: {mensaje: "Login correcto", usuario: {...}} o error
 * 
 * @param {object} req - Request HTTP con body {rut, password}
 * @param {object} res - Response HTTP
 */
exports.login = (req, res) => {
  // Extrae RUT y password del body
  const { rut, password } = req.body;
  
  // Normaliza el RUT para poder buscar en la BD
  const rutNormalizado = normalizarRut(rut);

  // Busca el usuario en la BD
  // REPLACE normaliza el RUT almacenado para compararlo correctamente
  db.query(
    'SELECT * FROM usuarios WHERE REPLACE(REPLACE(REPLACE(UPPER(rut), ".", ""), "-", ""), " ", "") = ?',
    [rutNormalizado],
    async (err, results) => {
      // Si hay error en la BD, devuelve error 500
      if (err) {
        console.error('❌ ERROR en login - BD:', err.message);
        console.error('📍 RUT buscado:', rut);
        console.error('📍 RUT normalizado:', rutNormalizado);
        return res.status(500).json({ mensaje: 'Error al iniciar sesión: ' + err.message });
      }

      // Si no encuentra el usuario, devuelve error 401
      if (results.length === 0) {
        return res.status(401).json({ mensaje: 'Usuario no existe' });
      }

      // Obtiene el usuario encontrado
      const user = results[0];
      
      // Compara la contraseña de forma directa
      const valid = password === user.password;

      // Si la password no coincide, devuelve error 401
      if (!valid) {
        return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
      }

      // Si todo es correcto, devuelve un objeto usuario con su rol
      // El frontend usará esto para mostrar/ocultar funcionalidades
      res.json({
        mensaje: 'Login correcto',
        usuario: {
          id: user.id,
          rut: user.rut,
          nombre: user.nombre || '',           // Nombre completo (puede estar vacío)
          rol: user.rol || 'inspector'         // 'admin' o 'inspector'
        }
      });
    }
  );
};
