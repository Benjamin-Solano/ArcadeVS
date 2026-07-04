/**
 * Helpers de nombres de sala (rooms) de Socket.io compartidos entre manejadores.
 *
 * Una sala agrupa a los sockets interesados en un mismo contexto para difundirles
 * eventos. Centralizar aqui los nombres evita que cada dominio invente el suyo y
 * que las convenciones se dupliquen o se desincronicen.
 */

/**
 * Sala personal de un usuario. El socket autenticado se une a ella al conectarse
 * y el servidor la usa para entregarle notificaciones dirigidas (solicitudes de
 * amistad, vinculos confirmados, presencia de sus amigos).
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {string} Nombre de la sala (ej: "usuario:<uuid>").
 */
export function sala_de_usuario(id_usuario) {
  return `usuario:${id_usuario}`;
}
