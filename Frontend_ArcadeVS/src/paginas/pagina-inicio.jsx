import { useState } from 'react';
import OverlaysCrt from '../componentes/crt/overlays-crt.jsx';
import BarraNavegacion from '../componentes/barra-navegacion.jsx';
import PaginaPerfil from './pagina-perfil.jsx';
import PaginaAmigos from './pagina-amigos.jsx';

/**
 * PaginaInicio — pantalla principal tras iniciar sesion. Por ahora solo monta la
 * barra de navegacion superior sobre el fondo CRT; el contenido del body queda
 * como marcador de posicion hasta desarrollar las secciones.
 *
 * @param {object} props
 * @param {object} props.usuario - Usuario en sesion.
 * @param {function} props.al_cerrar_sesion - Cierra la sesion.
 * @param {function} props.al_actualizar_usuario - Propaga cambios de perfil a la app.
 */
export default function PaginaInicio({ usuario, al_cerrar_sesion, al_actualizar_usuario }) {
  const [seccion_activa, set_seccion_activa] = useState('inicio');

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-screen)', animation: 'flick 6s ease-in-out infinite' }}>
      <OverlaysCrt />
      <BarraNavegacion
        usuario={usuario}
        activo={seccion_activa}
        al_navegar={set_seccion_activa}
        al_cerrar_sesion={al_cerrar_sesion}
      />

      <main style={{ position: 'relative', minHeight: 'calc(100vh - 84px)', padding: '24px' }}>
        {seccion_activa === 'perfil' ? (
          <PaginaPerfil usuario={usuario} al_actualizar_usuario={al_actualizar_usuario} />
        ) : seccion_activa === 'amigos' ? (
          <PaginaAmigos />
        ) : (
          // Marcador de posicion del resto de secciones — se desarrollara mas adelante
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100vh - 132px)',
              fontFamily: "'Silkscreen', monospace",
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'var(--pink-faint)',
            }}
          >
            SECCION: {seccion_activa.toUpperCase()}
          </div>
        )}
      </main>
    </div>
  );
}
