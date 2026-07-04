/**
 * Rutas REST del dominio torneo (capa de entrada HTTP).
 *
 * Lecturas publicas (listado y detalle) y mutaciones protegidas. Las mutaciones
 * exigen autenticacion; la inscripcion y su cancelacion operan sobre el usuario
 * del token (nunca sobre un id de la URL). Delegan en servicio-torneos; el
 * manejador global traduce los errores.
 *
 * Nota de autorizacion (modelo dueño-admin): crear exige solo estar autenticado
 * (el creador queda como dueño); iniciar/finalizar los permite el dueño o un
 * administrador. La autorizacion concreta se resuelve en servicio-torneos.
 *
 * Prefijo montado en construir-servidor.js: /torneos
 *   GET    /torneos                      → lista (filtro ?estado=).
 *   GET    /torneos/:id_torneo           → detalle con participantes.
 *   POST   /torneos                      → crea un torneo (auth).
 *   POST   /torneos/:id_torneo/inscripcion → inscribe al usuario (auth).
 *   DELETE /torneos/:id_torneo/inscripcion → cancela la inscripcion (auth).
 *   POST   /torneos/:id_torneo/iniciar   → inscripcion → en_curso (auth).
 *   POST   /torneos/:id_torneo/finalizar → en_curso → finalizado (auth).
 */

import {
  crear_torneo,
  listar_torneos,
  obtener_torneo,
  inscribir_usuario,
  cancelar_inscripcion,
  iniciar_torneo,
  finalizar_torneo,
} from '../servicios/servicio-torneos.js';
import { requerir_autenticacion } from '../configuracion/configuracion-autenticacion.js';

/** Opciones de ruta que exigen un JWT valido. */
const PROTEGIDA = { preHandler: requerir_autenticacion };

/**
 * Registra las rutas de torneo sobre la instancia de Fastify.
 *
 * @param {import('fastify').FastifyInstance} servidor - Instancia (o scope) de Fastify.
 * @returns {Promise<void>}
 */
export async function registrar_rutas_torneo(servidor) {
  /** Lista torneos, con filtro opcional por estado (?estado=). */
  servidor.get('/', async (peticion) => {
    const torneos = await listar_torneos(peticion.query?.estado ?? null);
    return { torneos };
  });

  /** Detalle de un torneo con sus participantes. */
  servidor.get('/:id_torneo', async (peticion) => {
    const torneo = await obtener_torneo(peticion.params.id_torneo);
    return { torneo };
  });

  /** Crea un torneo; el usuario autenticado queda como dueño. */
  servidor.post('/', PROTEGIDA, async (peticion, respuesta) => {
    const torneo = await crear_torneo(peticion.body ?? {}, peticion.usuario.id_usuario);
    return respuesta.code(201).send({ torneo });
  });

  /** Inscribe al usuario autenticado en el torneo. */
  servidor.post('/:id_torneo/inscripcion', PROTEGIDA, async (peticion, respuesta) => {
    const inscripcion = await inscribir_usuario(
      peticion.params.id_torneo,
      peticion.usuario.id_usuario,
    );
    return respuesta.code(201).send({ inscripcion });
  });

  /** Cancela la inscripcion del usuario autenticado. */
  servidor.delete('/:id_torneo/inscripcion', PROTEGIDA, async (peticion) => {
    await cancelar_inscripcion(peticion.params.id_torneo, peticion.usuario.id_usuario);
    return { cancelado: true };
  });

  /** Inicia el torneo (inscripcion → en_curso). Solo dueño o admin. */
  servidor.post('/:id_torneo/iniciar', PROTEGIDA, async (peticion) => {
    const torneo = await iniciar_torneo(
      peticion.params.id_torneo,
      peticion.usuario.id_usuario,
    );
    return { torneo };
  });

  /** Finaliza el torneo (en_curso → finalizado). Solo dueño o admin. */
  servidor.post('/:id_torneo/finalizar', PROTEGIDA, async (peticion) => {
    const torneo = await finalizar_torneo(
      peticion.params.id_torneo,
      peticion.usuario.id_usuario,
    );
    return { torneo };
  });
}
