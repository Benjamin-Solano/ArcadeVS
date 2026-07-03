/**
 * Servicio de leaderboard — logica de negocio de rankings por juego.
 *
 * No escribe SQL (delega en repositorio-ranking) ni emite eventos Socket.io.
 * Se encarga de traducir el resultado de una partida a los contadores del
 * ranking y de exponer el top del leaderboard.
 *
 * `actualizar_puntaje` participa de la transaccion externa: recibe el `cliente`
 * y actualiza rankings_juego en la misma transaccion en que servicio-historial
 * guardo la partida. Aplica la regla f (solo puntua si modalidad.puntua = TRUE)
 * y la regla e (los bots no acumulan ranking). El orquestador (manejador-juego)
 * abre la transaccion y pasa `puntua` a partir de la modalidad de la partida.
 */

import {
  actualizar_ranking,
  obtener_top_juego,
  obtener_rankings_de_usuario,
} from '../repositorios/repositorio-ranking.js';
import { ErrorServicio } from './error-servicio.js';

/**
 * Acumula el resultado de una partida en el ranking de cada jugador humano.
 *
 * Debe ejecutarse dentro de la misma transaccion que servicio-historial. Si la
 * modalidad no puntua (regla f), no toca rankings_juego y devuelve []. Los
 * jugadores bot se ignoran (regla e).
 *
 * @param {object} datos - Datos del resultado a acumular.
 * @param {string} datos.id_juego - UUID del juego.
 * @param {boolean} datos.puntua - Si la modalidad suma al ranking.
 * @param {Array<{id_usuario: string|null, es_bot: boolean, puntuacion: number,
 *          resultado: string|null}>} datos.jugadores - Jugadores de la partida.
 * @param {import('pg').PoolClient} cliente - Cliente de la transaccion en curso.
 * @returns {Promise<Array<object>>} Rankings actualizados (vacio si no puntua).
 */
export async function actualizar_puntaje(datos, cliente) {
  if (!cliente) {
    throw new ErrorServicio(
      'TRANSACCION_REQUERIDA',
      'actualizar_puntaje debe ejecutarse dentro de una transaccion.',
      500,
    );
  }

  const { id_juego, puntua, jugadores } = datos;
  if (!puntua) {
    return [];
  }

  const rankings = [];
  for (const jugador of jugadores) {
    if (jugador.es_bot || !jugador.id_usuario) {
      continue;
    }
    rankings.push(
      await actualizar_ranking(
        {
          id_usuario: jugador.id_usuario,
          id_juego,
          puntuacion: jugador.puntuacion,
          es_victoria: jugador.resultado === 'victoria',
        },
        cliente,
      ),
    );
  }
  return rankings;
}

/**
 * Obtiene el top del leaderboard de un juego (lectura, sin transaccion).
 *
 * @param {string} id_juego - UUID del juego.
 * @param {number} [limite] - Tamano del top (por defecto 10).
 * @returns {Promise<Array<object>>} Tabla de puntajes ordenada.
 */
export async function obtener_top(id_juego, limite = 10) {
  return obtener_top_juego(id_juego, limite);
}

/**
 * Obtiene los rankings de un usuario en todos sus juegos (lectura).
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<Array<object>>} Rankings del usuario por juego.
 */
export async function obtener_rankings_usuario(id_usuario) {
  return obtener_rankings_de_usuario(id_usuario);
}
