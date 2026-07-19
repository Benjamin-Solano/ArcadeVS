import { useEffect, useState } from 'react';
import PanelBienvenida from './panel-bienvenida.jsx';
import ResumenEstadisticas from './resumen-estadisticas.jsx';
import ActividadReciente from './actividad-reciente.jsx';
import { nivel_por_victorias } from '../perfil/campos-perfil.jsx';
import { obtener_estadisticas } from '../../servicios/servicio-usuario.js';

/** Estadisticas en cero mientras se cargan (o si el usuario aun no ha jugado). */
const ESTADISTICAS_VACIAS = { partidas: 0, victorias: 0, derrotas: 0, empates: 0, torneos: 0, amigos: 0 };

/**
 * SeccionInicio — contenido de la pestaña INICIO: bienvenida al jugador, resumen
 * de sus estadisticas (GET /usuarios/estadisticas) y tablon de anuncios del
 * sistema. Se monta dentro del cuerpo de PaginaInicio, que ya aporta la barra
 * de navegacion y el fondo CRT.
 *
 * @param {object} props
 * @param {object} props.usuario - Usuario en sesion.
 */
export default function SeccionInicio({ usuario }) {
  const [estadisticas, set_estadisticas] = useState(ESTADISTICAS_VACIAS);

  useEffect(() => {
    let vigente = true;
    obtener_estadisticas()
      .then((datos) => { if (vigente) set_estadisticas(datos); })
      .catch(() => { if (vigente) set_estadisticas(ESTADISTICAS_VACIAS); });
    return () => { vigente = false; };
  }, [usuario?.id_usuario]);

  return (
    <div style={{ width: '100%', maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px', padding: '8px 0 40px' }}>
      <PanelBienvenida usuario={usuario} nivel={nivel_por_victorias(estadisticas.victorias)} />
      <div style={{ display: 'flex', gap: '18px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <ResumenEstadisticas estadisticas={estadisticas} />
        <ActividadReciente />
      </div>
    </div>
  );
}
