/**
 * Servicio de historial — logica de negocio del registro de partidas.
 *
 * No escribe SQL (delega en los repositorios) ni emite eventos Socket.io.
 * Se encarga de: validar los jugadores, aplicar las reglas de integridad de la
 * BD (bots, consistencia de torneo) y persistir la partida con sus jugadores.
 *
 * `guardar_sesion` participa de una transaccion externa: recibe el `cliente` y
 * lo propaga a los repositorios para que la escritura de la partida y sus
 * jugadores sea atomica junto con la actualizacion de rankings (que hace
 * servicio-leaderboard con el mismo cliente). El orquestador de la transaccion
 * es la capa de eventos (manejador-juego), no este servicio.
 */

import {
  guardar_partida,
  guardar_jugador_partida,
  obtener_historial_usuario as obtener_historial_bd,
} from '../repositorios/repositorio-partida.js';
import { obtener_modalidad_por_id } from '../repositorios/repositorio-modalidad.js';
import { obtener_torneo_por_id } from '../repositorios/repositorio-torneo.js';
import { ErrorServicio } from './error-servicio.js';
import { validar_jugadores } from './validaciones-partida.js';

/**
 * Verifica que la modalidad exista y admita a los jugadores dados.
 * Aplica la regla e: si hay bots, la modalidad debe tener permite_bot = TRUE.
 *
 * @param {string} id_modalidad - UUID de la modalidad.
 * @param {Array<object>} jugadores - Jugadores ya validados.
 * @param {import('pg').PoolClient} cliente - Cliente de transaccion.
 * @returns {Promise<object>} La modalidad encontrada.
 */
async function validar_modalidad(id_modalidad, jugadores, cliente) {
  const modalidad = await obtener_modalidad_por_id(id_modalidad, cliente);
  if (!modalidad) {
    throw new ErrorServicio('MODALIDAD_NO_ENCONTRADA', 'La modalidad no existe.', 404);
  }
  const hay_bots = jugadores.some((jugador) => jugador.es_bot);
  if (hay_bots && !modalidad.permite_bot) {
    throw new ErrorServicio(
      'BOT_NO_PERMITIDO',
      'La modalidad no permite jugadores bot.',
      409,
    );
  }
  return modalidad;
}

/**
 * Aplica la regla c: si la partida pertenece a un torneo, su id_juego e
 * id_modalidad deben coincidir con los del torneo.
 *
 * @param {string|null} id_torneo - UUID del torneo o null (partida casual).
 * @param {string} id_juego - UUID del juego de la partida.
 * @param {string} id_modalidad - UUID de la modalidad de la partida.
 * @param {import('pg').PoolClient} cliente - Cliente de transaccion.
 * @returns {Promise<void>}
 */
async function validar_consistencia_torneo(id_torneo, id_juego, id_modalidad, cliente) {
  if (!id_torneo) {
    return;
  }
  const torneo = await obtener_torneo_por_id(id_torneo, cliente);
  if (!torneo) {
    throw new ErrorServicio('TORNEO_NO_ENCONTRADO', 'El torneo no existe.', 404);
  }
  if (torneo.id_juego !== id_juego || torneo.id_modalidad !== id_modalidad) {
    throw new ErrorServicio(
      'PARTIDA_TORNEO_INCONSISTENTE',
      'El juego y la modalidad de la partida deben coincidir con los del torneo.',
      409,
    );
  }
}

/**
 * Registra una partida terminada con sus jugadores dentro de una transaccion.
 *
 * Debe invocarse con un `cliente` de transaccion en curso: asi la insercion de
 * la partida y de partidas_jugadores queda en la misma transaccion que la
 * actualizacion de rankings. Devuelve la partida y los jugadores creados junto
 * con la modalidad, para que el orquestador decida si actualizar el ranking
 * (segun modalidad.puntua) sin volver a consultar la BD.
 *
 * @param {object} datos - Datos de la sesion de juego.
 * @param {string} datos.id_juego - UUID del juego.
 * @param {string} datos.id_modalidad - UUID de la modalidad.
 * @param {string|null} [datos.id_torneo] - UUID del torneo (null = casual).
 * @param {Array<object>} datos.jugadores - Jugadores participantes.
 * @param {import('pg').PoolClient} cliente - Cliente de la transaccion en curso.
 * @returns {Promise<{partida: object, jugadores: Array<object>, modalidad: object}>}
 */
export async function guardar_sesion(datos, cliente) {
  if (!cliente) {
    throw new ErrorServicio(
      'TRANSACCION_REQUERIDA',
      'guardar_sesion debe ejecutarse dentro de una transaccion.',
      500,
    );
  }

  const { id_juego, id_modalidad, id_torneo = null } = datos;
  const jugadores_validos = validar_jugadores(datos.jugadores);

  const modalidad = await validar_modalidad(id_modalidad, jugadores_validos, cliente);
  await validar_consistencia_torneo(id_torneo, id_juego, id_modalidad, cliente);

  const partida = await guardar_partida(
    { id_juego, id_modalidad, id_torneo, estado: 'finalizada', finalizada: true },
    cliente,
  );

  const jugadores = [];
  for (const jugador of jugadores_validos) {
    jugadores.push(
      await guardar_jugador_partida({ ...jugador, id_partida: partida.id_partida }, cliente),
    );
  }

  return { partida, jugadores, modalidad };
}

/**
 * Obtiene el historial de partidas de un usuario (lectura, sin transaccion).
 *
 * @param {string} id_usuario - UUID del usuario.
 * @param {number} [limite] - Maximo de partidas a devolver (por defecto 20).
 * @returns {Promise<Array<object>>} Historial del usuario, de reciente a antiguo.
 */
export async function obtener_historial(id_usuario, limite = 20) {
  return obtener_historial_bd(id_usuario, limite);
}
