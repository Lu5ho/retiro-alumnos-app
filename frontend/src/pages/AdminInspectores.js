/**
 * COMPONENTE: Panel de Administración de Inspectores
 * 
 * ACCESO RESTRINGIDO: Solo usuarios con rol='admin'
 * 
 * Responsabilidades:
 * 1. Listar todos los inspectores registrados en el sistema
 * 2. Permitir crear nuevos inspectores (RUT, nombre, contraseña)
 * 3. Permitir eliminar inspectores existentes
 * 4. Mostrar mensajes de éxito/error de las operaciones
 * 
 * Props recibidas desde App.js:
 *   onBack: callback para volver a RetiroForm
 */

import { useEffect, useState } from 'react';
import api from '../services/api';

function AdminInspectores({ onBack }) {
  // ========== ESTADO DEL COMPONENTE ==========
  
  // Lista de inspectores cargados de la BD
  // Estructura: [{ id, rut, nombre }, ...]
  const [inspectores, setInspectores] = useState([]);
  
  // Campo RUT del formulario de crear inspector
  const [rut, setRut] = useState('');
  
  // Campo Nombre del formulario de crear inspector
  const [nombre, setNombre] = useState('');
  
  // Campo Password del formulario de crear inspector
  const [password, setPassword] = useState('');
  
  // Mensaje de éxito (verde) de crear/eliminar inspector
  const [mensaje, setMensaje] = useState('');
  
  // Mensaje de error (rojo) de operaciones fallidas
  const [error, setError] = useState('');
  
  // Flag para deshabilitar botones mientras se procesa una operación
  const [cargando, setCargando] = useState(false);

  /**
   * FUNCIÓN: Cargar inspectores desde el backend
   * 
   * Se ejecuta al montar el componente (useEffect)
   * y después de crear/eliminar un inspector
   * 
   * Petición: GET /api/inspectores
   * Requiere: Usuario logueado (header x-user-rut se adjunta automáticamente)
   * Devuelve: Array de inspectores [{id, rut, nombre}, ...]
   */
  const cargarInspectores = async () => {
    try {
      // Obtiene la lista de inspectores del backend
      const res = await api.get('/inspectores');
      
      // Guarda la lista (si es null/undefined, usa array vacío)
      setInspectores(res.data || []);
    } catch (err) {
      // Si hay error, muestra mensaje
      setError(err?.response?.data?.mensaje || 'No se pudieron cargar los inspectores');
    }
  };

  /**
   * EFECTO: Al montar el componente
   * 
   * Se ejecuta UNA SOLA VEZ cuando AdminInspectores aparece en pantalla
   * Carga la lista inicial de inspectores
   */
  useEffect(() => {
    cargarInspectores();
  }, []);  // [] = solo al montar

  /**
   * FUNCIÓN: Crear nuevo inspector
   * 
   * Se ejecuta cuando el usuario hace click en "Crear Inspector"
   * 
   * Proceso:
   * 1. Valida que RUT y password no estén vacíos
   * 2. Hace petición POST /api/inspectores con los datos
   * 3. Si es exitoso: limpia formulario y recarga lista
   * 4. Si falla: muestra error
   * 
   * Nota: El backend valida que:
   *   - El usuario que crea sea admin
   *   - El RUT no exista ya
   *   - La contraseña se encripta con bcrypt
   */
  const crearInspector = async () => {
    try {
      // Valida que los campos obligatorios estén completos
      if (!rut.trim() || !password.trim()) {
        setError('RUT y password son obligatorios');
        return;
      }

      // Muestra estado de cargando y limpia mensajes previos
      setCargando(true);
      setError('');
      setMensaje('');

      // Envía los datos del nuevo inspector al backend
      const res = await api.post('/inspectores', {
        rut: rut.trim(),
        nombre: nombre.trim(),
        password: password.trim()
      });

      // Muestra mensaje de éxito
      setMensaje(res.data?.mensaje || 'Inspector creado correctamente');
      
      // Limpia el formulario para permitir crear otro
      setRut('');
      setNombre('');
      setPassword('');
      
      // Recarga la lista de inspectores para mostrar el nuevo
      await cargarInspectores();
    } catch (err) {
      // Si hay error, lo muestra (puede ser: RUT duplicado, 403 no es admin, etc.)
      setError(err?.response?.data?.mensaje || 'Error al crear inspector');
    } finally {
      // Quita el estado de cargando en ambos casos (éxito o error)
      setCargando(false);
    }
  };

  /**
   * FUNCIÓN: Eliminar un inspector
   * 
   * Se ejecuta cuando el usuario hace click en el botón "Eliminar" de un inspector
   * 
   * Proceso:
   * 1. Hace petición DELETE /api/inspectores/:id
   * 2. Si es exitoso: muestra mensaje y recarga lista
   * 3. Si falla: muestra error
   * 
   * Nota: El backend valida que:
   *   - El usuario que elimina sea admin
   *   - El inspector exista
   */
  const eliminarInspector = async id => {
    try {
      // Muestra estado de cargando
      setCargando(true);
      setError('');
      setMensaje('');

      // Envía petición DELETE al backend
      const res = await api.delete(`/inspectores/${id}`);
      
      // Muestra mensaje de éxito
      setMensaje(res.data?.mensaje || 'Inspector eliminado correctamente');
      
      // Recarga la lista para que desaparezca el eliminado
      await cargarInspectores();
    } catch (err) {
      // Si hay error, lo muestra
      setError(err?.response?.data?.mensaje || 'Error al eliminar inspector');
    } finally {
      // Quita el estado de cargando
      setCargando(false);
    }
  };

  // ========== RENDERIZACIÓN ==========

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background: 'linear-gradient(135deg, #4e73df, #1cc88a)',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Logo de institución */}
      <img
        src="/Logo LB 2024.png"
        alt="logo"
        style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          width: '140px'
        }}
      />

      {/* Título principal */}
      <h1
        style={{
          color: '#fff',
          fontSize: '2rem',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          marginBottom: '20px',
          textAlign: 'center'
        }}
      >
        ADMINISTRAR INSPECTORES
      </h1>

      {/* Card principal con dos columnas: formulario y tabla */}
      <div
        className="card shadow-lg p-4"
        style={{
          width: 'min(760px, 94vw)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255,255,255,0.92)'
        }}
      >
        <div className="row g-3">
          {/* COLUMNA IZQUIERDA: Formulario para crear inspector */}
          <div className="col-lg-5">
            {/* Título de la sección */}
            <h5 className="fw-bold">Crear Inspector</h5>

            {/* Campo RUT */}
            <div className="mb-2">
              <label className="form-label fw-semibold">RUT</label>
              <input
                className="form-control"
                value={rut}
                onChange={e => setRut(e.target.value)}
                disabled={cargando}
              />
            </div>

            {/* Campo Nombre (opcional) */}
            <div className="mb-2">
              <label className="form-label fw-semibold">Nombre</label>
              <input
                className="form-control"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                disabled={cargando}
              />
            </div>

            {/* Campo Password */}
            <div className="mb-2">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={cargando}
              />
            </div>

            {/* Botones de acción */}
            <div className="d-grid gap-2 mt-3">
              {/* Botón: Crear inspector */}
              <button 
                className="btn btn-success rounded-pill" 
                onClick={crearInspector} 
                disabled={cargando}
              >
                Crear Inspector
              </button>
              
              {/* Botón: Volver a la pantalla de retiros */}
              <button 
                className="btn btn-outline-secondary rounded-pill" 
                onClick={onBack} 
                disabled={cargando}
              >
                Volver
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: Tabla de inspectores registrados */}
          <div className="col-lg-7">
            {/* Título de la sección */}
            <h5 className="fw-bold">Inspectores Registrados</h5>

            {/* Mostrar error si hay */}
            {error && <p className="text-danger mb-2">{error}</p>}
            
            {/* Mostrar mensaje de éxito si hay */}
            {mensaje && <p className="text-success mb-2">{mensaje}</p>}

            {/* Tabla con scroll vertical si hay muchos inspectores */}
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table className="table table-sm align-middle">
                {/* Encabezados de la tabla */}
                <thead>
                  <tr>
                    <th>RUT</th>
                    <th>Nombre</th>
                    <th className="text-end">Acción</th>
                  </tr>
                </thead>
                
                {/* Filas de la tabla */}
                <tbody>
                  {/* Si no hay inspectores, muestra mensaje */}
                  {inspectores.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-muted">
                        No hay inspectores registrados
                      </td>
                    </tr>
                  )}
                  
                  {/* Renderiza cada inspector */}
                  {inspectores.map(inspector => (
                    <tr key={inspector.id}>
                      {/* RUT del inspector */}
                      <td>{inspector.rut}</td>
                      
                      {/* Nombre del inspector (o guión si no tiene) */}
                      <td>{inspector.nombre || '-'}</td>
                      
                      {/* Botón eliminar */}
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminarInspector(inspector.id)}
                          disabled={cargando}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con información de contacto */}
      <footer
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          textAlign: 'center',
          color: '#fff',
          backgroundColor: '#000',
          padding: '10px',
          fontSize: '0.8rem'
        }}
      >
        Dirección San Patricio 500, Sector Guacolda, Lautaro, Fono 45-2270700 <br />
        © Creado por Luis Navarrete - Derechos reservados
      </footer>
    </div>
  );
}

export default AdminInspectores;
