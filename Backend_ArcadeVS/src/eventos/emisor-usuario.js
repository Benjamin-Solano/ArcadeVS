/**
 * Emisores de eventos del dominio `usuario` (capa de salida Socket.io).
 *
 * Puentea acciones que ocurren fuera del bus (por ejemplo una actualizacion de
 * perfil via REST) hacia el bus de eventos, difundiendo la notificacion a la
 * sala personal del usuario. No escribe SQL ni contiene logica de negocio: solo
 * traduce un resultado ya calculado en una emision de Socket.io.
 */

import { sala_de_usuario } from './salas.js';

/**
 * Notifica al usuario (todas sus conexiones) que su perfil se actualizo.
 * Emite `usuario:perfil_actualizado` a su sala personal (catalogo, seccion 5.2).
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {string} id_usuario - UUID del usuario dueno del perfil.
 * @param {object} datos_perfil - Perfil actualizado (campos publicos).
 * @returns {void}
 */
export function emitir_perfil_actualizado(io, id_usuario, datos_perfil) {
  io.to(sala_de_usuario(id_usuario)).emit('usuario:perfil_actualizado', {
    id_usuario,
    datos_perfil,
  });
}
