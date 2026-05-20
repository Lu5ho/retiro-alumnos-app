/**
 * COMPONENTE RAÍZ (App)
 * 
 * Responsabilidades principales:
 * 1. Gestionar la autenticación global del usuario
 * 2. Persistir la sesión en localStorage
 * 3. Renderizar la pantalla correcta según el estado:
 *    - Login (si no hay usuario)
 *    - RetiroForm (pantalla principal de autorización)
 *    - AddAlumnoForm (agregar estudiantes - acceso limitado)
 *    - AdminInspectores (gestionar inspectores - solo admin)
 * 
 * Este componente es el punto central de control de navegación
 */

import { lazy, Suspense, useState } from 'react';

// Importa todos los componentes de página
import Login from './pages/Login';
import RetiroForm from './pages/RetiroForm';
import AddAlumnoForm from './pages/AddAlumnoForm';
import AdminInspectores from './pages/AdminInspectores';
import './styles/Modal.css';
import './styles/Navbar.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  /**
   * STATE: usuario
   * 
   * Estructura del usuario:
   * {
   *   id: number,              // ID en la BD
   *   rut: "XX.XXX.XXX-X",    // RUT del usuario
   *   nombre: "Juan Perez",   // Nombre completo
   *   rol: "admin" | "inspector"
   * }
   * 
   * Se inicializa desde localStorage si existe sesión previa
   * Esto permite que el usuario no tenga que volver a loguearse
   * si cierra/abre el navegador
   */
  const [usuario, setUsuario] = useState(() => {
    try {
      // Intenta recuperar los datos guardados
      const raw = localStorage.getItem('authUser');
      // Si existen, los parsea a objeto; si no, devuelve null
      return raw ? JSON.parse(raw) : null;
    } catch {
      // Si hay error al parsear, devuelve null
      return null;
    }
  });

  /**
   * STATE: mostrarAddAlumno
   * Controla si se muestra la pantalla de agregar alumnos
   * Solo accesible a usuarios autenticados
   */
  const [mostrarAddAlumno, setMostrarAddAlumno] = useState(false);

  /**
   * STATE: mostrarAdminInspectores
   * Controla si se muestra el panel de administración de inspectores
   * SOLO accesible a usuarios con rol='admin' (verificado en la lógica de render)
   */
  const [mostrarAdminInspectores, setMostrarAdminInspectores] = useState(false);
  const [mostrarDashboard, setMostrarDashboard] = useState(false);

  /**
   * FUNCIÓN: Manejar login exitoso
   * 
   * Se ejecuta cuando Login.js reporta que la autenticación fue exitosa
   * 
   * Recibe: objeto usuario {id, rut, nombre, rol}
   * Hace:
   *   1. Guarda el usuario en el state (actualiza el componente)
   *   2. Guarda en localStorage (persiste la sesión)
   */
  const manejarLoginExitoso = user => {
    // Actualiza el state
    setUsuario(user || null);
    
    // Persiste en localStorage para que sobreviva recarga de página
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    }
  };

  /**
   * FUNCIÓN: Cerrar sesión
   * 
   * Se ejecuta cuando el usuario hace logout
   * 
   * Limpia:
   *   1. Usuario del state (muestra Login nuevamente)
   *   2. Flags de navegación (vuelve a pantalla principal si vuelve a loguearse)
   *   3. localStorage (elimina el autologin)
   */
  const cerrarSesion = () => {
    // Limpia el usuario
    setUsuario(null);
    
    // Limpia los flags de navegación
    setMostrarAddAlumno(false);
    setMostrarAdminInspectores(false);
    
    // Elimina la persistencia
    localStorage.removeItem('authUser');
  };

  /**
   * LÓGICA DE RENDERIZACIÓN
   * 
   * Si el usuario NO está logueado:
   *   Muestra Login
   * 
   * Si SÍ está logueado:
   *   1. Si mostrarAdminInspectores Y rol === 'admin'
   *      → Muestra AdminInspectores
   *   2. Si mostrarAddAlumno
   *      → Muestra AddAlumnoForm
   *   3. Por defecto
   *      → Muestra RetiroForm (pantalla principal)
   */
  
  if (!usuario) {
    // No hay usuario → mostrar login
    return <Login onLoginSuccess={manejarLoginExitoso} />;
  }
  // El usuario está logueado → renderiza una cabecera con navegación y el contenido seleccionado
  let contenido = (
    <RetiroForm
      usuario={usuario}
      onLogout={cerrarSesion}
      onShowAddAlumno={() => setMostrarAddAlumno(true)}
      onShowAdminInspectores={() => setMostrarAdminInspectores(true)}
    />
  );

  if (mostrarAdminInspectores && usuario.rol === 'admin') {
    contenido = <AdminInspectores onBack={() => setMostrarAdminInspectores(false)} />;
  } else if (mostrarAddAlumno) {
    contenido = <AddAlumnoForm onBack={() => setMostrarAddAlumno(false)} />;
  }

  // Estilos inline para el modal (overlay y ventana centrada)
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1050
  };

  const modalStyle = {
    background: '#fff',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '1100px',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '20px'
  };

  return (
    <div>
      <nav className="navbar app-navbar px-3">
        <div className="d-flex gap-2">
          <button className="btn btn-outline-light" onClick={() => { setMostrarDashboard(true); setMostrarAddAlumno(false); setMostrarAdminInspectores(false); }}>
            Dashboard
          </button>
          <button className="btn btn-outline-light" onClick={() => { setMostrarAddAlumno(true); setMostrarDashboard(false); setMostrarAdminInspectores(false); }}>
            Ingresar Alumno
          </button>
          {usuario.rol === 'admin' && (
            <button className="btn btn-outline-light" onClick={() => { setMostrarAdminInspectores(true); setMostrarDashboard(false); setMostrarAddAlumno(false); }}>
              Admin Inspectores
            </button>
          )}
        </div>
        <div>
          <span className="me-3 text-white fw-semibold">{usuario.nombre || usuario.rut}</span>
          <button className="btn btn-light" onClick={cerrarSesion}>Logout</button>
        </div>
      </nav>

      <div className="container-fluid mt-3">{contenido}</div>

      {mostrarDashboard && (
        <div className="modal-overlay" onClick={() => setMostrarDashboard(false)}>
          <div className="modal-window" style={modalStyle} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">Dashboard</h5>
              <div>
                <button className="btn btn-sm btn-secondary me-2" onClick={() => setMostrarDashboard(false)}>Cerrar</button>
              </div>
            </div>
            <Suspense fallback={<div className="alert alert-info text-center">Cargando dashboard...</div>}>
              <Dashboard />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

