/**
 * servicio-autenticacion — funciones de dominio para registro, verificacion e
 * inicio de sesion. Envuelven los endpoints REST del backend. El registro ya no
 * abre sesion: crea la cuenta (no verificada) y dispara el envio del codigo; la
 * sesion se persiste solo al iniciar sesion tras verificar. Los componentes
 * llaman a estas funciones, nunca a axios.
 */

import api from './servicio-api.js';
import { guardar_sesion, eliminar_sesion } from './almacenamiento-sesion.js';
import { conectar_socket, desconectar_socket } from './servicio-socket.js';

/**
 * Registra una cuenta nueva. La cuenta nace NO verificada; el backend envia un
 * codigo de verificacion al correo. No abre sesion.
 *
 * @param {object} datos - { nombre, apellido, correo, contrasena }.
 * @returns {Promise<object>} El usuario creado (campos publicos).
 */
export async function registrar_usuario(datos) {
  const { data } = await api.post('/auth/registro', {
    nombre: datos.nombre,
    apellido: datos.apellido,
    correo: datos.correo,
    contrasena: datos.contrasena,
  });
  return data.usuario;
}

/**
 * Verifica el codigo de 6 digitos enviado al correo y activa la cuenta.
 *
 * @param {string} correo - Correo del usuario.
 * @param {string} codigo - Codigo de 6 digitos.
 * @returns {Promise<object>} El usuario ya verificado.
 */
export async function verificar_codigo(correo, codigo) {
  const { data } = await api.post('/auth/verificar', { correo, codigo });
  return data.usuario;
}

/**
 * Solicita el reenvio de un codigo de verificacion nuevo.
 *
 * @param {string} correo - Correo del usuario.
 * @returns {Promise<void>}
 */
export async function reenviar_codigo(correo) {
  await api.post('/auth/reenviar', { correo });
}

/**
 * Inicia sesion por correo y contrasena. Ante exito persiste la sesion y
 * devuelve el usuario autenticado.
 *
 * @param {string} correo - Correo del usuario.
 * @param {string} contrasena - Contrasena en texto plano.
 * @returns {Promise<object>} El usuario autenticado (campos publicos).
 */
export async function iniciar_sesion(correo, contrasena) {
  const { data } = await api.post('/auth/login', { correo, contrasena });
  guardar_sesion(data.token, data.usuario);
  conectar_socket();
  return data.usuario;
}

/** Cierra la sesion: desconecta el socket en tiempo real y borra el token y el usuario del navegador. */
export function cerrar_sesion() {
  desconectar_socket();
  eliminar_sesion();
}
