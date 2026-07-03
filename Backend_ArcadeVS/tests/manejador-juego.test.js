/**
 * Pruebas unitarias del manejador-juego (sin BD ni sockets).
 * Cubren la normalizacion del payload de fin de partida y el nombre de sala.
 */

import { describe, expect, it } from 'vitest';
import {
  construir_jugadores,
  sala_de_juego,
} from '../src/eventos/manejador-juego.js';

describe('manejador-juego (funciones puras)', () => {
  it('sala_de_juego construye el nombre de sala a partir del id', () => {
    expect(sala_de_juego('abc')).toBe('juego:abc');
  });

  it('construir_jugadores arma un jugador humano desde el payload arcade', () => {
    const jugadores = construir_jugadores({
      id_juego: 'j1',
      id_usuario: 'u1',
      puntaje: 320,
    });

    expect(jugadores).toEqual([
      { id_usuario: 'u1', es_bot: false, puntuacion: 320, resultado: null },
    ]);
  });

  it('construir_jugadores respeta el resultado cuando viene en el payload', () => {
    const [jugador] = construir_jugadores({
      id_usuario: 'u1',
      puntaje: 10,
      resultado: 'victoria',
    });
    expect(jugador.resultado).toBe('victoria');
  });

  it('construir_jugadores usa el arreglo de jugadores cuando ya viene (multijugador)', () => {
    const jugadores = [
      { id_usuario: 'u1', es_bot: false, puntuacion: 5, resultado: 'derrota' },
      { es_bot: true, puntuacion: 9, resultado: 'victoria' },
    ];
    expect(construir_jugadores({ id_juego: 'j1', jugadores })).toBe(jugadores);
  });
});
