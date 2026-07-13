/**
 * servicio-amistades — funciones de dominio de amigos. La carga inicial (lista
 * de amigos, solicitudes pendientes, busqueda por codigo) va por REST; las
 * mutaciones (enviar/aceptar/rechazar) van por Socket.io, como define el
 * catalogo de eventos. Los componentes de amigos llaman a estas funciones,
 * nunca a axios ni al socket directamente.
 */

import api from './servicio-api.js';
import { conectar_socket } from './servicio-socket.js';

/**
 * Obtiene los amigos confirmados del usuario autenticado.
 *
 * @returns {Promise<Array<object>>} Amigos (id_usuario, nombre, apellido, codigo_amigo, avatar_url).
 */
export async function obtener_amigos() {
  const { data } = await api.get('/amigos');
  return data.amigos;
}

/**
 * Obtiene las solicitudes de amistad pendientes del usuario autenticado, con
 * los datos publicos del otro participante ya incluidos.
 *
 * @returns {Promise<Array<object>>} Solicitudes pendientes.
 */
export async function obtener_solicitudes() {
  const { data } = await api.get('/amigos/solicitudes');
  return data.solicitudes;
}

/**
 * Busca un usuario por su codigo de amigo (paso previo a enviar una solicitud).
 *
 * @param {string} codigo - Codigo de amigo de 12 caracteres.
 * @returns {Promise<object>} Datos publicos minimos del usuario encontrado.
 */
export async function buscar_por_codigo(codigo) {
  const { data } = await api.get(`/usuarios/buscar/${encodeURIComponent(codigo)}`);
  return data.usuario;
}

/**
 * Emite un evento de amigo y espera el ack del servidor (tercer argumento de
 * `socket.emit`) en vez de asumir que ya se proceso tras un tiempo fijo.
 *
 * @param {string} evento - Nombre del evento Socket.io.
 * @param {object} payload - Payload del evento.
 * @returns {Promise<void>} Resuelve cuando el servidor confirma; rechaza si
 *          reporta error (el detalle real llega por el evento `amigo:error`).
 */
function emitir_con_ack(evento, payload) {
  return new Promise((resolver, rechazar) => {
    conectar_socket().emit(evento, payload, (respuesta) => {
      if (respuesta?.ok) {
        resolver();
      } else {
        rechazar(new Error('El servidor no pudo procesar la accion.'));
      }
    });
  });
}

/**
 * Envia una solicitud de amistad al usuario indicado (evento `amigo:solicitud_enviada`).
 *
 * @param {string} id_usuario_destino - UUID del usuario destino.
 * @returns {Promise<void>} Resuelve cuando el servidor confirma que la persistio.
 */
export function enviar_solicitud_amistad(id_usuario_destino) {
  return emitir_con_ack('amigo:solicitud_enviada', { id_usuario_destino });
}

/**
 * Acepta una solicitud de amistad pendiente (evento `amigo:solicitud_aceptada`).
 *
 * @param {string} id_solicitud - UUID de la solicitud.
 * @returns {Promise<void>} Resuelve cuando el servidor confirma que la acepto.
 */
export function aceptar_solicitud_amistad(id_solicitud) {
  return emitir_con_ack('amigo:solicitud_aceptada', { id_solicitud });
}

/**
 * Rechaza una solicitud de amistad pendiente (evento `amigo:solicitud_rechazada`).
 *
 * @param {string} id_solicitud - UUID de la solicitud.
 * @returns {Promise<void>} Resuelve cuando el servidor confirma que la rechazo.
 */
export function rechazar_solicitud_amistad(id_solicitud) {
  return emitir_con_ack('amigo:solicitud_rechazada', { id_solicitud });
}
