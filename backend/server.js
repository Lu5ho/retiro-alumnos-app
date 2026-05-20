/**
 * SERVIDOR PRINCIPAL (BACKEND EXPRESS)
 * 
 * Inicia un servidor Express.js que maneja:
 * - API REST para autenticación, gestión de alumnos, retiros e inspectores
 * - Migración automática de base de datos
 * - Generación automática de reportes diarios
 * 
 * Puerto: 3001
 * Métodos HTTP: POST, GET, DELETE
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Importa funciones de migración de BD
const { 
  asegurarColumnaTipoMovimiento,  // Crea columna tipo_movimiento en retiros
  inicializarProgramadorReporte   // Programa generación de reportes a las 14:00
} = require('./controllers/retirosController');

// Importa función de inicialización de usuarios
const { 
  asegurarSistemaUsuarios  // Crea tabla usuarios con columnas rol y nombre
} = require('./controllers/authController');

// Crea la aplicación Express
const app = express();

/**
 * MIDDLEWARE GLOBAL
 * Se ejecuta en TODOS los requests antes de llegar a las rutas
 */

// Permite peticiones desde cualquier origen (CORS)
app.use(cors());

// Parsea el body de requests JSON
app.use(express.json());

/**
 * SERVICIO ESTÁTICO DE ARCHIVOS
 * Expone la carpeta /pdfs para que el frontend pueda descargar reportes
 * Ejemplo: http://localhost:3001/pdfs/reporte-diario-2026-05-06.pdf
 */
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

/**
 * RUTAS PRINCIPALES DE LA API
 * Cada módulo maneja un aspecto diferente del sistema
 */

// /api/login, /api/logout, etc.
app.use('/api', require('./routes/auth'));

// /api/alumnos, /api/alumnos/:rut (protegido con requireAuth)
app.use('/api', require('./routes/alumnos'));

// /api/retiros (protegido con requireAuth)
app.use('/api', require('./routes/retiros'));

// /api/inspectores (protegido con requireAuth + requireAdmin)
app.use('/api', require('./routes/inspectores'));

/**
 * RUTA DE PRUEBA
 * Devuelve mensaje simple para verificar que el servidor está funcionando
 */
app.get('/', (req, res) => {
  res.send('API funcionando');
});

/**
 * INICIALIZACIÓN DEL SISTEMA
 * Se ejecuta UNA SOLA VEZ al arrancar el servidor
 * 
 * Tareas:
 * 1. Crea columnas faltantes en BD (migraciones automáticas)
 * 2. Crea el usuario admin por defecto si no existe
 * 3. Inicia el programador de reportes diarios
 */
Promise.all([
  // Migración 1: Asegura que existe columna tipo_movimiento en tabla retiros
  asegurarColumnaTipoMovimiento(),
  
  // Migración 2: Crea tabla usuarios con columnas nombre y rol, y admin por defecto
  asegurarSistemaUsuarios()
])
  .then(() => {
    // Si todas las migraciones fueron exitosas, inicia el programador de reportes
    // Esto genera un PDF todos los días a las 14:00 con los movimientos del día
    inicializarProgramadorReporte();
  })
  .catch(error => {
    // Si hay algún error en las migraciones, lo imprime pero sigue corriendo
    console.error('Error al preparar el esquema de la base de datos:', error);
  });

/**
 * ESCUCHAR PUERTO
 * El servidor queda esperando peticiones HTTP en puerto 3001
 */
app.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});
