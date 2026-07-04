import { useContext } from 'react';
import { ContextoTema } from '../../contextos/contexto-tema.jsx';

/**
 * BadgeTema — caja 100x24px en la esquina inferior-izquierda del panel hero.
 * Muestra el tema activo y al pulsar cicla entre SAKURA, AMBER y BLUE.
 */
export default function BadgeTema() {
  const { tema, ciclar_tema } = useContext(ContextoTema);

  return (
    <button
      type="button"
      onClick={ciclar_tema}
      title="CAMBIAR TEMA CRT"
      style={{
        width: '100px',
        height: '24px',
        background: 'var(--bg-panel-2)',
        border: '1px solid rgba(var(--glow-neon), 0.4)',
        color: 'var(--neon-pink)',
        fontFamily: "'Silkscreen', monospace",
        fontSize: '9px',
        letterSpacing: '0.12em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textShadow: '0 0 6px rgba(var(--glow-neon), 0.5)',
      }}
    >
      [ {tema.toUpperCase()} ]
    </button>
  );
}
