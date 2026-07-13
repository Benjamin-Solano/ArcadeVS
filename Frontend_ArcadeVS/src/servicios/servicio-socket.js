/**
 * servicio-socket — cliente Socket.io central (singleton) del bus de eventos en
 * tiempo real. El servidor autentica el handshake con el JWT de la sesion
 * (`auth.token`) y une el socket a la sala personal `usuario:<id_usuario>`, por
 * donde llegan las notificaciones dirigidas (solicitudes de amistad, vinculos
 * confirmados, presencia). Los servicios de dominio (servicio-amistades, etc.)
 * usan este socket para emitir y escuchar; los componentes nunca lo tocan directo.
 */

import { io } from 'socket.io-client';
import { obtener_token } from './almacenamiento-sesion.js';

/** URL del servidor Socket.io; en desarrollo apunta al backend local. */
const URL_SOCKET = import.meta.env.VITE_URL_SOCKET ?? 'http://localhost:3000';

/** Instancia unica del socket, creada de forma perezosa al conectar. */
let socket = null;

/**
 * Abre (o reutiliza) la conexion Socket.io autenticada con el token de sesion
 * actual. Si ya hay un socket conectado, lo devuelve tal cual.
 *
 * @returns {import('socket.io-client').Socket} El socket conectado.
 */
export function conectar_socket() {
  if (socket?.connected) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
  }
  socket = io(URL_SOCKET, {
    auth: { token: obtener_token() },
    autoConnect: true,
  });
  return socket;
}

/** @returns {import('socket.io-client').Socket|null} El socket activo, o null si no se ha conectado. */
export function obtener_socket() {
  return socket;
}

/** Cierra la conexion del socket (por ejemplo, al cerrar sesion). */
export function desconectar_socket() {
  socket?.disconnect();
  socket = null;
}
