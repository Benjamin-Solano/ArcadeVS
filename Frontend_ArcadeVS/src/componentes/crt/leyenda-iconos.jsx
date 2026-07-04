/**
 * LeyendaIconos — fila explicativa sobre el primer campo del formulario:
 * "? = INFO DEL CAMPO" (celadon) y "! = CAMPO OBLIGATORIO" (neon).
 */
export default function LeyendaIconos() {
  const texto_estilo = {
    fontFamily: "'Silkscreen', monospace",
    fontSize: '8px',
    letterSpacing: '0.12em',
    color: 'var(--pink-faint)',
  };

  return (
    <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Silkscreen', monospace", fontWeight: 700, fontSize: '9px', color: 'var(--celadon)', textShadow: '0 0 6px rgba(var(--glow-cel),.6)' }}>?</span>
        <span style={texto_estilo}>= INFO DEL CAMPO</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Silkscreen', monospace", fontWeight: 700, fontSize: '9px', color: 'var(--neon-pink)', textShadow: '0 0 6px rgba(var(--glow-neon),.7)' }}>!</span>
        <span style={texto_estilo}>= CAMPO OBLIGATORIO</span>
      </div>
    </div>
  );
}
