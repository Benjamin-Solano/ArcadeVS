import { useState } from 'react';
import InputField from '../crt/input-field.jsx';
import BiosButton from '../crt/bios-button.jsx';
import MensajeError from '../crt/mensaje-error.jsx';
import AvatarMini from './avatar-mini.jsx';
import { buscar_por_codigo } from '../../servicios/servicio-amistades.js';

/**
 * BuscarAmigo — busca un usuario por su codigo de amigo y permite enviarle una
 * solicitud. La busqueda es REST (GET /usuarios/buscar/:codigo_amigo); el envio
 * de la solicitud delega en `al_enviar_solicitud` (evento Socket.io del padre).
 *
 * @param {object} props
 * @param {(id_usuario_destino: string) => Promise<void>} props.al_enviar_solicitud
 */
export default function BuscarAmigo({ al_enviar_solicitud }) {
  const [codigo, set_codigo] = useState('');
  const [resultado, set_resultado] = useState(null);
  const [buscando, set_buscando] = useState(false);
  const [enviando, set_enviando] = useState(false);
  const [enviado, set_enviado] = useState(false);
  const [mensaje, set_mensaje] = useState('');

  const buscar = async () => {
    const limpio = codigo.trim();
    if (!limpio) return;
    set_buscando(true);
    set_mensaje('');
    set_resultado(null);
    set_enviado(false);
    try {
      const usuario = await buscar_por_codigo(limpio);
      set_resultado(usuario);
    } catch (error) {
      set_mensaje(error.mensaje ?? error.message ?? 'NO SE ENCONTRO ESE CODIGO');
    } finally {
      set_buscando(false);
    }
  };

  const enviar = async () => {
    if (!resultado) return;
    set_enviando(true);
    set_mensaje('');
    try {
      await al_enviar_solicitud(resultado.id_usuario);
      set_enviado(true);
    } catch (error) {
      set_mensaje(error.mensaje ?? error.message ?? 'NO SE PUDO ENVIAR LA SOLICITUD');
    } finally {
      set_enviando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <InputField
          etiqueta="CODIGO DE AMIGO"
          placeholder="EJ. AB12CD34EF56"
          valor={codigo}
          onChange={(v) => set_codigo(v.toUpperCase())}
          ayuda="EL CODIGO DE 12 CARACTERES DEL PERFIL DE TU AMIGO"
        />
        <BiosButton
          texto={buscando ? 'BUSCANDO...' : 'BUSCAR'}
          disabled={buscando || !codigo.trim()}
          onClick={buscar}
          style={{ width: '120px', flex: '0 0 auto' }}
        />
      </div>

      {resultado && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px',
            border: '1px solid rgba(var(--glow-neon),.3)',
            background: 'var(--bg-panel-2)',
          }}
        >
          <AvatarMini nombre={resultado.nombre} avatar_url={resultado.avatar_url} />
          <div style={{ flex: 1, fontFamily: "'Silkscreen', monospace", fontSize: '10px', letterSpacing: '0.08em', color: 'var(--petal-white)' }}>
            {resultado.nombre?.toUpperCase()} {resultado.apellido?.toUpperCase()}
          </div>
          <BiosButton
            texto={enviado ? 'ENVIADA' : enviando ? 'ENVIANDO...' : 'AGREGAR'}
            disabled={enviando || enviado}
            onClick={enviar}
            style={{ width: '110px', flex: '0 0 auto' }}
          />
        </div>
      )}

      <MensajeError texto={mensaje} />
    </div>
  );
}
