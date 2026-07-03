/**
 * Pruebas de integracion del flujo de fin de partida contra la BD local real.
 *
 * Simulan lo que hara manejador-juego (capa de eventos): abrir UNA transaccion
 * y orquestar servicio-historial.guardar_sesion + servicio-leaderboard
 * .actualizar_puntaje con el mismo cliente. Verifican:
 *   - que partidas_jugadores y rankings_juego se actualizan atomicamente,
 *   - que un fallo hace ROLLBACK de todo (nada se persiste),
 *   - que una modalidad sin puntaje no toca rankings (regla f),
 *   - que un jugador bot no acumula ranking (regla e).
 */

import '../src/configuracion/cargar-entorno.js';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { guardar_sesion } from '../src/servicios/servicio-historial.js';
import { actualizar_puntaje, obtener_top } from '../src/servicios/servicio-leaderboard.js';
import { obtener_ranking } from '../src/repositorios/repositorio-ranking.js';
import {
  consultar,
  cerrar_pool,
  ejecutar_en_transaccion,
} from '../src/configuracion/configuracion-db.js';

const partidas_creadas = [];
let id_usuario;
let id_juego;
let id_modalidad_puntua;
let id_modalidad_casual;

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

/**
 * Orquesta el fin de partida en una sola transaccion (rol de manejador-juego):
 * guarda la sesion y actualiza el ranking con el mismo cliente.
 */
async function finalizar_partida_en_transaccion(datos) {
  return ejecutar_en_transaccion(async (cliente) => {
    const { partida, jugadores, modalidad } = await guardar_sesion(datos, cliente);
    const rankings = await actualizar_puntaje(
      { id_juego: datos.id_juego, puntua: modalidad.puntua, jugadores },
      cliente,
    );
    return { partida, jugadores, rankings };
  });
}

beforeAll(async () => {
  const s = sufijo_unico();

  const usuario = await consultar(
    `INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, codigo_amigo)
     VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario`,
    [`fin_${s}`.slice(0, 50), 'Prueba', `fin_${s}@test.com`, 'hash', codigo_amigo_unico()],
  );
  id_usuario = usuario[0].id_usuario;

  const juego = await consultar(
    `INSERT INTO juegos (nombre, slug) VALUES ($1, $2) RETURNING id_juego`,
    [`fjuego_${s}`.slice(0, 100), `fjuego-${s}`.slice(0, 100)],
  );
  id_juego = juego[0].id_juego;

  const puntua = await consultar(
    `INSERT INTO modalidades (nombre, permite_bot, puntua)
     VALUES ($1, TRUE, TRUE) RETURNING id_modalidad`,
    [`mp_${s}`.slice(0, 100)],
  );
  id_modalidad_puntua = puntua[0].id_modalidad;

  const casual = await consultar(
    `INSERT INTO modalidades (nombre, permite_bot, puntua)
     VALUES ($1, TRUE, FALSE) RETURNING id_modalidad`,
    [`mc_${s}`.slice(0, 100)],
  );
  id_modalidad_casual = casual[0].id_modalidad;
});

afterAll(async () => {
  for (const id of partidas_creadas) {
    await consultar('DELETE FROM partidas WHERE id_partida = $1', [id]);
  }
  await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id_usuario]);
  await consultar('DELETE FROM modalidades WHERE id_modalidad = ANY($1)', [
    [id_modalidad_puntua, id_modalidad_casual],
  ]);
  await consultar('DELETE FROM juegos WHERE id_juego = $1', [id_juego]);
  await cerrar_pool();
});

describe('flujo de fin de partida (historial + leaderboard atomicos)', () => {
  it('actualiza partidas_jugadores y rankings_juego en la misma transaccion', async () => {
    const { partida, rankings } = await finalizar_partida_en_transaccion({
      id_juego,
      id_modalidad: id_modalidad_puntua,
      jugadores: [
        { id_usuario, es_bot: false, puntuacion: 200, resultado: 'victoria' },
        { es_bot: true, puntuacion: 150, resultado: 'derrota' },
      ],
    });
    partidas_creadas.push(partida.id_partida);

    // Solo el jugador humano genero ranking (el bot se ignora, regla e).
    expect(rankings).toHaveLength(1);

    const ranking = await obtener_ranking(id_usuario, id_juego);
    expect(ranking.puntuacion_total).toBe(200);
    expect(ranking.partidas_jugadas).toBe(1);
    expect(ranking.victorias).toBe(1);
  });

  it('un fallo dentro de la transaccion revierte la partida completa (ROLLBACK)', async () => {
    const conteo_antes = await consultar(
      'SELECT COUNT(*)::int AS n FROM partidas WHERE id_juego = $1',
      [id_juego],
    );

    await expect(
      ejecutar_en_transaccion(async (cliente) => {
        await guardar_sesion(
          {
            id_juego,
            id_modalidad: id_modalidad_puntua,
            jugadores: [{ id_usuario, puntuacion: 10, resultado: 'victoria' }],
          },
          cliente,
        );
        // Simula un fallo posterior (p. ej. al actualizar rankings): debe revertir.
        throw new Error('fallo simulado tras guardar la sesion');
      }),
    ).rejects.toThrow('fallo simulado');

    const conteo_despues = await consultar(
      'SELECT COUNT(*)::int AS n FROM partidas WHERE id_juego = $1',
      [id_juego],
    );
    expect(conteo_despues[0].n).toBe(conteo_antes[0].n);
  });

  it('una modalidad sin puntaje guarda la partida pero no toca rankings (regla f)', async () => {
    const ranking_antes = await obtener_ranking(id_usuario, id_juego);
    const jugadas_antes = ranking_antes?.partidas_jugadas ?? 0;

    const { partida, rankings } = await finalizar_partida_en_transaccion({
      id_juego,
      id_modalidad: id_modalidad_casual,
      jugadores: [{ id_usuario, puntuacion: 999, resultado: 'victoria' }],
    });
    partidas_creadas.push(partida.id_partida);

    expect(rankings).toEqual([]);
    const ranking_despues = await obtener_ranking(id_usuario, id_juego);
    expect(ranking_despues?.partidas_jugadas ?? 0).toBe(jugadas_antes);
  });

  it('rechaza un bot en una modalidad que no lo permite', async () => {
    const s = sufijo_unico();
    const sin_bot = await consultar(
      `INSERT INTO modalidades (nombre, permite_bot, puntua)
       VALUES ($1, FALSE, TRUE) RETURNING id_modalidad`,
      [`sb_${s}`.slice(0, 100)],
    );
    const id_sin_bot = sin_bot[0].id_modalidad;

    await expect(
      finalizar_partida_en_transaccion({
        id_juego,
        id_modalidad: id_sin_bot,
        jugadores: [{ es_bot: true, puntuacion: 5, resultado: 'victoria' }],
      }),
    ).rejects.toMatchObject({ codigo: 'BOT_NO_PERMITIDO' });

    await consultar('DELETE FROM modalidades WHERE id_modalidad = $1', [id_sin_bot]);
  });

  it('obtener_top expone el leaderboard del juego', async () => {
    const top = await obtener_top(id_juego, 5);
    expect(top.map((fila) => fila.id_usuario)).toContain(id_usuario);
  });
});
