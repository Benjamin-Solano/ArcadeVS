/**
 * Repositorio de torneos — acceso SQL a `torneos` y `torneos_participantes`.
 *
 * Unica capa que ejecuta SQL sobre los torneos y sus inscripciones. Retorna
 * datos planos y no contiene logica de negocio (transiciones de estado, cupos y
 * validaciones viven en la capa de servicios). El estado del torneo sigue la
 * transicion unidireccional `inscripcion → en_curso → finalizado`.
 */

import { consultar, consultar_con } from '../configuracion/configuracion-db.js';

/** Columnas del torneo que se exponen en las lecturas. */
const CAMPOS_TORNEO = `
  id_torneo, id_juego, id_modalidad, nombre, estado,
  fecha_inicio, fecha_fin, max_participantes, id_creador
`;

/**
 * Inserta un torneo nuevo (estado inicial 'inscripcion').
 *
 * @param {object} datos - Datos del torneo.
 * @param {string} datos.id_juego - UUID del juego.
 * @param {string} datos.id_modalidad - UUID de la modalidad.
 * @param {string} datos.nombre - Nombre del torneo.
 * @param {number|null} [datos.max_participantes] - Cupo maximo (null = sin limite).
 * @param {string} datos.id_creador - UUID del usuario dueño (creador).
 * @returns {Promise<object>} El torneo creado.
 */
export async function guardar_torneo(datos) {
  const { id_juego, id_modalidad, nombre, max_participantes = null, id_creador } = datos;
  const filas = await consultar(
    `INSERT INTO torneos (id_juego, id_modalidad, nombre, max_participantes, id_creador)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${CAMPOS_TORNEO}`,
    [id_juego, id_modalidad, nombre, max_participantes, id_creador],
  );
  return filas[0];
}

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

/**
 * Lista torneos, opcionalmente filtrando por estado.
 *
 * @param {string|null} [estado] - Estado a filtrar, o null para todos.
 * @returns {Promise<Array<object>>} Torneos ordenados por fecha de inicio.
 */
export async function obtener_torneos(estado = null) {
  if (estado) {
    return consultar(
      `SELECT ${CAMPOS_TORNEO} FROM torneos
        WHERE estado = $1
        ORDER BY fecha_inicio ASC NULLS LAST, nombre ASC`,
      [estado],
    );
  }
  return consultar(
    `SELECT ${CAMPOS_TORNEO} FROM torneos
      ORDER BY fecha_inicio ASC NULLS LAST, nombre ASC`,
  );
}

/**
 * Actualiza el estado de un torneo, fijando la fecha correspondiente a la
 * transicion (fecha_inicio al pasar a 'en_curso', fecha_fin al 'finalizado').
 *
 * @param {string} id_torneo - UUID del torneo.
 * @param {string} estado - Nuevo estado ('en_curso' | 'finalizado' | ...).
 * @returns {Promise<object|null>} El torneo actualizado o null si no existe.
 */
export async function actualizar_estado_torneo(id_torneo, estado) {
  const filas = await consultar(
    `UPDATE torneos
        SET estado = $2::text,
            fecha_inicio = CASE WHEN $2::text = 'en_curso'   THEN NOW() ELSE fecha_inicio END,
            fecha_fin    = CASE WHEN $2::text = 'finalizado' THEN NOW() ELSE fecha_fin    END
      WHERE id_torneo = $1
      RETURNING ${CAMPOS_TORNEO}`,
    [id_torneo, estado],
  );
  return filas[0] ?? null;
}

/**
 * Inscribe a un usuario en un torneo.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<object>} La inscripcion creada.
 */
export async function inscribir_participante(id_torneo, id_usuario) {
  const filas = await consultar(
    `INSERT INTO torneos_participantes (id_torneo, id_usuario)
     VALUES ($1, $2)
     RETURNING id_participacion, id_torneo, id_usuario, fecha_inscripcion`,
    [id_torneo, id_usuario],
  );
  return filas[0];
}

/**
 * Busca la inscripcion de un usuario en un torneo.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<object|null>} La inscripcion o null si no esta inscrito.
 */
export async function obtener_participacion(id_torneo, id_usuario) {
  const filas = await consultar(
    `SELECT id_participacion, id_torneo, id_usuario, fecha_inscripcion
       FROM torneos_participantes
      WHERE id_torneo = $1 AND id_usuario = $2`,
    [id_torneo, id_usuario],
  );
  return filas[0] ?? null;
}

/**
 * Cuenta los inscritos de un torneo.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @returns {Promise<number>} Numero de participantes inscritos.
 */
export async function contar_participantes(id_torneo) {
  const filas = await consultar(
    `SELECT COUNT(*)::int AS total FROM torneos_participantes WHERE id_torneo = $1`,
    [id_torneo],
  );
  return filas[0].total;
}

/**
 * Lista los participantes de un torneo con sus datos publicos.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @returns {Promise<Array<object>>} Participantes ordenados por inscripcion.
 */
export async function obtener_participantes(id_torneo) {
  return consultar(
    `SELECT tp.id_usuario, u.nombre, u.avatar_url, tp.fecha_inscripcion
       FROM torneos_participantes tp
       JOIN usuarios u ON u.id_usuario = tp.id_usuario
      WHERE tp.id_torneo = $1
      ORDER BY tp.fecha_inscripcion ASC`,
    [id_torneo],
  );
}

/**
 * Elimina la inscripcion de un usuario en un torneo.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<void>}
 */
export async function eliminar_participante(id_torneo, id_usuario) {
  await consultar(
    `DELETE FROM torneos_participantes WHERE id_torneo = $1 AND id_usuario = $2`,
    [id_torneo, id_usuario],
  );
}
