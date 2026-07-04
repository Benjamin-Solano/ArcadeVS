/**
 * Rutas REST del dominio juego (capa de entrada HTTP).
 *
 * Rutas publicas de solo lectura: el catalogo de juegos y el leaderboard de cada
 * juego. Delegan en los servicios; el manejador global traduce los errores.
 *
 * Prefijo montado en index.js: /juegos
 *   GET /juegos                       → catalogo de juegos activos.
 *   GET /juegos/:slug                 → detalle de un juego con sus tags.
 *   GET /juegos/:id_juego/leaderboard → top del leaderboard del juego.
 */

import {
  obtener_catalogo,
  obtener_juego,
} from '../servicios/servicio-juego.js';
import { obtener_top } from '../servicios/servicio-leaderboard.js';

/** Tamano maximo del top de leaderboard que se puede pedir por query. */
const LIMITE_MAXIMO_TOP = 100;

/**
 * Registra las rutas de juego sobre la instancia de Fastify.
 *
 * @param {import('fastify').FastifyInstance} servidor - Instancia (o scope) de Fastify.
 * @returns {Promise<void>}
 */
export async function registrar_rutas_juego(servidor) {
  /** Lista el catalogo de juegos activos. */
  servidor.get('/', async () => {
    const juegos = await obtener_catalogo();
    return { juegos };
  });

  /** Devuelve el detalle de un juego por su slug. */
  servidor.get('/:slug', async (peticion) => {
    const juego = await obtener_juego(peticion.params.slug);
    return { juego };
  });

  /** Devuelve el top del leaderboard de un juego (limite opcional via ?limite=). */
  servidor.get('/:id_juego/leaderboard', async (peticion) => {
    const limite = Number(peticion.query?.limite) || 10;
    const tabla_puntajes = await obtener_top(
      peticion.params.id_juego,
      Math.min(limite, LIMITE_MAXIMO_TOP),
    );
    return { id_juego: peticion.params.id_juego, tabla_puntajes };
  });
}
