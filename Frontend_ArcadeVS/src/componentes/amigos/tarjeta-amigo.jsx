import AvatarMini from './avatar-mini.jsx';

/**
 * TarjetaAmigo — fila de la lista de amigos confirmados: avatar, nombre
 * completo y codigo de amigo.
 *
 * @param {object} props
 * @param {object} props.amigo - { id_usuario, nombre, apellido, codigo_amigo, avatar_url }.
 */
export default function TarjetaAmigo({ amigo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(var(--glow-neon),.12)' }}>
      <AvatarMini nombre={amigo.nombre} avatar_url={amigo.avatar_url} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Silkscreen', monospace",
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'var(--petal-white)',
            textShadow: '0 0 6px rgba(var(--glow-pink),.45)',
          }}
        >
          {amigo.nombre?.toUpperCase()} {amigo.apellido?.toUpperCase()}
        </div>
        <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.10em', color: 'var(--pink-faint)' }}>
          {amigo.codigo_amigo}
        </div>
      </div>
    </div>
  );
}
