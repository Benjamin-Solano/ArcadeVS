/**
 * Punto de entrada del backend de ArcadeVS.
 *
 * Arranca el servidor Fastify, verifica la conexion a la base de datos y
 * expone una ruta de salud. Las capas superiores (repositorios, servicios,
 * eventos, rutas) se iran registrando aqui en las siguientes iteraciones.
 */

// El cargador de entorno debe ir primero: configuracion-db construye el pool
// con DB_URL al ser importado.
import './configuracion/cargar-entorno.js';

import Fastify from 'fastify';
import {
  verificar_conexion,
  cerrar_pool,
} from './configuracion/configuracion-db.js';

const PUERTO_SERVIDOR = Number(process.env.SERVIDOR_PUERTO) || 3000;

const servidor = Fastify({
  logger: true,
});

/**
 * Ruta de salud: confirma que el servidor responde y que la base de datos
 * esta accesible. Util para verificar el despliegue y el entorno local.
 */
servidor.get('/salud', async () => {
  const bd = await verificar_conexion();
  return { estado: 'ok', bd };
});

/**
 * Cierra el servidor y el pool de conexiones de forma ordenada ante una
 * senal de apagado del sistema.
 *
 * @param {string} senal - Nombre de la senal recibida (SIGINT, SIGTERM).
 */
async function apagar_servidor(senal) {
  servidor.log.info(`Senal ${senal} recibida, apagando servidor...`);
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
  } catch (error) {
    servidor.log.error(error);
    process.exit(1);
  }
}

iniciar_servidor();
