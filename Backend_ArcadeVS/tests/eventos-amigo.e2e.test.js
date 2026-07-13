/**
 * Prueba end-to-end de los eventos del dominio `amigo` contra la BD local real.
 *
 * Levanta Socket.io real y conecta dos clientes autenticados (JWT en el
 * handshake). Verifica el flujo: A envia solicitud → B recibe
 * `amigo:solicitud_recibida`; B acepta → ambos reciben `amigo:vinculo_confirmado`.
 * Tambien verifica que un socket anonimo recibe `amigo:error` NO_AUTENTICADO.
 */

import '../src/configuracion/cargar-entorno.js';

import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as crear_cliente } from 'socket.io-client';
import { crear_socket } from '../src/configuracion/configuracion-socket.js';
import { firmar_token } from '../src/configuracion/configuracion-autenticacion.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

let servidor_http;
let servidor_socket;
let url_base;

let id_a;
let id_b;
let token_a;
let token_b;

function codigo_amigo_unico() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2))
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 12)
    .padEnd(12, '0')
    .toUpperCase();
}

async function crear_usuario() {
  const s = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const filas = await consultar(
    `INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, codigo_amigo)
     VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario`,
    [`ev_${s}`.slice(0, 50), 'Prueba', `ev_${s}@test.com`, 'hash', codigo_amigo_unico()],
  );
  return filas[0].id_usuario;
}

/** Conecta un cliente Socket.io con token opcional y resuelve al conectar. */
function conectar_cliente(token) {
  const cliente = crear_cliente(url_base, {
    transports: ['websocket'],
    forceNew: true,
    auth: token ? { token } : {},
  });
  return new Promise((resolver, rechazar) => {
    cliente.on('connect', () => resolver(cliente));
    cliente.on('connect_error', rechazar);
  });
}

/** Resuelve con el primer payload del evento dado. */
function esperar_evento(cliente, evento) {
  return new Promise((resolver) => cliente.once(evento, resolver));
}

/** Emite un evento con ack y resuelve con la respuesta del servidor. */
function emitir_con_ack(cliente, evento, datos) {
  return new Promise((resolver) => cliente.emit(evento, datos, resolver));
}

beforeAll(async () => {
  id_a = await crear_usuario();
  id_b = await crear_usuario();
  token_a = firmar_token(id_a);
  token_b = firmar_token(id_b);

  servidor_http = createServer();
  servidor_socket = crear_socket(servidor_http);
  await new Promise((resolver) => servidor_http.listen(0, resolver));
  url_base = `http://localhost:${servidor_http.address().port}`;
});

afterAll(async () => {
  servidor_socket.close();
  await new Promise((resolver) => servidor_http.close(resolver));
  await consultar('DELETE FROM usuarios WHERE id_usuario = ANY($1)', [[id_a, id_b]]);
  await cerrar_pool();
});

describe('eventos:amigo (end-to-end)', () => {
  it('flujo solicitud → recibida → aceptada → vinculo_confirmado', async () => {
    const cliente_a = await conectar_cliente(token_a);
    const cliente_b = await conectar_cliente(token_b);
    try {
      const recibida = esperar_evento(cliente_b, 'amigo:solicitud_recibida');
      const ack_envio = emitir_con_ack(cliente_a, 'amigo:solicitud_enviada', {
        id_usuario_destino: id_b,
      });

      const [datos_recibida, respuesta_envio] = await Promise.all([recibida, ack_envio]);
      expect(respuesta_envio).toEqual({ ok: true });
      expect(datos_recibida.id_usuario_origen).toBe(id_a);
      expect(datos_recibida.id_solicitud).toBeTruthy();

      const vinculo_a = esperar_evento(cliente_a, 'amigo:vinculo_confirmado');
      const vinculo_b = esperar_evento(cliente_b, 'amigo:vinculo_confirmado');
      const ack_aceptar = emitir_con_ack(cliente_b, 'amigo:solicitud_aceptada', {
        id_solicitud: datos_recibida.id_solicitud,
      });

      const [pa, pb, respuesta_aceptar] = await Promise.all([vinculo_a, vinculo_b, ack_aceptar]);
      expect(respuesta_aceptar).toEqual({ ok: true });
      expect([pa.id_usuario_a, pa.id_usuario_b].sort()).toEqual([id_a, id_b].sort());
      expect([pb.id_usuario_a, pb.id_usuario_b].sort()).toEqual([id_a, id_b].sort());
    } finally {
      cliente_a.disconnect();
      cliente_b.disconnect();
    }
  });

  it('un socket anonimo recibe amigo:error NO_AUTENTICADO', async () => {
    const anonimo = await conectar_cliente(null);
    try {
      const error = esperar_evento(anonimo, 'amigo:error');
      anonimo.emit('amigo:solicitud_enviada', { id_usuario_destino: id_a });
      const datos = await error;
      expect(datos.codigo).toBe('NO_AUTENTICADO');
    } finally {
      anonimo.disconnect();
    }
  });
});
