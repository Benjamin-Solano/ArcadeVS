/**
 * servicio-usuario — funciones de dominio del perfil de usuario. Envuelven los
 * endpoints REST protegidos del backend (requieren token de sesion, que el
 * interceptor de servicio-api adjunta automaticamente). Los componentes llaman a
 * estas funciones, nunca a axios directamente.
 */

import api from './servicio-api.js';

/**
 * Obtiene el perfil del usuario autenticado (campos publicos actualizados).
 *
 * @returns {Promise<object>} El usuario (id_usuario, nombre, codigo_amigo, rol, ...).
 */
export async function obtener_perfil() {
  const { data } = await api.get('/usuarios/perfil');
  return data.usuario;
}

/**
 * Obtiene el resumen de estadisticas de juego del usuario autenticado.
 *
 * @returns {Promise<{partidas: number, victorias: number, derrotas: number,
 *          empates: number, torneos: number, amigos: number}>} Estadisticas del perfil.
 */
export async function obtener_estadisticas() {
  const { data } = await api.get('/usuarios/estadisticas');
  return data.estadisticas;
}

/**
 * Actualiza los campos editables del perfil del usuario autenticado. El backend
 * reemplaza los tres campos (nacionalidad, fecha_nacimiento, avatar_url), asi que
 * conviene enviar los valores actuales junto al que se cambia.
 *
 * @param {object} datos - { nacionalidad?, fecha_nacimiento?, avatar_url? }.
 * @returns {Promise<object>} El usuario actualizado (campos publicos).
 */
export async function actualizar_perfil(datos) {
  const { data } = await api.put('/usuarios/perfil', datos);
  return data.usuario;
}

/**
 * Actualiza el nombre visible (alias) del usuario autenticado.
 *
 * @param {string} nombre - Nuevo nombre visible.
 * @returns {Promise<object>} El usuario actualizado (campos publicos).
 */
export async function actualizar_nombre(nombre) {
  const { data } = await api.put('/usuarios/nombre', { nombre });
  return data.usuario;
}
