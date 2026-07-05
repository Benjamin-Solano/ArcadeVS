/**
 * OverlaysCrt — capas fijas de la firma CRT, siempre activas sobre toda la pantalla.
 * Scanlines (z 80), vineta (z 81) y barrido de carga que baja una sola vez (z 82).
 */
export default function OverlaysCrt({ scanlines = true }) {
  return (
    <>
      {scanlines && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 80,
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,.24) 3px, rgba(0,0,0,0) 4px)',
            animation: 'scanDrift 7s linear infinite',
          }}
        />
      )}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 81,
          background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 58%, rgba(0,0,0,.62) 100%)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: 0,
          height: '18vh',
          pointerEvents: 'none',
          zIndex: 82,
          background:
            'linear-gradient(rgba(var(--glow-pink),0), rgba(var(--glow-pink),.05), rgba(var(--glow-pink),0))',
          animation: 'sweepDown 2.6s ease-out 1 forwards',
        }}
      />
    </>
  );
}
