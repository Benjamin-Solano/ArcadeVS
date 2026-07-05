/**
 * Repositorio de partidas — acceso SQL a `partidas` y `partidas_jugadores`.
 *
 * Unica capa que ejecuta SQL sobre las partidas y sus jugadores. Retorna datos
 * planos y no contiene logica de negocio (validaciones de bot, consistencia de
 * torneo y transacciones viven en la capa de servicios).
 *
 * Todas las escrituras aceptan un `cliente` de transaccion opcional para poder
 * insertar la partida, sus jugadores y actualizar rankings_juego en la misma
 * transaccion (regla de atomicidad del proyecto).
 */

import { consultar_con } from '../configuracion/configuracion-db.js';

/** Columnas de la partida que se exponen en las lecturas. */
const CAMPOS_PARTIDA = `
  id_partida, id_juego, id_modalidad, id_torneo, fecha_inicio, fecha_fin, estado
`;

/** Columnas del jugador de partida que se exponen en las lecturas. */
const CAMPOS_JUGADOR = `
  id_partida_jugador, id_partida, id_usuario, es_bot, puntuacion, resultado
`;

/**
 * Inserta una partida nueva.
 *
 * @param {object} datos - Datos de la partida.
 * @param {string} datos.id_juego - UUID del juego.
 * @param {string} datos.id_modalidad - UUID de la modalidad.
 * @param {string|null} [datos.id_torneo] - UUID del torneo (null = casual).
 * @param {string} [datos.estado] - Estado inicial ('en_curso' por defecto).
 * @param {boolean} [datos.finalizada] - Si true, marca fecha_fin = NOW().
 * @param {import('pg').PoolClient|null} [cliente] - Cliente de transaccion opcional.
 * @returns {Promise<object>} La partida creada.
 */
export async function guardar_partida(datos, cliente = null) {
  const {
    id_juego,
    id_modalidad,
    id_torneo = null,
    estado = 'en_curso',
    finalizada = false,
  } = datos;

  const filas = await consultar_con(
    cliente,
    `INSERT INTO partidas (id_juego, id_modalidad, id_torneo, estado, fecha_fin)
     VALUES ($1, $2, $3, $4, ${finalizada ? 'NOW()' : 'NULL'})
     RETURNING ${CAMPOS_PARTIDA}`,
    [id_juego, id_modalidad, id_torneo, estado],
  );
  return filas[0];
}

/**
 * Marca una partida como terminada, fijando estado y fecha_fin.
 *
 * @param {string} id_partida - UUID de la partida.
 * @param {string} estado - Estado final ('finalizada' | 'abandonada').
 * @param {import('pg').PoolClient|null} [cliente] - Cliente de transaccion opcional.
 * @returns {Promise<object|null>} La partida actualizada o null si no existe.
 */
export async function finalizar_partida(id_partida, estado, cliente = null) {
  const filas = await consultar_con(
    cliente,
    `UPDATE partidas
        SET estado = $2, fecha_fin = NOW()
      WHERE id_partida = $1
      RETURNING ${CAMPOS_PARTIDA}`,
    [id_partida, estado],
  );
  return filas[0] ?? null;
}

/**
 * Inserta un jugador (humano o bot) en una partida.
 *
 * @param {object} datos - Datos del jugador.
 * @param {string} datos.id_partida - UUID de la partida.
 * @param {string|null} [datos.id_usuario] - UUID del usuario (null si es bot).
 * @param {boolean} [datos.es_bot] - true si es un jugador bot.
 * @param {number} [datos.puntuacion] - Puntuacion obtenida.
 * @param {string|null} [datos.resultado] - 'victoria' | 'derrota' | 'empate' | null.
 * @param {import('pg').PoolClient|null} [cliente] - Cliente de transaccion opcional.
 * @returns {Promise<object>} El jugador de partida creado.
 */
export async function guardar_jugador_partida(datos, cliente = null) {
  const {
    id_partida,
    id_usuario = null,
    es_bot = false,
    puntuacion = 0,
    resultado = null,
  } = datos;

  const filas = await consultar_con(
    cliente,
    `INSERT INTO partidas_jugadores
       (id_partida, id_usuario, es_bot, puntuacion, resultado)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${CAMPOS_JUGADOR}`,
    [id_partida, id_usuario, es_bot, puntuacion, resultado],
  );
  return filas[0];
}

/**
 * Busca una partida por su identificador.
 *
 * @param {string} id_partida - UUID de la partida.
 * @param {import('pg').PoolClient|null} [cliente] - Cliente de transaccion opcional.
 * @returns {Promise<object|null>} La partida o null si no existe.
 */
export async function obtener_partida_por_id(id_partida, cliente = null) {
  const filas = await consultar_con(
    cliente,
    `SELECT ${CAMPOS_PARTIDA} FROM partidas WHERE id_partida = $1`,
    [id_partida],
  );
  return filas[0] ?? null;
}

/**
 * Lista los jugadores de una partida.
 *
 * @param {string} id_partida - UUID de la partida.
 * @param {import('pg').PoolClient|null} [cliente] - Cliente de transaccion opcional.
 * @returns {Promise<Array<object>>} Jugadores de la partida.
 */
export async function obtener_jugadores_de_partida(id_partida, cliente = null) {
  return consultar_con(
    cliente,
    `SELECT ${CAMPOS_JUGADOR} FROM partidas_jugadores WHERE id_partida = $1`,
    [id_partida],
  );
}

/**
 * Agrega los resultados de las partidas de un usuario (solo filas humanas).
 * Cuenta victorias, derrotas, empates y el total de partidas finalizadas
 * (resultado no nulo). Sirve para el resumen de estadisticas del perfil.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<{partidas: number, victorias: number, derrotas: number, empates: number}>}
 *          Conteos de partidas por resultado.
 */
export async function obtener_estadisticas_partidas(id_usuario) {
  const filas = await consultar_con(
    null,
    `SELECT
        COUNT(*) FILTER (WHERE resultado = 'victoria')::int AS victorias,
        COUNT(*) FILTER (WHERE resultado = 'derrota')::int  AS derrotas,
        COUNT(*) FILTER (WHERE resultado = 'empate')::int   AS empates,
        COUNT(*) FILTER (WHERE resultado IS NOT NULL)::int  AS partidas
       FROM partidas_jugadores
      WHERE id_usuario = $1 AND es_bot = FALSE`,
    [id_usuario],
  );
  return filas[0] ?? { partidas: 0, victorias: 0, derrotas: 0, empates: 0 };
}

/**
 * Obtiene el historial de partidas de un usuario, con datos del juego y su
 * resultado, ordenado de la mas reciente a la mas antigua.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @param {number} [limite] - Maximo de partidas a devolver (por defecto 20).
 * @returns {Promise<Array<object>>} Historial de partidas del usuario.
 */
export async function obtener_historial_usuario(id_usuario, limite = 20) {
  return consultar_con(
    null,
    `SELECT p.id_partida, p.id_juego, j.nombre AS nombre_juego, j.slug AS slug_juego,
            p.id_modalidad, p.id_torneo, p.estado, p.fecha_inicio, p.fecha_fin,
            pj.puntuacion, pj.resultado
       FROM partidas_jugadores pj
       JOIN partidas p ON p.id_partida = pj.id_partida
       JOIN juegos   j ON j.id_juego   = p.id_juego
      WHERE pj.id_usuario = $1
      ORDER BY p.fecha_inicio DESC
      LIMIT $2`,
    [id_usuario, limite],
  );
}
