/**
 * Rutas REST del dominio amigo (capa de entrada HTTP).
 *
 * Solo lectura: sirven la carga inicial de la lista de amigos y de las
 * solicitudes pendientes del usuario autenticado. Las mutaciones en tiempo real
 * (enviar/aceptar/rechazar) van por Socket.io (manejador-amigo). Todas requieren
 * autenticacion y operan sobre el usuario del token, nunca sobre un id de la URL.
 *
 * Prefijo montado en construir-servidor.js: /amigos
 *   GET /amigos             → amigos confirmados del usuario.
 *   GET /amigos/solicitudes → solicitudes pendientes del usuario.
 */

import {
  obtener_lista_amigos,
  obtener_solicitudes,
} from '../servicios/servicio-amistades.js';
import { requerir_autenticacion } from '../configuracion/configuracion-autenticacion.js';

/**
 * Registra las rutas de amigo sobre la instancia de Fastify. Aplica el guard de
 * autenticacion a todas las rutas de este scope.
 *
 * @param {import('fastify').FastifyInstance} servidor - Instancia (o scope) de Fastify.
 * @returns {Promise<void>}
 */
export async function registrar_rutas_amigo(servidor) {
  servidor.addHook('preHandler', requerir_autenticacion);

  /** Lista los amigos confirmados del usuario autenticado. */
  servidor.get('/', async (peticion) => {
    const amigos = await obtener_lista_amigos(peticion.usuario.id_usuario);
    return { amigos };
  });

  /** Lista las solicitudes pendientes del usuario autenticado. */
  servidor.get('/solicitudes', async (peticion) => {
    const solicitudes = await obtener_solicitudes(peticion.usuario.id_usuario);
    return { solicitudes };
  });
}
