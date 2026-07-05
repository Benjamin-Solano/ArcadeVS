import { useEffect, useRef, useState } from 'react';
import LayoutAuth from '../componentes/layout-auth.jsx';
import BiosButton from '../componentes/crt/bios-button.jsx';
import Separador from '../componentes/crt/separador.jsx';
import CajasCodigo from '../componentes/crt/cajas-codigo.jsx';
import MensajeError from '../componentes/crt/mensaje-error.jsx';
import { verificar_codigo, reenviar_codigo } from '../servicios/servicio-autenticacion.js';

const HERO_VERIFICACION = {
  hero_l1: 'VERIFICA',
  hero_l2: 'TU CUENTA',
  subtexto_l1: 'REVISA TU BANDEJA DE ENTRADA.',
  subtexto_l2: 'EL CODIGO EXPIRA EN 15 MINUTOS.',
};

/** Formatea segundos a "MM:SS". */
function fmt_mm_ss(seg) {
  const m = String(Math.floor(seg / 60)).padStart(2, '0');
  const s = String(seg % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** Enmascara un correo al formato "ju***@dominio.com". */
function maskear_correo(correo) {
  if (!correo || !correo.includes('@')) return 'JU***@CORREO.COM';
  const [usuario, dominio] = correo.split('@');
  const visible = usuario.slice(0, 2);
  return `${visible}***@${dominio}`.toUpperCase();
}

/**
 * PaginaVerificacion — pantalla CODIGO DE VERIFICACION. Cuenta atras de 15:00, 6 cajas de
 * digito y reenvio de codigo habilitado solo cuando el temporizador llega a 0.
 *
 * @param {object} props
 * @param {string} props.correo - Correo al que se envio el codigo (para enmascarar).
 * @param {function} props.ir_a_login - Navega al login tras verificar correctamente.
 * @param {function} props.ir_a_registro - Regresa a la pantalla de registro.
 */
export default function PaginaVerificacion({ correo, ir_a_login, ir_a_registro }) {
  const [timer_verificacion, set_timer] = useState(900);
  const [digitos, set_digitos] = useState(['', '', '', '', '', '']);
  const [error, set_error] = useState('');
  const [cargando, set_cargando] = useState(false);
  const iv = useRef(null);

  useEffect(() => {
    iv.current = setInterval(() => set_timer((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv.current);
  }, []);

  const codigo_expirado = timer_verificacion === 0;
  const codigo_completo = digitos.every((d) => d !== '');

  const actualizar_digitos = (nuevos) => {
    set_digitos(nuevos);
    if (error) set_error('');
  };

  /** Verifica el codigo contra el backend y, si es correcto, navega al login. */
  const manejar_verificacion = async () => {
    if (!codigo_completo) {
      set_error('INGRESA LOS 6 DIGITOS DEL CODIGO.');
      return;
    }
    set_cargando(true);
    set_error('');
    try {
      await verificar_codigo(correo, digitos.join(''));
      ir_a_login();
    } catch (e) {
      set_error((e.message || 'NO SE PUDO VERIFICAR EL CODIGO.').toUpperCase());
    } finally {
      set_cargando(false);
    }
  };

  /** Reenvia un codigo nuevo y reinicia el temporizador. */
  const manejar_reenvio = async () => {
    set_cargando(true);
    set_error('');
    try {
      await reenviar_codigo(correo);
      set_timer(900);
      set_digitos(['', '', '', '', '', '']);
    } catch (e) {
      set_error((e.message || 'NO SE PUDO REENVIAR EL CODIGO.').toUpperCase());
    } finally {
      set_cargando(false);
    }
  };

  return (
    <LayoutAuth hero={HERO_VERIFICACION} pantalla="VERIFICACION">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Silkscreen', monospace", fontWeight: 700, fontSize: '18px', letterSpacing: '0.10em', color: 'var(--petal-white)', textShadow: '0 0 10px rgba(var(--glow-pink),.55), 0 0 24px rgba(var(--glow-neon),.3)' }}>
          CODIGO DE VERIFICACION
        </div>
        <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'var(--pink-dim)', marginTop: '10px' }}>
          INGRESA EL CODIGO DE 6 DIGITOS ENVIADO A TU CORREO.
        </div>
        <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '10px', letterSpacing: '0.10em', color: 'var(--celadon)', marginTop: '8px', textShadow: '0 0 6px rgba(var(--glow-cel),.5)' }}>
          {maskear_correo(correo)}
        </div>
      </div>

      <Separador style={{ margin: '18px 0 14px' }} />

      <div style={{ textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.12em', color: 'var(--pink-dim)' }}>
        EXPIRA EN
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
        <div
          style={{
            width: '160px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-panel-2)',
            border: '1px solid rgba(var(--glow-neon), 0.5)',
            fontFamily: "'Silkscreen', monospace",
            fontWeight: 700,
            fontSize: '28px',
            letterSpacing: '0.08em',
            color: 'var(--neon-pink)',
            animation: 'timerPulse 1.8s ease-in-out infinite',
          }}
        >
          {fmt_mm_ss(timer_verificacion)}
        </div>
      </div>
      <div style={{ textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.14em', color: 'var(--pink-faint)', marginTop: '10px' }}>
        MM : SS
      </div>

      <Separador style={{ margin: '14px 0' }} />

      <div style={{ textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.12em', color: 'var(--pink-dim)', marginBottom: '14px' }}>
        INGRESA TU CODIGO:
      </div>
      <CajasCodigo digitos={digitos} onChange={actualizar_digitos} />

      <MensajeError texto={error} />

      <Separador style={{ margin: '18px 0 14px' }} />
      <BiosButton texto={cargando ? 'VERIFICANDO...' : 'VERIFICAR CODIGO'} seleccionado disabled={cargando} onClick={manejar_verificacion} />
      <div style={{ height: '12px' }} />
      <BiosButton texto="REENVIAR CODIGO" disabled={cargando || !codigo_expirado} onClick={manejar_reenvio} />
      <div style={{ textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.12em', color: 'var(--pink-faint)', marginTop: '10px' }}>
        DISPONIBLE SI EL TIEMPO EXPIRA.
      </div>

      <Separador style={{ margin: '14px 0' }} />
      <div style={{ textAlign: 'center' }}>
        <span onClick={ir_a_registro} style={{ position: 'relative', cursor: 'pointer', fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'var(--pink-dim)' }}>
          REGRESAR AL REGISTRO
          <span style={{ position: 'absolute', left: 0, right: 0, bottom: '-3px', height: '1px', background: 'rgba(var(--glow-neon),.7)' }} />
        </span>
      </div>
    </LayoutAuth>
  );
}
