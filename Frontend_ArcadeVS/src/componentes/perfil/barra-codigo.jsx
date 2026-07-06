/**
 * BarraCodigo — decoracion que simula un codigo de barras. Genera barras verticales
 * de ancho y separacion variables de forma determinista a partir de una semilla, para
 * que el patron sea estable entre renders. Es puramente ornamental (aria-hidden).
 *
 * Las barras y sus separaciones usan `flex-grow` proporcional (no anchos fijos), de
 * modo que el codigo abarca SIEMPRE todo el ancho disponible sin dejar huecos.
 *
 * @param {object} props
 * @param {string} props.semilla - Cadena que siembra el patron (ej. el codigo del usuario).
 * @param {string} props.codigo - Texto mostrado bajo las barras.
 */
export default function BarraCodigo({ semilla = 'ARCADEVS', codigo = 'ARCADEVS-0000-0000' }) {
  const base = (semilla || 'ARCADEVS').toUpperCase();
  const total = 84;
  // Fila plana alternando barra y separacion; ambas usan flex-grow proporcional
  // para llenar el 100% del ancho. La ultima barra no lleva separacion detras.
  const hijos = [];
  for (let i = 0; i < total; i += 1) {
    const c = base.charCodeAt(i % base.length) + i * 7;
    const ancho = 1 + (c % 4); // peso 1..4
    const separacion = 1 + (c % 3); // peso 1..3
    const opacidad = 0.35 + (c % 4) * 0.16;
    hijos.push(
      <div key={`b${i}`} style={{ flex: `${ancho} 1 0`, minWidth: 0, background: 'var(--petal-white)', opacity: opacidad, boxShadow: '0 0 2px rgba(var(--glow-pink),.5)' }} />,
    );
    if (i < total - 1) {
      hijos.push(<div key={`s${i}`} style={{ flex: `${separacion} 1 0`, minWidth: 0 }} />);
    }
  }

  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          width: '100%',
          height: '54px',
          background: 'var(--bg-screen)',
          border: '1px solid rgba(var(--glow-neon),.2)',
        }}
      >
        {hijos}
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
