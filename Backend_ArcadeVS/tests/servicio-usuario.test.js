/**
 * Pruebas de integracion del servicio-usuario contra la BD local real.
 * Cubren registro (con hash bcrypt real), autenticacion y validaciones.
 * Los usuarios creados se eliminan en afterAll.
 */

import '../src/configuracion/cargar-entorno.js';

import { afterAll, describe, expect, it } from 'vitest';
import {
  registrar_usuario,
  autenticar_usuario,
  obtener_perfil,
  actualizar_perfil,
} from '../src/servicios/servicio-usuario.js';
import { ErrorServicio } from '../src/servicios/error-servicio.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

const ids_creados = [];

/** Datos de registro validos y unicos. */
function datos_registro_unicos() {
  const sufijo = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  return {
    nombre: `svc_${sufijo}`.slice(0, 50),
    apellido: 'Servicio',
    correo: `svc_${sufijo}@test.com`,
    contrasena: 'contrasenaSegura123',
  };
}

/** Registra un usuario y guarda su id para limpieza. */
async function registrar_de_prueba(extra = {}) {
  const datos = { ...datos_registro_unicos(), ...extra };
  const usuario = await registrar_usuario(datos);
  ids_creados.push(usuario.id_usuario);
  return { datos, usuario };
}

afterAll(async () => {
  for (const id of ids_creados) {
    await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
  }
  await cerrar_pool();
});

describe('servicio-usuario', () => {
  it('registrar_usuario crea el usuario con codigo de amigo y sin exponer hash', async () => {
    const { datos, usuario } = await registrar_de_prueba();

    expect(usuario.id_usuario).toBeTruthy();
    expect(usuario.correo).toBe(datos.correo.toLowerCase());
    expect(usuario.codigo_amigo).toHaveLength(12);
    expect(usuario).not.toHaveProperty('contrasena_hash');
  });

  it('la contrasena se guarda hasheada, no en texto plano', async () => {
    const { datos, usuario } = await registrar_de_prueba();

    const filas = await consultar(
      'SELECT contrasena_hash FROM usuarios WHERE id_usuario = $1',
      [usuario.id_usuario],
    );
    expect(filas[0].contrasena_hash).not.toBe(datos.contrasena);
    expect(filas[0].contrasena_hash.length).toBeGreaterThan(20);
  });

  it('registrar_usuario rechaza correo duplicado', async () => {
    const { datos } = await registrar_de_prueba();

    await expect(
      registrar_usuario({ ...datos_registro_unicos(), correo: datos.correo }),
    ).rejects.toMatchObject({ codigo: 'CORREO_EN_USO' });
  });

  it('registrar_usuario rechaza contrasena corta', async () => {
    await expect(
      registrar_usuario({ ...datos_registro_unicos(), contrasena: 'corta' }),
    ).rejects.toBeInstanceOf(ErrorServicio);
  });

  it('registrar_usuario rechaza correo con formato invalido', async () => {
    await expect(
      registrar_usuario({ ...datos_registro_unicos(), correo: 'no-es-correo' }),
    ).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS' });
  });

  it('autenticar_usuario acepta credenciales correctas', async () => {
    const { datos, usuario } = await registrar_de_prueba();

    const autenticado = await autenticar_usuario(datos.correo, datos.contrasena);
    expect(autenticado.id_usuario).toBe(usuario.id_usuario);
    expect(autenticado).not.toHaveProperty('contrasena_hash');
  });

  it('autenticar_usuario rechaza contrasena incorrecta', async () => {
    const { datos } = await registrar_de_prueba();

    await expect(
      autenticar_usuario(datos.correo, 'contrasenaEquivocada9'),
    ).rejects.toMatchObject({ codigo: 'CREDENCIALES_INVALIDAS' });
  });

  it('obtener_perfil lanza error si el usuario no existe', async () => {
    await expect(
      obtener_perfil('00000000-0000-0000-0000-000000000000'),
    ).rejects.toMatchObject({ codigo: 'USUARIO_NO_ENCONTRADO' });
  });

  it('actualizar_perfil modifica los campos editables', async () => {
    const { usuario } = await registrar_de_prueba();

    const actualizado = await actualizar_perfil(usuario.id_usuario, {
      nacionalidad: 'Argentina',
    });
    expect(actualizado.nacionalidad).toBe('Argentina');
  });
});
