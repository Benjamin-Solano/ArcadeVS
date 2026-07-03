/**
 * Manejador de eventos del dominio `juego` (capa de entrada Socket.io).
 *
 * Recibe los eventos del cliente, valida el formato del payload, delega la
 * logica en el orquestador de fin de partida y difunde el resultado a la sala
 * del juego. No escribe SQL ni contiene logica de negocio.
 *
 * Eventos manejados (ver catalogo en arquitectura-crt-gaming-v2.md seccion 5.1):
 *   juego:partida_iniciada   (Cliente → Servidor)  el usuario entra a la sala del juego.
 *   juego:partida_terminada  (Cliente → Servidor)  dispara el flujo de fin de partida.
 * Eventos emitidos:
 *   juego:puntaje_actualizado (Servidor → Sala)    top del leaderboard tras la partida.
 *   juego:error               (Servidor → Cliente) fallo de validacion o de negocio.
 */

import { ErrorServicio } from '../servicios/error-servicio.js';
import { finalizar_partida } from './finalizar-partida.js';

/**
 * Nombre de la sala Socket.io asociada a un juego. Los clientes que observan el
 * leaderboard de un juego se unen a esta sala para recibir sus actualizaciones.
 *
 * @param {string} id_juego - UUID del juego.
 * @returns {string} Nombre de la sala (ej: "juego:<uuid>").
 */
export function sala_de_juego(id_juego) {
  return `juego:${id_juego}`;
}

/**
 * Normaliza el payload de `juego:partida_terminada` a la lista de jugadores que
 * espera el servicio. Acepta dos formas:
 *   - Multijugador: `datos.jugadores` ya es un arreglo → se usa tal cual.
 *   - Un jugador (arcade): se construye a partir de `{ id_usuario, puntaje,
 *     resultado }` del catalogo de eventos.
 *
 * @param {object} datos - Payload recibido del cliente.
 * @returns {Array<object>} Jugadores en el formato del servicio de historial.
 */
export function construir_jugadores(datos) {
  if (Array.isArray(datos.jugadores)) {
    return datos.jugadores;
  }
  return [
    {
      id_usuario: datos.id_usuario ?? null,
      es_bot: false,
      puntuacion: datos.puntaje,
      resultado: datos.resultado ?? null,
    },
  ];
}

/**
 * Maneja el inicio de una partida: une el socket a la sala del juego para que
 * reciba las actualizaciones de leaderboard en tiempo real.
 *
 * @param {import('socket.io').Socket} socket - Socket del cliente.
 * @param {object} datos - Payload { id_juego, id_usuario }.
 * @returns {void}
 */
export function manejar_inicio_partida(socket, datos) {
  if (!datos?.id_juego) {
    emitir_error(socket, new ErrorServicio('DATOS_INVALIDOS', 'Falta id_juego.'));
    return;
  }
  socket.join(sala_de_juego(datos.id_juego));
}

/**
 * Maneja el fin de una partida: ejecuta el flujo atomico y difunde el nuevo top
 * del leaderboard a la sala del juego.
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {import('socket.io').Socket} socket - Socket del cliente que finalizo.
 * @param {object} datos - Payload de la partida terminada.
 * @returns {Promise<void>}
 */
export async function manejar_fin_partida(io, socket, datos) {
  try {
    if (!datos?.id_juego || !datos?.id_modalidad) {
      throw new ErrorServicio('DATOS_INVALIDOS', 'Falta id_juego o id_modalidad.');
    }

    const { tabla_puntajes } = await finalizar_partida({
      id_juego: datos.id_juego,
      id_modalidad: datos.id_modalidad,
      id_torneo: datos.id_torneo ?? null,
      jugadores: construir_jugadores(datos),
    });

    const sala = sala_de_juego(datos.id_juego);
    socket.join(sala); // garantiza que el emisor tambien reciba la actualizacion
    io.to(sala).emit('juego:puntaje_actualizado', {
      id_juego: datos.id_juego,
      tabla_puntajes,
    });
  } catch (error) {
    emitir_error(socket, error);
  }
}

/**
 * Emite `juego:error` al cliente. Traduce ErrorServicio a su codigo/mensaje
 * estable; cualquier otro error se reporta como fallo interno sin filtrar
 * detalles sensibles.
 *
 * @param {import('socket.io').Socket} socket - Socket del cliente.
 * @param {Error} error - Error capturado.
 * @returns {void}
 */
function emitir_error(socket, error) {
  if (error instanceof ErrorServicio) {
    socket.emit('juego:error', { codigo: error.codigo, mensaje: error.message });
    return;
  }
  socket.emit('juego:error', {
    codigo: 'ERROR_INTERNO',
    mensaje: 'Ocurrio un error al procesar la partida.',
  });
}

/**
 * Registra los listeners del dominio `juego` sobre un socket recien conectado.
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {import('socket.io').Socket} socket - Socket del cliente.
 * @returns {void}
 */
export function registrar_manejador_juego(io, socket) {
  socket.on('juego:partida_iniciada', (datos) => manejar_inicio_partida(socket, datos));
  socket.on('juego:partida_terminada', (datos) => manejar_fin_partida(io, socket, datos));
}
