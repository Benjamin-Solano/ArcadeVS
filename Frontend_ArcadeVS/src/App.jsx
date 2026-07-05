import { useState } from 'react';
import { ProveedorTema } from './contextos/contexto-tema.jsx';
import PaginaRegistro from './paginas/pagina-registro.jsx';
import PaginaVerificacion from './paginas/pagina-verificacion.jsx';
import PaginaLogin from './paginas/pagina-login.jsx';
import { cerrar_sesion } from './servicios/servicio-autenticacion.js';

/**
 * App — enrutado principal por estado.
 * Flujo: REGISTRO -> VERIFICACION -> LOGIN -> SESION (y VERIFICACION -> REGISTRO).
 */
export default function App() {
  const [pantalla, set_pantalla] = useState('registro');
  const [correo, set_correo] = useState('');
  const [usuario, set_usuario] = useState(null);

  const ir_a_verificacion = (correo_registrado) => {
    set_correo(correo_registrado);
    set_pantalla('verificacion');
  };

  const al_iniciar_sesion = (usuario_autenticado) => {
    set_usuario(usuario_autenticado);
    set_pantalla('sesion');
  };

  const al_cerrar_sesion = () => {
    cerrar_sesion();
    set_usuario(null);
    set_pantalla('login');
  };

  return (
    <ProveedorTema>
      {pantalla === 'registro' && (
        <PaginaRegistro ir_a_verificacion={ir_a_verificacion} ir_a_login={() => set_pantalla('login')} />
      )}
      {pantalla === 'verificacion' && (
        <PaginaVerificacion
          correo={correo}
          ir_a_login={() => set_pantalla('login')}
          ir_a_registro={() => set_pantalla('registro')}
        />
      )}
      {pantalla === 'login' && (
        <PaginaLogin ir_a_registro={() => set_pantalla('registro')} al_iniciar_sesion={al_iniciar_sesion} />
      )}
      {pantalla === 'sesion' && <PantallaSesion usuario={usuario} al_cerrar_sesion={al_cerrar_sesion} />}
    </ProveedorTema>
  );
}

/**
 * PantallaSesion — confirmacion minima de sesion iniciada. Placeholder hasta
 * que exista el lobby; verifica de extremo a extremo que el login contra el
 * backend funciona mostrando el usuario autenticado.
 */
function PantallaSesion({ usuario, al_cerrar_sesion }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '18px',
        background: 'var(--bg-screen)',
        fontFamily: "'Silkscreen', monospace",
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <div style={{ fontSize: '18px', letterSpacing: '0.10em', color: 'var(--petal-white)', textShadow: '0 0 10px rgba(var(--glow-pink),.55)' }}>
        SESION INICIADA
      </div>
      <div style={{ fontSize: '10px', letterSpacing: '0.10em', color: 'var(--celadon)', textShadow: '0 0 6px rgba(var(--glow-cel),.5)' }}>
        BIENVENIDO, {(usuario?.nombre || 'JUGADOR').toUpperCase()}
      </div>
      <span
        onClick={al_cerrar_sesion}
        style={{ position: 'relative', cursor: 'pointer', fontSize: '9px', letterSpacing: '0.10em', color: 'var(--pink-dim)' }}
      >
        CERRAR SESION
        <span style={{ position: 'absolute', left: 0, right: 0, bottom: '-3px', height: '1px', background: 'rgba(var(--glow-neon),.7)' }} />
      </span>
    </div>
  );
}
