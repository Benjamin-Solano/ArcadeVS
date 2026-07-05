/**
 * Rutas REST del dominio usuario (capa de entrada HTTP).
 *
 * Todas requieren autenticacion. Las rutas de perfil operan sobre el usuario del
 * token (`peticion.usuario.id_usuario`), nunca sobre un id del cliente: asi se
 * evita el acceso a datos ajenos (IDOR). La excepcion es el cambio de rol, una
 * accion de administrador sobre otro usuario, autorizada dentro del servicio.
 * Delegan en los servicios; el manejador global traduce los errores.
 *
 * Prefijo montado en index.js: /usuarios
 *   GET  /usuarios/perfil        → perfil propio.
 *   PUT  /usuarios/perfil        → actualiza el perfil propio.
 *   GET  /usuarios/historial     → historial de partidas propio.
 *   GET  /usuarios/rankings      → rankings propios por juego.
 *   PUT  /usuarios/:id/rol       → cambia el rol de un usuario (solo admin).
 */

import {
  obtener_perfil,
  obtener_estadisticas,
  actualizar_perfil,
  actualizar_rol,
} from '../servicios/servicio-usuario.js';
import { obtener_historial } from '../servicios/servicio-historial.js';
import { obtener_rankings_usuario } from '../servicios/servicio-leaderboard.js';
import { requerir_autenticacion } from '../configuracion/configuracion-autenticacion.js';
import { emitir_perfil_actualizado } from '../eventos/emisor-usuario.js';

/**
 * Registra las rutas de usuario sobre la instancia de Fastify. Aplica el guard
 * de autenticacion a todas las rutas de este scope.
 *
 * @param {import('fastify').FastifyInstance} servidor - Instancia (o scope) de Fastify.
 * @returns {Promise<void>}
 */
export async function registrar_rutas_usuario(servidor) {
  servidor.addHook('preHandler', requerir_autenticacion);

  /** Devuelve el perfil del usuario autenticado. */
  servidor.get('/perfil', async (peticion) => {
    const usuario = await obtener_perfil(peticion.usuario.id_usuario);
    return { usuario };
  });

  /** Actualiza el perfil del usuario autenticado y lo notifica por el bus. */
  servidor.put('/perfil', async (peticion) => {
    const usuario = await actualizar_perfil(
      peticion.usuario.id_usuario,
      peticion.body ?? {},
    );
    // Puente REST → bus: notifica a las conexiones del usuario (si el bus existe).
    if (peticion.server.io) {
      emitir_perfil_actualizado(peticion.server.io, usuario.id_usuario, usuario);
    }
    return { usuario };
  });

  /** Devuelve el resumen de estadisticas de juego del usuario autenticado. */
  servidor.get('/estadisticas', async (peticion) => {
    const estadisticas = await obtener_estadisticas(peticion.usuario.id_usuario);
    return { estadisticas };
  });

  /** Devuelve el historial de partidas del usuario autenticado. */
  servidor.get('/historial', async (peticion) => {
    const historial = await obtener_historial(peticion.usuario.id_usuario);
    return { historial };
  });

  /** Devuelve los rankings por juego del usuario autenticado. */
  servidor.get('/rankings', async (peticion) => {
    const rankings = await obtener_rankings_usuario(peticion.usuario.id_usuario);
    return { rankings };
  });

  /** Cambia el rol de un usuario. El servicio exige que el solicitante sea admin. */
  servidor.put('/:id_usuario/rol', async (peticion) => {
    const usuario = await actualizar_rol(
      peticion.usuario.id_usuario,
      peticion.params.id_usuario,
      peticion.body?.rol,
    );
    return { usuario };
  });
}
