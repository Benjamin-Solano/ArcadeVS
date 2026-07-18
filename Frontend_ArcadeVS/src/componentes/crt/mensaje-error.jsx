/**
 * MensajeError — linea de error CRT en neon rosa con glow. No renderiza nada si
 * el texto esta vacio, para poder colocarlo siempre en el formulario sin
 * ocupar espacio hasta que haya un error que mostrar.
 *
 * @param {object} props
 * @param {string} props.texto - Mensaje de error (en mayusculas); vacio = oculto.
 */
export default function MensajeError({ texto }) {
  if (!texto) return null;

  return (
    <div
      role="alert"
      style={{
        marginTop: '14px',
        padding: '8px 10px',
        border: '1px solid var(--neon-pink)',
        background: 'var(--bg-panel-2)',
        color: 'var(--neon-pink)',
        fontFamily: "'Silkscreen', monospace",
        fontSize: '11px',
        letterSpacing: '0.10em',
        textAlign: 'center',
        textShadow: '0 0 6px rgba(var(--glow-neon), 0.6)',
        boxShadow: 'inset 0 0 10px rgba(var(--glow-neon), 0.15)',
      }}
    >
      {texto}
    </div>
  );
}
