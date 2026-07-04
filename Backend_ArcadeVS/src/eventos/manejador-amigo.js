/**
 * Manejador de eventos del dominio `amigo` (capa de entrada Socket.io).
 *
 * Recibe las acciones de amistad del cliente, deriva la identidad del emisor del
 * socket autenticado (`socket.data.id_usuario`, no de un id enviado por el
 * cliente), delega en servicio-amistades y notifica a los usuarios implicados a
 * traves de sus salas personales `usuario:<id_usuario>`. No escribe SQL ni
 * contiene logica de negocio.
 *
 * Eventos manejados (catalogo, seccion 5.3):
 *   amigo:solicitud_enviada    (Cliente → Servidor)  { id_usuario_destino }
 *   amigo:solicitud_aceptada   (Cliente → Servidor)  { id_solicitud }
 *   amigo:solicitud_rechazada  (Cliente → Servidor)  { id_solicitud }
 * Eventos emitidos:
 *   amigo:solicitud_recibida   (Servidor → destino)
 *   amigo:vinculo_confirmado   (Servidor → ambos)
 *   amigo:error                (Servidor → emisor)
 */

import { ErrorServicio } from '../servicios/error-servicio.js';
import {
  enviar_solicitud,
  responder_solicitud,
} from '../servicios/servicio-amistades.js';
import { sala_de_usuario } from './salas.js';

/**
 * Devuelve el id del usuario autenticado en el socket o lanza si es anonimo.
 *
 * @param {import('socket.io').Socket} socket - Socket del cliente.
 * @returns {string} UUID del usuario autenticado.
 */
function exigir_usuario(socket) {
  const id_usuario = socket.data?.id_usuario;
  if (!id_usuario) {
    throw new ErrorServicio(
      'NO_AUTENTICADO',
      'Debes autenticarte para gestionar amistades.',
      401,
    );
  }
  return id_usuario;
}

/**
 * Maneja el envio de una solicitud: la persiste y notifica al destino en vivo.
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {import('socket.io').Socket} socket - Socket del emisor.
 * @param {object} datos - Payload { id_usuario_destino }.
 * @returns {Promise<void>}
 */
export async function manejar_solicitud_enviada(io, socket, datos) {
  try {
    const id_emisor = exigir_usuario(socket);
    const { solicitud, id_destino } = await enviar_solicitud(
      id_emisor,
      datos?.id_usuario_destino,
    );
    io.to(sala_de_usuario(id_destino)).emit('amigo:solicitud_recibida', {
      id_solicitud: solicitud.id_solicitud,
      id_usuario_origen: id_emisor,
    });
  } catch (error) {
    emitir_error(socket, error);
  }
}

/**
 * Maneja la respuesta a una solicitud. Al aceptar, difunde el vinculo confirmado
 * a las salas personales de ambos usuarios.
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {import('socket.io').Socket} socket - Socket de quien responde.
 * @param {object} datos - Payload { id_solicitud }.
 * @param {boolean} aceptar - true para aceptar, false para rechazar.
 * @returns {Promise<void>}
 */
export async function manejar_respuesta_solicitud(io, socket, datos, aceptar) {
  try {
    const id_usuario = exigir_usuario(socket);
    const solicitud = await responder_solicitud(id_usuario, datos?.id_solicitud, aceptar);
    if (!aceptar) {
      return;
    }
    const payload = {
      id_usuario_a: solicitud.id_solicitante,
      id_usuario_b: solicitud.id_receptor,
    };
    io.to(sala_de_usuario(solicitud.id_solicitante))
      .to(sala_de_usuario(solicitud.id_receptor))
      .emit('amigo:vinculo_confirmado', payload);
  } catch (error) {
    emitir_error(socket, error);
  }
}

/**
 * Emite `amigo:error` al cliente. Traduce ErrorServicio a su codigo/mensaje
 * estable; cualquier otro error se reporta como fallo interno sin filtrar
 * detalles sensibles.
 *
 * @param {import('socket.io').Socket} socket - Socket del cliente.
 * @param {Error} error - Error capturado.
 * @returns {void}
 */
function emitir_error(socket, error) {
  if (error instanceof ErrorServicio) {
    socket.emit('amigo:error', { codigo: error.codigo, mensaje: error.message });
    return;
  }
  socket.emit('amigo:error', {
    codigo: 'ERROR_INTERNO',
    mensaje: 'Ocurrio un error al procesar la accion de amistad.',
  });
}

/**
 * Registra los listeners del dominio `amigo` sobre un socket recien conectado.
 *
 * @param {import('socket.io').Server} io - Servidor Socket.io.
 * @param {import('socket.io').Socket} socket - Socket del cliente.
 * @returns {void}
 */
export function registrar_manejador_amigo(io, socket) {
  socket.on('amigo:solicitud_enviada', (datos) =>
    manejar_solicitud_enviada(io, socket, datos),
  );
  socket.on('amigo:solicitud_aceptada', (datos) =>
    manejar_respuesta_solicitud(io, socket, datos, true),
  );
  socket.on('amigo:solicitud_rechazada', (datos) =>
    manejar_respuesta_solicitud(io, socket, datos, false),
  );
}
