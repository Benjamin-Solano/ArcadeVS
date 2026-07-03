/**
 * Repositorio de modalidades — acceso SQL a la tabla `modalidades`.
 *
 * Unica capa que ejecuta SQL sobre las modalidades. Retorna datos planos.
 * Los servicios lo consultan para aplicar dos reglas de integridad:
 *   - `puntua`      → si es FALSE, la partida no actualiza rankings_juego.
 *   - `permite_bot` → si es FALSE, la partida no admite jugadores bot.
 */

import { consultar_con } from '../configuracion/configuracion-db.js';

/** Columnas de la modalidad que se exponen en las lecturas. */
const CAMPOS_MODALIDAD = `
  id_modalidad, nombre, descripcion, permite_bot, puntua
`;

/**
 * Busca una modalidad por su identificador.
 *
 * @param {string} id_modalidad - UUID de la modalidad.
 * @param {import('pg').PoolClient|null} [cliente] - Cliente de transaccion opcional.
 * @returns {Promise<object|null>} La modalidad o null si no existe.
 */
export async function obtener_modalidad_por_id(id_modalidad, cliente = null) {
  const filas = await consultar_con(
    cliente,
    `SELECT ${CAMPOS_MODALIDAD} FROM modalidades WHERE id_modalidad = $1`,
    [id_modalidad],
  );
  return filas[0] ?? null;
}

/**
 * Lista todas las modalidades disponibles, ordenadas por nombre.
 *
 * @returns {Promise<Array<object>>} Modalidades del catalogo.
 */
export async function obtener_modalidades() {
  return consultar_con(
    null,
    `SELECT ${CAMPOS_MODALIDAD} FROM modalidades ORDER BY nombre ASC`,
  );
}
