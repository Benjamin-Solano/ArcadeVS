import { createContext, useEffect, useState } from 'react';

/** Temas CRT disponibles. Sakura no lleva atributo data-theme. */
const TEMAS = ['sakura', 'amber', 'blue', 'grey'];

export const ContextoTema = createContext({ tema: 'sakura', ciclar_tema: () => {}, cambiar_tema: () => {} });

/**
 * ProveedorTema — mantiene el tema CRT activo y lo refleja en <html data-theme>.
 * Sakura se representa sin atributo (paleta por defecto).
 */
export function ProveedorTema({ children }) {
  const [tema, set_tema] = useState('sakura');

  useEffect(() => {
    const raiz = document.documentElement;
    if (tema === 'sakura') {
      raiz.removeAttribute('data-theme');
    } else {
      raiz.setAttribute('data-theme', tema);
    }
  }, [tema]);

  /** Cambia al siguiente tema en el ciclo sakura -> amber -> blue -> grey -> sakura. */
  const ciclar_tema = () => {
    set_tema((actual) => TEMAS[(TEMAS.indexOf(actual) + 1) % TEMAS.length]);
  };

  /** Fija un tema concreto. */
  const cambiar_tema = (nuevo) => {
    if (TEMAS.includes(nuevo)) set_tema(nuevo);
  };

  return (
    <ContextoTema.Provider value={{ tema, ciclar_tema, cambiar_tema }}>{children}</ContextoTema.Provider>
  );
}
