/**
 * Medidor — barra horizontal de porcentaje con etiqueta y valor. El relleno emite
 * glow en el color indicado; la pista queda hundida y oscura.
 */
function Medidor({ etiqueta, porcentaje, cantidad, color, glow }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.12em', color: 'var(--pink-dim)' }}>{etiqueta}</span>
        <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: '11px', letterSpacing: '0.08em', color, textShadow: `0 0 8px rgba(${glow},.6)` }}>
          {porcentaje}% <span style={{ fontSize: '8px', color: 'var(--pink-faint)' }}>({cantidad})</span>
        </span>
      </div>
      <div style={{ position: 'relative', height: '10px', background: 'var(--bg-screen)', border: '1px solid rgba(var(--glow-neon),.18)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${porcentaje}%`, background: color, boxShadow: `0 0 8px rgba(${glow},.7)`, opacity: 0.85 }} />
      </div>
    </div>
  );
}

/** Casilla — numero grande sobre etiqueta, para totales (partidas, torneos). */
function Casilla({ valor, etiqueta }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '14px 8px',
        background: 'var(--bg-panel-2)',
        border: '1px solid rgba(var(--glow-neon),.18)',
      }}
    >
      <span style={{ fontFamily: "'Silkscreen', monospace", fontWeight: 700, fontSize: '24px', letterSpacing: '0.04em', color: 'var(--petal-white)', textShadow: '0 0 10px rgba(var(--glow-pink),.55)' }}>
        {valor}
      </span>
      <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.12em', color: 'var(--pink-dim)', textAlign: 'center' }}>{etiqueta}</span>
    </div>
  );
}

/**
 * EstadisticasJuego — bloque de estadisticas de combate: medidores de victoria,
 * derrota y empate (porcentaje sobre el total de partidas) y casillas con los
 * totales de partidas y torneos jugados.
 *
 * @param {object} props
 * @param {number} props.partidas - Total de partidas jugadas.
 * @param {number} props.victorias - Partidas ganadas.
 * @param {number} props.derrotas - Partidas perdidas.
 * @param {number} props.empates - Partidas empatadas.
 * @param {number} props.torneos - Torneos jugados.
 */
export default function EstadisticasJuego({ partidas = 0, victorias = 0, derrotas = 0, empates = 0, torneos = 0 }) {
  // Porcentaje sobre el total de partidas; evita division por cero.
  const pct = (n) => (partidas > 0 ? Math.round((n / partidas) * 100) : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Medidor etiqueta="VICTORIAS" porcentaje={pct(victorias)} cantidad={victorias} color="var(--celadon)" glow="var(--glow-cel)" />
        <Medidor etiqueta="DERROTAS" porcentaje={pct(derrotas)} cantidad={derrotas} color="var(--neon-pink)" glow="var(--glow-neon)" />
        <Medidor etiqueta="EMPATES" porcentaje={pct(empates)} cantidad={empates} color="var(--pink-dim)" glow="var(--glow-pink)" />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Casilla valor={partidas} etiqueta="PARTIDAS JUGADAS" />
        <Casilla valor={torneos} etiqueta="TORNEOS JUGADOS" />
        <Casilla valor={victorias} etiqueta="VICTORIAS TOTALES" />
      </div>
    </div>
  );
}
