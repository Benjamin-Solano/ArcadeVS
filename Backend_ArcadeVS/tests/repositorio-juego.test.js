/**
 * Pruebas de integracion del repositorio-juego contra la BD local real.
 * Crea juegos y tags con identificadores unicos y los limpia en afterAll.
 */

import '../src/configuracion/cargar-entorno.js';

import { afterAll, describe, expect, it } from 'vitest';
import {
  guardar_juego,
  obtener_juego_por_id,
  obtener_juego_por_slug,
  obtener_juegos_activos,
  obtener_tags_de_juego,
  obtener_juegos_por_tag,
} from '../src/repositorios/repositorio-juego.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

const ids_juegos = [];
const ids_tags = [];

/** Sufijo unico para nombres/slugs de prueba. */
function sufijo_unico() {
  return `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

/** Crea un juego de prueba y registra su id para limpieza. */
async function crear_juego_de_prueba(extra = {}) {
  const s = sufijo_unico();
  const datos = {
    nombre: `Juego ${s}`,
    slug: `juego-${s}`,
    descripcion: 'Juego de prueba',
    ...extra,
  };
  const creado = await guardar_juego(datos);
  ids_juegos.push(creado.id_juego);
  return { datos, creado };
}

/** Inserta un tag de prueba y lo vincula a un juego. */
async function vincular_tag(id_juego, nombre_tag) {
  const filas = await consultar(
    'INSERT INTO tags (nombre) VALUES ($1) RETURNING id_tag',
    [nombre_tag],
  );
  const id_tag = filas[0].id_tag;
  ids_tags.push(id_tag);
  await consultar(
    'INSERT INTO juegos_tags (id_juego, id_tag) VALUES ($1, $2)',
    [id_juego, id_tag],
  );
  return id_tag;
}

afterAll(async () => {
  // juegos_tags se borra por CASCADE al eliminar juegos y tags.
  for (const id of ids_juegos) {
    await consultar('DELETE FROM juegos WHERE id_juego = $1', [id]);
  }
  for (const id of ids_tags) {
    await consultar('DELETE FROM tags WHERE id_tag = $1', [id]);
  }
  await cerrar_pool();
});

describe('repositorio-juego', () => {
  it('guardar_juego crea el juego y lo retorna', async () => {
    const { datos, creado } = await crear_juego_de_prueba();

    expect(creado.id_juego).toBeTruthy();
    expect(creado.nombre).toBe(datos.nombre);
    expect(creado.slug).toBe(datos.slug);
    expect(creado.activo).toBe(true);
  });

  it('obtener_juego_por_slug encuentra el juego', async () => {
    const { datos, creado } = await crear_juego_de_prueba();

    const encontrado = await obtener_juego_por_slug(datos.slug);
    expect(encontrado).not.toBeNull();
    expect(encontrado.id_juego).toBe(creado.id_juego);
  });

  it('obtener_juego_por_id devuelve null si no existe', async () => {
    const inexistente = await obtener_juego_por_id(
      '00000000-0000-0000-0000-000000000000',
    );
    expect(inexistente).toBeNull();
  });

  it('obtener_juegos_activos incluye el juego activo y excluye el inactivo', async () => {
    const { creado: activo } = await crear_juego_de_prueba();
    const { creado: inactivo } = await crear_juego_de_prueba({ activo: false });

    const activos = await obtener_juegos_activos();
    const ids = activos.map((j) => j.id_juego);
    expect(ids).toContain(activo.id_juego);
    expect(ids).not.toContain(inactivo.id_juego);
  });

  it('obtener_tags_de_juego devuelve los tags vinculados', async () => {
    const { creado } = await crear_juego_de_prueba();
    const nombre_tag = `estrategia_${sufijo_unico()}`;
    await vincular_tag(creado.id_juego, nombre_tag);

    const tags = await obtener_tags_de_juego(creado.id_juego);
    expect(tags.map((t) => t.nombre)).toContain(nombre_tag);
  });

  it('obtener_juegos_por_tag lista los juegos con ese tag', async () => {
    const { creado } = await crear_juego_de_prueba();
    const nombre_tag = `puzzle_${sufijo_unico()}`;
    await vincular_tag(creado.id_juego, nombre_tag);

    const juegos = await obtener_juegos_por_tag(nombre_tag);
    expect(juegos.map((j) => j.id_juego)).toContain(creado.id_juego);
  });
});
