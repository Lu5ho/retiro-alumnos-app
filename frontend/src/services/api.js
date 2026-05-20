/**
 * CLIENTE HTTP CENTRALIZADO
 * 
 * Archivo que configura Axios para comunicarse con el backend.
 * Beneficios:
 * - Un único lugar para cambiar la URL base
 * - Interceptores que se aplican a TODOS los requests automáticamente
 * - Reutilizable en cualquier componente
 */

import axios from 'axios';

/**
 * Crea una instancia de Axios con configuración base
 * baseURL: URL del servidor backend
 */
const api = axios.create({
  baseURL: 'http://localhost:3001/api'
});

/**
 * INTERCEPTOR DE REQUESTS
 * Se ejecuta automáticamente ANTES de cada request
 * 
 * Propósito: Adjunta el header 'x-user-rut' con las credenciales del usuario
 * Esto permite al backend validar quién está haciendo cada petición
 */
api.interceptors.request.use(config => {
  // Obtiene los datos del usuario guardados en localStorage
  const raw = localStorage.getItem('authUser');

  if (raw) {
    try {
      // Parsea el JSON guardado
      const user = JSON.parse(raw);
      
      // Si existe el RUT del usuario, lo adjunta al header
      if (user?.rut) {
        // Este header es lido por middleware requireAuth en el backend
        config.headers['x-user-rut'] = user.rut;
      }
    } catch {
      // Si hay error al parsear JSON, limpia localStorage (datos corruptos)
      localStorage.removeItem('authUser');
    }
  }

  // Retorna la configuración modificada
  return config;
});

/**
 * Exporta la instancia de Axios
 * Se importa en los componentes para hacer peticiones HTTP
 * 
 * Ejemplo de uso en un componente:
 *   const response = await api.get('/alumnos');
 *   const response = await api.post('/retiros', {...});
 *   const response = await api.delete('/inspectores/5');
 */
export default api;
