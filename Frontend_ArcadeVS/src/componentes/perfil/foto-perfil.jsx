import { useRef, useState } from 'react';
import GlifoPixel from '../crt/glifo-pixel.jsx';

/** Lado maximo (px) al que se reduce la imagen antes de guardarla. */
const MAX_LADO = 512;

/** Corchete de enfoque en una esquina del recuadro de la foto. */
function Corchete({ pos }) {
  const base = { position: 'absolute', width: '14px', height: '14px', borderColor: 'var(--celadon)', borderStyle: 'solid', filter: 'drop-shadow(0 0 4px rgba(var(--glow-cel),.6))' };
  const a = {
    tl: { top: 6, left: 6, borderWidth: '2px 0 0 2px' },
    tr: { top: 6, right: 6, borderWidth: '2px 2px 0 0' },
    bl: { bottom: 6, left: 6, borderWidth: '0 0 2px 2px' },
    br: { bottom: 6, right: 6, borderWidth: '0 2px 2px 0' },
  }[pos];
  return <div style={{ ...base, ...a }} />;
}

/**
 * Reduce una imagen a un data URL JPEG compacto (lado maximo MAX_LADO). Mantener
 * la imagen pequeña evita superar el limite de cuerpo del backend y no infla la BD,
 * ya que el avatar se persiste como data URL en la columna avatar_url (TEXT).
 *
 * @param {File} archivo - Archivo de imagen elegido por el usuario.
 * @returns {Promise<string>} Data URL de la imagen redimensionada.
 */
function redimensionar_a_dataurl(archivo) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
        const ancho = Math.round(img.width * escala);
        const alto = Math.round(img.height * escala);
        const lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;
        lienzo.getContext('2d').drawImage(img, 0, 0, ancho, alto);
        resolver(lienzo.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = rechazar;
      img.src = lector.result;
    };
    lector.onerror = rechazar;
    lector.readAsDataURL(archivo);
  });
}

/**
 * FotoPerfil — recuadro para la foto de perfil con carga, redimensionado y guardado.
 * Al pulsar el recuadro abre el selector; la imagen se muestra tenida en fosforo con
 * scanlines. Cuando hay una imagen nueva sin guardar aparece el boton GUARDAR, que
 * delega la persistencia en `al_guardar` (el contenedor hace el PUT al backend).
 *
 * @param {object} props
 * @param {string} props.nombre - Nombre del usuario (texto alternativo).
 * @param {string|null} props.avatar_inicial - Avatar ya guardado (data URL o URL), o null.
 * @param {(dataUrl: string) => Promise<void>} props.al_guardar - Persiste el avatar.
 */
export default function FotoPerfil({ nombre = 'JUGADOR', avatar_inicial = null, al_guardar }) {
  const entrada = useRef(null);
  const [preview, set_preview] = useState(avatar_inicial);
  const [sucio, set_sucio] = useState(false);
  const [guardando, set_guardando] = useState(false);
  const [mensaje, set_mensaje] = useState('');

  const elegir_archivo = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      const dataurl = await redimensionar_a_dataurl(archivo);
      set_preview(dataurl);
      set_sucio(true);
      set_mensaje('');
    } catch {
      set_mensaje('NO SE PUDO LEER LA IMAGEN');
    }
  };

  const guardar = async () => {
    if (!preview || !al_guardar) return;
    set_guardando(true);
    set_mensaje('');
    try {
      await al_guardar(preview);
      set_sucio(false);
      set_mensaje('AVATAR GUARDADO');
    } catch {
      set_mensaje('ERROR AL GUARDAR');
    } finally {
      set_guardando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        title="SUBIR FOTO DE PERFIL"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3 / 4',
          background: preview ? 'var(--bg-screen)' : 'var(--bg-panel-2)',
          border: '1px solid rgba(var(--glow-neon),.35)',
          padding: 0,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt={`FOTO DE ${nombre.toUpperCase()}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.15) brightness(.95)' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <GlifoPixel name="pawn" size={40} color="var(--pink-dim)" />
            <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: '9px', letterSpacing: '0.14em', color: 'var(--pink-dim)' }}>SUBIR FOTO</span>
          </div>
        )}

        {/* Tinte fosforo sobre la imagen */}
        {preview && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--neon-pink)', mixBlendMode: 'color', opacity: 0.45, pointerEvents: 'none' }} />
        )}
        {/* Rejilla de scanlines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,.35) 3px, rgba(0,0,0,0) 4px)',
          }}
        />
        <Corchete pos="tl" />
        <Corchete pos="tr" />
        <Corchete pos="bl" />
        <Corchete pos="br" />

        <input ref={entrada} type="file" accept="image/*" onChange={elegir_archivo} style={{ display: 'none' }} />
      </button>

      <span style={{ textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.12em', color: 'var(--pink-faint)' }}>
        {preview ? 'PULSA PARA CAMBIAR' : 'PULSA EL RECUADRO'}
      </span>

      {sucio && (
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          style={{
            width: '100%',
            height: '30px',
            background: 'rgba(var(--glow-neon),.08)',
            border: '1px solid var(--neon-pink)',
            color: 'var(--petal-white)',
            fontFamily: "'Silkscreen', monospace",
            fontSize: '9px',
            letterSpacing: '0.12em',
            textShadow: '0 0 6px rgba(var(--glow-neon),.6)',
            cursor: guardando ? 'default' : 'pointer',
            opacity: guardando ? 0.6 : 1,
          }}
        >
          {guardando ? 'GUARDANDO...' : 'GUARDAR AVATAR'}
        </button>
      )}

      {mensaje && (
        <span style={{ textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.12em', color: mensaje.startsWith('ERROR') || mensaje.startsWith('NO') ? 'var(--neon-pink)' : 'var(--celadon)' }}>
          {mensaje}
        </span>
      )}
    </div>
  );
}
