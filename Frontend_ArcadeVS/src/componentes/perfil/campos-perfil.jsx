import { useState } from 'react';
import GlifoPixel from '../crt/glifo-pixel.jsx';

/** Fila etiqueta-valor del expediente, con separador tenue inferior. */
export function FilaDato({ etiqueta, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(var(--glow-neon),.12)' }}>
      <span style={{ flex: '0 0 130px', fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.12em', color: 'var(--pink-dim)' }}>{etiqueta}</span>
      <span style={{ flex: 1, textAlign: 'right', fontFamily: "'Silkscreen', monospace", fontSize: '10px', letterSpacing: '0.06em', color: 'var(--petal-white)', textShadow: '0 0 6px rgba(var(--glow-pink),.45)' }}>
        {children}
      </span>
    </div>
  );
}

/** Nivel de jugador dibujado con glifos estrella (llenas/vacias). */
export function Nivel({ nivel = 1, maximo = 5 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '4px', justifyContent: 'flex-end' }}>
      {Array.from({ length: maximo }).map((_, i) => (
        <GlifoPixel key={i} name="star" size={12} color={i < nivel ? 'var(--neon-pink)' : 'var(--pink-faint)'} glow={i < nivel ? 'var(--glow-neon)' : 'var(--glow-pink)'} />
      ))}
    </span>
  );
}

/** Boton pequeño que copia un texto al portapapeles con feedback breve. */
export function BotonCopiar({ texto }) {
  const [copiado, set_copiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      set_copiado(true);
      setTimeout(() => set_copiado(false), 1500);
    } catch {
      set_copiado(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copiar}
      title="COPIAR CODIGO DE AMIGO"
      style={{
        height: '20px',
        padding: '0 8px',
        background: 'var(--bg-panel)',
        border: `1px solid rgba(var(--glow-cel),${copiado ? 0.9 : 0.55})`,
        color: 'var(--celadon)',
        fontFamily: "'Silkscreen', monospace",
        fontSize: '8px',
        letterSpacing: '0.10em',
        textShadow: '0 0 6px rgba(var(--glow-cel),.5)',
        cursor: 'pointer',
      }}
    >
      {copiado ? 'COPIADO' : 'COPIAR'}
    </button>
  );
}

/** Formatea una fecha ISO a DD/MM/AAAA; '—' si no hay valor; original si no parsea. */
export function formatear_fecha(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Formatea una marca de tiempo a DD/MM/AAAA HH:MM; '—' si no hay valor. */
export function formatear_fecha_hora(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${formatear_fecha(valor)} ${hh}:${min}`;
}

/** Deriva un nivel 1-5 a partir de las victorias (una estrella por cada 10). */
export function nivel_por_victorias(victorias) {
  return Math.min(5, Math.max(1, 1 + Math.floor((Number(victorias) || 0) / 10)));
}
