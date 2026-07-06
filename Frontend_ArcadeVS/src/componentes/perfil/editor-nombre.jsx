import { useState } from 'react';
import { actualizar_nombre } from '../../servicios/servicio-usuario.js';
import { actualizar_usuario as actualizar_usuario_sesion } from '../../servicios/almacenamiento-sesion.js';

/** Estilo compartido de los botones pequeños del editor. */
const BOTON_MINI = {
  height: '20px',
  padding: '0 8px',
  background: 'var(--bg-panel)',
  border: '1px solid rgba(var(--glow-cel),.55)',
  color: 'var(--celadon)',
  fontFamily: "'Silkscreen', monospace",
  fontSize: '8px',
  letterSpacing: '0.10em',
  cursor: 'pointer',
};

/**
 * EditorNombre — muestra el alias y permite editarlo en linea. Al guardar persiste
 * el nuevo nombre (PUT /usuarios/nombre), refresca la sesion y avisa al contenedor
 * para que la app (navbar + encabezado) refleje el cambio. Se muestra en MAYUSCULAS
 * pero se edita el valor real almacenado.
 *
 * @param {object} props
 * @param {string} props.nombre - Nombre real (sin transformar) del usuario.
 * @param {(usuario: object) => void} props.al_guardado - Recibe el usuario actualizado.
 */
export default function EditorNombre({ nombre = 'JUGADOR', al_guardado }) {
  const [editando, set_editando] = useState(false);
  const [valor, set_valor] = useState(nombre);
  const [guardando, set_guardando] = useState(false);
  const [error, set_error] = useState('');

  const abrir = () => { set_valor(nombre); set_error(''); set_editando(true); };
  const cancelar = () => { set_editando(false); set_error(''); };

  const guardar = async () => {
    const limpio = valor.trim();
    if (!limpio) { set_error('NOMBRE VACIO'); return; }
    if (limpio === nombre) { set_editando(false); return; }
    set_guardando(true);
    set_error('');
    try {
      const actualizado = await actualizar_nombre(limpio);
      actualizar_usuario_sesion(actualizado);
      al_guardado?.(actualizado);
      set_editando(false);
    } catch (e) {
      set_error((e.message || 'NO SE PUDO GUARDAR').toUpperCase());
    } finally {
      set_guardando(false);
    }
  };

  if (!editando) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
        {nombre.toUpperCase()}
        <button type="button" onClick={abrir} title="EDITAR NOMBRE" style={BOTON_MINI}>EDITAR</button>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      <input
        value={valor}
        onChange={(e) => set_valor(e.target.value)}
        maxLength={50}
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') cancelar(); }}
        style={{
          width: '150px',
          height: '24px',
          padding: '0 8px',
          background: 'var(--bg-panel-2)',
          border: '1px solid rgba(var(--glow-neon),.6)',
          color: 'var(--petal-white)',
          fontFamily: "'Silkscreen', monospace",
          fontSize: '10px',
          letterSpacing: '0.06em',
          outline: 'none',
          textAlign: 'right',
        }}
      />
      <button type="button" onClick={guardar} disabled={guardando} style={{ ...BOTON_MINI, border: '1px solid var(--neon-pink)', color: 'var(--petal-white)', opacity: guardando ? 0.6 : 1 }}>
        {guardando ? '...' : 'OK'}
      </button>
      <button type="button" onClick={cancelar} style={BOTON_MINI}>X</button>
      {error && (
        <span style={{ width: '100%', textAlign: 'right', fontFamily: "'Silkscreen', monospace", fontSize: '8px', letterSpacing: '0.10em', color: 'var(--neon-pink)' }}>{error}</span>
      )}
    </span>
  );
}
