/**
 * Pruebas unitarias de configuracion-autenticacion (firma/verificacion de JWT).
 * No tocan la base de datos: fijan el secreto en el entorno y ejercitan el
 * ciclo firmar → verificar, ademas de los casos de error.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import {
  firmar_token,
  verificar_token,
  extraer_token,
  requerir_autenticacion,
} from '../src/configuracion/configuracion-autenticacion.js';
import { ErrorServicio } from '../src/servicios/error-servicio.js';

const ID_USUARIO = '11111111-1111-1111-1111-111111111111';

beforeAll(() => {
  process.env.SERVIDOR_JWT_SECRETO = 'secreto_de_prueba';
});

describe('firmar_token / verificar_token', () => {
  it('firma un token y lo verifica devolviendo el id_usuario', () => {
    const token = firmar_token(ID_USUARIO);
    const payload = verificar_token(token);
    expect(payload.id_usuario).toBe(ID_USUARIO);
  });

  it('rechaza un token invalido con ErrorServicio 401', () => {
    try {
      verificar_token('token.basura.invalido');
      expect.unreachable('deberia lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorServicio);
      expect(error.estado_http).toBe(401);
    }
  });
});

describe('extraer_token', () => {
  it('extrae el token del formato Bearer', () => {
    expect(extraer_token('Bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('devuelve null si la cabecera falta o no es Bearer', () => {
    expect(extraer_token(undefined)).toBeNull();
    expect(extraer_token('Basic abc')).toBeNull();
    expect(extraer_token('Bearer')).toBeNull();
  });
});

describe('requerir_autenticacion', () => {
  it('expone request.usuario cuando el token es valido', async () => {
    const token = firmar_token(ID_USUARIO);
    const peticion = { headers: { authorization: `Bearer ${token}` } };
    await requerir_autenticacion(peticion);
    expect(peticion.usuario.id_usuario).toBe(ID_USUARIO);
  });

  it('lanza ErrorServicio 401 si no hay token', async () => {
    const peticion = { headers: {} };
    await expect(requerir_autenticacion(peticion)).rejects.toMatchObject({
      estado_http: 401,
      codigo: 'NO_AUTENTICADO',
    });
  });
});
