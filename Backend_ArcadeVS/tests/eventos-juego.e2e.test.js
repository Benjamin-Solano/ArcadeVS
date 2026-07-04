/**
 * Prueba end-to-end de los eventos del dominio `juego` contra la BD local real.
 *
 * Levanta un servidor HTTP con Socket.io real, conecta un cliente de verdad y
 * verifica el flujo completo: al emitir `juego:partida_terminada`, el servidor
 * ejecuta el flujo atomico y difunde `juego:puntaje_actualizado` con el top del
 * leaderboard. Tambien verifica que un payload invalido produce `juego:error`.
 */

import '../src/configuracion/cargar-entorno.js';

import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as crear_cliente } from 'socket.io-client';
import { crear_socket } from '../src/configuracion/configuracion-socket.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

let servidor_http;
let servidor_socket;
let url_base;

let id_usuario;
let id_juego;
let id_modalidad;

function sufijo_unico() {
  return `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function codigo_amigo_unico() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2))
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 12)
    .padEnd(12, '0')
    .toUpperCase();
}

/** Conecta un cliente Socket.io y resuelve cuando la conexion esta lista. */
function conectar_cliente() {
  const cliente = crear_cliente(url_base, { transports: ['websocket'], forceNew: true });
  return new Promise((resolver, rechazar) => {
    cliente.on('connect', () => resolver(cliente));
    cliente.on('connect_error', rechazar);
  });
}

beforeAll(async () => {
  const s = sufijo_unico();

  const usuario = await consultar(
    `INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, codigo_amigo)
     VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario`,
    [`e2e_${s}`.slice(0, 50), 'Prueba', `e2e_${s}@test.com`, 'hash', codigo_amigo_unico()],
  );
  id_usuario = usuario[0].id_usuario;

  const juego = await consultar(
    `INSERT INTO juegos (nombre, slug) VALUES ($1, $2) RETURNING id_juego`,
    [`ejuego_${s}`.slice(0, 100), `ejuego-${s}`.slice(0, 100)],
  );
  id_juego = juego[0].id_juego;

  const modalidad = await consultar(
    `INSERT INTO modalidades (nombre, permite_bot, puntua)
     VALUES ($1, TRUE, TRUE) RETURNING id_modalidad`,
    [`emod_${s}`.slice(0, 100)],
  );
  id_modalidad = modalidad[0].id_modalidad;

  servidor_http = createServer();
  servidor_socket = crear_socket(servidor_http);
  await new Promise((resolver) => servidor_http.listen(0, resolver));
  url_base = `http://localhost:${servidor_http.address().port}`;
});

afterAll(async () => {
  servidor_socket.close();
  await new Promise((resolver) => servidor_http.close(resolver));

  // Limpia las partidas creadas por el flujo (rankings caen por CASCADE).
  await consultar('DELETE FROM partidas WHERE id_juego = $1', [id_juego]);
  await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id_usuario]);
  await consultar('DELETE FROM modalidades WHERE id_modalidad = $1', [id_modalidad]);
  await consultar('DELETE FROM juegos WHERE id_juego = $1', [id_juego]);
  await cerrar_pool();
});

describe('eventos:juego (end-to-end)', () => {
  it('juego:partida_terminada difunde juego:puntaje_actualizado con el top', async () => {
    const cliente = await conectar_cliente();
    try {
      const actualizacion = new Promise((resolver) => {
        cliente.on('juego:puntaje_actualizado', resolver);
      });

      cliente.emit('juego:partida_terminada', {
        id_juego,
        id_usuario,
        id_modalidad,
        puntaje: 175,
        resultado: 'victoria',
        duracion_segundos: 42,
      });

      const datos = await actualizacion;
      expect(datos.id_juego).toBe(id_juego);
      expect(datos.tabla_puntajes.map((fila) => fila.id_usuario)).toContain(id_usuario);
      const fila_usuario = datos.tabla_puntajes.find((f) => f.id_usuario === id_usuario);
      expect(fila_usuario.puntuacion_total).toBeGreaterThanOrEqual(175);
    } finally {
      cliente.disconnect();
    }
  });

  it('un payload sin id_modalidad produce juego:error DATOS_INVALIDOS', async () => {
    const cliente = await conectar_cliente();
    try {
      const error = new Promise((resolver) => cliente.on('juego:error', resolver));
      cliente.emit('juego:partida_terminada', { id_juego, id_usuario, puntaje: 10 });

      const datos = await error;
      expect(datos.codigo).toBe('DATOS_INVALIDOS');
    } finally {
      cliente.disconnect();
    }
  });
});
