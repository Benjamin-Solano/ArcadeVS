/**
 * Pruebas end-to-end de las rutas REST contra la BD local real.
 * Levantan la app con construir_servidor y usan fastify.inject() (sin abrir
 * puertos). Cubren el flujo registro → login → ruta protegida y el catalogo
 * publico de juegos. El usuario creado se elimina en afterAll.
 */

import '../src/configuracion/cargar-entorno.js';

// Evita enviar correos reales durante las pruebas (modo desarrollo del correo).
process.env.CORREO_HABILITADO = 'false';

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

/**
 * Registra un usuario, verifica su correo con el código expuesto en desarrollo
 * e inicia sesión, devolviendo su id y un token válido. Usado por las pruebas de
 * rutas protegidas, que ahora requieren una cuenta verificada para autenticarse.
 */
async function registrar_verificado_y_login() {
  const datos = datos_registro_unicos();
  const reg = await servidor.inject({ method: 'POST', url: '/auth/registro', payload: datos });
  const { usuario, codigo_dev } = reg.json();
  ids_creados.push(usuario.id_usuario);

  await servidor.inject({
    method: 'POST',
    url: '/auth/verificar',
    payload: { correo: datos.correo, codigo: codigo_dev },
  });
  const login = await servidor.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { correo: datos.correo, contrasena: datos.contrasena },
  });
  return { id_usuario: usuario.id_usuario, token: login.json().token };
}

afterAll(async () => {
  for (const id of ids_creados) {
    await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
  }
  await servidor.close();
  await cerrar_pool();
});

describe('POST /auth/registro, /auth/verificar y /auth/login', () => {
  it('registra un usuario sin token y como pendiente de verificacion', async () => {
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
    expect(cuerpo.usuario.verificado).toBe(false);
    expect(cuerpo).not.toHaveProperty('token');
    expect(cuerpo.pendiente_verificacion).toBe(true);
    // En entorno de desarrollo la ruta expone el codigo para poder probar.
    expect(typeof cuerpo.codigo_dev).toBe('string');
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

  it('verifica el codigo y luego inicia sesion con credenciales correctas', async () => {
    const datos = datos_registro_unicos();
    const reg = await servidor.inject({
      method: 'POST',
      url: '/auth/registro',
      payload: datos,
    });
    const { usuario, codigo_dev } = reg.json();
    ids_creados.push(usuario.id_usuario);

    const verif = await servidor.inject({
      method: 'POST',
      url: '/auth/verificar',
      payload: { correo: datos.correo, codigo: codigo_dev },
    });
    expect(verif.statusCode).toBe(200);
    expect(verif.json().usuario.verificado).toBe(true);

    const respuesta = await servidor.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { correo: datos.correo, contrasena: datos.contrasena },
    });
    expect(respuesta.statusCode).toBe(200);
    expect(typeof respuesta.json().token).toBe('string');
  });

  it('rechaza el login de una cuenta no verificada (403)', async () => {
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
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json().codigo).toBe('CUENTA_NO_VERIFICADA');
  });

  it('rechaza un codigo de verificacion incorrecto (400)', async () => {
    const datos = datos_registro_unicos();
    const reg = await servidor.inject({
      method: 'POST',
      url: '/auth/registro',
      payload: datos,
    });
    ids_creados.push(reg.json().usuario.id_usuario);

    const respuesta = await servidor.inject({
      method: 'POST',
      url: '/auth/verificar',
      payload: { correo: datos.correo, codigo: '000000' },
    });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json().codigo).toBe('CODIGO_INVALIDO');
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
    const { id_usuario, token } = await registrar_verificado_y_login();

    const respuesta = await servidor.inject({
      method: 'GET',
      url: '/usuarios/perfil',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json().usuario.id_usuario).toBe(id_usuario);
  });
});

describe('GET /usuarios/buscar/:codigo_amigo', () => {
  it('rechaza sin token (401)', async () => {
    const respuesta = await servidor.inject({
      method: 'GET',
      url: '/usuarios/buscar/AAAAAAAAAAAA',
    });
    expect(respuesta.statusCode).toBe(401);
  });

  it('encuentra a otro usuario por su codigo de amigo y omite datos privados', async () => {
    const { token } = await registrar_verificado_y_login();
    const objetivo = await registrar_verificado_y_login();
    const codigo_amigo = (
      await servidor.inject({
        method: 'GET',
        url: '/usuarios/perfil',
        headers: { authorization: `Bearer ${objetivo.token}` },
      })
    ).json().usuario.codigo_amigo;

    const respuesta = await servidor.inject({
      method: 'GET',
      url: `/usuarios/buscar/${codigo_amigo}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json().usuario.id_usuario).toBe(objetivo.id_usuario);
    expect(respuesta.json().usuario).not.toHaveProperty('correo');
  });

  it('devuelve 404 si el codigo de amigo no existe', async () => {
    const { token } = await registrar_verificado_y_login();

    const respuesta = await servidor.inject({
      method: 'GET',
      url: '/usuarios/buscar/AAAAAAAAAAAA',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json().codigo).toBe('USUARIO_NO_ENCONTRADO');
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
  /** Registra un usuario verificado y con sesion (token) via REST. */
  const registrar = registrar_verificado_y_login;

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
