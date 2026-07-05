/**
 * Rutas REST del dominio autenticacion (capa de entrada HTTP).
 *
 * Reciben los datos del cliente y delegan la logica en servicio-usuario /
 * servicio-verificacion. El registro ya NO firma token: la cuenta nace no
 * verificada y el login queda bloqueado hasta confirmar el codigo enviado al
 * correo. Solo el login (de una cuenta verificada) firma un JWT propio
 * (configuracion-autenticacion). No escriben SQL ni contienen logica de
 * negocio; los errores de negocio (ErrorServicio) los traduce el manejador
 * global de errores de Fastify.
 *
 * Prefijo montado en index.js: /auth
 *   POST /auth/registro  → crea la cuenta (no verificada) y envia el codigo.
 *   POST /auth/verificar → confirma el codigo y activa la cuenta.
 *   POST /auth/reenviar  → reenvia un codigo nuevo.
 *   POST /auth/login     → autentica (solo verificados) y devuelve { usuario, token }.
 */

import {
  registrar_usuario,
  autenticar_usuario,
} from '../servicios/servicio-usuario.js';
import {
  verificar_codigo,
  reenviar_codigo,
} from '../servicios/servicio-verificacion.js';
import { firmar_token } from '../configuracion/configuracion-autenticacion.js';

/** @returns {boolean} true si el backend corre en entorno de desarrollo. */
function es_desarrollo() {
  return process.env.SERVIDOR_ENTORNO === 'desarrollo';
}

/**
 * Registra las rutas de autenticacion sobre la instancia de Fastify.
 *
 * @param {import('fastify').FastifyInstance} servidor - Instancia (o scope) de Fastify.
 * @returns {Promise<void>}
 */
export async function registrar_rutas_autenticacion(servidor) {
  /** Crea una cuenta (no verificada) y envia el codigo de verificacion. */
  servidor.post('/registro', async (peticion, respuesta) => {
    const { usuario, codigo } = await registrar_usuario(peticion.body ?? {});
    const cuerpo = { usuario, pendiente_verificacion: true };
    // En desarrollo se expone el codigo para poder probar sin correo real.
    if (es_desarrollo()) {
      cuerpo.codigo_dev = codigo;
    }
    return respuesta.code(201).send(cuerpo);
  });

  /** Verifica el codigo de 6 digitos y activa la cuenta. */
  servidor.post('/verificar', async (peticion) => {
    const { correo, codigo } = peticion.body ?? {};
    const usuario = await verificar_codigo(correo, codigo);
    return { usuario, verificado: true };
  });

  /** Reenvia un codigo de verificacion nuevo al correo del usuario. */
  servidor.post('/reenviar', async (peticion) => {
    const { correo } = peticion.body ?? {};
    await reenviar_codigo(correo);
    return { pendiente_verificacion: true };
  });

  /** Autentica por correo y contrasena y devuelve el usuario con su token. */
  servidor.post('/login', async (peticion) => {
    const { correo, contrasena } = peticion.body ?? {};
    const usuario = await autenticar_usuario(correo, contrasena);
    const token = firmar_token(usuario.id_usuario);
    return { usuario, token };
  });
}
