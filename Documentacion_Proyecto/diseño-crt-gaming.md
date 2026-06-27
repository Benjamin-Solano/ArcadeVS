# Instrucciones exactas — Recrear el diseño web «Guía Técnica ArcadeVS»

Documento de construcción del manual de sistema de diseño **ArcadeVS**: estética CRT de fósforo *sakura* (menú de juego PC‑98 + pantalla BIOS + noche de Hanami). Sigue estas instrucciones al pie de la letra para reproducir el diseño pixel por pixel.

> **Principio rector:** *todo es emisión de fósforo, no tinta*. Nada es plano: cada texto y cada borde emite un halo (bloom). La jerarquía se controla por **brillo**, no por peso. Esquinas rectas (radio 0), salvo el cristal CRT. Sin emoji: la iconografía son sprites pixel 7×7. Sin fuentes *sans*: solo pixel/monospace.

---

## 1. Formato y andamiaje

- **Tipo de archivo:** un único Design Component `Guía Técnica ArcadeVS.dc.html` (se abre directo en el navegador). Estructura: `<x-dc>` con un bloque `<helmet>` al inicio, el cuerpo de la plantilla con estilos **inline**, y una clase de lógica `class Component extends DCLogic`.
- **Estilos:** siempre inline (`style="…"`). En `<helmet><style>` solo viven los tokens `:root`, los temas `[data-theme]`, los `@keyframes`, el reset de `body` y el `<link>` de fuentes.
- **Ancho del documento:** columna central `max-width:880px; margin:0 auto; padding:60px 36px 130px`, sobre fondo CRT oscuro, con overlays fijos de scanlines + viñeta + barrido.

### Cabeza del documento (`<helmet>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&family=Silkscreen:wght@400;700&family=VT323&display=swap" rel="stylesheet">
```

---

## 2. Color — tokens y temas CRT

Crea **siempre** contra las variables, nunca contra el hexadecimal crudo. La paleta por defecto es **Sakura**. Los temas se activan con `document.documentElement.setAttribute('data-theme','amber'|'blue')` (Sakura = sin atributo).

```css
:root{                          /* SAKURA (por defecto) */
  --bg-screen:#1a0510; --bg-panel:#240a18; --bg-panel-2:#2e0e22;
  --phosphor-pink:#ff8fb1; --petal-white:#ffe4ec; --neon-pink:#ff4d8f;
  --celadon:#a8d8a8; --pink-dim:#c46a86; --pink-faint:#7a3e52;
  --glow-neon:255,77,143; --glow-pink:255,143,177; --glow-cel:168,216,168;
  --border:rgba(255,77,143,.26);
}
[data-theme="amber"]{          /* DARK AMBER */
  --bg-screen:#180e02; --bg-panel:#231603; --bg-panel-2:#2c1d06;
  --phosphor-pink:#ffcf8f; --petal-white:#fff1da; --neon-pink:#ff9e2e;
  --celadon:#9fd6c2; --pink-dim:#c39a5a; --pink-faint:#6f5226;
  --glow-neon:255,158,46; --glow-pink:255,207,143; --glow-cel:159,214,194;
  --border:rgba(255,158,46,.26);
}
[data-theme="blue"]{           /* ELECTRIC BLUE */
  --bg-screen:#02101a; --bg-panel:#06192a; --bg-panel-2:#0a2438;
  --phosphor-pink:#8fcaff; --petal-white:#dcefff; --neon-pink:#3da6ff;
  --celadon:#86e0bf; --pink-dim:#5a96c4; --pink-faint:#26506f;
  --glow-neon:61,166,255; --glow-pink:143,202,255; --glow-cel:134,224,191;
  --border:rgba(61,166,255,.26);
}
```

**Roles (jerarquía por brillo):**
- `--petal-white` → énfasis máximo (texto que «brilla más»).
- `--phosphor-pink` → texto primario / cuerpo.
- `--pink-dim` → secundario / descripciones.
- `--pink-faint` → apagado / deshabilitado.
- `--neon-pink` → activo / seleccionado / acentos, líneas de separación.
- `--celadon` → acento de contraste (online, conteos, encabezados de torneo, el reloj).
- Los tripletes `--glow-*` son los **componentes RGB** que alimentan `rgba(var(--glow-neon), …)` en sombras/halos, de modo que cada tema recolorea sus glows automáticamente.

---

## 3. Tipografía

Tres familias de Google Fonts (sustitutas de fuentes bitmap PC‑98/DOS no redistribuibles). **Ninguna sans en ninguna parte.**

| Familia | Rol | Uso |
|---|---|---|
| `DotGothic16` | primaria | UI, cuerpo, nombres de filas |
| `VT323` | terminal CRT | numéricos, temporizadores, códigos, ticker, código fuente |
| `Silkscreen` (400/700) | display bitmap | logo y encabezados duros |

- **Reset:** `body{ font-family:'DotGothic16',monospace; color:var(--phosphor-pink); line-height:1.7; -webkit-font-smoothing:none; text-rendering:geometricPrecision; }`
- **Tracking de mayúsculas (`--ls-caps`) ≈ `0.14em`** en etiquetas/botones; los títulos Silkscreen usan `letter-spacing:.10–.14em`.
- **Escala** (1rem = 16px): micro 11 · xs 13 · sm 15 · base 16 · md 20 · lg 24 · xl 32 · 2xl 44. Interlineado generoso (1.6–1.85) porque las fuentes pixel lo piden.

---

## 4. Espaciado y rejilla

Rejilla estricta de **4px**. Las regiones se separan con una **línea de neón de 1px**, no con espacios.

```
--sp-1:4px  --sp-2:8px  --sp-3:12px  --sp-4:16px  --sp-6:24px  --sp-8:32px
--line:1px  --bezel:4px  --ctl-h:40px (control)  28px (control sm)  --icon:24px
--radius:0  /* esquinas rectas */   --radius-soft:2px (solo chips)
```

Escala de muestra (cuadros de neón con bloom): 4 · 8 · 16 · 24 · 32 · 48 · 64 px.

---

## 5. Efectos CRT (la firma de la marca)

Animación **elegante y contenida**: las pantallas entran con fade‑up, las reglas se «dibujan» solas, un barrido brillante baja una vez al cargar. *Hover = se ilumina* (sube brillo/bloom), nunca oscurece ni encoge.

### 5.1 Keyframes (en `<helmet><style>`)

```css
@keyframes scanDrift{0%{background-position:0 0}100%{background-position:0 6px}}
@keyframes caretBlink{0%,48%{opacity:1}49%,100%{opacity:0}}
@keyframes dotPulse{0%,100%{filter:drop-shadow(0 0 3px rgba(var(--glow-neon),.5));opacity:1}
                    50%{filter:drop-shadow(0 0 9px rgba(var(--glow-neon),.95));opacity:.85}}
@keyframes livePulse{0%,100%{opacity:1;text-shadow:0 0 10px rgba(var(--glow-neon),.7)}
                     50%{opacity:.4;text-shadow:0 0 4px rgba(var(--glow-neon),.3)}}
@keyframes sweepDown{0%{transform:translateY(-30vh);opacity:0}10%{opacity:1}
                     100%{transform:translateY(130vh);opacity:0}}
@keyframes flick{0%,100%{opacity:1}50%{opacity:.92}}
```

### 5.2 Overlays fijos (3 `<div>` justo tras `</helmet>`, antes de la columna)

```html
<!-- SCANLINES (animadas) -->
<div style="position:fixed;inset:0;pointer-events:none;z-index:80;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(0,0,0,.24) 3px,rgba(0,0,0,0) 4px);
  animation:scanDrift 7s linear infinite;display:{{ scanOn }}"></div>
<!-- VIÑETA / CURVATURA -->
<div style="position:fixed;inset:0;pointer-events:none;z-index:81;
  background:radial-gradient(ellipse 110% 110% at 50% 50%,transparent 58%,rgba(0,0,0,.62) 100%);
  display:{{ vignetteOn }}"></div>
<!-- BARRIDO de carga (una sola vez) -->
<div style="position:fixed;left:0;right:0;top:0;height:18vh;pointer-events:none;z-index:82;
  background:linear-gradient(rgba(var(--glow-pink),0),rgba(var(--glow-pink),.05),rgba(var(--glow-pink),0));
  animation:sweepDown 2.6s ease-out 1 forwards"></div>
```

La columna de contenido lleva un parpadeo CRT muy sutil: `animation:flick 6s ease-in-out infinite`.

### 5.3 Recetas de bloom (memorizar)

- **Bloom de texto rosa:** `text-shadow:0 0 10px rgba(var(--glow-pink),.55), 0 0 24px rgba(var(--glow-neon),.3)`
- **Bloom de borde:** `box-shadow:0 0 14px rgba(var(--glow-neon),.45), inset 0 0 14px rgba(var(--glow-neon),.18)`
- **Halo de icono SVG:** `filter:drop-shadow(0 0 2px rgba(var(--glow-neon),.7))`
- **Textura scanline local** (dentro de un panel CRT): `background-image:repeating-linear-gradient(0deg,transparent 0,transparent 2px,rgba(0,0,0,.26) 3px,transparent 4px)`
- **Rejilla de pixel:** `background-image:linear-gradient(rgba(var(--glow-neon),.08) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--glow-neon),.08) 1px,transparent 1px);background-size:6px 6px`

---

## 6. Iconografía — sprites pixel 7×7

Sin icon‑font ni emoji. Cada glifo es una matriz 7×7 de `#`/`.` renderizada como SVG nítido (`shape-rendering:crispEdges`) con halo de fósforo. Mapa `GLYPHS` (definido en la clase de lógica):

```js
glyphs = {
  pawn:    ["..###..",".#####.","..###..","...#...","..###..",".#####.","#######"],
  grid:    ["#######","#.#.#.#","#######","#.#.#.#","#######","#.#.#.#","#######"],
  letters: ["..###..",".#...#.",".#...#.",".#####.",".#...#.",".#...#.","......."],
  dice:    ["#######","#.....#","#.#.#.#","#.....#","#.#.#.#","#.....#","#######"],
  crown:   ["#..#..#","#.###.#","#######","#######","#######","#######","......."],
  petal:   ["..#.#..",".#####.","#######","#######",".#####.","..###..","...#..."],
  clock:   ["..###..",".#...#.","#..#..#","#..###.","#.....#",".#...#.","..###.."],
  star:    ["...#...","...#...",".#####.","..###..",".##.##.","##...##","......."]
};
```

Constructor del SVG (un `<rect>` 1×1 por cada `#`):

```js
glyph(name, size, color, glow) {
  const rows = this.glyphs[name] || this.glyphs.pawn;
  const rects = [];
  rows.forEach((row, y) => row.split('').forEach((ch, x) => {
    if (ch === '#') rects.push(React.createElement('rect',
      { key: x+'-'+y, x, y, width: 1.02, height: 1.02, style: { fill: color } }));
  }));
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 7 7', shapeRendering: 'crispEdges',
    style: { display:'block', flex:'0 0 auto', filter:'drop-shadow(0 0 2px rgba('+glow+',.7))' }
  }, rects);
}
```

Para añadir un glifo, extiende `GLYPHS` con otra matriz 7×7; mantenlo en rejilla y reconocible a 24–32px.

---

## 7. Componentes — recetas exactas

Todas las medidas son literales inline. Reutiliza estos patrones.

### 7.1 Encabezado de sección numerado
```html
<div style="display:flex;align-items:center;gap:14px;margin:64px 0 4px;flex-wrap:wrap">
  <span style="font-family:'Silkscreen',monospace;font-size:18px;color:var(--bg-screen);
    background:var(--neon-pink);padding:6px 9px;box-shadow:0 0 16px rgba(var(--glow-neon),.55)">02</span>
  <h2 style="margin:0;font-family:'Silkscreen',monospace;font-size:25px;letter-spacing:.13em;
    color:var(--phosphor-pink);text-shadow:0 0 10px rgba(var(--glow-pink),.55),0 0 24px rgba(var(--glow-neon),.3)">COLOR</h2>
</div>
<div style="height:1px;background:linear-gradient(90deg,var(--neon-pink),rgba(var(--glow-neon),0));
  box-shadow:0 0 8px rgba(var(--glow-neon),.5);margin-bottom:26px"></div>
```

### 7.2 Panel / ficha (contenedor base)
`background:var(--bg-panel); border:1px solid var(--border); box-shadow:0 0 22px rgba(var(--glow-neon),.06), inset 0 0 40px rgba(0,0,0,.3); padding:24px`

### 7.3 Bloque de código (terminal)
`background:var(--bg-screen); border-left:2px solid var(--neon-pink); box-shadow:0 0 14px rgba(var(--glow-neon),.05); padding:14px 16px; font-family:'VT323',monospace; font-size:16px; color:var(--phosphor-pink); line-height:1.6; overflow-x:auto` — escapa `<` `>` como `&lt;` `&gt;`.

### 7.4 BiosButton (4 estados)
Botón de selección estilo BIOS, **no** redondeado.
- **Inactivo:** texto fósforo + contorno neón. `font-family:'Silkscreen'; font-size:12px; letter-spacing:.16em; color:var(--phosphor-pink); background:transparent; border:1px solid var(--neon-pink); padding:11px 20px; box-shadow:0 0 8px rgba(var(--glow-neon),.25); text-shadow:0 0 6px rgba(var(--glow-pink),.6)`. En hover: sube box-shadow a `.6` y color a `--petal-white`.
- **Selected (vídeo invertido):** `color:var(--bg-screen); background:var(--neon-pink); box-shadow:0 0 16px rgba(var(--glow-neon),.6)` + caret `►` parpadeante (`animation:caretBlink 1s steps(1) infinite`) antes de la etiqueta.
- **Small:** `font-size:10px; padding:7px 14px`.
- **Disabled (OFF):** `color/border:var(--pink-faint)`, sin glow, `cursor:not-allowed`.

### 7.5 Badge / StatusDot
- **Badge:** caja entre corchetes en VT323. tone `celadon` → texto+borde celadón; tone `neon solid` → `background:var(--neon-pink); color:var(--bg-screen)`; default → fósforo. `padding:3px 9px`.
- **StatusDot:** cuadro de pixel `11px` (sin radio) + etiqueta Silkscreen 10px en mayúsculas. `online`=celadón y `ingame`=neón **laten** (`animation:dotPulse 1.8s ease-in-out infinite`); `away`=`--pink-faint` sin pulso.

### 7.6 SectionHeader (bilingüe → ahora monolingüe)
Glifo PixelIcon + etiqueta Silkscreen 15px `letter-spacing:.14em` con bloom. *(El subtítulo katakana fue retirado de este diseño; ver §9.)*

### 7.7 CrtFrame / ArcadePanel (cristal)
Único elemento con esquinas curvas: `border:2px solid var(--neon-pink); border-radius:16px; box-shadow:0 0 22px rgba(var(--glow-neon),.4), inset 0 0 40px rgba(0,0,0,.5); overflow:hidden` + textura scanline local (§5.3). Badge de letra A/B/C en la esquina: `position:absolute; top:10px; right:14px; VT323 14px; color:var(--pink-faint)`.

### 7.8 Filas de lobby (GameRow / FriendRow / TournamentRow)
Se apilan **sin huecos** dentro de un panel `background:var(--bg-screen)`, separadas por `border-bottom:1px solid var(--border)`. Patrón: `display:flex; align-items:center; gap:16px; padding:14px 18px`.
- **GameRow:** `{icono}` · nombre (DotGothic16 17px, `flex:1`) · Badge celadón `«128 ON»` · BiosButton `PLAY`.
- **FriendRow:** tile de avatar `30px` (`--bg-panel-2`, inicial en VT323) · nombre/código (VT323 17px) · StatusDot.
- **TournamentRow:** icono corona celadón · nombre · Badge `«64 ENT»` (borde `--pink-faint`) · cuenta atrás `HH:MM:SS` (VT323 22px celadón con bloom) que al llegar a 0 cambia a `LIVE NOW` (`animation:livePulse 1.4s ease-in-out infinite`).

---

## 8. Lógica (`class Component extends DCLogic`)

Responsabilidades: aplicar tema, generar iconos pixel, y mantener relojes/cuentas atrás **en vivo**.

```js
class Component extends DCLogic {
  glyphs = { /* …matrices 7×7 de §6… */ };
  state = { t1: 5400, t2: 600, clock: '' };       // t1=01:30:00, t2=00:10:00

  componentDidMount() { this.applyTheme(); this.tick(); this._iv = setInterval(() => this.tick(), 1000); }
  componentDidUpdate() { this.applyTheme(); }      // reaplica tema en cada render
  componentWillUnmount() { clearInterval(this._iv); }

  tick() {
    const d = new Date();
    const cl = [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2,'0')).join(':');
    this.setState(s => ({ t1: Math.max(0, s.t1-1), t2: Math.max(0, s.t2-1), clock: cl }));
  }
  applyTheme() {
    const t = this.props.theme || 'sakura';
    const r = document.documentElement;
    if (t === 'sakura') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', t);
  }
  fmt(sec){ const h=String(Math.floor(sec/3600)).padStart(2,'0'),
            m=String(Math.floor(sec%3600/60)).padStart(2,'0'),
            s=String(sec%60).padStart(2,'0'); return h+':'+m+':'+s; }
  glyph(name,size,color,glow){ /* …de §6… */ }

  renderVals() {
    const NEON='var(--neon-pink)', PINK='var(--phosphor-pink)', CEL='var(--celadon)';
    const GN='var(--glow-neon)', GP='var(--glow-pink)', GC='var(--glow-cel)';
    const g = (n,s,c,gl) => this.glyph(n,s,c,gl);
    return {
      scanOn: (this.props.scanlines ?? true) ? 'block' : 'none',
      vignetteOn: (this.props.curvature ?? true) ? 'block' : 'none',
      t1: this.fmt(this.state.t1), t2: this.fmt(this.state.t2),
      clock: this.state.clock || '00:00:00',
      // iconos (nombre,tamaño,color,glow) — uno por uso en la plantilla:
      shPawn:g('pawn',32,NEON,GN), shGrid:g('grid',32,NEON,GN), /* …showcase 32px neón… */
      hdrPawn:g('pawn',26,PINK,GP), hdrCrown:g('crown',26,CEL,GC),
      grPawn:g('pawn',28,PINK,GP), /* …etc para cada fila… */
    };
  }
}
```

Los iconos se exponen como nodos React por `renderVals()` y se insertan en la plantilla con holes `{{ shPawn }}`, `{{ hdrCrown }}`, etc. Los temporizadores `{{ t1 }}` `{{ t2 }}` `{{ clock }}` también son holes (valores en vivo).

### Props / Tweaks (`data-props`)
```json
{
  "$preview": { "width": 920, "height": 1500 },
  "theme":     { "editor": "enum", "options": ["sakura","amber","blue"], "default": "sakura", "section": "CRT" },
  "scanlines": { "editor": "boolean", "default": true, "section": "CRT" },
  "curvature": { "editor": "boolean", "default": true, "section": "CRT" }
}
```

---

## 9. Contenido y voz

- **Tono:** escueto, tipo sistema, algo juguetón — pantalla de atracción de arcade, no dashboard SaaS.
- **Mayúsculas** con tracking amplio en etiquetas/botones; numéricos desnudos en monospace.
- **Sin emoji:** el estado usa cuadros de pixel + palabras (`ONLINE · IN GAME · AWAY`).
- **Idioma:** *en esta versión se retiró todo el katakana/japonés decorativo*. Los subtítulos kana de los encabezados y el «ruido» atmosférico se eliminan; los nombres que portan información se escriben en inglés/latino (Chess, Dots, Word Search, Backgammon, Sakura Cup, Night Blitz, Go Master). Conserva las menciones en prosa española («soporta katakana y kanji») por ser explicativas.

### Estructura del documento (orden de secciones)
1. **Hero** — etiqueta `ARCADEVS · SYSTEM DOC`, logotipo `ARCADEVS` (Silkscreen 62px con bloom triple), `GUÍA TÉCNICA DEL DISEÑO`, subtítulo y línea `VER · 1.0 · SAKURA / AMBER / BLUE · NS · TablPolisDesignSystem_0d5fe2`.
2. **ÍNDICE** — rejilla de 2 columnas, ítems `01…11` (número neón + título fósforo).
3. **01 Concepto y principios** — 2 párrafos + 4 fichas (Fósforo · Esquinas rectas · Bilingüe · Sin emoji).
4. **02 Color** — párrafo + 8 swatches (con hex literal sakura) + bloque «Jerarquía por brillo» + comentario de temas.
5. **03 Tipografía** — 3 especímenes (DotGothic16 / VT323 / Silkscreen) + escala.
6. **04 Espaciado y rejilla** — barras 4→64 + bloque de tokens.
7. **05 Efectos CRT** — 4 fichas (Bloom · Edge · Scan · Grid, cada una mostrando su efecto) + nota de animación.
8. **06 Iconografía** — panel con los 8 sprites + nota del mapa GLYPHS.
9. **07 Componentes base** — fichas BiosButton, Badge·StatusDot, SectionHeader, CrtFrame·ArcadePanel (demo en vivo + tabla de props + código).
10. **08 Componentes de lobby** — fichas GameRow, FriendRow, TournamentRow.
11. **09 Cómo construir una pantalla** — 5 pasos + recreación del lobby completo (header con reloj en vivo, 2 columnas, barra de estado) + código.
12. **10 Voz y contenido** — 4 fichas + bloque de ejemplos.
13. **11 Notas técnicas** — cargar el sistema, temas CRT, nota de sustitución de fuentes, advertencia «no editar archivos generados».
14. **Footer** — regla + `ARCADEVS` + `GUÍA TÉCNICA · FIN DEL DOCUMENTO`.

---

## 10. Checklist de fidelidad

- [ ] Fondo `--bg-screen`; todo el texto/borde con bloom; nada plano.
- [ ] Solo DotGothic16 / VT323 / Silkscreen; ninguna sans.
- [ ] Esquinas rectas en todo salvo el cristal CrtFrame (radius 16) y chips (2px).
- [ ] Separadores = línea de neón de 1px con glow, no espacios en blanco.
- [ ] Scanlines + viñeta + barrido de carga activos; columna con `flick`.
- [ ] Iconos = sprites SVG 7×7 con `crispEdges` y drop‑shadow; sin emoji.
- [ ] Reloj, caret, status dots, `LIVE NOW` y cuentas atrás animados/en vivo.
- [ ] Tweaks funcionales: tema (Sakura/Amber/Blue), scanlines, curvatura — todo recolorea vía `--glow-*`.
- [ ] Cero caracteres katakana/kanji en la interfaz renderizada (§9).
