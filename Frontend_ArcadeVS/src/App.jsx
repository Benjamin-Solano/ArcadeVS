import { useState } from 'react';
import { ProveedorTema } from './contextos/contexto-tema.jsx';
import PaginaRegistro from './paginas/pagina-registro.jsx';
import PaginaVerificacion from './paginas/pagina-verificacion.jsx';
import PaginaLogin from './paginas/pagina-login.jsx';
import PaginaInicio from './paginas/pagina-inicio.jsx';
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
      {pantalla === 'sesion' && <PaginaInicio usuario={usuario} al_cerrar_sesion={al_cerrar_sesion} />}
    </ProveedorTema>
  );
}
