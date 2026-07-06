import { useContext, useEffect, useRef, useState } from 'react';
import { ContextoTema, TEMAS } from '../../contextos/contexto-tema.jsx';

/**
 * SelectorTema — combobox CRT para elegir un tema concreto (ya no cicla).
 * Muestra el tema activo y despliega la lista completa al pulsar; se cierra al
 * seleccionar o al hacer clic fuera. Estetica fosforo: esquinas rectas y bloom neon.
 */
export default function SelectorTema() {
  const { tema, cambiar_tema } = useContext(ContextoTema);
  const [abierto, set_abierto] = useState(false);
  const contenedor = useRef(null);

  // Cierra el desplegable al hacer clic fuera del componente.
  useEffect(() => {
    if (!abierto) return;
    const al_clic_fuera = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) set_abierto(false);
    };
    document.addEventListener('mousedown', al_clic_fuera);
    return () => document.removeEventListener('mousedown', al_clic_fuera);
  }, [abierto]);

  const seleccionar = (nuevo) => {
    cambiar_tema(nuevo);
    set_abierto(false);
  };

  return (
    <div ref={contenedor} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => set_abierto((v) => !v)}
        title="SELECCIONAR TEMA CRT"
        style={{
          width: '116px',
          height: '24px',
          background: 'var(--bg-panel-2)',
          border: '1px solid rgba(var(--glow-neon), 0.4)',
          color: 'var(--neon-pink)',
          fontFamily: "'Silkscreen', monospace",
          fontSize: '9px',
          letterSpacing: '0.12em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          textShadow: '0 0 6px rgba(var(--glow-neon), 0.5)',
        }}
      >
        <span>{tema.toUpperCase()}</span>
        <span style={{ fontSize: '7px', transform: abierto ? 'scaleY(-1)' : 'none' }}>▼</span>
      </button>

      {abierto && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            width: '116px',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            background: 'var(--bg-panel)',
            border: '1px solid rgba(var(--glow-neon), 0.4)',
            boxShadow: '0 0 14px rgba(var(--glow-neon), 0.18)',
            zIndex: 80,
          }}
        >
          {TEMAS.map((t) => {
            const activo = t === tema;
            return (
              <li key={t} role="option" aria-selected={activo}>
                <button
                  type="button"
                  onClick={() => seleccionar(t)}
                  style={{
                    width: '100%',
                    height: '26px',
                    background: activo ? 'rgba(var(--glow-neon), 0.12)' : 'transparent',
                    border: 'none',
                    color: activo ? 'var(--petal-white)' : 'var(--pink-dim)',
                    fontFamily: "'Silkscreen', monospace",
                    fontSize: '9px',
                    letterSpacing: '0.12em',
                    textAlign: 'left',
                    padding: '0 8px',
                    textShadow: activo ? '0 0 6px rgba(var(--glow-pink), 0.6)' : 'none',
                  }}
                >
                  {t.toUpperCase()}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
