import MarcoDossier from '../perfil/marco-dossier.jsx';
import GlifoPixel from '../crt/glifo-pixel.jsx';

/** Tarjeta de una estadistica: glifo + valor grande + etiqueta. */
function Tarjeta({ glifo, valor, etiqueta, color, glow }) {
  return (
    <div
      style={{
        flex: '1 1 120px',
        minWidth: '110px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 8px',
        background: 'var(--bg-panel-2)',
        border: '1px solid rgba(var(--glow-neon),.18)',
      }}
    >
      <GlifoPixel name={glifo} size={18} color={color} glow={glow} />
      <span style={{ fontFamily: "'Silkscreen', monospace", fontWeight: 700, fontSize: '24px', letterSpacing: '0.04em', color: 'var(--petal-white)', textShadow: '0 0 10px rgba(var(--glow-pink),.55)' }}>
        {valor}
      </span>
      <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: '10px', letterSpacing: '0.12em', color: 'var(--pink-dim)', textAlign: 'center' }}>{etiqueta}</span>
    </div>
  );
}

/**
 * ResumenEstadisticas — vitrina rapida de las estadisticas del jugador en la
 * seccion INICIO. Reutiliza los mismos datos que la pantalla de perfil
 * (GET /usuarios/estadisticas) pero en formato compacto de tarjetas.
 *
 * @param {object} props
 * @param {object} props.estadisticas - { partidas, victorias, derrotas, empates, torneos, amigos }.
 */
export default function ResumenEstadisticas({ estadisticas }) {
  const e = estadisticas || {};

  return (
    <MarcoDossier titulo="RESUMEN DE ESTADISTICAS" etiqueta_derecha={`${e.partidas || 0} PARTIDAS`} style={{ flex: '1 1 460px', minWidth: '320px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Tarjeta glifo="dice" valor={e.partidas || 0} etiqueta="PARTIDAS" color="var(--petal-white)" glow="var(--glow-pink)" />
        <Tarjeta glifo="star" valor={e.victorias || 0} etiqueta="VICTORIAS" color="var(--celadon)" glow="var(--glow-cel)" />
        <Tarjeta glifo="grid" valor={e.derrotas || 0} etiqueta="DERROTAS" color="var(--neon-pink)" glow="var(--glow-neon)" />
        <Tarjeta glifo="petal" valor={e.empates || 0} etiqueta="EMPATES" color="var(--pink-dim)" glow="var(--glow-pink)" />
        <Tarjeta glifo="crown" valor={e.torneos || 0} etiqueta="TORNEOS" color="var(--neon-pink)" glow="var(--glow-neon)" />
        <Tarjeta glifo="pawn" valor={e.amigos || 0} etiqueta="AMIGOS" color="var(--celadon)" glow="var(--glow-cel)" />
      </div>
    </MarcoDossier>
  );
}
