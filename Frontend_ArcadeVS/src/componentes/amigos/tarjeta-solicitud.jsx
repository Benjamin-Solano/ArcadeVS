import { useState } from 'react';
import AvatarMini from './avatar-mini.jsx';

/** Boton de accion pequeño (aceptar/rechazar) de la fila de solicitud. */
function BotonAccion({ texto, color, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={texto}
      style={{
        height: '24px',
        padding: '0 8px',
        background: color === 'celadon' ? 'rgba(var(--glow-cel),.1)' : 'transparent',
        border: `1px solid ${color === 'celadon' ? 'var(--celadon)' : 'rgba(var(--glow-neon),.35)'}`,
        color: color === 'celadon' ? 'var(--celadon)' : 'var(--pink-dim)',
        fontFamily: "'Silkscreen', monospace",
        fontSize: '8px',
        letterSpacing: '0.10em',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {texto}
    </button>
  );
}

/**
 * TarjetaSolicitud — fila de una solicitud pendiente. Si la recibio el usuario
 * (enviada_por_mi = false) muestra botones ACEPTAR/RECHAZAR; si la envio el
 * usuario, muestra un estado ESPERANDO de solo lectura.
 *
 * @param {object} props
 * @param {object} props.solicitud - { id_solicitud, enviada_por_mi, usuario }.
 * @param {(id_solicitud: string) => Promise<void>} props.al_aceptar
 * @param {(id_solicitud: string) => Promise<void>} props.al_rechazar
 */
export default function TarjetaSolicitud({ solicitud, al_aceptar, al_rechazar }) {
  const [procesando, set_procesando] = useState(false);
  const { usuario, enviada_por_mi, id_solicitud } = solicitud;

  const responder = async (accion) => {
    set_procesando(true);
    try {
      await accion(id_solicitud);
    } finally {
      set_procesando(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(var(--glow-neon),.12)' }}>
      <AvatarMini nombre={usuario.nombre} avatar_url={usuario.avatar_url} size={32} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: "'Silkscreen', monospace",
          fontSize: '9px',
          letterSpacing: '0.08em',
          color: 'var(--petal-white)',
        }}
      >
        {usuario.nombre?.toUpperCase()} {usuario.apellido?.toUpperCase()}
      </div>

      {enviada_por_mi ? (
        <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.12em', color: 'var(--pink-faint)' }}>
          ESPERANDO...
        </span>
      ) : (
        <div style={{ display: 'flex', gap: '6px' }}>
          <BotonAccion texto="ACEPTAR" color="celadon" disabled={procesando} onClick={() => responder(al_aceptar)} />
          <BotonAccion texto="RECHAZAR" disabled={procesando} onClick={() => responder(al_rechazar)} />
        </div>
      )}
    </div>
  );
}
