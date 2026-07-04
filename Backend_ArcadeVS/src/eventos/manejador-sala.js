/**
 * Manejador de eventos del dominio `sala` (capa de entrada Socket.io).
 *
 * Gestiona la pertenencia de un socket a las salas (rooms) de Socket.io. Una
 * sala agrupa a los clientes interesados en el mismo contexto (leaderboard de
 * un juego, sala de una partida) para poder difundirles eventos en tiempo real.
 *
 * Eventos manejados (ver catalogo en arquitectura-crt-gaming-v2.md seccion 5.4):
 *   sala:unirse  (Cliente → Servidor)  el usuario entra a una sala.
 *   sala:salir   (Cliente → Servidor)  el usuario sale de una sala.
 */

/**
 * Une el socket a la sala indicada.
 *
 * @param {import('socket.io').Socket} socket - Socket del cliente.
 * @param {object} datos - Payload { id_sala }.
 * @returns {void}
 */
export function manejar_union_sala(socket, datos) {
  if (!datos?.id_sala) {
    return;
  }
  socket.join(datos.id_sala);
}

/**
 * Saca el socket de la sala indicada.
 *
 * @param {import('socket.io').Socket} socket - Socket del cliente.
 * @param {object} datos - Payload { id_sala }.
 * @returns {void}
 */
export function manejar_salida_sala(socket, datos) {
  if (!datos?.id_sala) {
    return;
  }
  socket.leave(datos.id_sala);
}

/**
 * Registra los listeners del dominio `sala` sobre un socket recien conectado.
 *
 * @param {import('socket.io').Socket} socket - Socket del cliente.
 * @returns {void}
 */
export function registrar_manejador_sala(socket) {
  socket.on('sala:unirse', (datos) => manejar_union_sala(socket, datos));
  socket.on('sala:salir', (datos) => manejar_salida_sala(socket, datos));
}
