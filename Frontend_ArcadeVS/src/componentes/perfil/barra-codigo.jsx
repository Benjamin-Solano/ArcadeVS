/**
 * BarraCodigo — decoracion que simula un codigo de barras. Genera barras verticales
 * de ancho y separacion variables de forma determinista a partir de una semilla, para
 * que el patron sea estable entre renders. Es puramente ornamental (aria-hidden).
 *
 * @param {object} props
 * @param {string} props.semilla - Cadena que siembra el patron (ej. el codigo del usuario).
 * @param {string} props.codigo - Texto mostrado bajo las barras.
 */
export default function BarraCodigo({ semilla = 'ARCADEVS', codigo = 'ARCADEVS-0000-0000' }) {
  const base = (semilla || 'ARCADEVS').toUpperCase();
  const barras = [];
  for (let i = 0; i < 72; i += 1) {
    const c = base.charCodeAt(i % base.length) + i * 7;
    barras.push({ ancho: 1 + (c % 4), separacion: 1 + (c % 3), opacidad: 0.35 + (c % 4) * 0.16 });
  }

  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: '54px',
          padding: '0 6px',
          background: 'var(--bg-screen)',
          border: '1px solid rgba(var(--glow-neon),.2)',
          overflow: 'hidden',
        }}
      >
        {barras.map((b, i) => (
          <div
            key={i}
            style={{
              flex: '0 0 auto',
              width: `${b.ancho}px`,
              marginRight: `${b.separacion}px`,
              background: 'var(--petal-white)',
              opacity: b.opacidad,
              boxShadow: '0 0 2px rgba(var(--glow-pink),.5)',
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'Silkscreen', monospace",
          fontSize: '8px',
          letterSpacing: '0.22em',
          color: 'var(--pink-faint)',
        }}
      >
        <span>ARCADEVS</span>
        <span>{codigo}</span>
        <span>PROPIEDAD DE ARCADEVS</span>
      </div>
    </div>
  );
}
