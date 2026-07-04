/**
 * Punto de entrada del backend de ArcadeVS.
 *
 * Construye la app Fastify (construir-servidor), monta el bus de eventos
 * Socket.io sobre su servidor HTTP, verifica la conexion a la base de datos y
 * arranca el listener. El ensamblado de rutas y el manejador de errores viven
 * en construir-servidor.js para poder probarlos sin abrir puertos.
 */

// El cargador de entorno debe ir primero: configuracion-db construye el pool
// con DB_URL al ser importado.
import './configuracion/cargar-entorno.js';

import {
  verificar_conexion,
  cerrar_pool,
} from './configuracion/configuracion-db.js';
import { crear_socket } from './configuracion/configuracion-socket.js';
import { construir_servidor } from './construir-servidor.js';

const PUERTO_SERVIDOR = Number(process.env.SERVIDOR_PUERTO) || 3000;

const servidor = construir_servidor({ logger: true });

// Bus de eventos: Socket.io montado sobre el servidor HTTP de Fastify.
const io = crear_socket(servidor.server);

// Expone el bus a las rutas REST para que puedan emitir eventos (p. ej. la
// confirmacion usuario:perfil_actualizado tras PUT /usuarios/perfil).
servidor.io = io;

/**
 * Cierra el servidor y el pool de conexiones de forma ordenada ante una
 * senal de apagado del sistema.
 *
 * @param {string} senal - Nombre de la senal recibida (SIGINT, SIGTERM).
 */
async function apagar_servidor(senal) {
  servidor.log.info(`Senal ${senal} recibida, apagando servidor...`);
  io.close();
  await servidor.close();
  await cerrar_pool();
  process.exit(0);
}

process.on('SIGINT', () => apagar_servidor('SIGINT'));
process.on('SIGTERM', () => apagar_servidor('SIGTERM'));

/**
 * Arranca el servidor: verifica la base de datos y se pone a escuchar.
 */
async function iniciar_servidor() {
  try {
    const bd_conectada = await verificar_conexion();
    if (bd_conectada) {
      servidor.log.info('Conexion a la base de datos verificada correctamente.');
    } else {
      servidor.log.warn('La base de datos NO respondio. Revisa DB_URL en .env.local.');
    }

    await servidor.listen({ port: PUERTO_SERVIDOR });
    servidor.log.info(`Servidor ArcadeVS escuchando en el puerto ${PUERTO_SERVIDOR}.`);
    servidor.log.info('Bus de eventos Socket.io activo.');
  } catch (error) {
    servidor.log.error(error);
    process.exit(1);
  }
}

iniciar_servidor();
