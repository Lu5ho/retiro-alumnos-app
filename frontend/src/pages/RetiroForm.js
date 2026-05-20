/**
 * COMPONENTE: Formulario de Retiros / Ingresos
 * 
 * Pantalla principal después de loguearse
 * Permite a inspectores (y admin) autorizar retiros e ingresos de estudiantes
 * 
 * Props recibidas desde App.js:
 *   usuario: objeto con {id, rut, nombre, rol}
 *   onLogout: callback para cerrar sesión
 *   onShowAddAlumno: callback para navegar a agregar alumno
 *   onShowAdminInspectores: callback para navegar a admin de inspectores (solo admin)
 */

import { useMemo, useState } from 'react';
import api from '../services/api';

/**
 * FUNCIÓN UTILITARIA: Normalizar RUT
 * Remueve puntos, guiones y espacios para poder comparar RUTs
 * Ejemplo: "19.462.699-1" → "194626991"
 * 
 * @param {string} valor - RUT a normalizar
 * @returns {string} RUT sin caracteres especiales
 */
const normalizarRut = (valor = '') => valor
  .toString()
  .trim()
  .toUpperCase()
  .replace(/\./g, '')      // Remueve puntos
  .replace(/-/g, '')       // Remueve guiones
  .replace(/\s+/g, '');    // Remueve espacios

function RetiroForm({ usuario, onLogout, onShowAddAlumno, onShowAdminInspectores }) {
  // ========== ESTADO DEL FORMULARIO ==========
  
  // RUT que el inspector escribe en el campo de búsqueda
  const [rut, setRut] = useState('');
  
  // Objeto del alumno encontrado: {id, nombre, apellidos, curso}
  const [alumno, setAlumno] = useState(null);
  
  // Texto del motivo del retiro/ingreso
  const [motivo, setMotivo] = useState('');
  
  // Tipo de movimiento: "Salida" o "Ingreso"
  const [tipoMovimiento, setTipoMovimiento] = useState('Salida');
  
  // Flag para mostrar "Buscando..." mientras se ejecuta buscarAlumno()
  const [buscando, setBuscando] = useState(false);
  
  // Mensaje de error si no encuentra al alumno
  const [errorAlumno, setErrorAlumno] = useState('');

  /**
   * STATE: Fecha y hora actual
   * Se calcula UNA SOLA VEZ (useMemo) y se formatea en locale chileno
   * Se muestra en el formulario como referencia temporal
   */
  const fechaHora = useMemo(() => {
    const ahora = new Date();
    // Formato: DD/MM/YYYY
    const fecha = ahora.toLocaleDateString('es-CL');
    // Formato: HH:MM
    const hora = ahora.toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return { fecha, hora };
  }, []);  // Nunca cambia, se calcula solo al montar el componente

  /**
   * FUNCIÓN: Buscar alumno por RUT
   * 
   * Se ejecuta cuando el usuario hace click en el botón "OK"
   * 
   * Proceso:
   * 1. Valida que el RUT no esté vacío
   * 2. Normaliza el RUT
   * 3. Hace petición GET /api/alumnos/:rut
   * 4. Si encuentra: guarda el alumno en state
   * 5. Si no encuentra: muestra error
   */
  const buscarAlumno = async () => {
    // Valida que haya algo escrito
    if (!rut.trim()) {
      setAlumno(null);
      setErrorAlumno('Ingrese un RUT');
      return;
    }

    try {
      // Muestra "Buscando..." al usuario
      setBuscando(true);
      setErrorAlumno('');

      // Normaliza el RUT para comparar correctamente en la BD
      const rutNormalizado = normalizarRut(rut);
      
      // Petición al backend
      const res = await api.get(`/alumnos/${encodeURIComponent(rutNormalizado)}`);
      
      // Si encuentra, guarda los datos del alumno
      setAlumno(res.data);
    } catch (error) {
      // Si no encuentra, muestra error
      setAlumno(null);
      setErrorAlumno(error?.response?.data?.mensaje || 'Alumno no encontrado');
    } finally {
      // Quita el "Buscando..." en ambos casos
      setBuscando(false);
    }
  };

  /**
   * FUNCIÓN: Autorizar/registrar el retiro o ingreso
   * 
   * Se ejecuta cuando el usuario hace click en "Autorizar Retiro o Ingreso"
   * 
   * Proceso:
   * 1. Valida que haya un alumno seleccionado y motivo escrito
   * 2. Hace petición POST /api/retiros con los datos
   * 3. Si es exitoso: limpia el formulario
   * 4. El movimiento entra al reporte diario de las 14:00
   */
  const autorizar = async () => {
    try {
      // Valida que haya alumno antes de proceder
      if (!alumno) {
        alert('Primero debes ingresar un RUT válido');
        return;
      }

      // Envía el movimiento al backend
      const res = await api.post('/retiros', {
        alumno_id: alumno.id,          // ID del alumno encontrado
        motivo,                        // Razón del retiro/ingreso
        tipo_movimiento: tipoMovimiento // "Salida" o "Ingreso"
      });

      // Muestra mensaje de éxito
      alert(res.data?.mensaje || 'Movimiento registrado');
      
      // IMPORTANTE: Limpia el formulario para el siguiente registro
      setRut('');
      setAlumno(null);
      setMotivo('');
      setTipoMovimiento('Salida');
      setErrorAlumno('');
    } catch {
      alert('Error al autorizar');
    }
  };

  /**
   * FUNCIÓN: Cerrar sesión
   * 
   * Se ejecuta cuando el usuario hace click en "Cerrar Sesión"
   * 
   * Limpia el formulario e invoca el callback onLogout del componente padre
   * (que a su vez limpia localStorage y muestra nuevamente el Login)
   */
  const salir = () => {
    // Limpia todo el formulario
    setRut('');
    setAlumno(null);
    setMotivo('');
    setBuscando(false);
    setErrorAlumno('');
    
    // Invoca el callback del padre para cerrar sesión
    if (onLogout) onLogout();
  };

  // ========== RENDERIZACIÓN ==========
  
  return (
    <div
      className="d-flex justify-content-center"
      style={{
        background: 'linear-gradient(135deg, #4e73df, #1cc88a)',
        flexDirection: 'column',
        position: 'relative',
        alignItems: 'center',
        minHeight: '100vh',
        paddingTop: '60px',
        paddingBottom: '40px'
      }}
    >
      {/* Logo de institución (arriba a la izquierda) */}
      <img src="/Logo LB 2024.png" alt="logo"
        style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          width: '140px'
        }}
      />

      {/* Logo de Lautaro (arriba a la derecha) */}
      <img src="/Lautaro-corazon-de-la-araucania-color-01.png" alt="Lautaro"
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
        fontSize: '2.2rem',
        fontWeight: 'bold',
        fontFamily: 'Arial Black, sans-serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        marginBottom: '15px',
        textAlign: 'center',
        letterSpacing: '1px'
      }}>
        AUTORIZACION DE RETIRO
      </h1>

      {/* Card principal con dos columnas */}
      <div className="card shadow-lg p-4" style={{
        width: 'min(640px, 92vw)',
        maxWidth: '640px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255,255,255,0.9)',
        minHeight: 'auto'
      }}>

        <div className="row g-3">
          {/* COLUMNA IZQUIERDA: Entrada y botones */}
          <div className="col-lg-5 d-flex flex-column gap-3">
            
            {/* Campo de búsqueda de RUT */}
            <div className="d-flex gap-2 align-items-start">
              <input
                className="form-control rounded-pill"
                placeholder="Ingrese RUT"
                value={rut}
                onChange={e => {
                  setRut(e.target.value);
                  setAlumno(null);          // Limpia el alumno anterior si el usuario cambia el RUT
                  setErrorAlumno('');       // Limpia el error anterior
                }}
              />
              <button 
                className="btn btn-dark rounded-pill px-3" 
                onClick={buscarAlumno}
              >
                OK
              </button>
            </div>

            {/* Fecha y Hora */}
            <div className="d-flex gap-2">
              <div className="flex-fill">
                <label className="form-label mb-1 fw-semibold">Fecha</label>
                <input 
                  className="form-control" 
                  value={fechaHora.fecha} 
                  readOnly
                />
              </div>
              <div className="flex-fill">
                <label className="form-label mb-1 fw-semibold">Hora</label>
                <input 
                  className="form-control" 
                  value={fechaHora.hora} 
                  readOnly
                />
              </div>
            </div>

            {/* Selector de tipo de movimiento */}
            <div>
              <label className="form-label mb-1 fw-semibold">Tipo de movimiento</label>
              <select
                className="form-select"
                value={tipoMovimiento}
                onChange={e => setTipoMovimiento(e.target.value)}
              >
                <option value="Salida">Salida</option>
                <option value="Ingreso">Ingreso</option>
              </select>
            </div>

            {/* Botones de acción: solo la acción principal permanece aquí */}
            <div className="d-grid gap-2 mt-auto">
              <button
                className="btn btn-success rounded-pill"
                onClick={autorizar}
                disabled={!alumno || !motivo.trim()}
              >
                Autorizar Retiro o Ingreso
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: Datos del alumno y motivo */}
          <div className="col-lg-7">
            
            {/* Indicador de búsqueda en curso */}
            {buscando && <p className="text-muted mb-2">Buscando...</p>}
            
            {/* Mostrar error si no encuentra al alumno */}
            {errorAlumno && <p className="text-danger mb-2">{errorAlumno}</p>}

            {/* Datos del alumno encontrado (solo lectura) */}
            <div className="mb-3">
              <input 
                className="form-control mb-2" 
                value={alumno ? alumno.nombre : ''} 
                placeholder="Nombre" 
                readOnly
              />
              <input 
                className="form-control mb-2" 
                value={alumno ? alumno.apellidos : ''} 
                placeholder="Apellidos" 
                readOnly
              />
              <input 
                className="form-control" 
                value={alumno ? alumno.curso : ''} 
                placeholder="Curso" 
                readOnly
              />
            </div>

            {/* Campo de motivo - aquí escribe el inspector por qué se retira/ingresa */}
            <textarea
              className="form-control"
              rows="5"
              placeholder="Motivo del ingreso o salida"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
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

export default RetiroForm;
