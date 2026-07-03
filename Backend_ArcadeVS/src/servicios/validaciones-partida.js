/**
 * Validaciones de datos de partida (funciones puras).
 *
 * No acceden a la base de datos: solo verifican formato y reglas de forma sobre
 * los jugadores de una partida. Las reglas que requieren consultar la BD
 * (existencia de modalidad, consistencia de torneo) viven en servicio-historial.
 * Lanzan ErrorServicio con codigo 'DATOS_INVALIDOS'.
 */

import { ErrorServicio } from './error-servicio.js';

/** Resultados validos de un jugador al terminar la partida. */
export const RESULTADOS_VALIDOS = ['victoria', 'derrota', 'empate'];

/**
 * Valida y normaliza un jugador de partida.
 *
 * Aplica la regla de bots (regla e): si es_bot = TRUE el id_usuario debe ser
 * NULL; si es_bot = FALSE el id_usuario es obligatorio.
 *
 * @param {object} jugador - Datos crudos del jugador.
 * @returns {{id_usuario: string|null, es_bot: boolean, puntuacion: number,
 *            resultado: string|null}} Jugador normalizado.
 */
function validar_jugador(jugador = {}) {
  const es_bot = jugador.es_bot === true;
  const id_usuario = jugador.id_usuario ?? null;

  if (es_bot && id_usuario !== null) {
    throw new ErrorServicio(
      'DATOS_INVALIDOS',
      'Un jugador bot no puede tener id_usuario.',
    );
  }
  if (!es_bot && !id_usuario) {
    throw new ErrorServicio(
      'DATOS_INVALIDOS',
      'Un jugador humano requiere id_usuario.',
    );
  }

  const puntuacion = Number(jugador.puntuacion ?? 0);
  if (!Number.isInteger(puntuacion) || puntuacion < 0) {
    throw new ErrorServicio(
      'DATOS_INVALIDOS',
      'La puntuacion debe ser un entero mayor o igual a 0.',
    );
  }

  const resultado = jugador.resultado ?? null;
  if (resultado !== null && !RESULTADOS_VALIDOS.includes(resultado)) {
    throw new ErrorServicio(
      'DATOS_INVALIDOS',
      "El resultado debe ser 'victoria', 'derrota', 'empate' o null.",
    );
  }

  return { id_usuario, es_bot, puntuacion, resultado };
}

/**
 * Valida y normaliza la lista de jugadores de una partida.
 *
 * @param {Array<object>} jugadores - Jugadores crudos recibidos del cliente.
 * @returns {Array<{id_usuario: string|null, es_bot: boolean, puntuacion: number,
 *           resultado: string|null}>} Jugadores normalizados.
 */
export function validar_jugadores(jugadores) {
  if (!Array.isArray(jugadores) || jugadores.length === 0) {
    throw new ErrorServicio(
      'DATOS_INVALIDOS',
      'La partida requiere al menos un jugador.',
    );
  }
  return jugadores.map(validar_jugador);
}
