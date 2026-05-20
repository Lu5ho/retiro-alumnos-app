/**
 * COMPONENTE: Pantalla de Login
 * 
 * Responsabilidades:
 * - Mostrar formulario de login (RUT + Contraseña)
 * - Validar credenciales con el backend
 * - Llamar a onLoginSuccess si la autenticación es exitosa
 * - Mostrar mensajes de error si la autenticación falla
 * 
 * Props:
 *   onLoginSuccess: callback que recibe el objeto usuario {id, rut, nombre, rol}
 *                   se ejecuta cuando el login es exitoso
 */

import { useState } from 'react';
import api from '../services/api';

function Login({ onLoginSuccess }) {
  // Estado para el RUT ingresado por el usuario
  const [rut, setRut] = useState('');
  
  // Estado para la contraseña ingresada por el usuario
  const [password, setPassword] = useState('');

  /**
   * FUNCIÓN: Manejar login
   * 
   * Se ejecuta cuando el usuario hace click en "Ingresar"
   * 
   * Proceso:
   * 1. Envía RUT y contraseña al backend (POST /api/login)
   * 2. Si es exitoso: obtiene el objeto usuario con su rol
   * 3. Llama al callback onLoginSuccess pasando el usuario
   * 4. Si falla: muestra mensaje de error
   */
  const handleLogin = async () => {
    try {
      // Envía credenciales al backend
      const res = await api.post('/login', { rut, password });
      
      // Muestra mensaje de éxito (mensaje del backend)
      alert(res.data.mensaje);
      
      // Llama al callback con el objeto usuario
      // Este objeto contiene: id, rut, nombre, rol ('admin' o 'inspector')
      if (onLoginSuccess) {
        onLoginSuccess(res.data?.usuario);
      }
    } catch (error) {
      // Si hay error, obtiene el mensaje del backend o genérico
      const mensaje = error?.response?.data?.mensaje || 'Error login';
      alert(mensaje);
    }
  };

  return (
  // Contenedor principal con fondo gradiente
  <div
    className="d-flex justify-content-center align-items-center vh-100"
    style={{
      background: 'linear-gradient(135deg, #4e73df, #1cc88a)',
      flexDirection: 'column',
      position: 'relative'
    }}
  >
    {/* Logo de la institución en la esquina superior derecha */}
    <img src="/Logo LB 2024.png" alt="logo liceo"
      style={{
        position: 'absolute',
        top: '30px',
        right: '30px',
        width: '140px'
      }}
    />

    {/* Título principal */}
    <h1 style={{
      color: '#fff',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
      marginBottom: '30px',
      letterSpacing: '1px',
      textAlign: 'center'
    }}>
      LICEO BICENTENARIO POLITECNICO
    </h1>

    {/* Card con el formulario de login */}
    <div className="card shadow-lg p-4" style={{
      width: '350px',
      borderRadius: '20px',
      backdropFilter: 'blur(10px)',
      backgroundColor: 'rgba(255,255,255,0.9)'
    }}>
      {/* Título del formulario */}
      <h3 className="text-center mb-4 fw-bold">Ingreso Sistema</h3>

      {/* Campo de RUT */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control rounded-pill"
          placeholder="RUT"
          onChange={e => setRut(e.target.value)}
        />
      </div>

      {/* Campo de Contraseña */}
      <div className="mb-3">
        <input
          type="password"
          className="form-control rounded-pill"
          placeholder="Contraseña"
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      {/* Botón para enviar login */}
      <button className="btn btn-dark w-100 rounded-pill" onClick={handleLogin}>
        Ingresar
      </button>
    </div>

    {/* Footer con información de la institución */}
    <footer
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        textAlign: 'center',
        width: '100%',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: '10px 12px',
        margin: 0,
        fontSize: '0.85rem',
        fontWeight: '300',
        letterSpacing: '0.5px'
      }}
    >
      Dirección San Patricio 500, Sector Guacolda, Lautaro, Fono 45-2270700 <br />
      © Creado por Luis Navarrete - Derechos reservados
    </footer>
  </div>
);

}

export default Login;
