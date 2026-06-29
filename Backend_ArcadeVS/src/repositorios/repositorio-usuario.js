/**
 * Repositorio de usuarios — acceso SQL a la tabla `usuarios`.
 *
 * Unica capa que ejecuta SQL sobre los usuarios. Retorna datos planos (filas)
 * y no contiene logica de negocio: validaciones, hashing de contrasenas y
 * generacion del codigo de amigo viven en la capa de servicios.
 *
 * Regla de seguridad: contrasena_hash NUNCA se expone en las consultas de
 * lectura general. Solo `obtener_credenciales_por_correo` lo retorna, y se usa
 * exclusivamente para autenticar el login.
 */

import { consultar } from '../configuracion/configuracion-db.js';

/**
 * Columnas publicas del usuario (excluye contrasena_hash).
 * Se reutiliza en todas las consultas de lectura y en los RETURNING.
 */
const CAMPOS_PUBLICOS = `
  id_usuario, nombre, apellido, correo, codigo_amigo,
  nacionalidad, fecha_nacimiento, avatar_url, fecha_registro, ultima_conexion
`;

/**
 * Inserta un usuario nuevo. Los datos ya deben venir validados y con la
 * contrasena hasheada desde la capa de servicios.
 *
 * @param {object} datos - Datos del usuario a crear.
 * @param {string} datos.nombre - Nombre (unico).
 * @param {string} datos.apellido - Apellido.
 * @param {string} datos.correo - Correo (unico).
 * @param {string} datos.contrasena_hash - Hash de la contrasena (bcrypt/argon2).
 * @param {string} datos.codigo_amigo - Codigo de amigo de 12 caracteres (unico).
 * @param {string|null} [datos.nacionalidad] - Nacionalidad seleccionada.
 * @param {string|null} [datos.fecha_nacimiento] - Fecha de nacimiento (YYYY-MM-DD).
 * @param {string|null} [datos.avatar_url] - URL del avatar.
 * @returns {Promise<object>} El usuario creado (campos publicos).
 */
export async function guardar_usuario(datos) {
  const {
    nombre,
    apellido,
    correo,
    contrasena_hash,
    codigo_amigo,
    nacionalidad = null,
    fecha_nacimiento = null,
    avatar_url = null,
  } = datos;

  const filas = await consultar(
    `INSERT INTO usuarios
       (nombre, apellido, correo, contrasena_hash, codigo_amigo,
        nacionalidad, fecha_nacimiento, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${CAMPOS_PUBLICOS}`,
    [
      nombre,
      apellido,
      correo,
      contrasena_hash,
      codigo_amigo,
      nacionalidad,
      fecha_nacimiento,
      avatar_url,
    ],
  );

  return filas[0];
}

/**
 * Busca un usuario por su identificador.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<object|null>} El usuario (campos publicos) o null si no existe.
 */
export async function obtener_usuario_por_id(id_usuario) {
  const filas = await consultar(
    `SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id_usuario = $1`,
    [id_usuario],
  );
  return filas[0] ?? null;
}

/**
 * Busca un usuario por su codigo de amigo (flujo de agregar amigos).
 *
 * @param {string} codigo_amigo - Codigo de amigo de 12 caracteres.
 * @returns {Promise<object|null>} El usuario (campos publicos) o null si no existe.
 */
export async function obtener_usuario_por_codigo_amigo(codigo_amigo) {
  const filas = await consultar(
    `SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE codigo_amigo = $1`,
    [codigo_amigo],
  );
  return filas[0] ?? null;
}

/**
 * Obtiene las credenciales necesarias para autenticar un login.
 * Es la UNICA funcion que retorna contrasena_hash; usar solo en el servicio
 * de autenticacion.
 *
 * @param {string} correo - Correo del usuario.
 * @returns {Promise<{id_usuario: string, contrasena_hash: string}|null>}
 *          Credenciales o null si no existe el correo.
 */
export async function obtener_credenciales_por_correo(correo) {
  const filas = await consultar(
    `SELECT id_usuario, contrasena_hash FROM usuarios WHERE correo = $1`,
    [correo],
  );
  return filas[0] ?? null;
}

/**
 * Indica si ya existe un usuario con el correo dado.
 *
 * @param {string} correo - Correo a verificar.
 * @returns {Promise<boolean>} true si el correo ya esta registrado.
 */
export async function existe_correo(correo) {
  const filas = await consultar(
    `SELECT 1 FROM usuarios WHERE correo = $1`,
    [correo],
  );
  return filas.length > 0;
}

/**
 * Indica si ya existe un usuario con el nombre dado.
 *
 * @param {string} nombre - Nombre a verificar.
 * @returns {Promise<boolean>} true si el nombre ya esta en uso.
 */
export async function existe_nombre(nombre) {
  const filas = await consultar(
    `SELECT 1 FROM usuarios WHERE nombre = $1`,
    [nombre],
  );
  return filas.length > 0;
}

/**
 * Actualiza los campos editables del perfil de un usuario.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @param {object} datos - Campos a actualizar.
 * @param {string|null} [datos.nacionalidad] - Nueva nacionalidad.
 * @param {string|null} [datos.fecha_nacimiento] - Nueva fecha de nacimiento.
 * @param {string|null} [datos.avatar_url] - Nueva URL de avatar.
 * @returns {Promise<object|null>} El usuario actualizado o null si no existe.
 */
export async function actualizar_perfil(id_usuario, datos) {
  const { nacionalidad = null, fecha_nacimiento = null, avatar_url = null } = datos;

  const filas = await consultar(
    `UPDATE usuarios
        SET nacionalidad     = $2,
            fecha_nacimiento = $3,
            avatar_url       = $4
      WHERE id_usuario = $1
      RETURNING ${CAMPOS_PUBLICOS}`,
    [id_usuario, nacionalidad, fecha_nacimiento, avatar_url],
  );

  return filas[0] ?? null;
}

/**
 * Marca la ultima conexion del usuario con la hora actual del servidor de BD.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<void>}
 */
export async function actualizar_ultima_conexion(id_usuario) {
  await consultar(
    `UPDATE usuarios SET ultima_conexion = NOW() WHERE id_usuario = $1`,
    [id_usuario],
  );
}
