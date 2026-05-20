import { useState } from 'react';
import api from '../services/api';

function AddAlumnoForm({ onBack }) {
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [curso, setCurso] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleAgregar = async () => {
    try {
      if (!rut.trim() || !nombre.trim() || !apellidos.trim() || !curso.trim()) {
        setError('Todos los campos son requeridos');
        return;
      }

      setCargando(true);
      setError('');
      setMensaje('');

      const res = await api.post('/alumnos', {
        rut: rut.trim(),
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        curso: curso.trim()
      });

      setMensaje(res.data?.mensaje || 'Alumno agregado exitosamente');
      setRut('');
      setNombre('');
      setApellidos('');
      setCurso('');

      setTimeout(() => {
        if (onBack) onBack();
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.mensaje || 'Error al agregar alumno');
    } finally {
      setCargando(false);
    }
  };

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
      {/* LOGO */}
      <img src="/Logo LB 2024.png" alt="logo"
        style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          width: '140px'
        }}
      />

      {/* TÍTULO */}
      <h1 style={{
        color: '#fff',
        fontSize: '2.2rem',
        fontWeight: 'bold',
        fontFamily: 'Arial Black, sans-serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        marginBottom: '20px',
        textAlign: 'center',
        letterSpacing: '1px'
      }}>
        INGRESAR ALUMNO
      </h1>

      {/* CARD */}
      <div className="card shadow-lg p-4" style={{
        width: 'min(640px, 92vw)',
        maxWidth: '640px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255,255,255,0.9)'
      }}>

        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label fw-semibold">RUT</label>
            <input
              className="form-control"
              placeholder="Ej: 19.462.699-1"
              value={rut}
              onChange={e => setRut(e.target.value)}
              disabled={cargando}
            />
          </div>

          <div>
            <label className="form-label fw-semibold">Nombre</label>
            <input
              className="form-control"
              placeholder="Nombre del alumno"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              disabled={cargando}
            />
          </div>

          <div>
            <label className="form-label fw-semibold">Apellidos</label>
            <input
              className="form-control"
              placeholder="Apellidos"
              value={apellidos}
              onChange={e => setApellidos(e.target.value)}
              disabled={cargando}
            />
          </div>

          <div>
            <label className="form-label fw-semibold">Curso</label>
            <input
              className="form-control"
              placeholder="Ej: 4°A"
              value={curso}
              onChange={e => setCurso(e.target.value)}
              disabled={cargando}
            />
          </div>

          {error && <p className="text-danger mb-2">{error}</p>}
          {mensaje && <p className="text-success mb-2">{mensaje}</p>}

          <div className="d-grid gap-2">
            <button
              className="btn btn-success rounded-pill"
              onClick={handleAgregar}
              disabled={cargando}
            >
              {cargando ? 'Ingresando...' : 'Ingresar Alumno'}
            </button>

            <button
              className="btn btn-outline-secondary rounded-pill"
              onClick={onBack}
              disabled={cargando}
            >
              Volver
            </button>
          </div>
        </div>

      </div>

      {/* FOOTER */}
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

export default AddAlumnoForm;
