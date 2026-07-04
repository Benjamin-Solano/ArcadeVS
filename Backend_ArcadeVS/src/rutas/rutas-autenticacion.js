/**
 * Rutas REST del dominio autenticacion (capa de entrada HTTP).
 *
 * Reciben los datos del cliente, delegan la logica en servicio-usuario y, ante
 * un registro o login valido, firman un JWT propio (configuracion-autenticacion)
 * que el cliente enviara luego en la cabecera Authorization. No escriben SQL ni
 * contienen logica de negocio; los errores de negocio (ErrorServicio) los
 * traduce el manejador global de errores de Fastify.
 *
 * Prefijo montado en index.js: /auth
 *   POST /auth/registro  → crea la cuenta y devuelve { usuario, token }.
 *   POST /auth/login     → autentica y devuelve { usuario, token }.
 */

import {
  registrar_usuario,
  autenticar_usuario,
} from '../servicios/servicio-usuario.js';
import { firmar_token } from '../configuracion/configuracion-autenticacion.js';

/**
 * Registra las rutas de autenticacion sobre la instancia de Fastify.
 *
 * @param {import('fastify').FastifyInstance} servidor - Instancia (o scope) de Fastify.
 * @returns {Promise<void>}
 */
export async function registrar_rutas_autenticacion(servidor) {
  /** Crea una cuenta nueva y devuelve el usuario con su token de sesion. */
  servidor.post('/registro', async (peticion, respuesta) => {
    const usuario = await registrar_usuario(peticion.body ?? {});
    const token = firmar_token(usuario.id_usuario);
    return respuesta.code(201).send({ usuario, token });
  });

  /** Autentica por correo y contrasena y devuelve el usuario con su token. */
  servidor.post('/login', async (peticion) => {
    const { correo, contrasena } = peticion.body ?? {};
    const usuario = await autenticar_usuario(correo, contrasena);
    const token = firmar_token(usuario.id_usuario);
    return { usuario, token };
  });
}
