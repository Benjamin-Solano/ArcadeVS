/**
 * Pruebas de integracion del servicio-usuario contra la BD local real.
 * Cubren registro (con hash bcrypt real), autenticacion y validaciones.
 * Los usuarios creados se eliminan en afterAll.
 */

import '../src/configuracion/cargar-entorno.js';

// Evita enviar correos reales durante las pruebas (modo desarrollo del correo).
process.env.CORREO_HABILITADO = 'false';

import { afterAll, describe, expect, it } from 'vitest';
import {
  registrar_usuario,
  autenticar_usuario,
  obtener_perfil,
  actualizar_perfil,
  actualizar_rol,
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
  const { usuario, codigo } = await registrar_usuario(datos);
  ids_creados.push(usuario.id_usuario);
  return { datos, usuario, codigo };
}

/** Marca un usuario como verificado (para poder iniciar sesión en las pruebas). */
async function verificar_de_prueba(id_usuario) {
  await consultar('UPDATE usuarios SET verificado = TRUE WHERE id_usuario = $1', [id_usuario]);
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
    await verificar_de_prueba(usuario.id_usuario);

    const autenticado = await autenticar_usuario(datos.correo, datos.contrasena);
    expect(autenticado.id_usuario).toBe(usuario.id_usuario);
    expect(autenticado).not.toHaveProperty('contrasena_hash');
  });

  it('autenticar_usuario rechaza una cuenta no verificada (403)', async () => {
    const { datos } = await registrar_de_prueba();

    await expect(
      autenticar_usuario(datos.correo, datos.contrasena),
    ).rejects.toMatchObject({ codigo: 'CUENTA_NO_VERIFICADA', estado_http: 403 });
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

  it('registrar_usuario asigna el rol jugador por defecto', async () => {
    const { usuario } = await registrar_de_prueba();
    expect(usuario.rol).toBe('jugador');
  });

  it('actualizar_rol rechaza a un solicitante no admin (403)', async () => {
    const { usuario: solicitante } = await registrar_de_prueba();
    const { usuario: objetivo } = await registrar_de_prueba();

    await expect(
      actualizar_rol(solicitante.id_usuario, objetivo.id_usuario, 'admin'),
    ).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO', estado_http: 403 });
  });

  it('un admin promueve a otro usuario a admin', async () => {
    const { usuario: admin } = await registrar_de_prueba();
    await consultar(`UPDATE usuarios SET rol = 'admin' WHERE id_usuario = $1`, [
      admin.id_usuario,
    ]);
    const { usuario: objetivo } = await registrar_de_prueba();

    const promovido = await actualizar_rol(admin.id_usuario, objetivo.id_usuario, 'admin');
    expect(promovido.rol).toBe('admin');
  });

  it('actualizar_rol rechaza un rol invalido', async () => {
    const { usuario: admin } = await registrar_de_prueba();
    await consultar(`UPDATE usuarios SET rol = 'admin' WHERE id_usuario = $1`, [
      admin.id_usuario,
    ]);
    const { usuario: objetivo } = await registrar_de_prueba();

    await expect(
      actualizar_rol(admin.id_usuario, objetivo.id_usuario, 'superadmin'),
    ).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS' });
  });
});
