/**
 * Configuracion del servidor Socket.io (bus de eventos).
 *
 * Adjunta Socket.io al servidor HTTP de Fastify y registra, por cada conexion,
 * los manejadores de cada dominio. Es el punto unico donde se ensambla el bus
 * de eventos; los manejadores concretos viven en `eventos/`.
 */

import { Server } from 'socket.io';

import { registrar_manejador_juego } from '../eventos/manejador-juego.js';
import { registrar_manejador_sala } from '../eventos/manejador-sala.js';

/**
 * Crea el servidor Socket.io sobre el servidor HTTP dado y cablea los
 * manejadores de eventos de cada dominio para cada cliente que se conecta.
 *
 * El origen permitido por CORS se toma de CORS_ORIGEN (la URL del frontend en
 * produccion); por defecto '*' en desarrollo local.
 *
 * @param {import('http').Server} servidor_http - Servidor HTTP subyacente de Fastify.
 * @returns {import('socket.io').Server} La instancia de Socket.io creada.
 */
export function crear_socket(servidor_http) {
  const io = new Server(servidor_http, {
    cors: {
      origin: process.env.CORS_ORIGEN ?? '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    registrar_manejador_juego(io, socket);
    registrar_manejador_sala(socket);
  });

  return io;
}
