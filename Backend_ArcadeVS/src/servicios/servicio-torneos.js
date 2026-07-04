/**
 * Servicio de torneos — logica de negocio de torneos e inscripciones.
 *
 * No escribe SQL (delega en repositorio-torneo) ni emite eventos Socket.io.
 * Aplica las reglas: existencia de juego/modalidad al crear, cupo e inscripcion
 * unica al inscribir, y la transicion unidireccional del estado del torneo
 * (`inscripcion → en_curso → finalizado`). Cada transicion solo es valida desde
 * el estado previo correcto.
 *
 * Autorizacion (modelo dueño-admin): cualquier usuario autenticado crea un
 * torneo y queda como su dueño (id_creador). Iniciar/finalizar solo lo permite el
 * dueño o un administrador (ver exigir_dueno_o_admin en autorizacion.js). La
 * inscripcion y su cancelacion son acciones del propio usuario.
 */

import {
  guardar_torneo,
  obtener_torneo_por_id,
  obtener_torneos,
  actualizar_estado_torneo,
  inscribir_participante,
  obtener_participacion,
  obtener_participantes,
  contar_participantes,
  eliminar_participante,
} from '../repositorios/repositorio-torneo.js';
import { obtener_juego_por_id } from '../repositorios/repositorio-juego.js';
import { obtener_modalidad_por_id } from '../repositorios/repositorio-modalidad.js';
import { ErrorServicio } from './error-servicio.js';
import { exigir_dueno_o_admin } from './autorizacion.js';
import { validar_datos_torneo } from './validaciones-torneo.js';

/** Minimo de participantes para poder iniciar un torneo. */
const MINIMO_PARTICIPANTES = 2;

/**
 * Obtiene un torneo por id o lanza 404 si no existe.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @returns {Promise<object>} El torneo.
 */
async function exigir_torneo(id_torneo) {
  const torneo = await obtener_torneo_por_id(id_torneo);
  if (!torneo) {
    throw new ErrorServicio('TORNEO_NO_ENCONTRADO', 'El torneo no existe.', 404);
  }
  return torneo;
}

/**
 * Crea un torneo (estado inicial 'inscripcion'). Valida el formato y que el
 * juego y la modalidad existan. El usuario que lo crea queda como dueño.
 *
 * @param {object} datos_crudos - Datos recibidos del cliente.
 * @param {string} id_creador - UUID del usuario autenticado que crea el torneo.
 * @returns {Promise<object>} El torneo creado.
 */
export async function crear_torneo(datos_crudos, id_creador) {
  const datos = validar_datos_torneo(datos_crudos);

  if (!(await obtener_juego_por_id(datos.id_juego))) {
    throw new ErrorServicio('JUEGO_NO_ENCONTRADO', 'El juego no existe.', 404);
  }
  if (!(await obtener_modalidad_por_id(datos.id_modalidad))) {
    throw new ErrorServicio('MODALIDAD_NO_ENCONTRADA', 'La modalidad no existe.', 404);
  }
  return guardar_torneo({ ...datos, id_creador });
}

/**
 * Lista torneos, opcionalmente filtrando por estado.
 *
 * @param {string|null} [estado] - Estado a filtrar, o null para todos.
 * @returns {Promise<Array<object>>} Torneos.
 */
export async function listar_torneos(estado = null) {
  return obtener_torneos(estado);
}

/**
 * Obtiene el detalle de un torneo con sus participantes y el total inscrito.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @returns {Promise<object>} El torneo con `participantes` y `total_participantes`.
 */
export async function obtener_torneo(id_torneo) {
  const torneo = await exigir_torneo(id_torneo);
  const participantes = await obtener_participantes(id_torneo);
  return { ...torneo, participantes, total_participantes: participantes.length };
}

/**
 * Inscribe a un usuario en un torneo. Reglas: el torneo debe estar en
 * 'inscripcion', el usuario no puede estar ya inscrito y no se supera el cupo.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @param {string} id_usuario - UUID del usuario que se inscribe.
 * @returns {Promise<object>} La inscripcion creada.
 */
export async function inscribir_usuario(id_torneo, id_usuario) {
  const torneo = await exigir_torneo(id_torneo);
  if (torneo.estado !== 'inscripcion') {
    throw new ErrorServicio(
      'INSCRIPCION_CERRADA',
      'El torneo no admite inscripciones en su estado actual.',
      409,
    );
  }
  if (await obtener_participacion(id_torneo, id_usuario)) {
    throw new ErrorServicio('YA_INSCRITO', 'Ya estas inscrito en este torneo.', 409);
  }
  if (torneo.max_participantes !== null) {
    const total = await contar_participantes(id_torneo);
    if (total >= torneo.max_participantes) {
      throw new ErrorServicio('TORNEO_LLENO', 'El torneo alcanzo su cupo maximo.', 409);
    }
  }
  return inscribir_participante(id_torneo, id_usuario);
}

/**
 * Cancela la inscripcion de un usuario. Solo mientras el torneo sigue en
 * 'inscripcion' y si el usuario estaba inscrito.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @param {string} id_usuario - UUID del usuario.
 * @returns {Promise<void>}
 */
export async function cancelar_inscripcion(id_torneo, id_usuario) {
  const torneo = await exigir_torneo(id_torneo);
  if (torneo.estado !== 'inscripcion') {
    throw new ErrorServicio(
      'INSCRIPCION_CERRADA',
      'Ya no puedes cancelar la inscripcion en este torneo.',
      409,
    );
  }
  if (!(await obtener_participacion(id_torneo, id_usuario))) {
    throw new ErrorServicio('NO_INSCRITO', 'No estas inscrito en este torneo.', 404);
  }
  await eliminar_participante(id_torneo, id_usuario);
}

/**
 * Inicia un torneo: transicion 'inscripcion' → 'en_curso'. Solo el dueño o un
 * admin, y con el minimo de participantes.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @param {string} id_actor - UUID del usuario que gestiona (dueño o admin).
 * @returns {Promise<object>} El torneo actualizado.
 */
export async function iniciar_torneo(id_torneo, id_actor) {
  const torneo = await exigir_torneo(id_torneo);
  await exigir_dueno_o_admin(torneo.id_creador, id_actor);
  if (torneo.estado !== 'inscripcion') {
    throw new ErrorServicio(
      'TRANSICION_INVALIDA',
      'Solo se puede iniciar un torneo en inscripcion.',
      409,
    );
  }
  if ((await contar_participantes(id_torneo)) < MINIMO_PARTICIPANTES) {
    throw new ErrorServicio(
      'PARTICIPANTES_INSUFICIENTES',
      `Se requieren al menos ${MINIMO_PARTICIPANTES} participantes para iniciar.`,
      409,
    );
  }
  return actualizar_estado_torneo(id_torneo, 'en_curso');
}

/**
 * Finaliza un torneo: transicion 'en_curso' → 'finalizado'. Solo el dueño o un
 * admin.
 *
 * @param {string} id_torneo - UUID del torneo.
 * @param {string} id_actor - UUID del usuario que gestiona (dueño o admin).
 * @returns {Promise<object>} El torneo actualizado.
 */
export async function finalizar_torneo(id_torneo, id_actor) {
  const torneo = await exigir_torneo(id_torneo);
  await exigir_dueno_o_admin(torneo.id_creador, id_actor);
  if (torneo.estado !== 'en_curso') {
    throw new ErrorServicio(
      'TRANSICION_INVALIDA',
      'Solo se puede finalizar un torneo en curso.',
      409,
    );
  }
  return actualizar_estado_torneo(id_torneo, 'finalizado');
}
