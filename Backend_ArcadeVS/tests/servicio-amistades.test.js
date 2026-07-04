/**
 * Pruebas de integracion del servicio-amistades contra la BD local real.
 * Cubren el flujo enviar → responder, las validaciones de negocio y la baja.
 * Crea usuarios de prueba y los limpia en afterAll (solicitudes caen por CASCADE).
 */

import '../src/configuracion/cargar-entorno.js';

import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  enviar_solicitud,
  responder_solicitud,
  eliminar_amistad,
  obtener_lista_amigos,
  obtener_solicitudes,
} from '../src/servicios/servicio-amistades.js';
import { ErrorServicio } from '../src/servicios/error-servicio.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

const ids_usuarios = [];

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
    [`amis_${s}`.slice(0, 50), 'Prueba', `amis_${s}@test.com`, 'hash', codigo_amigo_unico()],
  );
  const id = filas[0].id_usuario;
  ids_usuarios.push(id);
  return id;
}

let id_a;
let id_b;

beforeAll(async () => {
  id_a = await crear_usuario();
  id_b = await crear_usuario();
});

afterAll(async () => {
  for (const id of ids_usuarios) {
    await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
  }
  await cerrar_pool();
});

describe('enviar_solicitud (validaciones)', () => {
  it('rechaza enviarse una solicitud a si mismo', async () => {
    await expect(enviar_solicitud(id_a, id_a)).rejects.toMatchObject({
      codigo: 'AMISTAD_CONSIGO_MISMO',
    });
  });

  it('rechaza un destino inexistente con 404', async () => {
    await expect(enviar_solicitud(id_a, randomUUID())).rejects.toMatchObject({
      codigo: 'USUARIO_NO_ENCONTRADO',
      estado_http: 404,
    });
  });
});

describe('flujo enviar → responder', () => {
  it('crea una solicitud pendiente entre dos usuarios', async () => {
    const { solicitud } = await enviar_solicitud(id_a, id_b);
    expect(solicitud.estado).toBe('pendiente');
    const pendientes = await obtener_solicitudes(id_b);
    expect(pendientes.map((s) => s.id_solicitud)).toContain(solicitud.id_solicitud);
  });

  it('rechaza una segunda solicitud pendiente entre el mismo par', async () => {
    await expect(enviar_solicitud(id_b, id_a)).rejects.toMatchObject({
      codigo: 'SOLICITUD_PENDIENTE',
    });
  });

  it('un tercero no puede responder la solicitud (403)', async () => {
    const id_c = await crear_usuario();
    const [solicitud] = await obtener_solicitudes(id_b);
    await expect(
      responder_solicitud(id_c, solicitud.id_solicitud, true),
    ).rejects.toBeInstanceOf(ErrorServicio);
    await expect(
      responder_solicitud(id_c, solicitud.id_solicitud, true),
    ).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO', estado_http: 403 });
  });

  it('al aceptar, ambos aparecen como amigos', async () => {
    const [solicitud] = await obtener_solicitudes(id_b);
    const actualizada = await responder_solicitud(id_b, solicitud.id_solicitud, true);
    expect(actualizada.estado).toBe('aceptado');

    const amigos_a = await obtener_lista_amigos(id_a);
    const amigos_b = await obtener_lista_amigos(id_b);
    expect(amigos_a.map((u) => u.id_usuario)).toContain(id_b);
    expect(amigos_b.map((u) => u.id_usuario)).toContain(id_a);
  });

  it('rechaza una nueva solicitud cuando ya son amigos (409)', async () => {
    await expect(enviar_solicitud(id_a, id_b)).rejects.toMatchObject({
      codigo: 'YA_SON_AMIGOS',
      estado_http: 409,
    });
  });

  it('eliminar_amistad borra el vinculo', async () => {
    await eliminar_amistad(id_a, id_b);
    const amigos_a = await obtener_lista_amigos(id_a);
    expect(amigos_a.map((u) => u.id_usuario)).not.toContain(id_b);
  });
});
