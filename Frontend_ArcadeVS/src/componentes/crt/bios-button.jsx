import { useState } from 'react';

/**
 * BiosButton — boton estilo BIOS con 4 estados: selected (primario), inactivo, disabled, hover.
 * Altura fija 40px, radio 0. El estado selected lleva prefijo "► " y glow neon.
 *
 * @param {object} props
 * @param {string} props.texto - Etiqueta del boton (en mayusculas, sin el prefijo).
 * @param {boolean} props.seleccionado - true = estado primario (fondo neon).
 * @param {boolean} props.disabled - true = deshabilitado, sin glow.
 * @param {function} props.onClick - Manejador de click.
 * @param {object} props.style - Estilos extra (ej. ancho).
 */
export default function BiosButton({ texto, seleccionado = false, disabled = false, onClick, style = {} }) {
  const [hover, set_hover] = useState(false);

  const base = {
    height: 'var(--ctl-h-btn)',
    width: '100%',
    border: '1px solid var(--neon-pink)',
    background: 'var(--bg-panel-2)',
    color: 'var(--phosphor-pink)',
    fontFamily: "'Silkscreen', monospace",
    fontWeight: 700,
    fontSize: '12px',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'box-shadow 0.15s ease, color 0.15s ease',
    ...style,
  };

  let estado = {};
  if (disabled) {
    estado = {
      color: 'var(--pink-faint)',
      borderColor: 'var(--pink-faint)',
      boxShadow: 'none',
      cursor: 'not-allowed',
      background: 'var(--bg-panel-2)',
    };
  } else if (seleccionado) {
    estado = {
      background: 'var(--neon-pink)',
      color: 'var(--bg-screen)',
      boxShadow: hover
        ? '0 0 22px rgba(var(--glow-neon), 0.8)'
        : '0 0 16px rgba(var(--glow-neon), 0.6)',
    };
  } else {
    estado = {
      boxShadow: hover ? '0 0 14px rgba(var(--glow-neon), 0.6)' : '0 0 6px rgba(var(--glow-neon), 0.2)',
      color: hover ? 'var(--petal-white)' : 'var(--phosphor-pink)',
    };
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => set_hover(true)}
      onMouseLeave={() => set_hover(false)}
      style={{ ...base, ...estado }}
    >
      {seleccionado ? `► ${texto}` : texto}
    </button>
  );
}
