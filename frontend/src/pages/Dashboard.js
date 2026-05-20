import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [retirosPorFecha, setRetirosPorFecha] = useState([]);
  const [distribucionAlumnos, setDistribucionAlumnos] = useState([]);
  const [actividadInspectores, setActividadInspectores] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      const [resRetiros, resAlumnos, resInspectores] = await Promise.all([
        api.get('/retiros'),
        api.get('/alumnos'),
        api.get('/inspectores')
      ]);

      procesarRetirosPorFecha(resRetiros.data);
      procesarDistribucionAlumnos(resAlumnos.data);
      procesarActividadInspectores(resInspectores.data, resRetiros.data);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  };

  // Procesa retiros agrupados por fecha
  const procesarRetirosPorFecha = (retiros) => {
    const agrupados = {};
    retiros.forEach(retiro => {
      const fecha = new Date(retiro.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      agrupados[fecha] = (agrupados[fecha] || 0) + 1;
    });

    const datos = Object.keys(agrupados).map(fecha => ({
      fecha,
      retiros: agrupados[fecha]
    }));
    setRetirosPorFecha(datos);
  };

  // Procesa distribución de alumnos por estado
  const procesarDistribucionAlumnos = (alumnos) => {
    const estados = { 'Activo': 0, 'Retirado': 0, 'Pendiente': 0 };
    alumnos.forEach(alumno => {
      if (alumno.estado && estados.hasOwnProperty(alumno.estado)) {
        estados[alumno.estado]++;
      } else {
        estados['Activo']++;
      }
    });

    const datos = Object.keys(estados).map(estado => ({
      name: estado,
      value: estados[estado]
    }));
    setDistribucionAlumnos(datos);
  };

  // Procesa actividad de inspectores
  const procesarActividadInspectores = (inspectores, retiros) => {
    const actividad = {};
    
    inspectores.forEach(inspector => {
      actividad[inspector.nombre] = 0;
    });

    retiros.forEach(retiro => {
      if (retiro.inspector && actividad.hasOwnProperty(retiro.inspector)) {
        actividad[retiro.inspector]++;
      }
    });

    const datos = Object.keys(actividad).map(inspector => ({
      inspector,
      retiros: actividad[inspector]
    }));
    setActividadInspectores(datos);
  };

  const COLORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (cargando) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-info text-center">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="mb-4" style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '2.5rem', letterSpacing: '1px' }}>📊 Dashboard</h1>

      <div className="row">
        {/* Gráfico de Retiros por Fecha */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              📈 Retiros por Fecha
            </div>
            <div className="card-body">
              {retirosPorFecha.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={retirosPorFecha}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="retiros" stroke="#0088FE" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted">No hay datos de retiros</p>
              )}
            </div>
          </div>
        </div>

        {/* Gráfico de Distribución de Alumnos */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header bg-success text-white">
              👥 Distribución de Alumnos
            </div>
            <div className="card-body">
              {distribucionAlumnos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribucionAlumnos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribucionAlumnos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted">No hay datos de alumnos</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Gráfico de Actividad de Inspectores */}
        <div className="col-md-12 mb-4">
          <div className="card">
            <div className="card-header bg-warning text-dark">
              🔍 Actividad de Inspectores
            </div>
            <div className="card-body">
              {actividadInspectores.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={actividadInspectores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="inspector" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="retiros" fill="#FFC658" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted">No hay datos de inspectores</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
