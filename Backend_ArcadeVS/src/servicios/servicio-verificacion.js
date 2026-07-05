/**
 * Servicio de verificación de correo — lógica del código de 6 dígitos.
 *
 * No escribe SQL (delega en repositorio-verificacion y repositorio-usuario) ni
 * conoce el transporte de correo (delega en servicio-correo). Se encarga de:
 * generar el código, hashearlo con bcrypt, controlar expiración e intentos, y
 * traducir las reglas a ErrorServicio.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import {
  guardar_codigo,
  obtener_codigo_vigente,
  marcar_codigo_usado,
  incrementar_intentos,
} from '../repositorios/repositorio-verificacion.js';
import {
  obtener_usuario_por_correo,
  marcar_verificado,
} from '../repositorios/repositorio-usuario.js';
import { enviar_codigo_verificacion } from './servicio-correo.js';
import { ErrorServicio } from './error-servicio.js';
import { validar_correo } from './validaciones-usuario.js';

/** Longitud del código de verificación (coincide con las 6 cajas del frontend). */
const CODIGO_LONGITUD = 6;

/** Factor de coste de bcrypt para el hash del código. */
const RONDAS_BCRYPT = 10;

/** Máximo de intentos fallidos antes de invalidar el código. */
const MAX_INTENTOS = 5;

/** @returns {number} Minutos de validez del código (env, con 15 por defecto). */
function minutos_expiracion() {
  return Number(process.env.CODIGO_VERIFICACION_EXPIRA_MIN) || 15;
}

/**
 * Genera un código numérico de 6 dígitos criptográficamente aleatorio.
 *
 * @returns {string} Código de 6 dígitos (con ceros a la izquierda si aplica).
 */
function generar_codigo() {
  const maximo = 10 ** CODIGO_LONGITUD; // 1_000_000
  return String(crypto.randomInt(0, maximo)).padStart(CODIGO_LONGITUD, '0');
}

/**
 * Crea un código nuevo para el usuario, lo persiste hasheado y lo envía por
 * correo. Reutilizable en el registro y en el reenvío.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @param {string} correo - Correo destino.
 * @returns {Promise<string>} El código en claro (para exponerlo solo en modo dev).
 */
export async function crear_y_enviar_codigo(id_usuario, correo) {
  const codigo = generar_codigo();
  const codigo_hash = await bcrypt.hash(codigo, RONDAS_BCRYPT);
  const expira_en = new Date(Date.now() + minutos_expiracion() * 60 * 1000);

  await guardar_codigo(id_usuario, codigo_hash, expira_en);
  await enviar_codigo_verificacion(correo, codigo);

  return codigo;
}

/**
 * Verifica el código ingresado por el usuario y, si es correcto, marca su
 * cuenta como verificada.
 *
 * @param {string} correo - Correo del usuario.
 * @param {string} codigo - Código de 6 dígitos ingresado.
 * @returns {Promise<object>} El usuario ya verificado (campos públicos).
 */
export async function verificar_codigo(correo, codigo) {
  const correo_normalizado = validar_correo(correo);
  const usuario = await obtener_usuario_por_correo(correo_normalizado);
  if (!usuario) {
    throw new ErrorServicio('USUARIO_NO_ENCONTRADO', 'El usuario no existe.', 404);
  }
  if (usuario.verificado) {
    throw new ErrorServicio('CUENTA_YA_VERIFICADA', 'La cuenta ya está verificada.', 409);
  }

  const vigente = await obtener_codigo_vigente(usuario.id_usuario);
  if (!vigente) {
    throw new ErrorServicio(
      'CODIGO_EXPIRADO',
      'El código expiró o no existe. Solicita uno nuevo.',
      400,
    );
  }
  if (vigente.intentos >= MAX_INTENTOS) {
    await marcar_codigo_usado(vigente.id_codigo);
    throw new ErrorServicio(
      'CODIGO_BLOQUEADO',
      'Demasiados intentos fallidos. Solicita un código nuevo.',
      429,
    );
  }

  const coincide = await bcrypt.compare(codigo ?? '', vigente.codigo_hash);
  if (!coincide) {
    await incrementar_intentos(vigente.id_codigo);
    throw new ErrorServicio('CODIGO_INVALIDO', 'El código es incorrecto.', 400);
  }

  await marcar_codigo_usado(vigente.id_codigo);
  return marcar_verificado(usuario.id_usuario);
}

/**
 * Reenvía un código nuevo al correo del usuario (si aún no está verificado).
 *
 * @param {string} correo - Correo del usuario.
 * @returns {Promise<void>}
 */
export async function reenviar_codigo(correo) {
  const correo_normalizado = validar_correo(correo);
  const usuario = await obtener_usuario_por_correo(correo_normalizado);
  if (!usuario) {
    throw new ErrorServicio('USUARIO_NO_ENCONTRADO', 'El usuario no existe.', 404);
  }
  if (usuario.verificado) {
    throw new ErrorServicio('CUENTA_YA_VERIFICADA', 'La cuenta ya está verificada.', 409);
  }
  await crear_y_enviar_codigo(usuario.id_usuario, usuario.correo);
}
