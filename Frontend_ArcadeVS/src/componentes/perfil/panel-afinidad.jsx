import GraficoRadar from './grafico-radar.jsx';

/** Fila de la leyenda: tag, mini-barra proporcional y conteo de partidas. */
function FilaTag({ tag, valor, max }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
      <span style={{ flex: '0 0 96px', fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.08em', color: 'var(--pink-dim)' }}>
        {String(tag).toUpperCase()}
      </span>
      <div style={{ flex: 1, height: '8px', background: 'var(--bg-screen)', border: '1px solid rgba(var(--glow-neon),.18)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--neon-pink)', boxShadow: '0 0 6px rgba(var(--glow-neon),.7)', opacity: 0.85 }} />
      </div>
      <span style={{ flex: '0 0 28px', textAlign: 'right', fontFamily: "'Silkscreen', monospace", fontSize: '9px', color: 'var(--petal-white)' }}>{valor}</span>
    </div>
  );
}

/**
 * PanelAfinidad — subseccion "AFINIDAD DE JUEGO" pensada para ir DENTRO del panel de
 * estadisticas. Muestra un radar de los tags que mas juega el usuario junto a una
 * leyenda ordenada. Si no hay ningun tag disponible muestra un marcador; si hay tags
 * pero todos en cero (usuario sin partidas), el radar dibuja igualmente sus ejes.
 *
 * @param {object} props
 * @param {Array<{tag: string, valor: number}>} props.tags - Tags jugados y su conteo.
 */
export default function PanelAfinidad({ tags = [] }) {
  const hay_datos = tags.some((t) => (Number(t.valor) || 0) > 0);
  const max = Math.max(1, ...tags.map((t) => Number(t.valor) || 0));
  const ordenados = [...tags].sort((a, b) => b.valor - a.valor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Subtitulo separado del bloque de estadisticas superior */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(var(--glow-neon),.2)' }}>
        <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: '10px', letterSpacing: '0.12em', color: 'var(--neon-pink)', textShadow: '0 0 6px rgba(var(--glow-neon),.5)' }}>
          AFINIDAD DE JUEGO
        </span>
        <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.12em', color: 'var(--pink-dim)' }}>{tags.length} TAGS</span>
      </div>

      {tags.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '140px', fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.12em', color: 'var(--pink-faint)', textAlign: 'center' }}>
          SIN TAGS DE JUEGO REGISTRADOS AUN
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto', margin: '0 auto' }}>
            <GraficoRadar datos={tags} size={260} />
          </div>
          <div style={{ flex: '1 1 220px', minWidth: '200px' }}>
            <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.12em', color: 'var(--pink-faint)', marginBottom: '8px' }}>
              {hay_datos ? 'TAGS QUE MAS JUEGAS · POR PARTIDAS' : 'AUN NO HAY PARTIDAS · JUEGA PARA LLENAR EL RADAR'}
            </div>
            {ordenados.map((t) => (
              <FilaTag key={t.tag} tag={t.tag} valor={Number(t.valor) || 0} max={max} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
