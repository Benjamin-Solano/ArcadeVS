/**
 * Validaciones de datos de torneo (funciones puras).
 *
 * No acceden a la base de datos: solo verifican formato y reglas de forma sobre
 * los datos de creacion de un torneo. Las reglas que requieren consultar la BD
 * (existencia de juego/modalidad, cupos, transiciones de estado) viven en
 * servicio-torneos. Lanzan ErrorServicio con codigo 'DATOS_INVALIDOS'.
 */

import { ErrorServicio } from './error-servicio.js';

/**
 * Valida el cupo maximo: null (sin limite) o un entero positivo.
 *
 * @param {any} valor - Valor recibido para max_participantes.
 * @returns {number|null} El cupo validado o null.
 */
function validar_max_participantes(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorServicio(
      'DATOS_INVALIDOS',
      'max_participantes debe ser un entero positivo o nulo.',
    );
  }
  return numero;
}

/**
 * Valida y normaliza los datos de creacion de un torneo.
 *
 * @param {object} datos - Datos crudos recibidos del cliente.
 * @returns {{nombre: string, id_juego: string, id_modalidad: string,
 *            max_participantes: number|null}} Datos normalizados.
 */
export function validar_datos_torneo(datos = {}) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (nombre === '') {
    throw new ErrorServicio('DATOS_INVALIDOS', 'El nombre del torneo es obligatorio.');
  }
  if (!datos.id_juego) {
    throw new ErrorServicio('DATOS_INVALIDOS', 'Falta id_juego.');
  }
  if (!datos.id_modalidad) {
    throw new ErrorServicio('DATOS_INVALIDOS', 'Falta id_modalidad.');
  }
  return {
    nombre,
    id_juego: datos.id_juego,
    id_modalidad: datos.id_modalidad,
    max_participantes: validar_max_participantes(datos.max_participantes),
  };
}
