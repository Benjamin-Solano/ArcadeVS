import LayoutAuth from '../componentes/layout-auth.jsx';
import Separador from '../componentes/crt/separador.jsx';
import BiosButton from '../componentes/crt/bios-button.jsx';

const HERO_LOGIN = {
  hero_l1: 'BIENVENIDO',
  hero_l2: 'DE VUELTA',
  subtexto_l1: 'INICIO DE SESION · ARCADEVS',
  subtexto_l2: 'VER 1.0 · [TEMA]',
};

/**
 * PaginaLogin — marcador de posicion. El diseno de inicio de sesion esta pendiente;
 * por ahora solo cierra el flujo Registro -> Verificacion -> Login.
 *
 * @param {object} props
 * @param {function} props.ir_a_registro - Navega a la pantalla de registro.
 */
export default function PaginaLogin({ ir_a_registro }) {
  return (
    <LayoutAuth hero={HERO_LOGIN} pantalla="LOGIN">
      <div style={{ textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontWeight: 700, fontSize: '18px', letterSpacing: '0.10em', color: 'var(--petal-white)', textShadow: '0 0 10px rgba(var(--glow-pink),.55), 0 0 24px rgba(var(--glow-neon),.3)' }}>
        INICIAR SESION
      </div>
      <div style={{ textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'var(--pink-dim)', marginTop: '12px' }}>
        PANTALLA PENDIENTE DE DISENO.
      </div>
      <Separador style={{ margin: '20px 0' }} />
      <BiosButton texto="VOLVER AL REGISTRO" onClick={ir_a_registro} />
    </LayoutAuth>
  );
}
