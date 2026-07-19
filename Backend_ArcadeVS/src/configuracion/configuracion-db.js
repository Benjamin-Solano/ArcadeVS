/**
 * Configuracion de acceso a PostgreSQL.
 *
 * Unica responsabilidad del modulo: exponer la conexion a la base de datos.
 * Es la pieza mas baja de la pila (capa por capa); los repositorios la usan
 * para ejecutar SQL. Ningun otro modulo debe crear conexiones por su cuenta.
 *
 * La cadena de conexion se toma de DB_URL y sirve igual en local (pgAdmin)
 * como en produccion (Supabase).
 */

import pg from 'pg';

const { Pool } = pg;

/**
 * Pool de conexiones unico y compartido por toda la aplicacion.
 * Reutiliza conexiones en lugar de abrir una nueva por cada consulta.
 */
export const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: process.env.DB_URL?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false,
});

/**
 * Ejecuta una consulta suelta (no transaccional) y retorna solo las filas.
 *
 * @param {string} texto - Sentencia SQL con placeholders ($1, $2, ...).
 * @param {Array<any>} [parametros] - Valores para los placeholders.
 * @returns {Promise<Array<object>>} Filas resultantes de la consulta.
 */
export async function consultar(texto, parametros = []) {
  const resultado = await pool.query(texto, parametros);
  return resultado.rows;
}

/**
 * Ejecuta una consulta usando un cliente de transaccion cuando se proporciona,
 * o el pool compartido cuando no.
 *
 * Permite que un mismo repositorio sirva tanto para consultas sueltas como para
 * pasos dentro de una transaccion (BEGIN/COMMIT). Es la pieza que hace posible
 * actualizar `partidas_jugadores` y `rankings_juego` en la misma transaccion sin
 * duplicar el codigo de acceso a datos.
 *
 * @param {import('pg').PoolClient|null|undefined} cliente
 *        Cliente dedicado de una transaccion, o null/undefined para usar el pool.
 * @param {string} texto - Sentencia SQL con placeholders ($1, $2, ...).
 * @param {Array<any>} [parametros] - Valores para los placeholders.
 * @returns {Promise<Array<object>>} Filas resultantes de la consulta.
 */
export async function consultar_con(cliente, texto, parametros = []) {
  const ejecutor = cliente ?? pool;
  const resultado = await ejecutor.query(texto, parametros);
  return resultado.rows;
}

/**
 * Ejecuta una operacion dentro de una transaccion (BEGIN / COMMIT / ROLLBACK).
 *
 * Helper central para garantizar atomicidad. Las reglas de integridad del
 * proyecto se apoyan en este metodo, por ejemplo: actualizar a la vez
 * partidas_jugadores y rankings_juego, o normalizar el orden canonico antes
 * de insertar en solicitudes_amistad.
 *
 * La operacion recibe un cliente dedicado y debe usarlo para todas sus
 * consultas; si lanza un error se hace ROLLBACK automatico.
 *
 * @param {(cliente: import('pg').PoolClient) => Promise<any>} operacion
 *        Funcion que recibe el cliente y ejecuta las consultas de la transaccion.
 * @returns {Promise<any>} Lo que retorne la operacion tras el COMMIT.
 */
export async function ejecutar_en_transaccion(operacion) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await operacion(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

/**
 * Comprueba que la base de datos responde ejecutando un SELECT trivial.
 * Usado en el arranque del servidor y en la ruta de salud.
 *
 * @returns {Promise<boolean>} true si la base de datos respondio correctamente.
 */
export async function verificar_conexion() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Cierra el pool de conexiones de forma ordenada.
 * Se invoca durante el apagado del servidor (SIGINT / SIGTERM).
 *
 * @returns {Promise<void>}
 */
export async function cerrar_pool() {
  await pool.end();
}
