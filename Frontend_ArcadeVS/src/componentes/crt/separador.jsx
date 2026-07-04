/**
 * Separador — linea horizontal de 1px con gradiente neon que se desvanece en los extremos.
 * Separa regiones clave del formulario (antes del primer campo, antes del boton, del footer).
 *
 * @param {object} props
 * @param {object} props.style - Estilos extra (ej. margenes).
 */
export default function Separador({ style = {} }) {
  return (
    <div
      style={{
        height: '1px',
        width: '100%',
        background: 'linear-gradient(90deg, transparent 0%, var(--neon-pink) 50%, transparent 100%)',
        ...style,
      }}
    />
  );
}
