/**
 * Prueba end-to-end del puente REST → bus para `usuario:perfil_actualizado`.
 *
 * Monta la app Fastify con Socket.io sobre el mismo servidor HTTP, registra un
 * usuario, conecta su socket (que se une a su sala personal) y verifica que un
 * PUT /usuarios/perfil difunde `usuario:perfil_actualizado` a ese socket.
 */

import '../src/configuracion/cargar-entorno.js';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as crear_cliente } from 'socket.io-client';
import { construir_servidor } from '../src/construir-servidor.js';
import { crear_socket } from '../src/configuracion/configuracion-socket.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

let servidor;
let io;
let url_base;
const ids_creados = [];

function datos_registro_unicos() {
  const sufijo = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  return {
    nombre: `perf_${sufijo}`.slice(0, 50),
    apellido: 'Perfil',
    correo: `perf_${sufijo}@test.com`,
    contrasena: 'contrasenaSegura123',
  };
}

function conectar_cliente(token) {
  const cliente = crear_cliente(url_base, {
    transports: ['websocket'],
    forceNew: true,
    auth: { token },
  });
  return new Promise((resolver, rechazar) => {
    cliente.on('connect', () => resolver(cliente));
    cliente.on('connect_error', rechazar);
  });
}

beforeAll(async () => {
  servidor = construir_servidor();
  io = crear_socket(servidor.server);
  servidor.io = io;
  await servidor.listen({ port: 0 });
  url_base = `http://localhost:${servidor.server.address().port}`;
});

afterAll(async () => {
  io.close();
  await servidor.close();
  for (const id of ids_creados) {
    await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
  }
  await cerrar_pool();
});

describe('usuario:perfil_actualizado (REST → bus)', () => {
  it('PUT /usuarios/perfil difunde la confirmacion a la sala del usuario', async () => {
    const reg = await servidor.inject({
      method: 'POST',
      url: '/auth/registro',
      payload: datos_registro_unicos(),
    });
    const { usuario, token } = reg.json();
    ids_creados.push(usuario.id_usuario);

    const cliente = await conectar_cliente(token);
    try {
      const actualizado = new Promise((resolver) =>
        cliente.once('usuario:perfil_actualizado', resolver),
      );

      const respuesta = await servidor.inject({
        method: 'PUT',
        url: '/usuarios/perfil',
        headers: { authorization: `Bearer ${token}` },
        payload: { nacionalidad: 'Chile' },
      });
      expect(respuesta.statusCode).toBe(200);

      const evento = await actualizado;
      expect(evento.id_usuario).toBe(usuario.id_usuario);
      expect(evento.datos_perfil.nacionalidad).toBe('Chile');
    } finally {
      cliente.disconnect();
    }
  });
});
