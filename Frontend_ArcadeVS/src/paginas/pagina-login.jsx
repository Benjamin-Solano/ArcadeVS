import { useState } from 'react';
import LayoutAuth from '../componentes/layout-auth.jsx';
import InputField from '../componentes/crt/input-field.jsx';
import BiosButton from '../componentes/crt/bios-button.jsx';
import Separador from '../componentes/crt/separador.jsx';
import MensajeError from '../componentes/crt/mensaje-error.jsx';
import { iniciar_sesion } from '../servicios/servicio-autenticacion.js';

const HERO_LOGIN = {
  hero_l1: 'BIENVENIDO',
  hero_l2: 'DE VUELTA',
  subtexto_l1: 'INICIO DE SESION · ARCADEVS',
  subtexto_l2: 'VER 1.0 · [TEMA]',
};

/**
 * PaginaLogin — pantalla INICIAR SESION. Recoge correo y contrasena, autentica
 * contra el backend (POST /auth/login) y, ante exito, entrega el usuario al
 * contenedor mediante al_iniciar_sesion.
 *
 * @param {object} props
 * @param {function} props.ir_a_registro - Navega a la pantalla de registro.
 * @param {function} props.al_iniciar_sesion - Recibe el usuario autenticado.
 */
export default function PaginaLogin({ ir_a_registro, al_iniciar_sesion }) {
  const [datos, set_datos] = useState({
    correo: '',
    contrasena: '',
  });
  const [error, set_error] = useState('');
  const [cargando, set_cargando] = useState(false);

  const actualizar = (campo) => (valor) => {
    set_datos((d) => ({ ...d, [campo]: valor }));
    if (error) set_error('');
  };

  /** Valida el formulario y autentica contra el backend. */
  const manejar_login = async () => {
    // Validacion minima de cliente; la autenticacion real ocurre en el backend.
    if (!datos.correo.includes('@')) {
      set_error('EL CORREO NO TIENE UN FORMATO VALIDO.');
      return;
    }
    if (datos.contrasena.length === 0) {
      set_error('INGRESA TU CONTRASENA.');
      return;
    }

    set_cargando(true);
    set_error('');
    try {
      const usuario = await iniciar_sesion(datos.correo, datos.contrasena);
      if (al_iniciar_sesion) al_iniciar_sesion(usuario);
    } catch (e) {
      set_error((e.message || 'NO SE PUDO INICIAR SESION.').toUpperCase());
    } finally {
      set_cargando(false);
    }
  };

  return (
    <LayoutAuth hero={HERO_LOGIN} pantalla="LOGIN">
      <Titulo />
      <Separador style={{ margin: '20px 0 14px' }} />

      <div style={{ marginTop: '4px' }}>
        <InputField etiqueta="CORREO ELECTRONICO" obligatorio placeholder="EJ. JUAN@CORREO.COM" tipo="email" valor={datos.correo} onChange={actualizar('correo')} ayuda="EL CORREO CON EL QUE TE REGISTRASTE" />
      </div>

      <div style={{ marginTop: '16px' }}>
        <InputField etiqueta="CONTRASENA" obligatorio placeholder="INGRESA TU CONTRASENA" tipo="password" valor={datos.contrasena} onChange={actualizar('contrasena')} ayuda="TU CONTRASENA DE ACCESO" />
      </div>

      <div style={{ textAlign: 'right', marginTop: '10px' }}>
        <span style={{ position: 'relative', cursor: 'pointer', fontFamily: "'Silkscreen', monospace", fontSize: '10px', letterSpacing: '0.10em', color: 'var(--pink-dim)' }}>
          OLVIDASTE TU CONTRASENA?
          <span style={{ position: 'absolute', left: 0, right: 0, bottom: '-3px', height: '1px', background: 'rgba(var(--glow-neon),.7)' }} />
        </span>
      </div>

      <MensajeError texto={error} />

      <Separador style={{ margin: '14px 0' }} />
      <BiosButton texto={cargando ? 'INGRESANDO...' : 'INICIAR SESION'} seleccionado disabled={cargando} onClick={manejar_login} />
      <Separador style={{ margin: '14px 0' }} />

      <div style={{ textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontSize: '11px', letterSpacing: '0.10em', color: 'var(--pink-dim)' }}>
        NO TIENES UNA CUENTA?{' '}
        <span onClick={ir_a_registro} style={{ position: 'relative', cursor: 'pointer', color: 'var(--phosphor-pink)' }}>
          REGISTRATE
          <span style={{ position: 'absolute', left: 0, right: 0, bottom: '-3px', height: '1px', background: 'rgba(var(--glow-neon),.7)' }} />
        </span>
      </div>
    </LayoutAuth>
  );
}

/** Encabezado de la pantalla de inicio de sesion. */
function Titulo() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: "'Silkscreen', monospace",
          fontWeight: 700,
          fontSize: '20px',
          letterSpacing: '0.12em',
          color: 'var(--petal-white)',
          textShadow: '0 0 10px rgba(var(--glow-pink),.55), 0 0 24px rgba(var(--glow-neon),.3)',
        }}
      >
        INICIAR SESION
      </div>
      <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '11px', letterSpacing: '0.10em', color: 'var(--pink-dim)', marginTop: '10px' }}>
        INGRESA TUS DATOS PARA ACCEDER.
      </div>
    </div>
  );
}
