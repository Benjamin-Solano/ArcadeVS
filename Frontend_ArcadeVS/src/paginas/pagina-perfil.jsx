import { useEffect, useState } from 'react';
import GlifoPixel from '../componentes/crt/glifo-pixel.jsx';
import MarcoDossier from '../componentes/perfil/marco-dossier.jsx';
import FotoPerfil from '../componentes/perfil/foto-perfil.jsx';
import EstadisticasJuego from '../componentes/perfil/estadisticas-juego.jsx';
import BarraCodigo from '../componentes/perfil/barra-codigo.jsx';
import { obtener_estadisticas, actualizar_perfil } from '../servicios/servicio-usuario.js';
import { actualizar_usuario as actualizar_usuario_sesion } from '../servicios/almacenamiento-sesion.js';

/** Fila etiqueta-valor del expediente, con separador tenue inferior. */
function FilaDato({ etiqueta, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(var(--glow-neon),.12)' }}>
      <span style={{ flex: '0 0 130px', fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.12em', color: 'var(--pink-dim)' }}>{etiqueta}</span>
      <span style={{ flex: 1, textAlign: 'right', fontFamily: "'Silkscreen', monospace", fontSize: '10px', letterSpacing: '0.06em', color: 'var(--petal-white)', textShadow: '0 0 6px rgba(var(--glow-pink),.45)' }}>
        {children}
      </span>
    </div>
  );
}

/** Boton pequeño que copia un texto al portapapeles con feedback breve. */
function BotonCopiar({ texto }) {
  const [copiado, set_copiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      set_copiado(true);
      setTimeout(() => set_copiado(false), 1500);
    } catch {
      set_copiado(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copiar}
      title="COPIAR CODIGO DE AMIGO"
      style={{
        height: '20px',
        padding: '0 8px',
        background: 'var(--bg-panel)',
        border: `1px solid rgba(var(--glow-cel),${copiado ? 0.9 : 0.55})`,
        color: 'var(--celadon)',
        fontFamily: "'Silkscreen', monospace",
        fontSize: '8px',
        letterSpacing: '0.10em',
        textShadow: '0 0 6px rgba(var(--glow-cel),.5)',
        cursor: 'pointer',
      }}
    >
      {copiado ? 'COPIADO' : 'COPIAR'}
    </button>
  );
}

/** Nivel de jugador dibujado con glifos estrella (llenas/vacias). */
function Nivel({ nivel = 1, maximo = 5 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '4px', justifyContent: 'flex-end' }}>
      {Array.from({ length: maximo }).map((_, i) => (
        <GlifoPixel key={i} name="star" size={12} color={i < nivel ? 'var(--neon-pink)' : 'var(--pink-faint)'} glow={i < nivel ? 'var(--glow-neon)' : 'var(--glow-pink)'} />
      ))}
    </span>
  );
}

/** Formatea una fecha ISO a DD/MM/AAAA; si no parsea, devuelve el valor original. */
function formatear_fecha(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Formatea una marca de tiempo a DD/MM/AAAA HH:MM; '—' si no hay valor. */
function formatear_fecha_hora(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${formatear_fecha(valor)} ${hh}:${min}`;
}

/** Deriva un nivel 1-5 a partir de las victorias (una estrella por cada 10). */
function nivel_por_victorias(victorias) {
  return Math.min(5, Math.max(1, 1 + Math.floor((Number(victorias) || 0) / 10)));
}

/** Estadisticas en cero mientras se cargan (o si el usuario aun no ha jugado). */
const ESTADISTICAS_VACIAS = { partidas: 0, victorias: 0, derrotas: 0, empates: 0, torneos: 0, amigos: 0 };

/**
 * PaginaPerfil — expediente del usuario con estetica de dossier cyberpunk. Se pensó
 * para montarse dentro del cuerpo del inicio (la barra y el fondo CRT los aporta el
 * contenedor). Los datos personales salen del usuario en sesion (respuesta del login)
 * y las estadisticas se piden al backend (GET /usuarios/estadisticas). Distribucion
 * horizontal: datos personales y estadisticas lado a lado, con codigo de barras al pie.
 *
 * @param {object} props
 * @param {object} props.usuario - Usuario en sesion (campos publicos reales).
 */
export default function PaginaPerfil({ usuario }) {
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
  };

  const codigo_amigo = (usuario?.codigo_amigo || 'SIN-CODIGO').toUpperCase();
  const p = {
    nombre: (usuario?.nombre || 'JUGADOR').toUpperCase(),
    codigo_amigo,
    nacionalidad: (usuario?.nacionalidad || '—').toUpperCase(),
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
              <div style={{ flex: '0 0 180px', maxWidth: '180px' }}>
                <FotoPerfil nombre={p.nombre} avatar_inicial={usuario?.avatar_url ?? null} al_guardar={guardar_avatar} />
              </div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <FilaDato etiqueta="ALIAS">{p.nombre}</FilaDato>
                <FilaDato etiqueta="CODIGO AMIGO">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    {p.codigo_amigo}
                    <BotonCopiar texto={p.codigo_amigo} />
                  </span>
                </FilaDato>
                <FilaDato etiqueta="NACIONALIDAD">{p.nacionalidad}</FilaDato>
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

        {/* Estadisticas de combate */}
        <MarcoDossier titulo="ESTADISTICAS DE JUEGO" etiqueta_derecha={`${estadisticas.partidas} PARTIDAS`} style={{ flex: '1 1 420px', minWidth: '320px' }}>
          <EstadisticasJuego
            partidas={estadisticas.partidas}
            victorias={estadisticas.victorias}
            derrotas={estadisticas.derrotas}
            empates={estadisticas.empates}
            torneos={estadisticas.torneos}
          />
        </MarcoDossier>
      </div>
    </div>
  );
}
