/**
 * Servicio de juego — logica de negocio del catalogo de juegos.
 *
 * No escribe SQL (delega en repositorio-juego) ni emite eventos Socket.io.
 * Expone el catalogo para las rutas REST y ensambla el detalle de un juego con
 * sus tags. Solo lectura: la administracion del catalogo se agrega mas adelante.
 */

import {
  obtener_juegos_activos,
  obtener_juego_por_slug,
  obtener_tags_de_juego,
} from '../repositorios/repositorio-juego.js';
import { ErrorServicio } from './error-servicio.js';

/**
 * Lista los juegos activos del catalogo.
 *
 * @returns {Promise<Array<object>>} Juegos activos ordenados por nombre.
 */
export async function obtener_catalogo() {
  return obtener_juegos_activos();
}

/**
 * Obtiene el detalle de un juego por su slug, incluyendo sus tags.
 *
 * @param {string} slug - Slug del juego (usado en la URL).
 * @returns {Promise<object>} El juego con su arreglo `tags`.
 */
export async function obtener_juego(slug) {
  const juego = await obtener_juego_por_slug(slug);
  if (!juego) {
    throw new ErrorServicio('JUEGO_NO_ENCONTRADO', 'El juego no existe.', 404);
  }
  const tags = await obtener_tags_de_juego(juego.id_juego);
  return { ...juego, tags };
}
