import { useCallback, useEffect, useState } from 'react';
import MarcoDossier from '../componentes/perfil/marco-dossier.jsx';
import BuscarAmigo from '../componentes/amigos/buscar-amigo.jsx';
import TarjetaAmigo from '../componentes/amigos/tarjeta-amigo.jsx';
import TarjetaSolicitud from '../componentes/amigos/tarjeta-solicitud.jsx';
import {
  obtener_amigos,
  obtener_solicitudes,
  enviar_solicitud_amistad,
  aceptar_solicitud_amistad,
  rechazar_solicitud_amistad,
} from '../servicios/servicio-amistades.js';
import { conectar_socket } from '../servicios/servicio-socket.js';

/** Texto centrado de estado vacio/carga dentro de un panel. */
function Mensaje({ texto }) {
  return (
    <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.12em', color: 'var(--pink-faint)', padding: '12px 0', textAlign: 'center' }}>
      {texto}
    </div>
  );
}

/**
 * PaginaAmigos — red de contactos: buscar y agregar por codigo, solicitudes
 * pendientes (recibidas y enviadas) y lista de amigos confirmados. La carga
 * inicial es REST; las actualizaciones en vivo llegan por Socket.io
 * (amigo:solicitud_recibida, amigo:vinculo_confirmado) y disparan un refresco.
 */
export default function PaginaAmigos() {
  const [amigos, set_amigos] = useState([]);
  const [solicitudes, set_solicitudes] = useState([]);
  const [cargando, set_cargando] = useState(true);

  const refrescar = useCallback(async () => {
    const [lista_amigos, lista_solicitudes] = await Promise.all([
      obtener_amigos(),
      obtener_solicitudes(),
    ]);
    set_amigos(lista_amigos);
    set_solicitudes(lista_solicitudes);
  }, []);

  useEffect(() => {
    refrescar().finally(() => set_cargando(false));

    const socket = conectar_socket();
    socket.on('amigo:solicitud_recibida', refrescar);
    socket.on('amigo:vinculo_confirmado', refrescar);

    return () => {
      socket.off('amigo:solicitud_recibida', refrescar);
      socket.off('amigo:vinculo_confirmado', refrescar);
    };
  }, [refrescar]);

  /** Envia la solicitud, espera el ack del servidor y recien entonces refresca. */
  const enviar_solicitud = async (id_usuario_destino) => {
    await enviar_solicitud_amistad(id_usuario_destino);
    await refrescar();
  };

  /** Espera el ack; el vinculo confirmado llega ademas por socket y refresca ambas listas. */
  const aceptar = async (id_solicitud) => {
    await aceptar_solicitud_amistad(id_solicitud);
  };

  /** Espera el ack y retira la fila (no hay evento de confirmacion aparte para el rechazo). */
  const rechazar = async (id_solicitud) => {
    await rechazar_solicitud_amistad(id_solicitud);
    set_solicitudes((actuales) => actuales.filter((s) => s.id_solicitud !== id_solicitud));
  };

  return (
    <div style={{ width: '100%', maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px', padding: '8px 0 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontFamily: "'Silkscreen', monospace", fontWeight: 700, fontSize: '20px', letterSpacing: '0.12em', color: 'var(--neon-pink)', textShadow: '0 0 10px rgba(var(--glow-neon),.5)' }}>
          RED DE CONTACTOS
        </div>
        <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.16em', color: 'var(--pink-faint)' }}>ARCADEVS · AMIGOS</div>
      </div>

      <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 420px', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <MarcoDossier titulo="AGREGAR AMIGO">
            <BuscarAmigo al_enviar_solicitud={enviar_solicitud} />
          </MarcoDossier>

          <MarcoDossier titulo="SOLICITUDES PENDIENTES" etiqueta_derecha={String(solicitudes.length)}>
            {cargando ? (
              <Mensaje texto="CARGANDO..." />
            ) : solicitudes.length === 0 ? (
              <Mensaje texto="SIN SOLICITUDES PENDIENTES" />
            ) : (
              <div>
                {solicitudes.map((s) => (
                  <TarjetaSolicitud key={s.id_solicitud} solicitud={s} al_aceptar={aceptar} al_rechazar={rechazar} />
                ))}
              </div>
            )}
          </MarcoDossier>
        </div>

        <MarcoDossier titulo="AMIGOS" etiqueta_derecha={String(amigos.length)} style={{ flex: '1 1 420px', minWidth: '320px' }}>
          {cargando ? (
            <Mensaje texto="CARGANDO..." />
          ) : amigos.length === 0 ? (
            <Mensaje texto="AUN NO TIENES AMIGOS AGREGADOS" />
          ) : (
            <div>
              {amigos.map((amigo) => (
                <TarjetaAmigo key={amigo.id_usuario} amigo={amigo} />
              ))}
            </div>
          )}
        </MarcoDossier>
      </div>
    </div>
  );
}
