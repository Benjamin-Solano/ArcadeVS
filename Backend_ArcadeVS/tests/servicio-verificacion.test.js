/**
 * Pruebas de integración del servicio-verificacion contra la BD local real.
 * Cubren el flujo: registro (no verificado) → código en BD → intento fallido →
 * verificación correcta → login habilitado → reenvío. Los usuarios creados se
 * eliminan en afterAll (la cascada borra sus códigos).
 */

import '../src/configuracion/cargar-entorno.js';

// Evita enviar correos reales durante las pruebas (modo desarrollo del correo).
process.env.CORREO_HABILITADO = 'false';

import { afterAll, describe, expect, it } from 'vitest';
import {
  registrar_usuario,
  autenticar_usuario,
} from '../src/servicios/servicio-usuario.js';
import {
  verificar_codigo,
  reenviar_codigo,
  crear_y_enviar_codigo,
} from '../src/servicios/servicio-verificacion.js';
import { consultar, cerrar_pool } from '../src/configuracion/configuracion-db.js';

const ids_creados = [];

/** Datos de registro válidos y únicos por ejecución. */
function datos_registro_unicos() {
  const sufijo = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  return {
    nombre: `ver_${sufijo}`.slice(0, 50),
    apellido: 'Verificacion',
    correo: `ver_${sufijo}@test.com`,
    contrasena: 'contrasenaSegura123',
  };
}

/** Registra un usuario y guarda su id para limpieza. */
async function registrar_de_prueba() {
  const datos = datos_registro_unicos();
  const { usuario, codigo } = await registrar_usuario(datos);
  ids_creados.push(usuario.id_usuario);
  return { datos, usuario, codigo };
}

afterAll(async () => {
  for (const id of ids_creados) {
    await consultar('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
  }
  await cerrar_pool();
});

describe('servicio-verificacion', () => {
  it('el registro crea la cuenta no verificada y emite un código', async () => {
    const { usuario, codigo } = await registrar_de_prueba();

    expect(usuario.verificado).toBe(false);
    expect(codigo).toMatch(/^\d{6}$/);

    const filas = await consultar(
      'SELECT codigo_hash, usado FROM codigos_verificacion WHERE id_usuario = $1',
      [usuario.id_usuario],
    );
    expect(filas).toHaveLength(1);
    expect(filas[0].usado).toBe(false);
    // El código se guarda hasheado, no en texto plano.
    expect(filas[0].codigo_hash).not.toBe(codigo);
  });

  it('verificar_codigo rechaza un código incorrecto', async () => {
    const { datos } = await registrar_de_prueba();

    await expect(
      verificar_codigo(datos.correo, '000000'),
    ).rejects.toMatchObject({ codigo: 'CODIGO_INVALIDO' });
  });

  it('verificar_codigo con el código correcto activa la cuenta y permite login', async () => {
    const { datos, codigo } = await registrar_de_prueba();

    const verificado = await verificar_codigo(datos.correo, codigo);
    expect(verificado.verificado).toBe(true);

    const autenticado = await autenticar_usuario(datos.correo, datos.contrasena);
    expect(autenticado.correo).toBe(datos.correo.toLowerCase());
  });

  it('un código ya usado no se puede volver a verificar', async () => {
    const { datos, codigo } = await registrar_de_prueba();
    await verificar_codigo(datos.correo, codigo);

    await expect(
      verificar_codigo(datos.correo, codigo),
    ).rejects.toMatchObject({ codigo: 'CUENTA_YA_VERIFICADA' });
  });

  it('reenviar_codigo invalida el código anterior y emite uno nuevo', async () => {
    const { datos, usuario, codigo } = await registrar_de_prueba();

    await reenviar_codigo(datos.correo);

    // El código original queda invalidado (usado = TRUE).
    await expect(
      verificar_codigo(datos.correo, codigo),
    ).rejects.toMatchObject({ codigo: 'CODIGO_INVALIDO' });

    const vigentes = await consultar(
      'SELECT COUNT(*)::int AS n FROM codigos_verificacion WHERE id_usuario = $1 AND usado = FALSE',
      [usuario.id_usuario],
    );
    expect(vigentes[0].n).toBe(1);
  });

  it('crear_y_enviar_codigo devuelve un código de 6 dígitos', async () => {
    const { usuario } = await registrar_de_prueba();
    const codigo = await crear_y_enviar_codigo(usuario.id_usuario, `x_${Date.now()}@test.com`);
    expect(codigo).toMatch(/^\d{6}$/);
  });
});
