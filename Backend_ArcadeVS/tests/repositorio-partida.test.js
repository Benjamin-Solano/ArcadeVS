/**
 * Pruebas de integracion del repositorio-partida contra la BD local real.
 * Verifican la insercion de partidas, sus jugadores (humano y bot) y el
 * historial de un usuario. Los datos de prueba se limpian en afterAll.
 */

import '../src/configuracion/cargar-entorno.js';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  guardar_partida,
  guardar_jugador_partida,
  obtener_partida_por_id,
  obtener_jugadores_de_partida,
  obtener_historial_usuario,
} from '../src/repositorios/repositorio-partida.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

const partidas_creadas = [];
let id_usuario;
let id_juego;
let id_modalidad;

/** Sufijo unico para nombres/slugs de prueba. */
function sufijo_unico() {
  return `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

/** Codigo de amigo unico de 12 caracteres. */
function codigo_amigo_unico() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2))
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 12)
    .padEnd(12, '0')
    .toUpperCase();
}

beforeAll(async () => {
  const s = sufijo_unico();

  const usuario = await consultar(
    `INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, codigo_amigo)
     VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario`,
    [`part_${s}`.slice(0, 50), 'Prueba', `part_${s}@test.com`, 'hash', codigo_amigo_unico()],
  );
  id_usuario = usuario[0].id_usuario;

  const juego = await consultar(
    `INSERT INTO juegos (nombre, slug) VALUES ($1, $2) RETURNING id_juego`,
    [`juego_${s}`.slice(0, 100), `juego-${s}`.slice(0, 100)],
  );
  id_juego = juego[0].id_juego;

  const modalidad = await consultar(
    `INSERT INTO modalidades (nombre, permite_bot, puntua)
     VALUES ($1, TRUE, TRUE) RETURNING id_modalidad`,
    [`modalidad_${s}`.slice(0, 100)],
  );
  id_modalidad = modalidad[0].id_modalidad;
});

afterAll(async () => {
  for (const id of partidas_creadas) {
    await consultar('DELETE FROM partidas WHERE id_partida = $1', [id]);
  }
  await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id_usuario]);
  await consultar('DELETE FROM modalidades WHERE id_modalidad = $1', [id_modalidad]);
  await consultar('DELETE FROM juegos WHERE id_juego = $1', [id_juego]);
  await cerrar_pool();
});

describe('repositorio-partida', () => {
  it('guardar_partida crea una partida finalizada con fecha_fin', async () => {
    const partida = await guardar_partida({
      id_juego,
      id_modalidad,
      estado: 'finalizada',
      finalizada: true,
    });
    partidas_creadas.push(partida.id_partida);

    expect(partida.id_partida).toBeTruthy();
    expect(partida.estado).toBe('finalizada');
    expect(partida.fecha_fin).not.toBeNull();
    expect(partida.id_torneo).toBeNull();
  });

  it('guardar_jugador_partida acepta un jugador humano y un bot', async () => {
    const partida = await guardar_partida({ id_juego, id_modalidad });
    partidas_creadas.push(partida.id_partida);

    const humano = await guardar_jugador_partida({
      id_partida: partida.id_partida,
      id_usuario,
      es_bot: false,
      puntuacion: 120,
      resultado: 'victoria',
    });
    const bot = await guardar_jugador_partida({
      id_partida: partida.id_partida,
      es_bot: true,
      puntuacion: 80,
      resultado: 'derrota',
    });

    expect(humano.id_usuario).toBe(id_usuario);
    expect(humano.es_bot).toBe(false);
    expect(bot.id_usuario).toBeNull();
    expect(bot.es_bot).toBe(true);

    const jugadores = await obtener_jugadores_de_partida(partida.id_partida);
    expect(jugadores).toHaveLength(2);
  });

  it('el CHECK impide un bot con id_usuario', async () => {
    const partida = await guardar_partida({ id_juego, id_modalidad });
    partidas_creadas.push(partida.id_partida);

    await expect(
      guardar_jugador_partida({
        id_partida: partida.id_partida,
        id_usuario,
        es_bot: true,
      }),
    ).rejects.toThrow();
  });

  it('obtener_partida_por_id devuelve null si no existe', async () => {
    const inexistente = await obtener_partida_por_id(
      '00000000-0000-0000-0000-000000000000',
    );
    expect(inexistente).toBeNull();
  });

  it('obtener_historial_usuario lista las partidas del usuario con nombre de juego', async () => {
    const partida = await guardar_partida({
      id_juego,
      id_modalidad,
      estado: 'finalizada',
      finalizada: true,
    });
    partidas_creadas.push(partida.id_partida);
    await guardar_jugador_partida({
      id_partida: partida.id_partida,
      id_usuario,
      puntuacion: 50,
      resultado: 'victoria',
    });

    const historial = await obtener_historial_usuario(id_usuario, 10);
    expect(historial.length).toBeGreaterThanOrEqual(1);
    expect(historial[0]).toHaveProperty('nombre_juego');
    expect(historial.every((fila) => fila.id_partida)).toBe(true);
  });
});
