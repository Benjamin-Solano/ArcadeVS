/**
 * Construccion del servidor Fastify (sin arrancarlo).
 *
 * Aisla el ensamblado de la app HTTP —manejador de errores, ruta de salud y
 * registro de las rutas REST por dominio— de su arranque (listen) y del bus de
 * eventos Socket.io, que viven en index.js. Separarlo permite instanciar la app
 * en las pruebas (via fastify.inject()) sin abrir puertos ni sockets.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';

import { verificar_conexion } from './configuracion/configuracion-db.js';
import { ErrorServicio } from './servicios/error-servicio.js';
import { registrar_rutas_autenticacion } from './rutas/rutas-autenticacion.js';
import { registrar_rutas_usuario } from './rutas/rutas-usuario.js';
import { registrar_rutas_juego } from './rutas/rutas-juego.js';
import { registrar_rutas_amigo } from './rutas/rutas-amigo.js';
import { registrar_rutas_torneo } from './rutas/rutas-torneo.js';

/**
 * Crea y configura la instancia de Fastify con sus rutas y el manejador global
 * de errores. No llama a listen(): eso es responsabilidad de index.js.
 *
 * @param {object} [opciones] - Opciones de Fastify (por ejemplo { logger }).
 * @returns {import('fastify').FastifyInstance} La instancia configurada.
 */
export function construir_servidor(opciones = {}) {
  const servidor = Fastify(opciones);

  // CORS: permite que el frontend (otro origen en desarrollo) consuma la API
  // REST desde el navegador. El origen se toma de CORS_ORIGEN (la URL del
  // frontend en produccion); por defecto '*' en desarrollo local.
  servidor.register(cors, {
    origin: process.env.CORS_ORIGEN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Bus de eventos para las rutas REST. Por defecto null (sin socket, p. ej. en
  // pruebas de inject); index.js lo asigna con la instancia real de Socket.io.
  servidor.decorate('io', null);

  // Traduce ErrorServicio a su estado HTTP y codigo estables; cualquier otro
  // error se reporta como 500 sin filtrar detalles sensibles.
  servidor.setErrorHandler((error, _peticion, respuesta) => {
    if (error instanceof ErrorServicio) {
      return respuesta
        .code(error.estado_http)
        .send({ codigo: error.codigo, mensaje: error.message });
    }
    servidor.log.error(error);
    return respuesta
      .code(500)
      .send({ codigo: 'ERROR_INTERNO', mensaje: 'Ocurrio un error inesperado.' });
  });

  // Ruta de salud: confirma que el servidor responde y que la BD esta accesible.
  servidor.get('/salud', async () => {
    const bd = await verificar_conexion();
    return { estado: 'ok', bd };
  });

  // Rutas REST agrupadas por dominio, cada una bajo su prefijo.
  servidor.register(registrar_rutas_autenticacion, { prefix: '/auth' });
  servidor.register(registrar_rutas_usuario, { prefix: '/usuarios' });
  servidor.register(registrar_rutas_juego, { prefix: '/juegos' });
  servidor.register(registrar_rutas_amigo, { prefix: '/amigos' });
  servidor.register(registrar_rutas_torneo, { prefix: '/torneos' });

  return servidor;
}
