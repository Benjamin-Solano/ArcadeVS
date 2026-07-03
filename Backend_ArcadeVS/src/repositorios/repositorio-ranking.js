/**
 * Repositorio de rankings — acceso SQL a la tabla `rankings_juego`.
 *
 * Unica capa que ejecuta SQL sobre el leaderboard. La tabla usa contadores
 * denormalizados (partidas_jugadas, victorias) que DEBEN actualizarse en la
 * misma transaccion que el INSERT en partidas_jugadores. Por eso las escrituras
 * aceptan un `cliente` de transaccion.
 *
 * `actualizar_ranking` hace un UPSERT: crea la fila del par (usuario, juego) la
 * primera vez y acumula los contadores en las siguientes. El CHECK de la BD
 * (victorias <= partidas_jugadas) actua como red de seguridad; este UPSERT lo
 * respeta porque cada llamada suma 1 a partidas_jugadas y 0 o 1 a victorias.
 */

import { consultar_con } from '../configuracion/configuracion-db.js';

/** Columnas del ranking que se exponen en las lecturas. */
const CAMPOS_RANKING = `
  id_ranking, id_usuario, id_juego, puntuacion_total,
  partidas_jugadas, victorias, ultima_actualizacion
`;

/**
 * Obtiene el ranking de un usuario en un juego concreto.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @param {string} id_juego - UUID del juego.
 * @param {import('pg').PoolClient|null} [cliente] - Cliente de transaccion opcional.
 * @returns {Promise<object|null>} El ranking o null si el usuario aun no jugo.
 */
export async function obtener_ranking(id_usuario, id_juego, cliente = null) {
  const filas = await consultar_con(
    cliente,
    `SELECT ${CAMPOS_RANKING}
       FROM rankings_juego
      WHERE id_usuario = $1 AND id_juego = $2`,
    [id_usuario, id_juego],
  );
  return filas[0] ?? null;
}

/**
 * Acumula el resultado de una partida en el ranking del usuario (UPSERT).
 * Suma la puntuacion, incrementa partidas_jugadas y suma 1 a victorias si
 * corresponde. Crea la fila si es la primera partida del usuario en el juego.
 *
 * @param {object} datos - Datos del resultado a acumular.
 * @param {string} datos.id_usuario - UUID del usuario.
 * @param {string} datos.id_juego - UUID del juego.
 * @param {number} datos.puntuacion - Puntuacion obtenida (>= 0).
 * @param {boolean} datos.es_victoria - true si la partida fue una victoria.
 * @param {import('pg').PoolClient|null} [cliente] - Cliente de transaccion opcional.
 * @returns {Promise<object>} El ranking actualizado.
 */
export async function actualizar_ranking(datos, cliente = null) {
  const { id_usuario, id_juego, puntuacion, es_victoria } = datos;
  const suma_victoria = es_victoria ? 1 : 0;

  const filas = await consultar_con(
    cliente,
    `INSERT INTO rankings_juego
       (id_usuario, id_juego, puntuacion_total, partidas_jugadas, victorias)
     VALUES ($1, $2, $3, 1, $4)
     ON CONFLICT (id_usuario, id_juego) DO UPDATE
       SET puntuacion_total     = rankings_juego.puntuacion_total + EXCLUDED.puntuacion_total,
           partidas_jugadas     = rankings_juego.partidas_jugadas + 1,
           victorias            = rankings_juego.victorias + EXCLUDED.victorias,
           ultima_actualizacion = NOW()
     RETURNING ${CAMPOS_RANKING}`,
    [id_usuario, id_juego, puntuacion, suma_victoria],
  );
  return filas[0];
}

/**
 * Obtiene el top N del leaderboard de un juego, con el nombre de cada usuario,
 * ordenado por puntuacion total descendente.
 *
 * @param {string} id_juego - UUID del juego.
 * @param {number} [limite] - Tamano del top (por defecto 10).
 * @returns {Promise<Array<object>>} Filas del leaderboard.
 */
export async function obtener_top_juego(id_juego, limite = 10) {
  return consultar_con(
    null,
    `SELECT r.id_usuario, u.nombre, u.avatar_url,
            r.puntuacion_total, r.partidas_jugadas, r.victorias
       FROM rankings_juego r
       JOIN usuarios u ON u.id_usuario = r.id_usuario
      WHERE r.id_juego = $1
      ORDER BY r.puntuacion_total DESC, r.victorias DESC
      LIMIT $2`,
    [id_juego, limite],
  );
}

/**
 * Lista los rankings de un usuario en todos los juegos que ha jugado.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<Array<object>>} Rankings del usuario por juego.
 */
export async function obtener_rankings_de_usuario(id_usuario) {
  return consultar_con(
    null,
    `SELECT r.id_juego, j.nombre AS nombre_juego, j.slug AS slug_juego,
            r.puntuacion_total, r.partidas_jugadas, r.victorias
       FROM rankings_juego r
       JOIN juegos j ON j.id_juego = r.id_juego
      WHERE r.id_usuario = $1
      ORDER BY r.puntuacion_total DESC`,
    [id_usuario],
  );
}
