import { useState } from 'react';
import LayoutAuth from '../componentes/layout-auth.jsx';
import InputField from '../componentes/crt/input-field.jsx';
import BiosButton from '../componentes/crt/bios-button.jsx';
import Separador from '../componentes/crt/separador.jsx';
import LeyendaIconos from '../componentes/crt/leyenda-iconos.jsx';
import MensajeError from '../componentes/crt/mensaje-error.jsx';
import { registrar_usuario } from '../servicios/servicio-autenticacion.js';

const HERO_REGISTRO = {
  hero_l1: 'EMPIEZA',
  hero_l2: 'AQUI',
  subtexto_l1: 'SISTEMA DE REGISTRO · ARCADEVS',
  subtexto_l2: 'VER 1.0 · [TEMA]',
};

/**
 * PaginaRegistro — pantalla CREAR CUENTA. Recoge nombre, apellido, correo y contrasena.
 * Al registrarse correctamente navega a la pantalla de verificacion.
 *
 * @param {object} props
 * @param {function} props.ir_a_verificacion - Navega a verificacion pasando el correo.
 * @param {function} props.ir_a_login - Navega a la pantalla de inicio de sesion.
 */
export default function PaginaRegistro({ ir_a_verificacion, ir_a_login }) {
  const [datos, set_datos] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    contrasena: '',
    confirmar: '',
  });

  const [error, set_error] = useState('');
  const [cargando, set_cargando] = useState(false);

  const actualizar = (campo) => (valor) => {
    set_datos((d) => ({ ...d, [campo]: valor }));
    if (error) set_error('');
  };

  /** Valida el formulario, crea la cuenta en el backend y avanza a verificacion. */
  const manejar_registro = async () => {
    // Validacion minima de cliente; la validacion real ocurre en el backend.
    if (!datos.nombre.trim() || !datos.apellido.trim()) {
      set_error('EL NOMBRE Y EL APELLIDO SON OBLIGATORIOS.');
      return;
    }
    if (!datos.correo.includes('@')) {
      set_error('EL CORREO NO TIENE UN FORMATO VALIDO.');
      return;
    }
    if (datos.contrasena.length < 8) {
      set_error('LA CONTRASENA DEBE TENER AL MENOS 8 CARACTERES.');
      return;
    }
    if (datos.contrasena !== datos.confirmar) {
      set_error('LAS CONTRASENAS NO COINCIDEN.');
      return;
    }

    set_cargando(true);
    set_error('');
    try {
      await registrar_usuario(datos);
      ir_a_verificacion(datos.correo);
    } catch (e) {
      set_error((e.message || 'NO SE PUDO COMPLETAR EL REGISTRO.').toUpperCase());
    } finally {
      set_cargando(false);
    }
  };

  return (
    <LayoutAuth hero={HERO_REGISTRO} pantalla="REGISTRO">
      <Titulo />
      <Separador style={{ margin: '20px 0 14px' }} />
      <LeyendaIconos />

      <div style={{ display: 'flex', gap: '14px', marginTop: '20px' }}>
        <InputField etiqueta="NOMBRE" obligatorio placeholder="EJ. JUAN" valor={datos.nombre} onChange={actualizar('nombre')} ayuda="TU NOMBRE DE PILA" />
        <InputField etiqueta="APELLIDO" obligatorio placeholder="EJ. GARCIA" valor={datos.apellido} onChange={actualizar('apellido')} ayuda="TU APELLIDO" />
      </div>

      <div style={{ marginTop: '16px' }}>
        <InputField etiqueta="CORREO ELECTRONICO" obligatorio placeholder="EJ. JUAN@CORREO.COM" tipo="email" valor={datos.correo} onChange={actualizar('correo')} ayuda="RECIBIRAS EL CODIGO DE VERIFICACION AQUI" />
      </div>

      <div style={{ marginTop: '16px' }}>
        <InputField etiqueta="CONTRASENA" obligatorio placeholder="INGRESA TU CONTRASENA" tipo="password" valor={datos.contrasena} onChange={actualizar('contrasena')} ayuda="MINIMO 8 CARACTERES" />
      </div>

      <div style={{ marginTop: '16px' }}>
        <InputField etiqueta="CONFIRMAR CONTRASENA" obligatorio placeholder="REPITE TU CONTRASENA" tipo="password" valor={datos.confirmar} onChange={actualizar('confirmar')} ayuda="DEBE COINCIDIR CON LA CONTRASENA" />
      </div>

      <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.12em', color: 'var(--pink-faint)', marginTop: '10px' }}>
        MINIMO 8 CARACTERES.
      </div>

      <MensajeError texto={error} />

      <Separador style={{ margin: '14px 0' }} />
      <BiosButton texto={cargando ? 'REGISTRANDO...' : 'REGISTRARSE'} seleccionado disabled={cargando} onClick={manejar_registro} />
      <Separador style={{ margin: '14px 0' }} />

      <div style={{ textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'var(--pink-dim)' }}>
        YA TIENES UNA CUENTA?{' '}
        <span onClick={ir_a_login} style={{ position: 'relative', cursor: 'pointer', color: 'var(--phosphor-pink)' }}>
          INICIA SESION
          <span style={{ position: 'absolute', left: 0, right: 0, bottom: '-3px', height: '1px', background: 'rgba(var(--glow-neon),.7)' }} />
        </span>
      </div>
    </LayoutAuth>
  );
}

/** Encabezado de la pantalla de registro. */
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
        CREAR CUENTA
      </div>
      <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'var(--pink-dim)', marginTop: '10px' }}>
        INGRESA TUS DATOS PARA REGISTRARTE.
      </div>
    </div>
  );
}
