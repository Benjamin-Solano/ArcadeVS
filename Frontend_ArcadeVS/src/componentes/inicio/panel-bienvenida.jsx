import GlifoPixel from '../crt/glifo-pixel.jsx';
import { Nivel } from '../perfil/campos-perfil.jsx';

/** Deriva el saludo segun la hora local del navegador. */
function saludo_por_hora() {
  const hora = new Date().getHours();
  if (hora < 12) return 'BUENOS DIAS';
  if (hora < 19) return 'BUENAS TARDES';
  return 'BUENAS NOCHES';
}

/**
 * PanelBienvenida — encabezado de la seccion INICIO. Saluda al jugador por su
 * nombre y muestra su nivel actual como resumen rapido de progreso.
 *
 * @param {object} props
 * @param {object} props.usuario - Usuario en sesion.
 * @param {number} props.nivel - Nivel de jugador (1-5), derivado de victorias.
 */
export default function PanelBienvenida({ usuario, nivel = 1 }) {
  const nombre = (usuario?.nombre || 'JUGADOR').toUpperCase();

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '18px 20px',
        border: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--bg-panel-2) 0%, var(--bg-panel) 100%)',
        boxShadow: 'inset 0 0 26px rgba(0,0,0,.55), 0 0 16px rgba(var(--glow-neon),.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <GlifoPixel name="grid" size={26} color="var(--neon-pink)" glow="var(--glow-neon)" />
        <div>
          <div
            style={{
              fontFamily: "'Silkscreen', monospace",
              fontWeight: 700,
              fontSize: '22px',
              letterSpacing: '0.10em',
              color: 'var(--petal-white)',
              textShadow: '0 0 10px rgba(var(--glow-pink),.55), 0 0 24px rgba(var(--glow-neon),.3)',
            }}
          >
            {saludo_por_hora()}, {nombre}
          </div>
          <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '12px', letterSpacing: '0.10em', color: 'var(--pink-dim)', marginTop: '6px' }}>
            PANTALLA DE INICIO · ARCADEVS
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: '10px', letterSpacing: '0.12em', color: 'var(--pink-faint)' }}>NIVEL DE JUGADOR</span>
        <Nivel nivel={nivel} />
      </div>
    </div>
  );
}
