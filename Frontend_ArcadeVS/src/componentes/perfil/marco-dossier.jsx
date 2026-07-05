/**
 * MarcoDossier — panel enmarcado estilo expediente cyberpunk. Borde neon tenue,
 * biseles en L en las cuatro esquinas y una cabecera opcional con titulo a la
 * izquierda y una etiqueta/codigo a la derecha (eco de "SUBJECT A-34" de la referencia).
 */

/** Bisel en L de una esquina. */
function Bisel({ pos }) {
  const base = { position: 'absolute', background: 'var(--neon-pink)', boxShadow: '0 0 6px rgba(var(--glow-neon),.7)' };
  const v = { ...base, width: '2px', height: '11px' };
  const h = { ...base, width: '11px', height: '2px' };
  const a = {
    tl: { top: -1, left: -1 },
    tr: { top: -1, right: -1 },
    bl: { bottom: -1, left: -1 },
    br: { bottom: -1, right: -1 },
  }[pos];
  return (
    <>
      <div style={{ ...v, ...a }} />
      <div style={{ ...h, ...a }} />
    </>
  );
}

/**
 * @param {object} props
 * @param {string} props.titulo - Rotulo de la cabecera (mayusculas).
 * @param {string} props.etiqueta_derecha - Codigo/estado a la derecha de la cabecera.
 * @param {string} props.padding - Relleno del cuerpo.
 * @param {object} props.style - Estilos extra del marco.
 * @param {React.ReactNode} props.children - Contenido del panel.
 */
export default function MarcoDossier({ titulo, etiqueta_derecha, padding = '16px', style = {}, children }) {
  return (
    <section
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--bg-panel-2) 0%, var(--bg-panel) 100%)',
        boxShadow: 'inset 0 0 26px rgba(0,0,0,.55), 0 0 16px rgba(var(--glow-neon),.06)',
        ...style,
      }}
    >
      <Bisel pos="tl" />
      <Bisel pos="tr" />
      <Bisel pos="bl" />
      <Bisel pos="br" />

      {titulo && (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 14px',
            borderBottom: '1px solid rgba(var(--glow-neon),.2)',
            background: 'rgba(var(--glow-neon),.05)',
          }}
        >
          <span
            style={{
              fontFamily: "'Silkscreen', monospace",
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.14em',
              color: 'var(--neon-pink)',
              textShadow: '0 0 8px rgba(var(--glow-neon),.55)',
            }}
          >
            {titulo}
          </span>
          {etiqueta_derecha && (
            <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.12em', color: 'var(--pink-dim)' }}>
              {etiqueta_derecha}
            </span>
          )}
        </header>
      )}

      <div style={{ padding, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </section>
  );
}
