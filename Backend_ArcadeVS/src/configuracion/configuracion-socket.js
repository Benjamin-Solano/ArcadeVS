/**
 * Configuracion del servidor Socket.io (bus de eventos).
 *
 * Adjunta Socket.io al servidor HTTP de Fastify y registra, por cada conexion,
 * los manejadores de cada dominio. Es el punto unico donde se ensambla el bus
 * de eventos; los manejadores concretos viven en `eventos/`.
 */

import { Server } from 'socket.io';

import { autenticar_socket } from './configuracion-autenticacion.js';
import { sala_de_usuario } from '../eventos/salas.js';
import { registrar_manejador_juego } from '../eventos/manejador-juego.js';
import { registrar_manejador_sala } from '../eventos/manejador-sala.js';
import { registrar_manejador_amigo } from '../eventos/manejador-amigo.js';
import { registrar_manejador_usuario } from '../eventos/manejador-usuario.js';

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

  // Autentica cada conexion con el JWT del handshake (anonimo si no hay token).
  io.use(autenticar_socket);

  io.on('connection', (socket) => {
    // El usuario autenticado se une a su sala personal para recibir
    // notificaciones dirigidas (solicitudes de amistad, vinculos confirmados,
    // presencia) y anuncia su presencia a los amigos conectados.
    if (socket.data.id_usuario) {
      socket.join(sala_de_usuario(socket.data.id_usuario));
      registrar_manejador_usuario(io, socket);
    }
    registrar_manejador_juego(io, socket);
    registrar_manejador_sala(socket);
    registrar_manejador_amigo(io, socket);
  });

  return io;
}
