import { useEffect, useState } from 'react';
import MarcoDossier from '../componentes/perfil/marco-dossier.jsx';
import FotoPerfil from '../componentes/perfil/foto-perfil.jsx';
import EstadisticasJuego from '../componentes/perfil/estadisticas-juego.jsx';
import BarraCodigo from '../componentes/perfil/barra-codigo.jsx';
import EditorNombre from '../componentes/perfil/editor-nombre.jsx';
import SelectorNacionalidad from '../componentes/perfil/selector-nacionalidad.jsx';
import PanelAfinidad from '../componentes/perfil/panel-afinidad.jsx';
import {
  FilaDato,
  Nivel,
  BotonCopiar,
  formatear_fecha,
  formatear_fecha_hora,
  nivel_por_victorias,
} from '../componentes/perfil/campos-perfil.jsx';
import { obtener_estadisticas, actualizar_perfil } from '../servicios/servicio-usuario.js';
import { actualizar_usuario as actualizar_usuario_sesion } from '../servicios/almacenamiento-sesion.js';

/** Estadisticas en cero mientras se cargan (o si el usuario aun no ha jugado). */
const ESTADISTICAS_VACIAS = { partidas: 0, victorias: 0, derrotas: 0, empates: 0, torneos: 0, amigos: 0, tags: [] };

/**
 * PaginaPerfil — expediente del usuario con estetica de dossier cyberpunk. Se pensó
 * para montarse dentro del cuerpo del inicio (la barra y el fondo CRT los aporta el
 * contenedor). Los datos personales salen del usuario en sesion (respuesta del login)
 * y las estadisticas se piden al backend (GET /usuarios/estadisticas). Distribucion
 * horizontal: datos personales y estadisticas lado a lado, con codigo de barras al pie.
 *
 * @param {object} props
 * @param {object} props.usuario - Usuario en sesion (campos publicos reales).
 * @param {(usuario: object) => void} props.al_actualizar_usuario - Propaga cambios de perfil.
 */
export default function PaginaPerfil({ usuario, al_actualizar_usuario }) {
  const [estadisticas, set_estadisticas] = useState(ESTADISTICAS_VACIAS);

  // Trae las estadisticas reales del usuario autenticado al montar el perfil.
  useEffect(() => {
    let vigente = true;
    obtener_estadisticas()
      .then((datos) => { if (vigente) set_estadisticas(datos); })
      .catch(() => { if (vigente) set_estadisticas(ESTADISTICAS_VACIAS); });
    return () => { vigente = false; };
  }, [usuario?.id_usuario]);

  /**
   * Persiste el nuevo avatar en la BD (PUT /usuarios/perfil) y refresca la sesion.
   * Reenvia nacionalidad y fecha_nacimiento actuales porque el backend reemplaza
   * los tres campos editables en cada actualizacion.
   */
  const guardar_avatar = async (avatar_url) => {
    const actualizado = await actualizar_perfil({
      avatar_url,
      nacionalidad: usuario?.nacionalidad ?? null,
      fecha_nacimiento: usuario?.fecha_nacimiento ?? null,
    });
    actualizar_usuario_sesion(actualizado);
    al_actualizar_usuario?.(actualizado);
  };

  /**
   * Persiste la nacionalidad elegida en el selector (PUT /usuarios/perfil) y refresca
   * la sesion. Reenvia avatar y fecha_nacimiento actuales porque el backend reemplaza
   * los tres campos editables en cada actualizacion.
   */
  const guardar_nacionalidad = async (nacionalidad) => {
    const actualizado = await actualizar_perfil({
      avatar_url: usuario?.avatar_url ?? null,
      nacionalidad,
      fecha_nacimiento: usuario?.fecha_nacimiento ?? null,
    });
    actualizar_usuario_sesion(actualizado);
    al_actualizar_usuario?.(actualizado);
  };

  const codigo_amigo = (usuario?.codigo_amigo || 'SIN-CODIGO').toUpperCase();
  const p = {
    nombre: (usuario?.nombre || 'JUGADOR').toUpperCase(),
    codigo_amigo,
    fecha_registro: formatear_fecha(usuario?.fecha_registro),
    rol: (usuario?.rol || 'JUGADOR').toUpperCase(),
    estado: usuario?.verificado ? 'ACTIVO' : 'NO VERIFICADO',
    ultima_conexion: formatear_fecha_hora(usuario?.ultima_conexion),
    nivel: nivel_por_victorias(estadisticas.victorias),
  };

  return (
    <div style={{ width: '100%', maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px', padding: '8px 0 40px' }}>
      {/* Encabezado del expediente */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontFamily: "'Silkscreen', monospace", fontWeight: 700, fontSize: '20px', letterSpacing: '0.12em', color: 'var(--neon-pink)', textShadow: '0 0 10px rgba(var(--glow-neon),.5)' }}>
          EXPEDIENTE // {p.nombre}
        </div>
        <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.16em', color: 'var(--pink-faint)' }}>ARCADEVS · PERFIL DE USUARIO</div>
      </div>

      {/* Fila horizontal: datos personales | estadisticas */}
      <div style={{ display: 'flex', gap: '18px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* Datos personales: foto + expediente + codigo de barras al fondo */}
        <MarcoDossier titulo="DATOS PERSONALES" etiqueta_derecha={p.codigo_amigo} style={{ flex: '1 1 460px', minWidth: '320px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '18px' }}>
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 230px', maxWidth: '230px' }}>
                <FotoPerfil nombre={p.nombre} avatar_inicial={usuario?.avatar_url ?? null} al_guardar={guardar_avatar} />
              </div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <FilaDato etiqueta="ALIAS">
                  <EditorNombre nombre={usuario?.nombre || 'JUGADOR'} al_guardado={al_actualizar_usuario} />
                </FilaDato>
                <FilaDato etiqueta="CODIGO AMIGO">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    {p.codigo_amigo}
                    <BotonCopiar texto={p.codigo_amigo} />
                  </span>
                </FilaDato>
                <FilaDato etiqueta="NACIONALIDAD">
                  <SelectorNacionalidad valor={usuario?.nacionalidad || ''} al_guardar={guardar_nacionalidad} />
                </FilaDato>
                <FilaDato etiqueta="FECHA DE INGRESO">{p.fecha_registro}</FilaDato>
                <FilaDato etiqueta="FUNCION">{p.rol}</FilaDato>
                <FilaDato etiqueta="ESTADO">{p.estado}</FilaDato>
                <FilaDato etiqueta="ULTIMA CONEXION">{p.ultima_conexion}</FilaDato>
                <FilaDato etiqueta="SEGUIDORES / AMIGOS">{estadisticas.amigos}</FilaDato>
                <FilaDato etiqueta="NIVEL DE JUGADOR"><Nivel nivel={p.nivel} /></FilaDato>
              </div>
            </div>

            {/* Decoracion de codigo de barras: al fondo del panel de datos personales */}
            <div style={{ marginTop: 'auto' }}>
              <BarraCodigo semilla={p.codigo_amigo + p.nombre} codigo={`ARCADEVS-${p.codigo_amigo}`} />
            </div>
          </div>
        </MarcoDossier>

        {/* Estadisticas de combate + afinidad de juego (radar) */}
        <MarcoDossier titulo="ESTADISTICAS DE JUEGO" etiqueta_derecha={`${estadisticas.partidas} PARTIDAS`} style={{ flex: '1 1 420px', minWidth: '320px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <EstadisticasJuego
              partidas={estadisticas.partidas}
              victorias={estadisticas.victorias}
              derrotas={estadisticas.derrotas}
              empates={estadisticas.empates}
              torneos={estadisticas.torneos}
            />
            <PanelAfinidad tags={estadisticas.tags} />
          </div>
        </MarcoDossier>
      </div>
    </div>
  );
}
