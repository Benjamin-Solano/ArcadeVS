/**
 * Repositorio de códigos de verificación — acceso SQL a `codigos_verificacion`.
 *
 * Única capa que ejecuta SQL sobre los códigos. Retorna filas planas y no
 * contiene lógica de negocio: la generación, el hasheo y la validación del
 * código viven en la capa de servicios.
 */

import {
  consultar,
  consultar_con,
  ejecutar_en_transaccion,
} from '../configuracion/configuracion-db.js';

/**
 * Guarda un código nuevo invalidando los anteriores del usuario en la misma
 * transacción, para que siempre haya como máximo un código vigente.
 *
 * @param {string} id_usuario - UUID del usuario dueño del código.
 * @param {string} codigo_hash - Hash bcrypt del código de 6 dígitos.
 * @param {Date|string} expira_en - Instante de expiración.
 * @returns {Promise<object>} El código creado (fila).
 */
export async function guardar_codigo(id_usuario, codigo_hash, expira_en) {
  return ejecutar_en_transaccion(async (cliente) => {
    await consultar_con(
      cliente,
      `UPDATE codigos_verificacion
          SET usado = TRUE
        WHERE id_usuario = $1 AND usado = FALSE`,
      [id_usuario],
    );
    const filas = await consultar_con(
      cliente,
      `INSERT INTO codigos_verificacion (id_usuario, codigo_hash, expira_en)
       VALUES ($1, $2, $3)
       RETURNING id_codigo, id_usuario, expira_en, usado, intentos, fecha_creacion`,
      [id_usuario, codigo_hash, expira_en],
    );
    return filas[0];
  });
}

/**
 * Obtiene el código vigente (no usado y no expirado) más reciente de un usuario.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<object|null>} La fila del código (incluye codigo_hash) o null.
 */
export async function obtener_codigo_vigente(id_usuario) {
  const filas = await consultar(
    `SELECT id_codigo, id_usuario, codigo_hash, expira_en, usado, intentos
       FROM codigos_verificacion
      WHERE id_usuario = $1 AND usado = FALSE AND expira_en > NOW()
      ORDER BY fecha_creacion DESC
      LIMIT 1`,
    [id_usuario],
  );
  return filas[0] ?? null;
}

/**
 * Marca un código como usado (tras verificarse o invalidarse).
 *
 * @param {string} id_codigo - UUID del código.
 * @returns {Promise<void>}
 */
export async function marcar_codigo_usado(id_codigo) {
  await consultar(
    `UPDATE codigos_verificacion SET usado = TRUE WHERE id_codigo = $1`,
    [id_codigo],
  );
}

/**
 * Incrementa el contador de intentos fallidos de un código.
 *
 * @param {string} id_codigo - UUID del código.
 * @returns {Promise<number>} El número de intentos tras el incremento.
 */
export async function incrementar_intentos(id_codigo) {
  const filas = await consultar(
    `UPDATE codigos_verificacion
        SET intentos = intentos + 1
      WHERE id_codigo = $1
      RETURNING intentos`,
    [id_codigo],
  );
  return filas[0]?.intentos ?? 0;
}
