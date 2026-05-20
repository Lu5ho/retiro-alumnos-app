const mysql = require('mysql2');

// Crea una conexión única a la base de datos MySQL que usan los controladores.
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'retiro_alumnos'
});

// Ejecuta una conexión inicial para confirmar que la base de datos está disponible.
db.connect(err => {
  if (err) {
    console.error('Error DB:', err);
  } else {
    console.log('MySQL conectado');
  }
});

module.exports = db;

