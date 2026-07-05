import { useState } from 'react';
import { ProveedorTema } from './contextos/contexto-tema.jsx';
import PaginaRegistro from './paginas/pagina-registro.jsx';
import PaginaVerificacion from './paginas/pagina-verificacion.jsx';
import PaginaLogin from './paginas/pagina-login.jsx';

/**
 * App — enrutado principal por estado.
 * Flujo: REGISTRO -> VERIFICACION -> LOGIN (y VERIFICACION -> REGISTRO).
 */
export default function App() {
  const [pantalla, set_pantalla] = useState('registro');
  const [correo, set_correo] = useState('');

  const ir_a_verificacion = (correo_registrado) => {
    set_correo(correo_registrado);
    set_pantalla('verificacion');
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
      {pantalla === 'login' && <PaginaLogin ir_a_registro={() => set_pantalla('registro')} />}
    </ProveedorTema>
  );
}
