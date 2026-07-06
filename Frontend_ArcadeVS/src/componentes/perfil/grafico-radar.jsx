/**
 * GraficoRadar — radar (SVG puro, sin librerias) de afinidad de juego. Cada eje es
 * un tag y su vertice se ubica segun cuantas partidas ha jugado el usuario en juegos
 * con ese tag, normalizado al maximo. Estetica CRT: rejilla tenue, poligono neon con
 * relleno translucido y etiquetas en fosforo.
 *
 * @param {object} props
 * @param {Array<{tag: string, valor: number}>} props.datos - Tags y su conteo de partidas.
 * @param {number} props.size - Lado del SVG en px.
 */
export default function GraficoRadar({ datos = [], size = 280 }) {
  const n = datos.length;
  const centro = size / 2;
  const radio = size / 2 - 46; // deja margen para las etiquetas
  const anillos = [0.25, 0.5, 0.75, 1];
  const max = Math.max(1, ...datos.map((d) => Number(d.valor) || 0));

  // Angulo del eje i: arranca arriba (-90deg) y gira en sentido horario.
  const angulo = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const punto = (i, r) => ({
    x: centro + Math.cos(angulo(i)) * r,
    y: centro + Math.sin(angulo(i)) * r,
  });
  const puntos_poligono = (r_de_i) =>
    datos.map((_, i) => { const p = punto(i, r_de_i(i)); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');

  const poligono_datos = puntos_poligono((i) => ((Number(datos[i].valor) || 0) / max) * radio);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', maxWidth: '100%' }}>
      {/* Rejilla concentrica */}
      {anillos.map((f, k) => (
        <polygon
          key={`anillo-${k}`}
          points={puntos_poligono(() => radio * f)}
          style={{ fill: 'none', stroke: 'rgba(var(--glow-neon),.16)', strokeWidth: 1 }}
        />
      ))}

      {/* Ejes radiales */}
      {datos.map((_, i) => {
        const p = punto(i, radio);
        return <line key={`eje-${i}`} x1={centro} y1={centro} x2={p.x} y2={p.y} style={{ stroke: 'rgba(var(--glow-neon),.14)', strokeWidth: 1 }} />;
      })}

      {/* Poligono de datos */}
      {max > 0 && (
        <polygon
          points={poligono_datos}
          style={{ fill: 'rgba(var(--glow-neon),.22)', stroke: 'var(--neon-pink)', strokeWidth: 2, filter: 'drop-shadow(0 0 4px rgba(var(--glow-neon),.6))' }}
        />
      )}

      {/* Vertices */}
      {datos.map((d, i) => {
        const p = punto(i, ((Number(d.valor) || 0) / max) * radio);
        return <circle key={`v-${i}`} cx={p.x} cy={p.y} r={2.5} style={{ fill: 'var(--petal-white)' }} />;
      })}

      {/* Etiquetas de tag */}
      {datos.map((d, i) => {
        const p = punto(i, radio + 16);
        const dx = p.x - centro;
        const anclaje = Math.abs(dx) < 6 ? 'middle' : dx > 0 ? 'start' : 'end';
        return (
          <text
            key={`t-${i}`}
            x={p.x}
            y={p.y}
            textAnchor={anclaje}
            dominantBaseline="middle"
            style={{ fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.06em', fill: 'var(--pink-dim)' }}
          >
            {String(d.tag).toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}
