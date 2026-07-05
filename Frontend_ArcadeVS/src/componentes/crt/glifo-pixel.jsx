/**
 * GlifoPixel — sprite pixel 7x7 renderizado como SVG.
 * Sin icon-font ni emoji: cada glifo es una matriz 7x7 donde cada "#" es un rect 1x1.
 */

const GLIFOS = {
  pawn: ['..###..', '.#####.', '..###..', '...#...', '..###..', '.#####.', '#######'],
  grid: ['#######', '#.#.#.#', '#######', '#.#.#.#', '#######', '#.#.#.#', '#######'],
  letters: ['..###..', '.#...#.', '.#...#.', '.#####.', '.#...#.', '.#...#.', '.......'],
  dice: ['#######', '#.....#', '#.#.#.#', '#.....#', '#.#.#.#', '#.....#', '#######'],
  crown: ['#..#..#', '#.###.#', '#######', '#######', '#######', '#######', '.......'],
  petal: ['..#.#..', '.#####.', '#######', '#######', '.#####.', '..###..', '...#...'],
  clock: ['..###..', '.#...#.', '#..#..#', '#..###.', '#.....#', '.#...#.', '..###..'],
  star: ['...#...', '...#...', '.#####.', '..###..', '.##.##.', '##...##', '.......'],
};

/**
 * Construye el SVG del glifo indicado.
 * @param {object} props
 * @param {string} props.name - Nombre del glifo (pawn, grid, letters, dice, crown, petal, clock, star).
 * @param {number} props.size - Lado del SVG en px.
 * @param {string} props.color - Color de relleno de los pixeles.
 * @param {string} props.glow - Triplete RGB para el halo (ej. "255,77,143").
 */
export default function GlifoPixel({ name, size = 14, color = 'var(--neon-pink)', glow = 'var(--glow-neon)' }) {
  const filas = GLIFOS[name] || GLIFOS.pawn;
  const rects = [];
  filas.forEach((fila, y) =>
    fila.split('').forEach((ch, x) => {
      if (ch === '#') {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} style={{ fill: color }} />);
      }
    }),
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 7 7"
      shapeRendering="crispEdges"
      style={{ display: 'block', flex: '0 0 auto', filter: `drop-shadow(0 0 2px rgba(${glow}, 0.7))` }}
    >
      {rects}
    </svg>
  );
}
