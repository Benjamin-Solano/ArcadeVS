import { useRef } from 'react';

/**
 * CajasCodigo — 6 cajas de digito 52x64px para el codigo de verificacion.
 * Separador "—" entre el digito 3 y 4. La caja activa lleva borde neon y cursor parpadeante.
 * Auto-avanza al siguiente campo al escribir y retrocede con Backspace.
 *
 * @param {object} props
 * @param {string[]} props.digitos - Arreglo de 6 caracteres (o vacios).
 * @param {function} props.onChange - Recibe el nuevo arreglo de digitos.
 */
export default function CajasCodigo({ digitos, onChange }) {
  const refs = useRef([]);

  const escribir = (indice, valor) => {
    const limpio = valor.replace(/\D/g, '').slice(-1);
    const siguiente = [...digitos];
    siguiente[indice] = limpio;
    onChange(siguiente);
    if (limpio && indice < 5) refs.current[indice + 1]?.focus();
  };

  const tecla = (indice, e) => {
    if (e.key === 'Backspace' && !digitos[indice] && indice > 0) {
      refs.current[indice - 1]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {i === 3 && (
            <span style={{ fontFamily: "'VT323', monospace", fontWeight: 700, fontSize: '24px', color: 'var(--pink-faint)' }}>—</span>
          )}
          <input
            ref={(el) => (refs.current[i] = el)}
            value={digitos[i] || ''}
            onChange={(e) => escribir(i, e.target.value)}
            onKeyDown={(e) => tecla(i, e)}
            inputMode="numeric"
            maxLength={1}
            style={{
              width: '52px',
              height: '64px',
              textAlign: 'center',
              background: digitos[i] ? 'var(--bg-panel)' : 'var(--bg-panel-2)',
              border: digitos[i]
                ? '2px solid var(--neon-pink)'
                : '1px solid rgba(var(--pink-faint), 0.4)',
              color: 'var(--petal-white)',
              fontFamily: "'Silkscreen', monospace",
              fontWeight: 700,
              fontSize: '22px',
              outline: 'none',
              boxShadow: digitos[i] ? '0 0 12px rgba(var(--glow-neon),.4), inset 0 0 8px rgba(var(--glow-neon),.15)' : 'none',
            }}
          />
        </span>
      ))}
    </div>
  );
}
