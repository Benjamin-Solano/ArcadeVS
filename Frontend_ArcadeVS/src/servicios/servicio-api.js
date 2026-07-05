/**
 * servicio-api — cliente HTTP central (axios) para consumir la API REST del
 * backend. Expone una instancia unica con la URL base tomada del entorno, un
 * interceptor que adjunta el token JWT (si existe) en cada peticion y otro que
 * normaliza los errores del backend ({ codigo, mensaje }) a un Error uniforme.
 *
 * Los servicios de dominio (servicio-autenticacion, etc.) importan esta
 * instancia; los componentes nunca llaman a axios directamente.
 */

import axios from 'axios';
import { obtener_token } from './almacenamiento-sesion.js';

/** URL base de la API REST; en desarrollo apunta al backend local. */
const URL_BASE_API = import.meta.env.VITE_URL_BASE_API ?? 'http://localhost:3000';

/** Instancia unica de axios reutilizada por todos los servicios de dominio. */
const api = axios.create({
  baseURL: URL_BASE_API,
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta el token JWT (si el usuario tiene sesion) en la cabecera Authorization.
api.interceptors.request.use((configuracion) => {
  const token = obtener_token();
  if (token) {
    configuracion.headers.Authorization = `Bearer ${token}`;
  }
  return configuracion;
});

// Normaliza los errores: el backend responde { codigo, mensaje }. Se propaga un
// Error con esos campos para que la UI muestre un mensaje legible en espanol.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const datos = error.response?.data;
    const normalizado = new Error(
      datos?.mensaje ?? 'No se pudo conectar con el servidor. Intenta de nuevo.',
    );
    normalizado.codigo = datos?.codigo ?? 'ERROR_RED';
    normalizado.estado_http = error.response?.status ?? 0;
    return Promise.reject(normalizado);
  },
);

export default api;
