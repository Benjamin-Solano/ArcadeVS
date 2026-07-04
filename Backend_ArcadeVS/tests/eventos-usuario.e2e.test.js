/**
 * Prueba end-to-end de la presencia del dominio `usuario` contra la BD local.
 *
 * Crea dos usuarios amigos, levanta Socket.io real y verifica que, cuando un
 * amigo se conecta y luego se desconecta, el otro recibe `usuario:conectado` y
 * `usuario:desconectado` en su sala personal.
 */

import '../src/configuracion/cargar-entorno.js';

import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as crear_cliente } from 'socket.io-client';
import { crear_socket } from '../src/configuracion/configuracion-socket.js';
import { firmar_token } from '../src/configuracion/configuracion-autenticacion.js';
import {
  guardar_solicitud,
  actualizar_estado,
} from '../src/repositorios/repositorio-amistad.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

let servidor_http;
let servidor_socket;
let url_base;

let id_a;
let id_b;
let nombre_a;
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
     VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario, nombre`,
    [`pres_${s}`.slice(0, 50), 'Prueba', `pres_${s}@test.com`, 'hash', codigo_amigo_unico()],
  );
  return filas[0];
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

function esperar_evento(cliente, evento) {
  return new Promise((resolver) => cliente.once(evento, resolver));
}

beforeAll(async () => {
  const a = await crear_usuario();
  const b = await crear_usuario();
  id_a = a.id_usuario;
  nombre_a = a.nombre;
  id_b = b.id_usuario;
  token_a = firmar_token(id_a);
  token_b = firmar_token(id_b);

  // Establece la amistad (aceptada) entre A y B.
  const solicitud = await guardar_solicitud(id_a, id_b);
  await actualizar_estado(solicitud.id_solicitud, 'aceptado');

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

describe('presencia:usuario (end-to-end)', () => {
  it('un amigo recibe usuario:conectado y usuario:desconectado', async () => {
    const cliente_b = await conectar_cliente(token_b);
    try {
      const conectado = esperar_evento(cliente_b, 'usuario:conectado');
      const cliente_a = await conectar_cliente(token_a);

      const datos_conectado = await conectado;
      expect(datos_conectado.id_usuario).toBe(id_a);
      expect(datos_conectado.nombre).toBe(nombre_a);

      const desconectado = esperar_evento(cliente_b, 'usuario:desconectado');
      cliente_a.disconnect();

      const datos_desconectado = await desconectado;
      expect(datos_desconectado.id_usuario).toBe(id_a);
    } finally {
      cliente_b.disconnect();
    }
  });
});
