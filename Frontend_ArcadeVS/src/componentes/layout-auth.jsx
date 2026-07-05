import { useContext } from 'react';
import { ContextoTema } from '../contextos/contexto-tema.jsx';
import OverlaysCrt from './crt/overlays-crt.jsx';
import BadgeTema from './crt/badge-tema.jsx';

/**
 * PanelHero — columna izquierda de branding (460px). Comparte estructura en todas las
 * pantallas de autenticacion; solo cambian el titulo hero y los subtextos.
 */
function PanelHero({ hero_l1, hero_l2, subtexto_l1, subtexto_l2, tema }) {
  // "[TEMA]" en cualquier subtexto se reemplaza por el tema CRT activo.
  const resolver = (txt) => (txt || '').replace('[TEMA]', tema.toUpperCase());
  subtexto_l1 = resolver(subtexto_l1);
  subtexto_l2 = resolver(subtexto_l2);
  return (
    <aside
      style={{
        position: 'relative',
        flex: '0 0 var(--left-w)',
        width: 'var(--left-w)',
        background: 'var(--bg-left)',
        padding: '52px 48px',
        overflow: 'hidden',
      }}
    >
      {/* Glow radial neon al 4% + vineta radial oscura */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(var(--glow-neon),.04) 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.72) 100%)',
        }}
      />

      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: "'Silkscreen', monospace",
            fontWeight: 700,
            fontSize: '28px',
            letterSpacing: '0.14em',
            color: 'var(--neon-pink)',
            textShadow: '0 0 10px rgba(var(--glow-pink),.55), 0 0 24px rgba(var(--glow-neon),.3)',
          }}
        >
          ARCADEVS
        </div>
        <div style={{ width: '200px', height: '2px', marginTop: '10px', background: 'var(--neon-pink)', opacity: 0.5 }} />

        <div style={{ marginTop: '160px' }}>
          <div
            style={{
              fontFamily: "'Silkscreen', monospace",
              fontWeight: 700,
              fontSize: '34px',
              letterSpacing: '0.08em',
              color: 'var(--petal-white)',
              textShadow: '0 0 10px rgba(var(--glow-pink),.55), 0 0 24px rgba(var(--glow-neon),.3)',
            }}
          >
            {hero_l1}
          </div>
          <div
            style={{
              fontFamily: "'Silkscreen', monospace",
              fontWeight: 700,
              fontSize: '30px',
              letterSpacing: '0.08em',
              marginTop: '8px',
              color: 'var(--neon-pink)',
              textShadow: '0 0 10px rgba(var(--glow-neon),.6)',
            }}
          >
            {hero_l2}
          </div>
          <div style={{ width: '80px', height: '3px', marginTop: '20px', background: 'var(--neon-pink)', opacity: 0.7 }} />
          <div
            style={{
              fontFamily: "'Silkscreen', monospace",
              fontSize: '9px',
              letterSpacing: '0.12em',
              marginTop: '14px',
              color: 'var(--pink-dim)',
            }}
          >
            {subtexto_l1}
          </div>
          <div
            style={{
              fontFamily: "'Silkscreen', monospace",
              fontSize: '9px',
              letterSpacing: '0.12em',
              marginTop: '6px',
              color: 'var(--pink-faint)',
            }}
          >
            {subtexto_l2}
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <BadgeTema />
        </div>
      </div>
    </aside>
  );
}

/**
 * LayoutAuth — armazon split-panel de las pantallas de autenticacion.
 * Panel hero izquierdo + divisor vertical con glow + panel derecho con el formulario.
 *
 * @param {object} props
 * @param {object} props.hero - { hero_l1, hero_l2, subtexto_l1, subtexto_l2 } del panel izquierdo.
 * @param {string} props.pantalla - Nombre de la pantalla para el footer (ej. "REGISTRO").
 * @param {React.ReactNode} props.children - Contenido del formulario (centrado en 420px).
 */
export default function LayoutAuth({ hero, pantalla, children }) {
  const { tema } = useContext(ContextoTema);

  return (
    <div style={{ position: 'relative', display: 'flex', minHeight: '100vh', background: 'var(--bg-screen)', animation: 'flick 6s ease-in-out infinite' }}>
      <OverlaysCrt />
      <PanelHero {...hero} tema={tema} />

      {/* Divisor vertical: linea 1px + glow difuso 6px */}
      <div style={{ position: 'relative', width: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '-3px', width: '6px', height: '100%', background: 'rgba(var(--glow-neon),.06)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '100%', background: 'rgba(var(--glow-neon),.25)' }} />
      </div>

      <main
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '80px 24px 28px',
          background:
            'radial-gradient(ellipse 120% 90% at 50% 40%, rgba(var(--glow-neon),.03) 0%, transparent 60%)',
        }}
      >
        <div style={{ width: 'var(--form-w)', maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '32px',
            fontFamily: "'Silkscreen', monospace",
            fontSize: '8px',
            letterSpacing: '0.14em',
            color: 'var(--pink-faint)',
          }}
        >
          ARCADEVS · {pantalla} · VER 1.0 · {tema.toUpperCase()}
        </div>
      </main>
    </div>
  );
}
