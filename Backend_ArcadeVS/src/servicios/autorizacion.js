/**
 * Utilidades de autorizacion basadas en el rol del usuario.
 *
 * Helper transversal de la capa de servicios (no es un servicio de dominio): lee
 * el rol vigente desde la BD en el momento de autorizar, para que un cambio de
 * rol tenga efecto inmediato sin depender de un token ya emitido. Lo comparten
 * el servicio de usuarios (promocion) y el de torneos (gestion por admin).
 */

import { obtener_usuario_por_id } from '../repositorios/repositorio-usuario.js';
import { ErrorServicio } from './error-servicio.js';

/**
 * Indica si un usuario tiene rol de administrador.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<boolean>} true si el usuario existe y es admin.
 */
export async function es_admin(id_usuario) {
  const usuario = await obtener_usuario_por_id(id_usuario);
  return usuario?.rol === 'admin';
}

/**
 * Exige que el usuario sea administrador; lanza 403 si no lo es.
 *
 * @param {string} id_usuario - UUID del usuario que realiza la accion.
 * @returns {Promise<void>}
 */
export async function exigir_admin(id_usuario) {
  if (!(await es_admin(id_usuario))) {
    throw new ErrorServicio(
      'NO_AUTORIZADO',
      'Esta accion requiere rol de administrador.',
      403,
    );
  }
}

/**
 * Exige que quien actua sea el dueño de un recurso o un administrador; lanza 403
 * en caso contrario. Modelo dueño-admin usado, por ejemplo, para gestionar el
 * ciclo de vida de un torneo.
 *
 * @param {string|null} id_dueno - UUID del dueño del recurso (null si no tiene).
 * @param {string} id_actor - UUID del usuario que intenta la accion.
 * @returns {Promise<void>}
 */
export async function exigir_dueno_o_admin(id_dueno, id_actor) {
  if (id_dueno && id_dueno === id_actor) {
    return;
  }
  if (await es_admin(id_actor)) {
    return;
  }
  throw new ErrorServicio(
    'NO_AUTORIZADO',
    'Solo el dueño o un administrador pueden realizar esta accion.',
    403,
  );
}
