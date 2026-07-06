import { useEffect, useRef, useState } from 'react';
import { bandera_url, buscar_pais, filtrar_paises } from './paises.js';

/** Bandera del pais (PNG de flagcdn) con marco tenue; oculta la imagen si falla. */
function Bandera({ codigo, ancho = 20 }) {
  if (!codigo) return null;
  return (
    <img
      src={bandera_url(codigo, ancho)}
      alt=""
      width={ancho}
      height={Math.round((ancho * 3) / 4)}
      loading="lazy"
      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
      style={{ display: 'block', flex: '0 0 auto', objectFit: 'cover', border: '1px solid rgba(var(--glow-neon),.35)', boxShadow: '0 0 5px rgba(var(--glow-neon),.35)' }}
    />
  );
}

/**
 * SelectorNacionalidad — combobox buscable para elegir la nacionalidad del perfil.
 * Muestra la bandera y el nombre del pais. Al elegir, persiste el nombre del pais
 * (fuente de verdad guardada en usuarios.nacionalidad) via el callback al_guardar.
 * La lista sale de una lista fija (paises.js); la bandera se deriva del codigo ISO.
 *
 * @param {object} props
 * @param {string} props.valor - Nacionalidad actual (nombre del pais) o vacio.
 * @param {(nombre: string) => Promise<void>} props.al_guardar - Persiste la eleccion.
 */
export default function SelectorNacionalidad({ valor = '', al_guardar }) {
  const [abierto, set_abierto] = useState(false);
  const [busqueda, set_busqueda] = useState('');
  const [guardando, set_guardando] = useState(false);
  const [error, set_error] = useState('');
  const contenedor = useRef(null);

  const pais_actual = buscar_pais(valor);
  const resultados = filtrar_paises(busqueda);

  // Cierra el desplegable al hacer clic fuera o pulsar Escape.
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (contenedor.current && !contenedor.current.contains(e.target)) cerrar(); };
    const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', tecla); };
  }, [abierto]);

  const abrir = () => { set_busqueda(''); set_error(''); set_abierto(true); };
  const cerrar = () => { set_abierto(false); set_error(''); };

  const seleccionar = async (pais) => {
    if (pais.nombre === valor) { cerrar(); return; }
    set_guardando(true);
    set_error('');
    try {
      await al_guardar?.(pais.nombre);
      set_abierto(false);
    } catch (e) {
      set_error((e.message || 'NO SE PUDO GUARDAR').toUpperCase());
    } finally {
      set_guardando(false);
    }
  };

  return (
    <span ref={contenedor} style={{ position: 'relative', display: 'inline-flex', justifyContent: 'flex-end' }}>
      <button
        type="button"
        onClick={() => (abierto ? cerrar() : abrir())}
        disabled={guardando}
        title="SELECCIONAR NACIONALIDAD"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          height: '24px',
          padding: '0 8px',
          background: 'var(--bg-panel)',
          border: `1px solid rgba(var(--glow-neon),${abierto ? 0.7 : 0.4})`,
          color: 'var(--petal-white)',
          fontFamily: "'Silkscreen', monospace",
          fontSize: '10px',
          letterSpacing: '0.06em',
          textShadow: '0 0 6px rgba(var(--glow-pink),.45)',
          cursor: guardando ? 'wait' : 'pointer',
        }}
      >
        {pais_actual && <Bandera codigo={pais_actual.codigo} />}
        <span>{guardando ? '...' : (pais_actual ? pais_actual.nombre.toUpperCase() : 'SIN DEFINIR')}</span>
        <span style={{ color: 'var(--celadon)', fontSize: '8px' }}>{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <div
          style={{
            position: 'absolute',
            top: '28px',
            right: 0,
            zIndex: 20,
            width: '240px',
            background: 'var(--bg-panel-2)',
            border: '1px solid rgba(var(--glow-neon),.6)',
            boxShadow: '0 0 14px rgba(var(--glow-neon),.25), inset 0 0 20px rgba(0,0,0,.5)',
          }}
        >
          <input
            value={busqueda}
            onChange={(e) => set_busqueda(e.target.value)}
            placeholder="BUSCAR PAIS..."
            autoFocus
            style={{
              width: '100%',
              height: '26px',
              padding: '0 8px',
              background: 'var(--bg-screen)',
              border: 'none',
              borderBottom: '1px solid rgba(var(--glow-neon),.4)',
              color: 'var(--petal-white)',
              fontFamily: "'Silkscreen', monospace",
              fontSize: '9px',
              letterSpacing: '0.06em',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {resultados.length === 0 ? (
              <div style={{ padding: '10px 8px', fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.08em', color: 'var(--pink-faint)', textAlign: 'center' }}>
                SIN COINCIDENCIAS
              </div>
            ) : (
              resultados.map((pais) => {
                const activo = pais.nombre === valor;
                return (
                  <button
                    key={pais.codigo}
                    type="button"
                    onClick={() => seleccionar(pais)}
                    disabled={guardando}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '6px 8px',
                      background: activo ? 'rgba(var(--glow-neon),.12)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(var(--glow-neon),.08)',
                      color: activo ? 'var(--neon-pink)' : 'var(--pink-dim)',
                      fontFamily: "'Silkscreen', monospace",
                      fontSize: '9px',
                      letterSpacing: '0.05em',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <Bandera codigo={pais.codigo} />
                    <span>{pais.nombre.toUpperCase()}</span>
                  </button>
                );
              })
            )}
          </div>
          {error && (
            <div style={{ padding: '6px 8px', fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.08em', color: 'var(--neon-pink)', borderTop: '1px solid rgba(var(--glow-neon),.3)' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
