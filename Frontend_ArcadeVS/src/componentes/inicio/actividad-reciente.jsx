import MarcoDossier from '../perfil/marco-dossier.jsx';
import GlifoPixel from '../crt/glifo-pixel.jsx';

/**
 * Anuncios del sistema mostrados mientras no exista un feed de actividad real
 * en el backend. Se listan del mas reciente al mas antiguo.
 */
const ANUNCIOS = [
  { fecha: '12/07', texto: 'BIENVENIDO A ARCADEVS. TU CUENTA QUEDO VERIFICADA Y LISTA PARA JUGAR.' },
  { fecha: '10/07', texto: 'MODULO DE JUEGOS EN DESARROLLO. LOS PRIMEROS TITULOS LLEGAN PRONTO.' },
  { fecha: '05/07', texto: 'SISTEMA DE TORNEOS Y RANKING EN CONSTRUCCION. VUELVE MAS ADELANTE.' },
  { fecha: '01/07', texto: 'ARCADEVS V1.0 EN LINEA. GRACIAS POR SER PARTE DE LA PRIMERA HORNADA.' },
];

/** Fila de un anuncio: glifo reloj + fecha + texto. */
function FilaAnuncio({ fecha, texto }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(var(--glow-neon),.12)' }}>
      <GlifoPixel name="clock" size={13} color="var(--celadon)" glow="var(--glow-cel)" />
      <span style={{ flex: '0 0 44px', fontFamily: "'Silkscreen', monospace", fontSize: '10px', letterSpacing: '0.08em', color: 'var(--pink-faint)' }}>{fecha}</span>
      <span style={{ flex: 1, fontFamily: "'Silkscreen', monospace", fontSize: '11px', letterSpacing: '0.06em', lineHeight: 1.6, color: 'var(--phosphor-pink)' }}>{texto}</span>
    </div>
  );
}

/**
 * ActividadReciente — tablon de anuncios del sistema en la seccion INICIO.
 * Contenido informativo fijo (aun no hay un feed de actividad real en el
 * backend); se reemplazara por historial de partidas/torneos cuando exista.
 */
export default function ActividadReciente() {
  return (
    <MarcoDossier titulo="ACTIVIDAD RECIENTE" etiqueta_derecha="TABLON DE ANUNCIOS" style={{ flex: '1 1 420px', minWidth: '320px' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {ANUNCIOS.map((a, i) => (
          <FilaAnuncio key={i} fecha={a.fecha} texto={a.texto} />
        ))}
      </div>
    </MarcoDossier>
  );
}
