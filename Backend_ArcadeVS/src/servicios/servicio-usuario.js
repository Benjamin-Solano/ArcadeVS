/**
 * Servicio de usuario — logica de negocio de registro, autenticacion y perfil.
 *
 * No escribe SQL (delega en repositorio-usuario) ni emite eventos Socket.io.
 * Se encarga de: validar datos, hashear contrasenas con bcrypt, generar el
 * codigo de amigo y traducir reglas de negocio a ErrorServicio.
 */

import bcrypt from 'bcryptjs';

import {
  guardar_usuario,
  obtener_usuario_por_id,
  obtener_usuario_por_codigo_amigo,
  obtener_credenciales_por_correo,
  existe_correo,
  existe_nombre,
  actualizar_perfil as actualizar_perfil_bd,
  actualizar_rol as actualizar_rol_bd,
  actualizar_ultima_conexion,
} from '../repositorios/repositorio-usuario.js';
import { ErrorServicio } from './error-servicio.js';
import { exigir_admin } from './autorizacion.js';
import { validar_datos_registro, validar_correo } from './validaciones-usuario.js';

/** Factor de coste de bcrypt para el hash de contrasenas. */
const RONDAS_BCRYPT = 10;

/** Roles validos de un usuario. */
const ROLES_VALIDOS = ['jugador', 'admin'];

/** Caracteres permitidos en el codigo de amigo (sin ambiguos como O/0, I/1). */
const ALFABETO_CODIGO_AMIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Longitud del codigo de amigo (coincide con CHAR(12) en la BD). */
const LONGITUD_CODIGO_AMIGO = 12;

/** Maximo de intentos para generar un codigo de amigo unico. */
const MAX_INTENTOS_CODIGO = 10;

/**
 * Genera un codigo de amigo aleatorio de 12 caracteres, garantizando que no
 * exista ya en la base de datos.
 *
 * @returns {Promise<string>} Un codigo de amigo unico.
 */
async function generar_codigo_amigo() {
  for (let intento = 0; intento < MAX_INTENTOS_CODIGO; intento += 1) {
    let codigo = '';
    for (let i = 0; i < LONGITUD_CODIGO_AMIGO; i += 1) {
      const indice = Math.floor(Math.random() * ALFABETO_CODIGO_AMIGO.length);
      codigo += ALFABETO_CODIGO_AMIGO[indice];
    }
    const existente = await obtener_usuario_por_codigo_amigo(codigo);
    if (!existente) {
      return codigo;
    }
  }
  throw new ErrorServicio(
    'CODIGO_AMIGO_NO_GENERADO',
    'No se pudo generar un codigo de amigo unico. Intenta de nuevo.',
    500,
  );
}

/**
 * Registra un usuario nuevo: valida los datos, verifica unicidad de correo y
 * nombre, hashea la contrasena y persiste el usuario.
 *
 * @param {object} datos_crudos - Datos recibidos del cliente.
 * @returns {Promise<object>} El usuario creado (campos publicos, sin hash).
 */
export async function registrar_usuario(datos_crudos) {
  const datos = validar_datos_registro(datos_crudos);

  if (await existe_correo(datos.correo)) {
    throw new ErrorServicio('CORREO_EN_USO', 'El correo ya esta registrado.', 409);
  }
  if (await existe_nombre(datos.nombre)) {
    throw new ErrorServicio('NOMBRE_EN_USO', 'El nombre ya esta en uso.', 409);
  }

  const contrasena_hash = await bcrypt.hash(datos.contrasena, RONDAS_BCRYPT);
  const codigo_amigo = await generar_codigo_amigo();

  return guardar_usuario({
    nombre: datos.nombre,
    apellido: datos.apellido,
    correo: datos.correo,
    contrasena_hash,
    codigo_amigo,
    nacionalidad: datos.nacionalidad,
    fecha_nacimiento: datos.fecha_nacimiento,
  });
}

/**
 * Autentica a un usuario por correo y contrasena. Actualiza la ultima conexion
 * si las credenciales son correctas.
 *
 * @param {string} correo - Correo del usuario.
 * @param {string} contrasena - Contrasena en texto plano.
 * @returns {Promise<object>} El usuario autenticado (campos publicos).
 */
export async function autenticar_usuario(correo, contrasena) {
  const correo_normalizado = validar_correo(correo);

  const credenciales = await obtener_credenciales_por_correo(correo_normalizado);
  const coincide =
    credenciales && (await bcrypt.compare(contrasena ?? '', credenciales.contrasena_hash));

  if (!coincide) {
    throw new ErrorServicio(
      'CREDENCIALES_INVALIDAS',
      'Correo o contrasena incorrectos.',
      401,
    );
  }

  await actualizar_ultima_conexion(credenciales.id_usuario);
  return obtener_usuario_por_id(credenciales.id_usuario);
}

/**
 * Obtiene el perfil publico de un usuario.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<object>} El usuario (campos publicos).
 */
export async function obtener_perfil(id_usuario) {
  const usuario = await obtener_usuario_por_id(id_usuario);
  if (!usuario) {
    throw new ErrorServicio('USUARIO_NO_ENCONTRADO', 'El usuario no existe.', 404);
  }
  return usuario;
}

/**
 * Actualiza los campos editables del perfil de un usuario.
 *
 * @param {string} id_usuario - UUID del usuario.
 * @param {object} datos - Campos a actualizar (nacionalidad, fecha_nacimiento, avatar_url).
 * @returns {Promise<object>} El usuario actualizado (campos publicos).
 */
export async function actualizar_perfil(id_usuario, datos = {}) {
  const actualizado = await actualizar_perfil_bd(id_usuario, {
    nacionalidad: datos.nacionalidad?.trim() || null,
    fecha_nacimiento: datos.fecha_nacimiento || null,
    avatar_url: datos.avatar_url?.trim() || null,
  });
  if (!actualizado) {
    throw new ErrorServicio('USUARIO_NO_ENCONTRADO', 'El usuario no existe.', 404);
  }
  return actualizado;
}

/**
 * Cambia el rol de un usuario. Solo un administrador puede hacerlo (por eso el
 * primer admin debe sembrarse manualmente en la BD).
 *
 * @param {string} id_solicitante - UUID de quien realiza el cambio (debe ser admin).
 * @param {string} id_objetivo - UUID del usuario cuyo rol se cambia.
 * @param {string} rol - Nuevo rol ('jugador' | 'admin').
 * @returns {Promise<object>} El usuario actualizado (campos publicos).
 */
export async function actualizar_rol(id_solicitante, id_objetivo, rol) {
  await exigir_admin(id_solicitante);
  if (!ROLES_VALIDOS.includes(rol)) {
    throw new ErrorServicio(
      'DATOS_INVALIDOS',
      `El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.`,
    );
  }
  const actualizado = await actualizar_rol_bd(id_objetivo, rol);
  if (!actualizado) {
    throw new ErrorServicio('USUARIO_NO_ENCONTRADO', 'El usuario no existe.', 404);
  }
  return actualizado;
}
