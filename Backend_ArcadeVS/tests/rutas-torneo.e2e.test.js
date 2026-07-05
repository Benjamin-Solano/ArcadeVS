/**
 * Pruebas end-to-end de las rutas REST de torneo contra la BD local real.
 * Usan construir_servidor + fastify.inject(). Cubren el cableado, el guard de
 * autenticacion y el flujo crear → inscribir → iniciar → finalizar. Limpia todo
 * en afterAll.
 */

import '../src/configuracion/cargar-entorno.js';

// Evita enviar correos reales durante las pruebas (modo desarrollo del correo).
process.env.CORREO_HABILITADO = 'false';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { construir_servidor } from '../src/construir-servidor.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';
import { firmar_token } from '../src/configuracion/configuracion-autenticacion.js';

let servidor;
const ids_torneos = [];
const ids_usuarios = [];
let id_juego;
let id_modalidad;

function sufijo() {
  return `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

/** Registra un usuario via REST y devuelve su token e id. */
async function registrar_usuario() {
  const s = sufijo();
  const respuesta = await servidor.inject({
    method: 'POST',
    url: '/auth/registro',
    payload: {
      nombre: `rt_${s}`.slice(0, 50),
      apellido: 'Ruta',
      correo: `rt_${s}@test.com`,
      contrasena: 'contrasenaSegura123',
    },
  });
  const { usuario } = respuesta.json();
  ids_usuarios.push(usuario.id_usuario);
  // El registro ya no devuelve token (login requiere verificacion); las pruebas
  // de torneo solo necesitan un token valido, se firma directamente.
  const token = firmar_token(usuario.id_usuario);
  return { token, id_usuario: usuario.id_usuario };
}

function auth(token) {
  return { authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  servidor = construir_servidor();
  await servidor.ready();

  const s = sufijo();
  const juego = await consultar(
    `INSERT INTO juegos (nombre, slug) VALUES ($1, $2) RETURNING id_juego`,
    [`rtjuego_${s}`.slice(0, 100), `rtjuego-${s}`.slice(0, 100)],
  );
  id_juego = juego[0].id_juego;
  const modalidad = await consultar(
    `INSERT INTO modalidades (nombre, permite_bot, puntua)
     VALUES ($1, FALSE, TRUE) RETURNING id_modalidad`,
    [`rtmod_${s}`.slice(0, 100)],
  );
  id_modalidad = modalidad[0].id_modalidad;
});

afterAll(async () => {
  await servidor.close();
  for (const id of ids_torneos) {
    await consultar('DELETE FROM torneos WHERE id_torneo = $1', [id]);
  }
  for (const id of ids_usuarios) {
    await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
  }
  await consultar('DELETE FROM modalidades WHERE id_modalidad = $1', [id_modalidad]);
  await consultar('DELETE FROM juegos WHERE id_juego = $1', [id_juego]);
  await cerrar_pool();
});

describe('rutas de torneo', () => {
  it('rechaza crear un torneo sin token (401)', async () => {
    const respuesta = await servidor.inject({
      method: 'POST',
      url: '/torneos',
      payload: { nombre: 'X', id_juego, id_modalidad },
    });
    expect(respuesta.statusCode).toBe(401);
  });

  it('flujo crear → detalle → inscribir → iniciar → finalizar', async () => {
    const a = await registrar_usuario();
    const b = await registrar_usuario();

    // Crear
    const creado = await servidor.inject({
      method: 'POST',
      url: '/torneos',
      headers: auth(a.token),
      payload: { nombre: `Copa ${sufijo()}`, id_juego, id_modalidad },
    });
    expect(creado.statusCode).toBe(201);
    const id_torneo = creado.json().torneo.id_torneo;
    ids_torneos.push(id_torneo);

    // Detalle publico
    const detalle = await servidor.inject({ method: 'GET', url: `/torneos/${id_torneo}` });
    expect(detalle.statusCode).toBe(200);
    expect(detalle.json().torneo.total_participantes).toBe(0);

    // Inscribir a los dos usuarios
    for (const usuario of [a, b]) {
      const insc = await servidor.inject({
        method: 'POST',
        url: `/torneos/${id_torneo}/inscripcion`,
        headers: auth(usuario.token),
      });
      expect(insc.statusCode).toBe(201);
    }

    // Doble inscripcion → 409
    const duplicada = await servidor.inject({
      method: 'POST',
      url: `/torneos/${id_torneo}/inscripcion`,
      headers: auth(a.token),
    });
    expect(duplicada.statusCode).toBe(409);
    expect(duplicada.json().codigo).toBe('YA_INSCRITO');

    // Iniciar y finalizar
    const iniciado = await servidor.inject({
      method: 'POST',
      url: `/torneos/${id_torneo}/iniciar`,
      headers: auth(a.token),
    });
    expect(iniciado.statusCode).toBe(200);
    expect(iniciado.json().torneo.estado).toBe('en_curso');

    const finalizado = await servidor.inject({
      method: 'POST',
      url: `/torneos/${id_torneo}/finalizar`,
      headers: auth(a.token),
    });
    expect(finalizado.statusCode).toBe(200);
    expect(finalizado.json().torneo.estado).toBe('finalizado');
  });

  it('lista torneos filtrando por estado', async () => {
    const respuesta = await servidor.inject({
      method: 'GET',
      url: '/torneos?estado=finalizado',
    });
    expect(respuesta.statusCode).toBe(200);
    const estados = respuesta.json().torneos.map((t) => t.estado);
    expect(estados.every((e) => e === 'finalizado')).toBe(true);
  });
});
