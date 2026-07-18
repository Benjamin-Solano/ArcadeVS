/**
 * Servicio de amistades — logica de negocio de solicitudes y vinculos de amistad.
 *
 * No escribe SQL (delega en repositorio-amistad) ni emite eventos Socket.io.
 * Aplica las reglas de negocio: no permitir amistad consigo mismo, verificar la
 * existencia del usuario destino y evitar solicitudes/vinculos duplicados. El
 * orden canonico de los UUID (regla b) lo garantiza el repositorio; la
 * direccion real (quien envio) se persiste aparte en id_emisor.
 */

import {
  guardar_solicitud,
  obtener_solicitud_entre,
  obtener_solicitud_por_id,
  actualizar_estado,
  reactivar_solicitud,
  obtener_amigos,
  obtener_solicitudes_pendientes,
  eliminar_solicitud,
} from '../repositorios/repositorio-amistad.js';
import { obtener_usuario_por_id } from '../repositorios/repositorio-usuario.js';
import { ErrorServicio } from './error-servicio.js';

/**
 * Envia una solicitud de amistad de un usuario a otro.
 *
 * Reglas: no consigo mismo; el destino debe existir; si ya son amigos o hay una
 * solicitud pendiente, se rechaza; si existia una solicitud rechazada/bloqueada,
 * se reactiva a 'pendiente' (la restriccion UNIQUE impide una fila nueva).
 *
 * @param {string} id_emisor - UUID del usuario que envia la solicitud.
 * @param {string} id_destino - UUID del usuario destino.
 * @returns {Promise<{solicitud: object, id_emisor: string, id_destino: string}>}
 */
export async function enviar_solicitud(id_emisor, id_destino) {
  if (!id_emisor || !id_destino) {
    throw new ErrorServicio('DATOS_INVALIDOS', 'Falta el usuario emisor o destino.');
  }
  if (id_emisor === id_destino) {
    throw new ErrorServicio(
      'AMISTAD_CONSIGO_MISMO',
      'No puedes enviarte una solicitud a ti mismo.',
      409,
    );
  }

  const destino = await obtener_usuario_por_id(id_destino);
  if (!destino) {
    throw new ErrorServicio('USUARIO_NO_ENCONTRADO', 'El usuario destino no existe.', 404);
  }

  const existente = await obtener_solicitud_entre(id_emisor, id_destino);
  if (existente?.estado === 'aceptado') {
    throw new ErrorServicio('YA_SON_AMIGOS', 'Ya son amigos.', 409);
  }
  if (existente?.estado === 'pendiente') {
    throw new ErrorServicio(
      'SOLICITUD_PENDIENTE',
      'Ya existe una solicitud pendiente entre ambos usuarios.',
      409,
    );
  }

  const solicitud = existente
    ? await reactivar_solicitud(existente.id_solicitud, id_emisor)
    : await guardar_solicitud(id_emisor, id_destino);

  return { solicitud, id_emisor, id_destino };
}

/**
 * Responde a una solicitud pendiente (aceptar o rechazar). Solo un participante
 * de la solicitud puede responderla y solo si sigue pendiente.
 *
 * @param {string} id_usuario - UUID del usuario que responde.
 * @param {string} id_solicitud - UUID de la solicitud.
 * @param {boolean} aceptar - true para aceptar, false para rechazar.
 * @returns {Promise<object>} La solicitud actualizada (con ambos participantes).
 */
export async function responder_solicitud(id_usuario, id_solicitud, aceptar) {
  if (!id_solicitud) {
    throw new ErrorServicio('DATOS_INVALIDOS', 'Falta id_solicitud.');
  }
  const solicitud = await obtener_solicitud_por_id(id_solicitud);
  if (!solicitud) {
    throw new ErrorServicio('SOLICITUD_NO_ENCONTRADA', 'La solicitud no existe.', 404);
  }
  if (id_usuario !== solicitud.id_solicitante && id_usuario !== solicitud.id_receptor) {
    throw new ErrorServicio(
      'NO_AUTORIZADO',
      'No participas en esta solicitud.',
      403,
    );
  }
  if (solicitud.estado !== 'pendiente') {
    throw new ErrorServicio(
      'SOLICITUD_NO_PENDIENTE',
      'La solicitud ya fue respondida.',
      409,
    );
  }
  return actualizar_estado(id_solicitud, aceptar ? 'aceptado' : 'rechazado');
}

/**
 * Elimina el vinculo (o solicitud) entre el usuario y otro. Solo puede hacerlo
 * un participante del par.
 *
 * @param {string} id_usuario - UUID del usuario que elimina.
 * @param {string} id_otro - UUID del otro usuario del par.
 * @returns {Promise<void>}
 */
export async function eliminar_amistad(id_usuario, id_otro) {
  const solicitud = await obtener_solicitud_entre(id_usuario, id_otro);
  if (!solicitud) {
    throw new ErrorServicio('AMISTAD_NO_ENCONTRADA', 'No existe vinculo con ese usuario.', 404);
  }
  await eliminar_solicitud(solicitud.id_solicitud);
}

/**
 * Lista los amigos confirmados de un usuario.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<Array<object>>} Amigos confirmados.
 */
export async function obtener_lista_amigos(id_usuario) {
  return obtener_amigos(id_usuario);
}

/**
 * Lista las solicitudes pendientes en las que participa un usuario.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<Array<object>>} Solicitudes pendientes.
 */
export async function obtener_solicitudes(id_usuario) {
  return obtener_solicitudes_pendientes(id_usuario);
}
