/**
 * Pruebas de integracion del repositorio-usuario contra la BD local real.
 *
 * Cada prueba crea usuarios con identificadores unicos y registra sus IDs;
 * afterAll los elimina para no dejar datos de prueba en la base.
 */

// El cargador de entorno debe ir primero: configuracion-db lee DB_URL al evaluarse.
import '../src/configuracion/cargar-entorno.js';

import { afterAll, describe, expect, it } from 'vitest';
import {
  guardar_usuario,
  obtener_usuario_por_id,
  obtener_usuario_por_codigo_amigo,
  obtener_credenciales_por_correo,
  existe_correo,
  existe_nombre,
  actualizar_perfil,
  actualizar_ultima_conexion,
} from '../src/repositorios/repositorio-usuario.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

/** IDs de los usuarios creados durante las pruebas, para limpiarlos al final. */
const ids_creados = [];

/** Genera un codigo de amigo unico de exactamente 12 caracteres. */
function codigo_amigo_unico() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2))
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 12)
    .padEnd(12, '0')
    .toUpperCase();
}

/** Construye datos de usuario unicos para una prueba. */
function datos_usuario_unicos() {
  const sufijo = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  return {
    nombre: `tester_${sufijo}`.slice(0, 50),
    apellido: 'Prueba',
    correo: `tester_${sufijo}@test.com`,
    contrasena_hash: 'hash_de_prueba_no_real',
    codigo_amigo: codigo_amigo_unico(),
  };
}

/** Crea un usuario y registra su id para limpieza posterior. */
async function crear_usuario_de_prueba(extra = {}) {
  const datos = { ...datos_usuario_unicos(), ...extra };
  const creado = await guardar_usuario(datos);
  ids_creados.push(creado.id_usuario);
  return { datos, creado };
}

afterAll(async () => {
  for (const id of ids_creados) {
    await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
  }
  await cerrar_pool();
});

describe('repositorio-usuario', () => {
  it('guardar_usuario crea el usuario y NO expone contrasena_hash', async () => {
    const { datos, creado } = await crear_usuario_de_prueba();

    expect(creado.id_usuario).toBeTruthy();
    expect(creado.nombre).toBe(datos.nombre);
    expect(creado.apellido).toBe(datos.apellido);
    expect(creado.correo).toBe(datos.correo);
    expect(creado).not.toHaveProperty('contrasena_hash');
    expect(creado.fecha_registro).toBeTruthy();
  });

  it('obtener_usuario_por_id devuelve el usuario creado', async () => {
    const { creado } = await crear_usuario_de_prueba();

    const encontrado = await obtener_usuario_por_id(creado.id_usuario);
    expect(encontrado).not.toBeNull();
    expect(encontrado.id_usuario).toBe(creado.id_usuario);
    expect(encontrado).not.toHaveProperty('contrasena_hash');
  });

  it('existe_correo y existe_nombre detectan el registro', async () => {
    const { datos } = await crear_usuario_de_prueba();

    expect(await existe_correo(datos.correo)).toBe(true);
    expect(await existe_nombre(datos.nombre)).toBe(true);
  });

  it('obtener_credenciales_por_correo retorna el hash para login', async () => {
    const { datos, creado } = await crear_usuario_de_prueba();

    const credenciales = await obtener_credenciales_por_correo(datos.correo);
    expect(credenciales).not.toBeNull();
    expect(credenciales.id_usuario).toBe(creado.id_usuario);
    expect(credenciales.contrasena_hash).toBe(datos.contrasena_hash);
  });

  it('obtener_usuario_por_codigo_amigo encuentra al usuario', async () => {
    const { datos, creado } = await crear_usuario_de_prueba();

    const encontrado = await obtener_usuario_por_codigo_amigo(datos.codigo_amigo);
    expect(encontrado).not.toBeNull();
    expect(encontrado.id_usuario).toBe(creado.id_usuario);
  });

  it('actualizar_perfil modifica los campos editables', async () => {
    const { creado } = await crear_usuario_de_prueba();

    const actualizado = await actualizar_perfil(creado.id_usuario, {
      nacionalidad: 'Chile',
      avatar_url: 'https://ejemplo.com/avatar.png',
    });
    expect(actualizado.nacionalidad).toBe('Chile');
    expect(actualizado.avatar_url).toBe('https://ejemplo.com/avatar.png');
  });

  it('actualizar_ultima_conexion asigna una fecha', async () => {
    const { creado } = await crear_usuario_de_prueba();
    expect(creado.ultima_conexion).toBeNull();

    await actualizar_ultima_conexion(creado.id_usuario);

    const encontrado = await obtener_usuario_por_id(creado.id_usuario);
    expect(encontrado.ultima_conexion).not.toBeNull();
  });

  it('obtener_usuario_por_id devuelve null si no existe', async () => {
    const inexistente = await obtener_usuario_por_id(
      '00000000-0000-0000-0000-000000000000',
    );
    expect(inexistente).toBeNull();
  });
});
