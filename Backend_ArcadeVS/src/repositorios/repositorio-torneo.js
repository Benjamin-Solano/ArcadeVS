/**
 * Repositorio de torneos — acceso SQL a la tabla `torneos`.
 *
 * Version minima: expone la lectura necesaria para validar la consistencia
 * partida-torneo (regla c del proyecto): cuando una partida pertenece a un
 * torneo, su id_juego e id_modalidad deben coincidir con los del torneo.
 * La logica completa de torneos (inscripcion, brackets) se agrega mas adelante.
 */

import { consultar_con } from '../configuracion/configuracion-db.js';

/** Columnas del torneo que se exponen en las lecturas. */
const CAMPOS_TORNEO = `
  id_torneo, id_juego, id_modalidad, nombre, estado,
  fecha_inicio, fecha_fin, max_participantes
`;

/**
 * Busca un torneo por su identificador.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @param {import('pg').PoolClient|null} [cliente] - Cliente de transaccion opcional.
 * @returns {Promise<object|null>} El torneo o null si no existe.
 */
export async function obtener_torneo_por_id(id_torneo, cliente = null) {
  const filas = await consultar_con(
    cliente,
    `SELECT ${CAMPOS_TORNEO} FROM torneos WHERE id_torneo = $1`,
    [id_torneo],
  );
  return filas[0] ?? null;
}
