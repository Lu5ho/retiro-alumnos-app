import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      setCargando(true);
      setError('');

      const resAlumnos = await api.get('/alumnos');
      const listaAlumnos = Array.isArray(resAlumnos.data) ? resAlumnos.data : [];

      setAlumnos(listaAlumnos);

      const cursosUnicos = [...new Set(
        listaAlumnos
          .map(alumno => (alumno.curso || '').trim())
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

      if (cursosUnicos.length > 0) {
        setCursoSeleccionado(cursosUnicos[0]);
      }
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      setError('No se pudieron cargar los alumnos. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const cursos = [...new Set(
    alumnos
      .map(alumno => (alumno.curso || '').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

  const alumnosFiltrados = alumnos.filter(
    alumno => (alumno.curso || '').trim() === cursoSeleccionado
  );

  if (cargando) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-info text-center">Cargando alumnos...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="mb-4 dashboard-title">Filtrador de Alumnos por Curso</h1>

      <div className="card">
        <div className="card-header bg-primary text-white">Buscar por curso</div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {cursos.length === 0 ? (
            <p className="text-muted">No hay cursos registrados.</p>
          ) : (
            <>
              <div className="mb-3">
                <label htmlFor="selectorCurso" className="form-label fw-semibold">Selecciona un curso</label>
                <select
                  id="selectorCurso"
                  className="form-select"
                  value={cursoSeleccionado}
                  onChange={e => setCursoSeleccionado(e.target.value)}
                >
                  {cursos.map(curso => (
                    <option key={curso} value={curso}>
                      {curso}
                    </option>
                  ))}
                </select>
              </div>

              <p className="resultado-resumen">
                Curso <strong>{cursoSeleccionado}</strong>: {alumnosFiltrados.length} alumno(s)
              </p>

              {alumnosFiltrados.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>RUT</th>
                        <th>Nombre</th>
                        <th>Apellidos</th>
                        <th>Curso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosFiltrados.map(alumno => (
                        <tr key={alumno.id || alumno.rut}>
                          <td>{alumno.rut}</td>
                          <td>{alumno.nombre}</td>
                          <td>{alumno.apellidos}</td>
                          <td>{alumno.curso}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No hay alumnos para el curso seleccionado.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
