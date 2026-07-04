/**
 * Pruebas end-to-end de las rutas REST contra la BD local real.
 * Levantan la app con construir_servidor y usan fastify.inject() (sin abrir
 * puertos). Cubren el flujo registro → login → ruta protegida y el catalogo
 * publico de juegos. El usuario creado se elimina en afterAll.
 */

import '../src/configuracion/cargar-entorno.js';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { construir_servidor } from '../src/construir-servidor.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

let servidor;
const ids_creados = [];

/** Datos de registro validos y unicos por ejecucion. */
function datos_registro_unicos() {
  const sufijo = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  return {
    nombre: `ruta_${sufijo}`.slice(0, 50),
    apellido: 'Ruta',
    correo: `ruta_${sufijo}@test.com`,
    contrasena: 'contrasenaSegura123',
  };
}

beforeAll(async () => {
  servidor = construir_servidor();
  await servidor.ready();
});

afterAll(async () => {
  for (const id of ids_creados) {
    await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
  }
  await servidor.close();
  await cerrar_pool();
});

describe('POST /auth/registro y /auth/login', () => {
  it('registra un usuario y devuelve usuario + token', async () => {
    const datos = datos_registro_unicos();
    const respuesta = await servidor.inject({
      method: 'POST',
      url: '/auth/registro',
      payload: datos,
    });
    expect(respuesta.statusCode).toBe(201);
    const cuerpo = respuesta.json();
    expect(cuerpo.usuario.id_usuario).toBeTruthy();
    expect(cuerpo.usuario).not.toHaveProperty('contrasena_hash');
    expect(typeof cuerpo.token).toBe('string');
    ids_creados.push(cuerpo.usuario.id_usuario);
  });

  it('rechaza el registro con datos invalidos (400)', async () => {
    const respuesta = await servidor.inject({
      method: 'POST',
      url: '/auth/registro',
      payload: { nombre: 'x' },
    });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json().codigo).toBe('DATOS_INVALIDOS');
  });

  it('inicia sesion con credenciales correctas', async () => {
    const datos = datos_registro_unicos();
    const reg = await servidor.inject({
      method: 'POST',
      url: '/auth/registro',
      payload: datos,
    });
    ids_creados.push(reg.json().usuario.id_usuario);

    const respuesta = await servidor.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { correo: datos.correo, contrasena: datos.contrasena },
    });
    expect(respuesta.statusCode).toBe(200);
    expect(typeof respuesta.json().token).toBe('string');
  });

  it('rechaza el login con credenciales invalidas (401)', async () => {
    const respuesta = await servidor.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { correo: 'noexiste@test.com', contrasena: 'malamala123' },
    });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json().codigo).toBe('CREDENCIALES_INVALIDAS');
  });
});

describe('rutas protegidas de usuario', () => {
  it('rechaza /usuarios/perfil sin token (401)', async () => {
    const respuesta = await servidor.inject({
      method: 'GET',
      url: '/usuarios/perfil',
    });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json().codigo).toBe('NO_AUTENTICADO');
  });

  it('devuelve el perfil propio con un token valido', async () => {
    const datos = datos_registro_unicos();
    const reg = await servidor.inject({
      method: 'POST',
      url: '/auth/registro',
      payload: datos,
    });
    const { usuario, token } = reg.json();
    ids_creados.push(usuario.id_usuario);

    const respuesta = await servidor.inject({
      method: 'GET',
      url: '/usuarios/perfil',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json().usuario.id_usuario).toBe(usuario.id_usuario);
  });
});

describe('rutas publicas de juego', () => {
  it('lista el catalogo de juegos', async () => {
    const respuesta = await servidor.inject({ method: 'GET', url: '/juegos' });
    expect(respuesta.statusCode).toBe(200);
    expect(Array.isArray(respuesta.json().juegos)).toBe(true);
  });
});

describe('PUT /usuarios/:id/rol (autorizacion de admin)', () => {
  /** Registra un usuario via REST y devuelve su token e id. */
  async function registrar() {
    const reg = await servidor.inject({
      method: 'POST',
      url: '/auth/registro',
      payload: datos_registro_unicos(),
    });
    const { usuario, token } = reg.json();
    ids_creados.push(usuario.id_usuario);
    return { id_usuario: usuario.id_usuario, token };
  }

  it('un no admin no puede cambiar roles (403)', async () => {
    const solicitante = await registrar();
    const objetivo = await registrar();
    const respuesta = await servidor.inject({
      method: 'PUT',
      url: `/usuarios/${objetivo.id_usuario}/rol`,
      headers: { authorization: `Bearer ${solicitante.token}` },
      payload: { rol: 'admin' },
    });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json().codigo).toBe('NO_AUTORIZADO');
  });

  it('un admin promueve a otro usuario', async () => {
    const admin = await registrar();
    await consultar(`UPDATE usuarios SET rol = 'admin' WHERE id_usuario = $1`, [
      admin.id_usuario,
    ]);
    const objetivo = await registrar();

    const respuesta = await servidor.inject({
      method: 'PUT',
      url: `/usuarios/${objetivo.id_usuario}/rol`,
      headers: { authorization: `Bearer ${admin.token}` },
      payload: { rol: 'admin' },
    });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json().usuario.rol).toBe('admin');
  });
});
