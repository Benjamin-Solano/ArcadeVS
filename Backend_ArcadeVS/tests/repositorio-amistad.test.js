/**
 * Pruebas de integracion del repositorio-amistad contra la BD local real.
 * Verifica el orden canonico (id_solicitante < id_receptor) y el flujo de amistad.
 * Crea usuarios de prueba y los limpia en afterAll (las solicitudes caen por CASCADE).
 */

import '../src/configuracion/cargar-entorno.js';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ordenar_par_canonico,
  guardar_solicitud,
  obtener_solicitud_entre,
  actualizar_estado,
  obtener_amigos,
  obtener_solicitudes_pendientes,
} from '../src/repositorios/repositorio-amistad.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

const ids_usuarios = [];

/** Codigo de amigo unico de 12 caracteres. */
function codigo_amigo_unico() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2))
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 12)
    .padEnd(12, '0')
    .toUpperCase();
}

/** Inserta un usuario minimo de prueba y devuelve su id. */
async function crear_usuario() {
  const s = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const filas = await consultar(
    `INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, codigo_amigo)
     VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario`,
    [`amigo_${s}`.slice(0, 50), 'Prueba', `amigo_${s}@test.com`, 'hash', codigo_amigo_unico()],
  );
  const id = filas[0].id_usuario;
  ids_usuarios.push(id);
  return id;
}

let id_a;
let id_b;
let id_menor;
let id_mayor;

beforeAll(async () => {
  id_a = await crear_usuario();
  id_b = await crear_usuario();
  [id_menor, id_mayor] = ordenar_par_canonico(id_a, id_b);
});

afterAll(async () => {
  for (const id of ids_usuarios) {
    await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
  }
  await cerrar_pool();
});

describe('repositorio-amistad', () => {
  it('ordenar_par_canonico devuelve [menor, mayor] sin importar el orden de entrada', () => {
    expect(ordenar_par_canonico('bbb', 'aaa')).toEqual(['aaa', 'bbb']);
    expect(ordenar_par_canonico('aaa', 'bbb')).toEqual(['aaa', 'bbb']);
  });

  it('guardar_solicitud almacena el par en orden canonico aunque se pase invertido', async () => {
    // Se pasa (mayor, menor) a proposito: debe guardarse solicitante = menor.
    const solicitud = await guardar_solicitud(id_mayor, id_menor);

    expect(solicitud.id_solicitante).toBe(id_menor);
    expect(solicitud.id_receptor).toBe(id_mayor);
    expect(solicitud.estado).toBe('pendiente');
  });

  it('obtener_solicitud_entre encuentra la solicitud en ambas direcciones', async () => {
    const desde_a = await obtener_solicitud_entre(id_a, id_b);
    const desde_b = await obtener_solicitud_entre(id_b, id_a);

    expect(desde_a).not.toBeNull();
    expect(desde_b).not.toBeNull();
    expect(desde_a.id_solicitud).toBe(desde_b.id_solicitud);
  });

  it('obtener_solicitudes_pendientes lista la solicitud para ambos usuarios', async () => {
    const pendientes_a = await obtener_solicitudes_pendientes(id_a);
    const pendientes_b = await obtener_solicitudes_pendientes(id_b);

    expect(pendientes_a.length).toBeGreaterThanOrEqual(1);
    expect(pendientes_b.length).toBeGreaterThanOrEqual(1);
  });

  it('el CHECK impide una solicitud duplicada invertida', async () => {
    // Ya existe (menor, mayor); intentar de nuevo (invertido) viola UNIQUE.
    await expect(guardar_solicitud(id_b, id_a)).rejects.toThrow();
  });

  it('al aceptar, obtener_amigos devuelve el amigo para ambos usuarios', async () => {
    const solicitud = await obtener_solicitud_entre(id_a, id_b);
    await actualizar_estado(solicitud.id_solicitud, 'aceptado');

    const amigos_de_a = await obtener_amigos(id_a);
    const amigos_de_b = await obtener_amigos(id_b);

    expect(amigos_de_a.map((u) => u.id_usuario)).toContain(id_b);
    expect(amigos_de_b.map((u) => u.id_usuario)).toContain(id_a);
  });
});
