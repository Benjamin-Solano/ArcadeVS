import { useState } from 'react';

/**
 * InputField — campo de formulario CRT con etiqueta Silkscreen, marcador "!" de obligatorio
 * y boton "?" de ayuda (celadon). Altura de caja 36px, radio 0.
 *
 * @param {object} props
 * @param {string} props.etiqueta - Texto de la etiqueta (mayusculas).
 * @param {boolean} props.obligatorio - Muestra el marcador "!" neon.
 * @param {string} props.placeholder - Texto de marcador dentro de la caja.
 * @param {string} props.valor - Valor controlado.
 * @param {function} props.onChange - Recibe el nuevo valor (string).
 * @param {string} props.tipo - type del input (text, email, password).
 * @param {string} props.ayuda - Texto informativo del boton "?".
 */
export default function InputField({
  etiqueta,
  obligatorio = false,
  placeholder = '',
  valor = '',
  onChange,
  tipo = 'text',
  ayuda = 'INFO DEL CAMPO',
}) {
  const [enfocado, set_enfocado] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span
          style={{
            fontFamily: "'Silkscreen', monospace",
            fontSize: '10px',
            letterSpacing: '0.12em',
            color: 'var(--pink-dim)',
            textTransform: 'uppercase',
          }}
        >
          {etiqueta}
        </span>
        {obligatorio && (
          <span
            style={{
              fontFamily: "'Silkscreen', monospace",
              fontWeight: 700,
              fontSize: '10px',
              color: 'var(--neon-pink)',
              textShadow: '0 0 6px rgba(var(--glow-neon), 0.7)',
            }}
          >
            !
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          type={tipo}
          value={valor}
          placeholder={placeholder}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => set_enfocado(true)}
          onBlur={() => set_enfocado(false)}
          style={{
            flex: 1,
            height: 'var(--ctl-h-input)',
            minWidth: 0,
            padding: '0 10px',
            background: 'var(--bg-panel-2)',
            border: `1px solid rgba(var(--glow-neon), ${enfocado ? 0.75 : 0.35})`,
            color: 'var(--petal-white)',
            fontFamily: "'Silkscreen', monospace",
            fontSize: '10px',
            letterSpacing: '0.08em',
            outline: 'none',
            boxShadow: enfocado ? 'inset 0 0 10px rgba(var(--glow-neon), 0.18)' : 'none',
          }}
        />
        <button
          type="button"
          title={ayuda}
          aria-label={ayuda}
          style={{
            width: '28px',
            height: 'var(--ctl-h-input)',
            flex: '0 0 auto',
            background: 'var(--bg-panel)',
            border: '1px solid rgba(var(--glow-cel), 0.55)',
            color: 'var(--celadon)',
            fontFamily: "'VT323', monospace",
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 0 6px rgba(var(--glow-cel), 0.6)',
          }}
        >
          ?
        </button>
      </div>
    </div>
  );
}
