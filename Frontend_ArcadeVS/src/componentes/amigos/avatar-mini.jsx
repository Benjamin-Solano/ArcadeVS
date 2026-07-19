import GlifoPixel from '../crt/glifo-pixel.jsx';

/**
 * AvatarMini — recuadro pequeño de avatar (imagen con tinte fosforo, o glifo de
 * respaldo si no hay avatar_url). Version compacta y de solo lectura de
 * FotoPerfil, para usar en tarjetas de amigos y solicitudes.
 *
 * @param {object} props
 * @param {string} props.nombre - Nombre del usuario (para el alt de la imagen).
 * @param {string|null} props.avatar_url - Avatar guardado (data URL o URL), o null.
 * @param {number} props.size - Lado del recuadro en px.
 */
export default function AvatarMini({ nombre = 'JUGADOR', avatar_url = null, size = 40 }) {
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flex: '0 0 auto',
        background: 'var(--bg-panel-2)',
        border: '1px solid rgba(var(--glow-neon),.35)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {avatar_url ? (
        <img
          src={avatar_url}
          alt={`AVATAR DE ${nombre.toUpperCase()}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.15) brightness(.95)' }}
        />
      ) : (
        <GlifoPixel name="pawn" size={Math.round(size * 0.5)} color="var(--pink-dim)" />
      )}
      {avatar_url && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--neon-pink)', mixBlendMode: 'color', opacity: 0.45, pointerEvents: 'none' }} />
      )}
    </div>
  );
}
