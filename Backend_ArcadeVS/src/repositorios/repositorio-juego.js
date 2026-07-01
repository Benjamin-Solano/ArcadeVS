/**
 * Repositorio de juegos — acceso SQL a las tablas `juegos`, `tags` y `juegos_tags`.
 *
 * Unica capa que ejecuta SQL sobre el catalogo de juegos. Retorna datos planos
 * y no contiene logica de negocio.
 */

import { consultar } from '../configuracion/configuracion-db.js';

/** Columnas del juego que se exponen en las lecturas. */
const CAMPOS_JUEGO = `
  id_juego, nombre, slug, descripcion, thumbnail_url, activo, fecha_creacion
`;

/**
 * Inserta un juego nuevo en el catalogo.
 *
 * @param {object} datos - Datos del juego.
 * @param {string} datos.nombre - Nombre unico del juego.
 * @param {string} datos.slug - Slug kebab-case unico para URLs.
 * @param {string|null} [datos.descripcion] - Descripcion del juego.
 * @param {string|null} [datos.thumbnail_url] - URL de la miniatura.
 * @param {boolean} [datos.activo] - Si el juego esta visible (por defecto true).
 * @returns {Promise<object>} El juego creado.
 */
export async function guardar_juego(datos) {
  const {
    nombre,
    slug,
    descripcion = null,
    thumbnail_url = null,
    activo = true,
  } = datos;

  const filas = await consultar(
    `INSERT INTO juegos (nombre, slug, descripcion, thumbnail_url, activo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${CAMPOS_JUEGO}`,
    [nombre, slug, descripcion, thumbnail_url, activo],
  );
  return filas[0];
}

/**
 * Busca un juego por su identificador.
 *
 * @param {string} id_juego - UUID del juego.
 * @returns {Promise<object|null>} El juego o null si no existe.
 */
export async function obtener_juego_por_id(id_juego) {
  const filas = await consultar(
    `SELECT ${CAMPOS_JUEGO} FROM juegos WHERE id_juego = $1`,
    [id_juego],
  );
  return filas[0] ?? null;
}

/**
 * Busca un juego por su slug (usado en URLs /juegos/:slug).
 *
 * @param {string} slug - Slug del juego.
 * @returns {Promise<object|null>} El juego o null si no existe.
 */
export async function obtener_juego_por_slug(slug) {
  const filas = await consultar(
    `SELECT ${CAMPOS_JUEGO} FROM juegos WHERE slug = $1`,
    [slug],
  );
  return filas[0] ?? null;
}

/**
 * Lista todos los juegos activos del catalogo, ordenados por nombre.
 *
 * @returns {Promise<Array<object>>} Juegos activos.
 */
export async function obtener_juegos_activos() {
  return consultar(
    `SELECT ${CAMPOS_JUEGO} FROM juegos WHERE activo = TRUE ORDER BY nombre ASC`,
  );
}

/**
 * Obtiene los tags asociados a un juego.
 *
 * @param {string} id_juego - UUID del juego.
 * @returns {Promise<Array<{id_tag: string, nombre: string}>>} Tags del juego.
 */
export async function obtener_tags_de_juego(id_juego) {
  return consultar(
    `SELECT t.id_tag, t.nombre
       FROM juegos_tags jt
       JOIN tags t ON t.id_tag = jt.id_tag
      WHERE jt.id_juego = $1
      ORDER BY t.nombre ASC`,
    [id_juego],
  );
}

/**
 * Lista los juegos activos que tienen un tag especifico.
 *
 * @param {string} nombre_tag - Nombre del tag (en minusculas).
 * @returns {Promise<Array<object>>} Juegos activos con ese tag.
 */
export async function obtener_juegos_por_tag(nombre_tag) {
  return consultar(
    `SELECT j.id_juego, j.nombre, j.slug, j.descripcion,
            j.thumbnail_url, j.activo, j.fecha_creacion
       FROM juegos j
       JOIN juegos_tags jt ON jt.id_juego = j.id_juego
       JOIN tags t ON t.id_tag = jt.id_tag
      WHERE t.nombre = $1 AND j.activo = TRUE
      ORDER BY j.nombre ASC`,
    [nombre_tag],
  );
}
