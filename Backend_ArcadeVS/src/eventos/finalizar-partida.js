/**
 * Orquestador del fin de partida (capa de eventos).
 *
 * Coordina los servicios de historial y leaderboard dentro de UNA transaccion,
 * cumpliendo la regla del proyecto: `partidas_jugadores` y `rankings_juego` se
 * actualizan de forma atomica. Vive en la capa de eventos (no en servicios)
 * porque orquesta a varios servicios; los servicios nunca se llaman entre si.
 *
 * Es la traduccion en codigo del flujo 8.1 de la arquitectura:
 *   BEGIN → guardar_sesion → actualizar_puntaje → COMMIT → obtener top.
 */

import { ejecutar_en_transaccion } from '../configuracion/configuracion-db.js';
import { guardar_sesion } from '../servicios/servicio-historial.js';
import { actualizar_puntaje, obtener_top } from '../servicios/servicio-leaderboard.js';

/** Tamano por defecto del top de leaderboard que se emite a los clientes. */
export const TAMANO_TABLA_PUNTAJES = 10;

/**
 * Finaliza una partida: guarda la sesion y actualiza los rankings en la misma
 * transaccion, y luego obtiene el top del leaderboard para difundirlo.
 *
 * @param {object} datos - Datos de la partida terminada.
 * @param {string} datos.id_juego - UUID del juego.
 * @param {string} datos.id_modalidad - UUID de la modalidad.
 * @param {string|null} [datos.id_torneo] - UUID del torneo (null = casual).
 * @param {Array<object>} datos.jugadores - Jugadores participantes (normalizados).
 * @param {number} [limite_top] - Tamano del top a devolver.
 * @returns {Promise<{partida: object, jugadores: Array<object>,
 *           rankings: Array<object>, tabla_puntajes: Array<object>}>}
 */
export async function finalizar_partida(datos, limite_top = TAMANO_TABLA_PUNTAJES) {
  const resultado = await ejecutar_en_transaccion(async (cliente) => {
    const { partida, jugadores, modalidad } = await guardar_sesion(datos, cliente);
    const rankings = await actualizar_puntaje(
      { id_juego: datos.id_juego, puntua: modalidad.puntua, jugadores },
      cliente,
    );
    return { partida, jugadores, rankings };
  });

  // Lectura fuera de la transaccion: refleja el estado ya confirmado (COMMIT).
  const tabla_puntajes = await obtener_top(datos.id_juego, limite_top);
  return { ...resultado, tabla_puntajes };
}
