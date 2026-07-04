/**
 * Configuracion de autenticacion (JWT propio).
 *
 * Centraliza la firma y verificacion de los JSON Web Token del backend. Es la
 * unica pieza que usa `jsonwebtoken` directamente; las rutas piden aqui el token
 * o el guard de autenticacion, sin repetir la libreria por su cuenta.
 *
 * El token es stateless: lleva en su payload el id_usuario y su propia fecha de
 * expiracion, por lo que no se persiste estado de sesion en la base de datos.
 * El secreto y la expiracion se leen de las variables de entorno
 * SERVIDOR_JWT_SECRETO y SERVIDOR_JWT_EXPIRACION.
 */

import jwt from 'jsonwebtoken';

import { ErrorServicio } from '../servicios/error-servicio.js';

/** Expiracion por defecto del token si no se define SERVIDOR_JWT_EXPIRACION. */
const EXPIRACION_POR_DEFECTO = '7d';

/**
 * Devuelve el secreto de firma, fallando de forma explicita si no esta definido.
 * Se lee en cada llamada (no al importar) para no romper los tests que no
 * ejercen autenticacion y para reflejar el entorno vigente.
 *
 * @returns {string} El secreto de firma del JWT.
 */
function obtener_secreto() {
  const secreto = process.env.SERVIDOR_JWT_SECRETO;
  if (!secreto) {
    throw new ErrorServicio(
      'CONFIGURACION_INVALIDA',
      'Falta SERVIDOR_JWT_SECRETO en el entorno.',
      500,
    );
  }
  return secreto;
}

/**
 * Firma un JWT para un usuario autenticado.
 *
 * @param {string} id_usuario - UUID del usuario dueno del token.
 * @returns {string} El token firmado.
 */
export function firmar_token(id_usuario) {
  return jwt.sign({ id_usuario }, obtener_secreto(), {
    expiresIn: process.env.SERVIDOR_JWT_EXPIRACION || EXPIRACION_POR_DEFECTO,
  });
}

/**
 * Verifica un JWT y devuelve su payload. Lanza ErrorServicio 401 si el token es
 * invalido o esta expirado.
 *
 * @param {string} token - Token a verificar (sin el prefijo 'Bearer ').
 * @returns {{id_usuario: string}} Payload decodificado.
 */
export function verificar_token(token) {
  try {
    return jwt.verify(token, obtener_secreto());
  } catch {
    throw new ErrorServicio('TOKEN_INVALIDO', 'Token invalido o expirado.', 401);
  }
}

/**
 * Extrae el token de la cabecera Authorization (formato 'Bearer <token>').
 *
 * @param {string|undefined} cabecera - Valor de la cabecera Authorization.
 * @returns {string|null} El token, o null si la cabecera no tiene el formato.
 */
export function extraer_token(cabecera) {
  if (typeof cabecera !== 'string') {
    return null;
  }
  const [esquema, token] = cabecera.split(' ');
  if (esquema !== 'Bearer' || !token) {
    return null;
  }
  return token;
}

/**
 * Hook `preHandler` de Fastify que exige un JWT valido. Si el token es correcto,
 * expone el usuario en `request.usuario`; si falta o es invalido, lanza
 * ErrorServicio 401 (el manejador global de errores lo traduce a la respuesta).
 *
 * @param {import('fastify').FastifyRequest} peticion - Peticion entrante.
 * @returns {Promise<void>}
 */
export async function requerir_autenticacion(peticion) {
  const token = extraer_token(peticion.headers.authorization);
  if (!token) {
    throw new ErrorServicio(
      'NO_AUTENTICADO',
      'Se requiere un token de autenticacion.',
      401,
    );
  }
  const { id_usuario } = verificar_token(token);
  peticion.usuario = { id_usuario };
}

/**
 * Middleware de Socket.io que autentica la conexion a partir del JWT enviado en
 * `handshake.auth.token`. Si hay token valido, guarda `id_usuario` en
 * `socket.data` (para enrutar eventos dirigidos). Las conexiones sin token se
 * aceptan como anonimas; un token presente pero invalido rechaza la conexion.
 *
 * @param {import('socket.io').Socket} socket - Socket que intenta conectarse.
 * @param {(error?: Error) => void} siguiente - Callback de continuacion.
 * @returns {void}
 */
export function autenticar_socket(socket, siguiente) {
  const token = socket.handshake?.auth?.token;
  if (!token) {
    siguiente();
    return;
  }
  try {
    const { id_usuario } = verificar_token(token);
    socket.data.id_usuario = id_usuario;
    siguiente();
  } catch {
    siguiente(new Error('TOKEN_INVALIDO'));
  }
}
