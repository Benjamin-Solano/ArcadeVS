import { useContext } from 'react';
import { ContextoTema } from '../contextos/contexto-tema.jsx';
import GlifoPixel from './crt/glifo-pixel.jsx';
import BadgeTema from './crt/badge-tema.jsx';

/** Secciones de navegacion del inicio. El id se usa para marcar la activa. */
const SECCIONES = [
  { id: 'inicio', etiqueta: 'INICIO', glifo: 'grid' },
  { id: 'juegos', etiqueta: 'JUEGOS', glifo: 'dice' },
  { id: 'torneos', etiqueta: 'TORNEOS', glifo: 'crown' },
  { id: 'ranking', etiqueta: 'RANKING', glifo: 'star' },
  { id: 'amigos', etiqueta: 'AMIGOS', glifo: 'petal' },
];

/**
 * Divisor — linea vertical de 1px con glow difuso que separa los segmentos de la barra.
 */
function Divisor() {
  return (
    <div style={{ position: 'relative', width: '1px', alignSelf: 'stretch', margin: '10px 0' }}>
      <div style={{ position: 'absolute', top: 0, left: '-2px', width: '5px', height: '100%', background: 'rgba(var(--glow-neon),.06)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '100%', background: 'rgba(var(--glow-neon),.22)' }} />
    </div>
  );
}

/**
 * EsquinaBisel — acento en forma de L en una esquina de la barra. Da la estetica
 * futurista de panel tecnico recortado (como los cortes de la pantalla de referencia).
 * @param {object} props
 * @param {('tl'|'tr'|'bl'|'br')} props.pos - Esquina donde se ancla.
 */
function EsquinaBisel({ pos }) {
  const v = { position: 'absolute', width: '2px', height: '12px', background: 'var(--neon-pink)', boxShadow: '0 0 6px rgba(var(--glow-neon),.7)' };
  const h = { position: 'absolute', width: '12px', height: '2px', background: 'var(--neon-pink)', boxShadow: '0 0 6px rgba(var(--glow-neon),.7)' };
  const anclas = {
    tl: { v: { top: -1, left: -1 }, h: { top: -1, left: -1 } },
    tr: { v: { top: -1, right: -1 }, h: { top: -1, right: -1 } },
    bl: { v: { bottom: -1, left: -1 }, h: { bottom: -1, left: -1 } },
    br: { v: { bottom: -1, right: -1 }, h: { bottom: -1, right: -1 } },
  }[pos];
  return (
    <>
      <div style={{ ...v, ...anclas.v }} />
      <div style={{ ...h, ...anclas.h }} />
    </>
  );
}

/**
 * ItemNav — celda de navegacion con glifo pixel + etiqueta. La activa emite mas
 * brillo y lleva un subrayado neon; las inactivas quedan atenuadas.
 */
function ItemNav({ seccion, activo, onClick }) {
  const color = activo ? 'var(--petal-white)' : 'var(--pink-dim)';
  return (
    <button
      type="button"
      onClick={onClick}
      title={seccion.etiqueta}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '100%',
        padding: '0 16px',
        background: activo ? 'rgba(var(--glow-neon),.06)' : 'transparent',
        border: 'none',
        color,
        fontFamily: "'Silkscreen', monospace",
        fontSize: '10px',
        letterSpacing: '0.12em',
        textShadow: activo ? '0 0 8px rgba(var(--glow-pink),.6)' : 'none',
      }}
    >
      <GlifoPixel name={seccion.glifo} size={13} color={activo ? 'var(--neon-pink)' : 'var(--pink-dim)'} />
      {seccion.etiqueta}
      {activo && (
        <span style={{ position: 'absolute', left: '10px', right: '10px', bottom: '6px', height: '2px', background: 'var(--neon-pink)', boxShadow: '0 0 6px rgba(var(--glow-neon),.8)' }} />
      )}
    </button>
  );
}

/**
 * BarraNavegacion — topbar flotante del inicio. Se separa del borde superior para
 * dar la sensacion de panel tecnico suspendido; segmenta marca, navegacion y sesion
 * con divisores neon y biseles en las esquinas.
 *
 * @param {object} props
 * @param {object} props.usuario - Usuario en sesion ({ nombre }).
 * @param {string} props.activo - Id de la seccion activa.
 * @param {function} props.al_navegar - Recibe el id de la seccion elegida.
 * @param {function} props.al_cerrar_sesion - Cierra la sesion.
 */
export default function BarraNavegacion({ usuario, activo = 'inicio', al_navegar = () => {}, al_cerrar_sesion = () => {} }) {
  const { tema } = useContext(ContextoTema);
  const nombre = (usuario?.nombre || 'JUGADOR').toUpperCase();

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 60, padding: '20px 24px 0' }}>
      {/* Meta-linea superior, ecos de "STORE ACCESS SCREEN" de la referencia */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'Silkscreen', monospace",
          fontSize: '8px',
          letterSpacing: '0.16em',
          color: 'var(--pink-faint)',
          padding: '0 4px 6px',
        }}
      >
        <span>ARCADEVS · SISTEMA DE DISTRIBUCION RETRO V2</span>
        <span>PANTALLA DE INICIO · {tema.toUpperCase()}</span>
      </div>

      {/* Barra segmentada */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'stretch',
          height: '56px',
          background: 'linear-gradient(180deg, var(--bg-panel-2) 0%, var(--bg-panel) 100%)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 18px rgba(var(--glow-neon),.10), inset 0 0 24px rgba(0,0,0,.5)',
        }}
      >
        <EsquinaBisel pos="tl" />
        <EsquinaBisel pos="tr" />
        <EsquinaBisel pos="bl" />
        <EsquinaBisel pos="br" />

        {/* Segmento marca */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', gap: '10px' }}>
          <div
            style={{
              fontFamily: "'Silkscreen', monospace",
              fontWeight: 700,
              fontSize: '18px',
              letterSpacing: '0.14em',
              color: 'var(--neon-pink)',
              textShadow: '0 0 10px rgba(var(--glow-pink),.55), 0 0 24px rgba(var(--glow-neon),.3)',
            }}
          >
            ARCADEVS
          </div>
        </div>

        <Divisor />

        {/* Segmento navegacion */}
        <nav style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
          {SECCIONES.map((s) => (
            <ItemNav key={s.id} seccion={s} activo={activo === s.id} onClick={() => al_navegar(s.id)} />
          ))}
        </nav>

        <Divisor />

        {/* Segmento sesion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GlifoPixel name="pawn" size={13} color="var(--celadon)" glow="var(--glow-cel)" />
            <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '10px', letterSpacing: '0.10em', color: 'var(--petal-white)', textShadow: '0 0 6px rgba(var(--glow-pink),.5)' }}>
              {nombre}
            </div>
          </div>
          <BadgeTema />
          <button
            type="button"
            onClick={al_cerrar_sesion}
            title="CERRAR SESION"
            style={{
              height: '24px',
              padding: '0 10px',
              background: 'transparent',
              border: '1px solid rgba(var(--glow-neon),.35)',
              color: 'var(--pink-dim)',
              fontFamily: "'Silkscreen', monospace",
              fontSize: '9px',
              letterSpacing: '0.10em',
            }}
          >
            SALIR
          </button>
        </div>
      </div>
    </header>
  );
}
