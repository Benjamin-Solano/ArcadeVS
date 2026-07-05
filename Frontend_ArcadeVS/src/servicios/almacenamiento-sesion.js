/**
 * almacenamiento-sesion — persistencia de la sesion del usuario en el
 * navegador (localStorage). Aisla el acceso a localStorage para que el resto
 * de la app no dependa de sus claves ni de su formato.
 *
 * Se guardan el token JWT firmado por el backend y el usuario autenticado.
 */

/** Clave de localStorage donde se guarda el token JWT. */
const CLAVE_TOKEN = 'arcadevs_token';

/** Clave de localStorage donde se guarda el usuario autenticado (JSON). */
const CLAVE_USUARIO = 'arcadevs_usuario';

/** @returns {string|null} El token JWT guardado, o null si no hay sesion. */
export function obtener_token() {
  return localStorage.getItem(CLAVE_TOKEN);
}

/** @returns {object|null} El usuario guardado, o null si no hay sesion. */
export function obtener_usuario() {
  const crudo = localStorage.getItem(CLAVE_USUARIO);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo);
  } catch {
    return null;
  }
}

/**
 * Persiste la sesion tras un login o registro correcto.
 *
 * @param {string} token - Token JWT firmado por el backend.
 * @param {object} usuario - Usuario autenticado (campos publicos).
 */
export function guardar_sesion(token, usuario) {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

/** Elimina la sesion del navegador (cierre de sesion). */
export function eliminar_sesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}
