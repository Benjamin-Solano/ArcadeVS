/**
 * Pruebas de integracion del servicio-torneos contra la BD local real.
 * Cubren creacion, inscripcion (cupo, duplicados) y la transicion de estado
 * inscripcion → en_curso → finalizado con sus reglas. Limpia todo en afterAll.
 */

import '../src/configuracion/cargar-entorno.js';

import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  crear_torneo,
  obtener_torneo,
  inscribir_usuario,
  cancelar_inscripcion,
  iniciar_torneo,
  finalizar_torneo,
} from '../src/servicios/servicio-torneos.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

const ids_torneos = [];
const ids_usuarios = [];
let id_juego;
let id_modalidad;
let id_creador;

function sufijo() {
  return `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function codigo_amigo_unico() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2))
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 12)
    .padEnd(12, '0')
    .toUpperCase();
}

async function crear_usuario() {
  const s = sufijo();
  const filas = await consultar(
    `INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, codigo_amigo)
     VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario`,
    [`tor_${s}`.slice(0, 50), 'Prueba', `tor_${s}@test.com`, 'hash', codigo_amigo_unico()],
  );
  const id = filas[0].id_usuario;
  ids_usuarios.push(id);
  return id;
}

async function crear_torneo_de_prueba(max_participantes = null, creador = id_creador) {
  const torneo = await crear_torneo(
    { nombre: `Copa ${sufijo()}`, id_juego, id_modalidad, max_participantes },
    creador,
  );
  ids_torneos.push(torneo.id_torneo);
  return torneo;
}

beforeAll(async () => {
  const s = sufijo();
  const juego = await consultar(
    `INSERT INTO juegos (nombre, slug) VALUES ($1, $2) RETURNING id_juego`,
    [`tjuego_${s}`.slice(0, 100), `tjuego-${s}`.slice(0, 100)],
  );
  id_juego = juego[0].id_juego;
  const modalidad = await consultar(
    `INSERT INTO modalidades (nombre, permite_bot, puntua)
     VALUES ($1, FALSE, TRUE) RETURNING id_modalidad`,
    [`tmod_${s}`.slice(0, 100)],
  );
  id_modalidad = modalidad[0].id_modalidad;
  id_creador = await crear_usuario();
});

afterAll(async () => {
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

describe('crear_torneo', () => {
  it('crea un torneo en estado inscripcion', async () => {
    const torneo = await crear_torneo_de_prueba();
    expect(torneo.estado).toBe('inscripcion');
    expect(torneo.id_torneo).toBeTruthy();
  });

  it('rechaza un juego inexistente con 404', async () => {
    await expect(
      crear_torneo({ nombre: 'X', id_juego: randomUUID(), id_modalidad }, id_creador),
    ).rejects.toMatchObject({ codigo: 'JUEGO_NO_ENCONTRADO', estado_http: 404 });
  });

  it('rechaza un nombre vacio con DATOS_INVALIDOS', async () => {
    await expect(
      crear_torneo({ nombre: '   ', id_juego, id_modalidad }, id_creador),
    ).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS' });
  });

  it('registra al creador como dueño (id_creador)', async () => {
    const torneo = await crear_torneo_de_prueba();
    expect(torneo.id_creador).toBe(id_creador);
  });
});

describe('inscripcion (cupo y duplicados)', () => {
  it('inscribe, rechaza duplicado y respeta el cupo', async () => {
    const torneo = await crear_torneo_de_prueba(2);
    const a = await crear_usuario();
    const b = await crear_usuario();
    const c = await crear_usuario();

    await inscribir_usuario(torneo.id_torneo, a);
    await expect(inscribir_usuario(torneo.id_torneo, a)).rejects.toMatchObject({
      codigo: 'YA_INSCRITO',
    });

    await inscribir_usuario(torneo.id_torneo, b);
    await expect(inscribir_usuario(torneo.id_torneo, c)).rejects.toMatchObject({
      codigo: 'TORNEO_LLENO',
    });

    const detalle = await obtener_torneo(torneo.id_torneo);
    expect(detalle.total_participantes).toBe(2);
  });

  it('cancelar_inscripcion libera el cupo', async () => {
    const torneo = await crear_torneo_de_prueba(1);
    const a = await crear_usuario();
    await inscribir_usuario(torneo.id_torneo, a);
    await cancelar_inscripcion(torneo.id_torneo, a);
    await expect(cancelar_inscripcion(torneo.id_torneo, a)).rejects.toMatchObject({
      codigo: 'NO_INSCRITO',
    });
  });
});

describe('transicion de estado', () => {
  it('inscripcion → en_curso → finalizado con sus reglas', async () => {
    const torneo = await crear_torneo_de_prueba();

    // No se puede iniciar sin el minimo de participantes.
    await expect(iniciar_torneo(torneo.id_torneo, id_creador)).rejects.toMatchObject({
      codigo: 'PARTICIPANTES_INSUFICIENTES',
    });

    await inscribir_usuario(torneo.id_torneo, await crear_usuario());
    await inscribir_usuario(torneo.id_torneo, await crear_usuario());

    const iniciado = await iniciar_torneo(torneo.id_torneo, id_creador);
    expect(iniciado.estado).toBe('en_curso');
    expect(iniciado.fecha_inicio).not.toBeNull();

    // Ya en curso: no admite inscripciones ni re-inicio.
    await expect(
      inscribir_usuario(torneo.id_torneo, await crear_usuario()),
    ).rejects.toMatchObject({ codigo: 'INSCRIPCION_CERRADA' });
    await expect(iniciar_torneo(torneo.id_torneo, id_creador)).rejects.toMatchObject({
      codigo: 'TRANSICION_INVALIDA',
    });

    const finalizado = await finalizar_torneo(torneo.id_torneo, id_creador);
    expect(finalizado.estado).toBe('finalizado');
    expect(finalizado.fecha_fin).not.toBeNull();

    await expect(finalizar_torneo(torneo.id_torneo, id_creador)).rejects.toMatchObject({
      codigo: 'TRANSICION_INVALIDA',
    });
  });
});

describe('autorizacion de gestion (dueño o admin)', () => {
  it('un usuario ajeno no puede iniciar el torneo (403)', async () => {
    const torneo = await crear_torneo_de_prueba();
    await inscribir_usuario(torneo.id_torneo, await crear_usuario());
    await inscribir_usuario(torneo.id_torneo, await crear_usuario());

    const ajeno = await crear_usuario();
    await expect(iniciar_torneo(torneo.id_torneo, ajeno)).rejects.toMatchObject({
      codigo: 'NO_AUTORIZADO',
      estado_http: 403,
    });
  });

  it('un admin ajeno si puede iniciar el torneo', async () => {
    const torneo = await crear_torneo_de_prueba();
    await inscribir_usuario(torneo.id_torneo, await crear_usuario());
    await inscribir_usuario(torneo.id_torneo, await crear_usuario());

    const admin = await crear_usuario();
    await consultar(`UPDATE usuarios SET rol = 'admin' WHERE id_usuario = $1`, [admin]);

    const iniciado = await iniciar_torneo(torneo.id_torneo, admin);
    expect(iniciado.estado).toBe('en_curso');
  });
});
