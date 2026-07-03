/**
 * Pruebas de integracion del repositorio-ranking contra la BD local real.
 * Verifican el UPSERT de contadores denormalizados (acumulacion sobre el mismo
 * par usuario-juego) y el top del leaderboard. Se limpian los datos en afterAll.
 */

import '../src/configuracion/cargar-entorno.js';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  actualizar_ranking,
  obtener_ranking,
  obtener_top_juego,
} from '../src/repositorios/repositorio-ranking.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

let id_usuario;
let id_juego;

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
    [`rank_${s}`.slice(0, 50), 'Prueba', `rank_${s}@test.com`, 'hash', codigo_amigo_unico()],
  );
  id_usuario = usuario[0].id_usuario;

  const juego = await consultar(
    `INSERT INTO juegos (nombre, slug) VALUES ($1, $2) RETURNING id_juego`,
    [`rjuego_${s}`.slice(0, 100), `rjuego-${s}`.slice(0, 100)],
  );
  id_juego = juego[0].id_juego;
});

afterAll(async () => {
  // rankings_juego cae por CASCADE al eliminar el usuario y el juego.
  await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id_usuario]);
  await consultar('DELETE FROM juegos WHERE id_juego = $1', [id_juego]);
  await cerrar_pool();
});

describe('repositorio-ranking', () => {
  it('actualizar_ranking crea la fila en la primera partida', async () => {
    const ranking = await actualizar_ranking({
      id_usuario,
      id_juego,
      puntuacion: 100,
      es_victoria: true,
    });

    expect(ranking.puntuacion_total).toBe(100);
    expect(ranking.partidas_jugadas).toBe(1);
    expect(ranking.victorias).toBe(1);
  });

  it('actualizar_ranking acumula sobre la fila existente (UPSERT)', async () => {
    await actualizar_ranking({ id_usuario, id_juego, puntuacion: 50, es_victoria: false });
    const ranking = await obtener_ranking(id_usuario, id_juego);

    // Tras dos partidas (100 victoria + 50 derrota):
    expect(ranking.puntuacion_total).toBe(150);
    expect(ranking.partidas_jugadas).toBe(2);
    expect(ranking.victorias).toBe(1);
    // Red de seguridad de la BD: victorias nunca supera partidas_jugadas.
    expect(ranking.victorias).toBeLessThanOrEqual(ranking.partidas_jugadas);
  });

  it('obtener_top_juego devuelve al usuario con su nombre y puntuacion', async () => {
    const top = await obtener_top_juego(id_juego, 10);

    expect(top.length).toBeGreaterThanOrEqual(1);
    expect(top[0]).toHaveProperty('nombre');
    expect(top.map((fila) => fila.id_usuario)).toContain(id_usuario);
  });

  it('obtener_ranking devuelve null para un par usuario-juego sin partidas', async () => {
    const inexistente = await obtener_ranking(
      '00000000-0000-0000-0000-000000000000',
      id_juego,
    );
    expect(inexistente).toBeNull();
  });
});
