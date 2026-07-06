/**
 * Validaciones de datos de usuario (funciones puras).
 *
 * No acceden a la base de datos: solo verifican formato y reglas de forma.
 * Las validaciones que requieren consultar la BD (correo o nombre en uso)
 * viven en servicio-usuario. Lanzan ErrorServicio con codigo 'DATOS_INVALIDOS'.
 */

import { ErrorServicio } from './error-servicio.js';

/** Longitud minima de la contrasena (segun diseno: "MINIMO 8 CARACTERES"). */
export const LONGITUD_MINIMA_CONTRASENA = 8;

/** Expresion simple para validar el formato de un correo electronico. */
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida que un valor sea un texto no vacio.
 *
 * @param {any} valor - Valor a validar.
 * @param {string} etiqueta - Nombre del campo para el mensaje de error.
 * @returns {string} El texto recortado (sin espacios en los extremos).
 */
function validar_texto_requerido(valor, etiqueta) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new ErrorServicio('DATOS_INVALIDOS', `El campo ${etiqueta} es obligatorio.`);
  }
  return valor.trim();
}

/** Longitud maxima del nombre visible (coincide con VARCHAR(50) en la BD). */
export const LONGITUD_MAXIMA_NOMBRE = 50;

/**
 * Valida el nombre visible (alias): texto no vacio y de a lo sumo 50 caracteres.
 *
 * @param {string} nombre - Nombre a validar.
 * @returns {string} El nombre recortado.
 */
export function validar_nombre(nombre) {
  const limpio = validar_texto_requerido(nombre, 'nombre');
  if (limpio.length > LONGITUD_MAXIMA_NOMBRE) {
    throw new ErrorServicio(
      'DATOS_INVALIDOS',
      `El nombre no puede superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`,
    );
  }
  return limpio;
}

/**
 * Valida el formato de un correo electronico.
 *
 * @param {string} correo - Correo a validar.
 * @returns {string} El correo normalizado (recortado y en minusculas).
 */
export function validar_correo(correo) {
  const limpio = validar_texto_requerido(correo, 'correo').toLowerCase();
  if (!PATRON_CORREO.test(limpio)) {
    throw new ErrorServicio('DATOS_INVALIDOS', 'El correo no tiene un formato valido.');
  }
  return limpio;
}

/**
 * Valida la contrasena en texto plano antes de hashearla.
 *
 * @param {string} contrasena - Contrasena a validar.
 * @returns {string} La contrasena validada (sin modificar).
 */
export function validar_contrasena(contrasena) {
  if (typeof contrasena !== 'string' || contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    throw new ErrorServicio(
      'DATOS_INVALIDOS',
      `La contrasena debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`,
    );
  }
  return contrasena;
}

/**
 * Valida y normaliza los datos de registro de un usuario.
 *
 * @param {object} datos - Datos crudos recibidos del cliente.
 * @returns {{nombre: string, apellido: string, correo: string, contrasena: string,
 *            nacionalidad: string|null, fecha_nacimiento: string|null}}
 *          Datos normalizados listos para el servicio.
 */
export function validar_datos_registro(datos = {}) {
  return {
    nombre: validar_texto_requerido(datos.nombre, 'nombre'),
    apellido: validar_texto_requerido(datos.apellido, 'apellido'),
    correo: validar_correo(datos.correo),
    contrasena: validar_contrasena(datos.contrasena),
    nacionalidad: datos.nacionalidad?.trim() || null,
    fecha_nacimiento: datos.fecha_nacimiento || null,
  };
}
