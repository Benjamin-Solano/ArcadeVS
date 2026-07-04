/**
 * Manejador de eventos del dominio `usuario` (capa de entrada Socket.io).
 *
 * Gestiona la presencia: cuando un usuario autenticado se conecta o desconecta,
 * notifica a las salas personales de SUS amigos. Vive en la capa de eventos
 * porque orquesta dos servicios (usuario y amistades); los servicios nunca se
 * llaman entre si. No escribe SQL.
 *
 * Eventos emitidos (catalogo, seccion 5.2):
 *   usuario:conectado     (Servidor → salas de amigos)  { id_usuario, nombre }
 *   usuario:desconectado  (Servidor → salas de amigos)  { id_usuario }
 *
 * Presencia idempotente por multiples pestañas: solo se anuncia la conexion en
 * el primer socket del usuario y la desconexion en el ultimo, contando cuantos
 * sockets siguen en su sala personal.
 */

import { obtener_perfil } from '../servicios/servicio-usuario.js';
import { obtener_lista_amigos } from '../servicios/servicio-amistades.js';
import { sala_de_usuario } from './salas.js';

/**
 * Emite un evento a la sala personal de cada amigo. Los amigos desconectados
 * tienen su sala vacia, por lo que la emision es un no-op para ellos.
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {Array<{id_usuario: string}>} amigos - Amigos del usuario.
 * @param {string} evento - Nombre del evento a emitir.
 * @param {object} payload - Datos del evento.
 * @returns {void}
 */
function emitir_a_amigos(io, amigos, evento, payload) {
  for (const amigo of amigos) {
    io.to(sala_de_usuario(amigo.id_usuario)).emit(evento, payload);
  }
}

/**
 * Cuenta cuantos sockets del usuario siguen en su sala personal.
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<number>} Numero de sockets en la sala personal.
 */
async function contar_conexiones(io, id_usuario) {
  const sockets = await io.in(sala_de_usuario(id_usuario)).fetchSockets();
  return sockets.length;
}

/**
 * Anuncia a los amigos que el usuario se conecto. Solo en su primer socket, para
 * no repetir el aviso cuando abre pestañas adicionales.
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {import('socket.io').Socket} socket - Socket recien conectado.
 * @returns {Promise<void>}
 */
export async function anunciar_conexion(io, socket) {
  const id_usuario = socket.data?.id_usuario;
  if (!id_usuario) {
    return;
  }
  try {
    // El socket ya se unio a su sala: si hay mas de uno, ya estaba conectado.
    if ((await contar_conexiones(io, id_usuario)) > 1) {
      return;
    }
    const [usuario, amigos] = await Promise.all([
      obtener_perfil(id_usuario),
      obtener_lista_amigos(id_usuario),
    ]);
    emitir_a_amigos(io, amigos, 'usuario:conectado', {
      id_usuario,
      nombre: usuario.nombre,
    });
  } catch {
    // La presencia es best-effort: un fallo aqui no debe romper la conexion.
  }
}

/**
 * Anuncia a los amigos que el usuario se desconecto. Solo cuando se va su ultimo
 * socket. Debe engancharse a `disconnecting` (el socket aun cuenta en su sala).
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {import('socket.io').Socket} socket - Socket que se esta desconectando.
 * @returns {Promise<void>}
 */
export async function anunciar_desconexion(io, socket) {
  const id_usuario = socket.data?.id_usuario;
  if (!id_usuario) {
    return;
  }
  try {
    // En 'disconnecting' este socket aun esta en la sala: si queda mas de uno,
    // el usuario sigue conectado por otra pestaña.
    if ((await contar_conexiones(io, id_usuario)) > 1) {
      return;
    }
    const amigos = await obtener_lista_amigos(id_usuario);
    emitir_a_amigos(io, amigos, 'usuario:desconectado', { id_usuario });
  } catch {
    // Best-effort: ignorar fallos de presencia al desconectar.
  }
}

/**
 * Registra la presencia del dominio `usuario` sobre un socket autenticado.
 * Anuncia la conexion de inmediato y engancha el anuncio de desconexion.
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {import('socket.io').Socket} socket - Socket del cliente autenticado.
 * @returns {void}
 */
export function registrar_manejador_usuario(io, socket) {
  anunciar_conexion(io, socket);
  socket.on('disconnecting', () => anunciar_desconexion(io, socket));
}
