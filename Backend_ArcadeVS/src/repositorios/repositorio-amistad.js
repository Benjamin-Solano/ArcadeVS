/**
 * Repositorio de amistades — acceso SQL a la tabla `solicitudes_amistad`.
 *
 * Regla de integridad clave: la tabla tiene CHECK (id_solicitante < id_receptor)
 * para impedir duplicados invertidos (A->B y B->A a la vez). Por eso TODA
 * operacion normaliza el par de UUIDs a orden canonico (menor, mayor) antes de
 * tocar la BD, mediante `ordenar_par_canonico`.
 *
 * Nota de diseno: por el orden canonico, la columna id_solicitante guarda el
 * UUID menor, no necesariamente quien inicio la solicitud. La direccion real
 * (quien envio a quien) no se conserva en esta tabla.
 */

import { consultar } from '../configuracion/configuracion-db.js';

/** Columnas de la solicitud que se exponen en las lecturas. */
const CAMPOS_SOLICITUD = `
  id_solicitud, id_solicitante, id_receptor, estado, fecha_solicitud, fecha_respuesta
`;

/**
 * Devuelve el par de UUIDs en orden canonico [menor, mayor].
 * Es la pieza que respeta el CHECK (id_solicitante < id_receptor).
 *
 * @param {string} id_a - Un UUID de usuario.
 * @param {string} id_b - Otro UUID de usuario.
 * @returns {[string, string]} Par ordenado [menor, mayor].
 */
export function ordenar_par_canonico(id_a, id_b) {
  return id_a < id_b ? [id_a, id_b] : [id_b, id_a];
}

/**
 * Crea una solicitud de amistad entre dos usuarios (estado 'pendiente').
 * Normaliza el orden canonico antes de insertar.
 *
 * @param {string} id_usuario_a - UUID de un usuario.
 * @param {string} id_usuario_b - UUID del otro usuario.
 * @returns {Promise<object>} La solicitud creada.
 */
export async function guardar_solicitud(id_usuario_a, id_usuario_b) {
  const [id_solicitante, id_receptor] = ordenar_par_canonico(id_usuario_a, id_usuario_b);
  const filas = await consultar(
    `INSERT INTO solicitudes_amistad (id_solicitante, id_receptor)
     VALUES ($1, $2)
     RETURNING ${CAMPOS_SOLICITUD}`,
    [id_solicitante, id_receptor],
  );
  return filas[0];
}

/**
 * Busca la solicitud existente entre dos usuarios (en cualquier direccion).
 *
 * @param {string} id_usuario_a - UUID de un usuario.
 * @param {string} id_usuario_b - UUID del otro usuario.
 * @returns {Promise<object|null>} La solicitud o null si no existe.
 */
export async function obtener_solicitud_entre(id_usuario_a, id_usuario_b) {
  const [id_solicitante, id_receptor] = ordenar_par_canonico(id_usuario_a, id_usuario_b);
  const filas = await consultar(
    `SELECT ${CAMPOS_SOLICITUD}
       FROM solicitudes_amistad
      WHERE id_solicitante = $1 AND id_receptor = $2`,
    [id_solicitante, id_receptor],
  );
  return filas[0] ?? null;
}

/**
 * Busca una solicitud por su identificador.
 *
 * @param {string} id_solicitud - UUID de la solicitud.
 * @returns {Promise<object|null>} La solicitud o null si no existe.
 */
export async function obtener_solicitud_por_id(id_solicitud) {
  const filas = await consultar(
    `SELECT ${CAMPOS_SOLICITUD} FROM solicitudes_amistad WHERE id_solicitud = $1`,
    [id_solicitud],
  );
  return filas[0] ?? null;
}

/**
 * Actualiza el estado de una solicitud y registra la fecha de respuesta.
 *
 * @param {string} id_solicitud - UUID de la solicitud.
 * @param {string} estado - Nuevo estado ('aceptado' | 'rechazado' | 'bloqueado').
 * @returns {Promise<object|null>} La solicitud actualizada o null si no existe.
 */
export async function actualizar_estado(id_solicitud, estado) {
  const filas = await consultar(
    `UPDATE solicitudes_amistad
        SET estado = $2, fecha_respuesta = NOW()
      WHERE id_solicitud = $1
      RETURNING ${CAMPOS_SOLICITUD}`,
    [id_solicitud, estado],
  );
  return filas[0] ?? null;
}

/**
 * Lista los amigos confirmados (estado 'aceptado') de un usuario, con sus
 * datos publicos, sin importar de que lado del par esten.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<Array<object>>} Amigos confirmados.
 */
export async function obtener_amigos(id_usuario) {
  return consultar(
    `SELECT u.id_usuario, u.nombre, u.apellido, u.codigo_amigo, u.avatar_url
       FROM solicitudes_amistad s
       JOIN usuarios u
         ON u.id_usuario = CASE
              WHEN s.id_solicitante = $1 THEN s.id_receptor
              ELSE s.id_solicitante
            END
      WHERE (s.id_solicitante = $1 OR s.id_receptor = $1)
        AND s.estado = 'aceptado'
      ORDER BY u.nombre ASC`,
    [id_usuario],
  );
}

/**
 * Cuenta los amigos confirmados (estado 'aceptado') de un usuario.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<number>} Numero de amigos confirmados.
 */
export async function contar_amigos(id_usuario) {
  const filas = await consultar(
    `SELECT COUNT(*)::int AS total
       FROM solicitudes_amistad
      WHERE (id_solicitante = $1 OR id_receptor = $1)
        AND estado = 'aceptado'`,
    [id_usuario],
  );
  return filas[0].total;
}

/**
 * Lista las solicitudes pendientes en las que participa un usuario, con los
 * datos publicos del otro participante (igual que obtener_amigos) para que el
 * cliente pueda mostrar la solicitud sin una segunda consulta. Incluye
 * `enviada_por_mi` para que el cliente distinga las que debe responder
 * (aceptar/rechazar) de las que ya envio y solo esta esperando.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<Array<{id_solicitud: string, estado: string,
 *          fecha_solicitud: string, enviada_por_mi: boolean, usuario: object}>>}
 *          Solicitudes en estado 'pendiente'.
 */
export async function obtener_solicitudes_pendientes(id_usuario) {
  const filas = await consultar(
    `SELECT s.id_solicitud, s.estado, s.fecha_solicitud,
            (s.id_solicitante = $1) AS enviada_por_mi,
            u.id_usuario, u.nombre, u.apellido, u.codigo_amigo, u.avatar_url
       FROM solicitudes_amistad s
       JOIN usuarios u
         ON u.id_usuario = CASE
              WHEN s.id_solicitante = $1 THEN s.id_receptor
              ELSE s.id_solicitante
            END
      WHERE (s.id_solicitante = $1 OR s.id_receptor = $1)
        AND s.estado = 'pendiente'
      ORDER BY s.fecha_solicitud DESC`,
    [id_usuario],
  );

  return filas.map((fila) => ({
    id_solicitud: fila.id_solicitud,
    estado: fila.estado,
    fecha_solicitud: fila.fecha_solicitud,
    enviada_por_mi: fila.enviada_por_mi,
    usuario: {
      id_usuario: fila.id_usuario,
      nombre: fila.nombre,
      apellido: fila.apellido,
      codigo_amigo: fila.codigo_amigo,
      avatar_url: fila.avatar_url,
    },
  }));
}

/**
 * Elimina una solicitud de amistad (por ejemplo, al eliminar un amigo).
 *
 * @param {string} id_solicitud - UUID de la solicitud.
 * @returns {Promise<void>}
 */
export async function eliminar_solicitud(id_solicitud) {
  await consultar('DELETE FROM solicitudes_amistad WHERE id_solicitud = $1', [
    id_solicitud,
  ]);
}
