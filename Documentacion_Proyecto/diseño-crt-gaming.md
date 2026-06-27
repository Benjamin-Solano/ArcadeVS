# Instrucciones exactas — Recrear el diseño web «ArcadeVS»

Documento de construcción del sistema de diseño **ArcadeVS**: estética CRT de fósforo *sakura* (menú de juego PC‑98 + pantalla BIOS). Sigue estas instrucciones al pie de la letra para reproducir el diseño pixel por pixel.

> **Principio rector:** *todo es emisión de fósforo, no tinta*. Nada es plano: cada texto y cada borde emite un halo (bloom). La jerarquía se controla por **brillo**, no por peso. Esquinas rectas (radio 0) en todos los elementos sin excepción. Sin emoji: la iconografía son sprites pixel 7×7. Sin fuentes *sans*: solo pixel/monospace. **Todo el texto de la UI va en español y mayúsculas.**

---

## 1. Formato y andamiaje

- **Resolución de pantalla:** las vistas de autenticación son **desktop-first** — frame base de `1280 × 800 px`.
- **Layout split-panel:** columna izquierda fija de `460 px` (hero/branding) + columna derecha `820 px` (formulario).
- **Columna de formulario:** el contenido se centra horizontalmente dentro del panel derecho en un contenedor de `420 px` de ancho.
- **Estilos:** siempre inline (`style="…"`). En `<helmet><style>` solo viven los tokens `:root`, los temas `[data-theme]`, los `@keyframes`, el reset de `body` y el `<link>` de fuentes.

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
:root {                          /* SAKURA (por defecto) */
  --bg-screen:  #1a0510;
  --bg-panel:   #240a18;
  --bg-panel-2: #2e0e22;
  --bg-left:    #240a12;   /* panel izquierdo hero */
  --phosphor-pink: #ff8fb1;
  --petal-white:   #ffe4ec;
  --neon-pink:     #ff4d8f;
  --celadon:       #a8d8a8;
  --pink-dim:      #c46a86;
  --pink-faint:    #7a3e52;
  --glow-neon:  255,77,143;
  --glow-pink:  255,143,177;
  --glow-cel:   168,216,168;
  --border: rgba(255,77,143,.26);
}

[data-theme="amber"] {           /* DARK AMBER */
  --bg-screen:  #180e02;
  --bg-panel:   #231603;
  --bg-panel-2: #2c1d06;
  --bg-left:    #231302;
  --phosphor-pink: #ffcf8f;
  --petal-white:   #fff1da;
  --neon-pink:     #ff9e2e;
  --celadon:       #9fd6c2;
  --pink-dim:      #c39a5a;
  --pink-faint:    #6f5226;
  --glow-neon:  255,158,46;
  --glow-pink:  255,207,143;
  --glow-cel:   159,214,194;
  --border: rgba(255,158,46,.26);
}

[data-theme="blue"] {            /* ELECTRIC BLUE */
  --bg-screen:  #02101a;
  --bg-panel:   #06192a;
  --bg-panel-2: #0a2438;
  --bg-left:    #061522;
  --phosphor-pink: #8fcaff;
  --petal-white:   #dcefff;
  --neon-pink:     #3da6ff;
  --celadon:       #86e0bf;
  --pink-dim:      #5a96c4;
  --pink-faint:    #26506f;
  --glow-neon:  61,166,255;
  --glow-pink:  143,202,255;
  --glow-cel:   134,224,191;
  --border: rgba(61,166,255,.26);
}
```

**Roles (jerarquía por brillo):**
- `--petal-white` → énfasis máximo (títulos principales de pantalla).
- `--phosphor-pink` → texto primario / cuerpo.
- `--pink-dim` → etiquetas de campo / subtítulos / texto secundario.
- `--pink-faint` → deshabilitado / placeholders / notas de validación / footer.
- `--neon-pink` → activo / seleccionado / acentos / marcador `!` obligatorio / botón primario / hero L2.
- `--celadon` → email maskeado, display timer, botón `?` de ayuda, marcador `?` de leyenda.
- `--bg-left` → fondo exclusivo del panel hero izquierdo.
- Los tripletes `--glow-*` alimentan `rgba(var(--glow-neon), …)` en sombras y halos.

---

## 3. Tipografía

Tres familias de Google Fonts. **Ninguna sans en ninguna parte.**

| Familia | Rol | Uso |
|---|---|---|
| `DotGothic16` | primaria | UI, cuerpo |
| `VT323` | terminal CRT | numéricos, temporizadores, botón `?` |
| `Silkscreen` (400/700) | display bitmap | logo, títulos, etiquetas de campo, botones, hero |

- **Reset:** `body { font-family:'DotGothic16',monospace; color:var(--phosphor-pink); line-height:1.7; -webkit-font-smoothing:none; text-rendering:geometricPrecision; }`
- **Todo el texto de UI en mayúsculas** con `letter-spacing: 0.10–0.16em`.
- **Escala de uso en pantallas de auth:**

| Elemento | Familia | Tamaño | Color |
|---|---|---|---|
| Logo `ARCADEVS` | Silkscreen Bold | 28px | `--neon-pink` |
| Hero L1 | Silkscreen Bold | 32–36px | `--petal-white` |
| Hero L2 | Silkscreen Bold | 24–32px | `--neon-pink` |
| Título de pantalla | Silkscreen Bold | 18–20px | `--petal-white` |
| Subtítulo | Silkscreen | 9px | `--pink-dim` |
| Etiqueta de campo | Silkscreen | 9–10px | `--pink-dim` |
| Marcador `!` | Silkscreen Bold | 9px | `--neon-pink` |
| Placeholder | Silkscreen | 10px | `--pink-faint` |
| Botón texto | Silkscreen Bold | 10px | `--bg-screen` (selected) / `--phosphor-pink` (inactivo) |
| Botón `?` | VT323 Bold | 13px | `--celadon` |
| Footer | Silkscreen | 8px | `--pink-faint` |
| Timer | Silkscreen Bold | 28px | `--neon-pink` |

---

## 4. Espaciado y rejilla

Rejilla estricta de **4 px**. Las regiones se separan con una **línea de neón de 1 px con gradiente**, no con espacios en blanco.

```
--sp-1:4px  --sp-2:8px  --sp-3:12px  --sp-4:16px  --sp-6:24px  --sp-8:32px
--line:1px
--ctl-h-btn:40px   (BiosButton)
--ctl-h-input:36px (InputField)
--radius:0         (esquinas rectas absolutas, sin excepción)
```

**Medidas del formulario:**
- `leftW = 460px` — ancho panel izquierdo
- `formW = 420px` — ancho contenedor formulario
- `formX = leftW + (rightW - formW) / 2 = 660px` — posición X del formulario
- `fieldW = formW - 32px = 388px` — ancho campo full (deja 32px para botón `?`)
- `halfW = (fieldW - 14px) / 2 = 187px` — ancho campo mitad (Nombre / Apellido), gap de 14px entre columnas

---

## 5. Efectos CRT (la firma de la marca)

### 5.1 Keyframes

```css
@keyframes scanDrift  { 0%   { background-position:0 0 }   100% { background-position:0 6px } }
@keyframes caretBlink { 0%,48% { opacity:1 } 49%,100% { opacity:0 } }
@keyframes dotPulse   {
  0%,100% { filter:drop-shadow(0 0 3px rgba(var(--glow-neon),.5)); opacity:1 }
  50%     { filter:drop-shadow(0 0 9px rgba(var(--glow-neon),.95)); opacity:.85 }
}
@keyframes timerPulse {
  0%,100% { opacity:1; text-shadow:0 0 12px rgba(var(--glow-neon),.8) }
  50%     { opacity:.6; text-shadow:0 0 4px rgba(var(--glow-neon),.3) }
}
@keyframes sweepDown  {
  0%   { transform:translateY(-30vh); opacity:0 }
  10%  { opacity:1 }
  100% { transform:translateY(130vh); opacity:0 }
}
@keyframes flick { 0%,100% { opacity:1 } 50% { opacity:.92 } }
```

### 5.2 Overlays fijos

```html
<!-- SCANLINES -->
<div style="position:fixed;inset:0;pointer-events:none;z-index:80;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(0,0,0,.24) 3px,rgba(0,0,0,0) 4px);
  animation:scanDrift 7s linear infinite"></div>
<!-- VIÑETA -->
<div style="position:fixed;inset:0;pointer-events:none;z-index:81;
  background:radial-gradient(ellipse 110% 110% at 50% 50%,transparent 58%,rgba(0,0,0,.62) 100%)"></div>
<!-- BARRIDO de carga (una sola vez) -->
<div style="position:fixed;left:0;right:0;top:0;height:18vh;pointer-events:none;z-index:82;
  background:linear-gradient(rgba(var(--glow-pink),0),rgba(var(--glow-pink),.05),rgba(var(--glow-pink),0));
  animation:sweepDown 2.6s ease-out 1 forwards"></div>
```

### 5.3 Recetas de bloom

- **Bloom de texto título:** `text-shadow:0 0 10px rgba(var(--glow-pink),.55), 0 0 24px rgba(var(--glow-neon),.3)`
- **Bloom de borde/panel:** `box-shadow:0 0 14px rgba(var(--glow-neon),.45), inset 0 0 14px rgba(var(--glow-neon),.18)`
- **Bloom botón primario:** `box-shadow:0 0 16px rgba(var(--glow-neon),.6)`
- **Bloom timer:** `text-shadow:0 0 12px rgba(var(--glow-neon),.8)` + `animation:timerPulse 1.8s ease-in-out infinite`
- **Viñeta panel izquierdo:** `background:radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 55%, rgba(0,0,0,.72) 100%)`
- **Separador horizontal:** `background:linear-gradient(90deg, transparent 0%, var(--neon-pink) 50%, transparent 100%)` — 1px alto, ancho `formW`
- **Divisor vertical:** rect `1px × 800px` en `rgba(var(--glow-neon),.25)` + rect `6px × 800px` en `rgba(var(--glow-neon),.06)` como glow difuso

---

## 6. Iconografía — sprites pixel 7×7

Sin icon-font ni emoji. Cada glifo es una matriz 7×7 renderizada como SVG (`shape-rendering:crispEdges`) con `filter:drop-shadow(0 0 2px rgba(var(--glow-neon),.7))`.

```js
glyphs = {
  pawn:    ["..###..",".#####.","..###..","...#...","..###..",".#####.","#######"],
  grid:    ["#######","#.#.#.#","#######","#.#.#.#","#######","#.#.#.#","#######"],
  letters: ["..###..",".#...#.",".#...#.",".#####.",".#...#.",".#...#.","......."],
  dice:    ["#######","#.....#","#.#.#.#","#.....#","#.#.#.#","#.....#","#######"],
  crown:   ["#..#..#","#.###.#","#######","#######","#######","#######","......."],
  petal:   ["..#.#..",".#####.","#######","#######",".#####.","..###..","...#..."],
  clock:   ["..###..",".#...#.","#..#..#","#..###.","#.....#",".#...#.","..###.."],
  star:    ["...#...","...#...",".#####.","..###..",".##.##.","##...##","......."],
};
```

Constructor del SVG — un `<rect>` 1×1 por cada `#`:

```js
glyph(name, size, color, glow) {
  const rows = this.glyphs[name] || this.glyphs.pawn;
  const rects = [];
  rows.forEach((row, y) => row.split('').forEach((ch, x) => {
    if (ch === '#') rects.push(
      React.createElement('rect', { key:`${x}-${y}`, x, y, width:1.02, height:1.02, style:{ fill:color } })
    );
  }));
  return React.createElement('svg', {
    width:size, height:size, viewBox:'0 0 7 7', shapeRendering:'crispEdges',
    style:{ display:'block', flex:'0 0 auto', filter:`drop-shadow(0 0 2px rgba(${glow},.7))` }
  }, rects);
}
```

---

## 7. Componentes base — recetas exactas

### 7.1 BiosButton (4 estados)

Altura fija `40px`, radio `0`, ancho flexible.

| Estado | Estilo |
|---|---|
| **Selected (primario)** | `background:var(--neon-pink); color:var(--bg-screen); border:1px solid var(--neon-pink); box-shadow:0 0 16px rgba(var(--glow-neon),.6)` + prefijo `► ` |
| **Inactivo** | `background:var(--bg-panel-2); color:var(--phosphor-pink); border:1px solid var(--neon-pink)` |
| **Disabled** | `color:var(--pink-faint); border-color:var(--pink-faint)` sin glow, `cursor:not-allowed` |

- Texto: Silkscreen Bold 10px, centrado, `letter-spacing:.16em`
- En hover sobre inactivo: `box-shadow` sube a `.6`, color a `--petal-white`

### 7.2 InputField

```
Altura:      36px, radio 0
Ancho:       fieldW (full) o halfW (media columna)
Etiqueta:    Silkscreen 9–10px, --pink-dim, sobre la caja
Marcador !:  Silkscreen Bold 9px, --neon-pink, 4px a la derecha de la etiqueta
Caja:        background --bg-panel-2
             border 1px solid rgba(var(--glow-neon),.35)
             stroke-align: inside
Placeholder: Silkscreen 10px, --pink-faint, padding-left 10px
Botón ?:     28 × 36px, radio 0
             background --bg-panel
             border 1px solid rgba(var(--glow-cel),.55)
             VT323 Bold 13px, --celadon, centrado
             4px a la derecha de la caja de input
```

### 7.3 Leyenda de íconos

Fila horizontal alineada al borde izquierdo del formulario (`formX`), siempre encima del primer campo:

```
?  = INFO DEL CAMPO         (? Silkscreen Bold 9px --celadon + texto Silkscreen 8px --pink-faint)
!  = CAMPO OBLIGATORIO      (! Silkscreen Bold 9px --neon   + texto Silkscreen 8px --pink-faint)
```

Gap entre los dos ítems: suficiente para que no se solapen (~140px).

### 7.4 Separador de sección

```css
height: 1px;
background: linear-gradient(90deg, transparent 0%, var(--neon-pink) 50%, transparent 100%);
width: 420px; /* formW */
```

Usar antes y después de grupos clave (antes del primer campo, antes del botón primario, antes del footer).

### 7.5 Divisor vertical del split

```css
/* Línea principal */
width: 1px; height: 800px;
background: rgba(var(--glow-neon), .25);

/* Glow difuso superpuesto */
width: 6px; height: 800px; x: leftW - 3px;
background: rgba(var(--glow-neon), .06);
```

### 7.6 Badge de tema

Caja `100 × 24px`, esquina inferior-izquierda del panel hero (`x=48, y=H-52`).

```
background: var(--bg-panel-2)
border: 1px solid rgba(var(--glow-neon),.4)
texto: Silkscreen Regular 9px, --neon-pink, centrado
contenido: [ SAKURA ] | [ AMBER ] | [ BLUE ]
```

### 7.7 Link subrayado

Silkscreen 9px `--pink-dim`. La porción accionable lleva un `rect` de `1px` en `rgba(var(--glow-neon),.7)` pegado inmediatamente debajo del texto.

---

## 8. Panel izquierdo — hero/branding (460 × 800 px)

Estructura idéntica en todas las pantallas de auth. Solo cambia el **título hero** y el **texto de contexto**.

```
background: --bg-left
+ viñeta radial oscura: radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.72) 100%)
+ glow radial neón al 4%: radial-gradient(ellipse at 50% 50%, rgba(var(--glow-neon),.04) 0%, transparent 60%)

y=52    ARCADEVS          Silkscreen Bold 28px, --neon-pink
y=94    ▬▬▬▬▬▬▬▬▬▬       rect 200×2px, --neon-pink opacidad .5
y=260   HERO L1           Silkscreen Bold 32–36px, --petal-white
y=304   HERO L2           Silkscreen Bold 24–32px, --neon-pink
y=350   ▬▬▬              rect 80×3px, --neon-pink opacidad .7
y=368   subtexto L1       Silkscreen 9px, --pink-dim
y=384   subtexto L2       Silkscreen 9px, --pink-faint
y=H-52  [ TEMA ]          badge
```

| Pantalla | Hero L1 | Hero L2 | Subtexto L1 | Subtexto L2 |
|---|---|---|---|---|
| Registro | `EMPIEZA` | `AQUI` | `SISTEMA DE REGISTRO · ARCADEVS` | `VER 1.0 · [TEMA]` |
| Verificación | `VERIFICA` | `TU CUENTA` | `REVISA TU BANDEJA DE ENTRADA.` | `EL CODIGO EXPIRA EN 15 MINUTOS.` |

> El panel izquierdo **no lleva iconos de email, puntos decorativos ni ningún otro elemento gráfico adicional** más allá de los indicados arriba.

---

## 9. Panel derecho — pantallas de autenticación

El formulario se centra en `formW = 420px`:

```
formX = 460 + (820 - 420) / 2 = 660px (desde borde izq. del frame)
```

---

### 9.1 Pantalla REGISTRO (`CREAR CUENTA`)

```
y=80    CREAR CUENTA                    Silkscreen Bold 20px, --petal-white, centrado en formW
y=116   INGRESA TUS DATOS PARA...       Silkscreen 9px, --pink-dim, centrado
y=130   ─────────────── (separador) ───────────────
y=140   ? = INFO DEL CAMPO   ! = CAMPO OBLIGATORIO   (leyenda, alineada a formX)

y=160   NOMBRE !    [__________][?]   APELLIDO !   [__________][?]
            halfW=187px                   col2X = formX + 187 + 32 + 4

y=224   CORREO ELECTRONICO !
        [__________________________________][?]   fieldW=388px

y=288   CONTRASENA !
        [__________________________________][?]

y=352   CONFIRMAR CONTRASENA !
        [__________________________________][?]

y=418   MINIMO 8 CARACTERES.            Silkscreen 8px, --pink-faint
y=430   ─────────────── (separador) ───────────────
y=444   ► REGISTRARSE                  BiosButton selected, ancho formW=420px, alto 40px
y=498   ─────────────── (separador) ───────────────
y=510   YA TIENES UNA CUENTA?  INICIA SESION
                                        Silkscreen 9px, --pink-dim, centrado
                                        "INICIA SESION" con rect subrayado 1px --neon-pink
y=H-28  ARCADEVS · REGISTRO · VER 1.0 · [TEMA]   Silkscreen 8px, --pink-faint, centrado
```

---

### 9.2 Pantalla VERIFICACIÓN (`CODIGO DE VERIFICACION`)

```
y=80    CODIGO DE VERIFICACION         Silkscreen Bold 18px, --petal-white, centrado
y=110   INGRESA EL CODIGO DE 6 DIGITOS ENVIADO A TU CORREO.
                                        Silkscreen 9px, --pink-dim, centrado
y=130   ju***@correo.com               Silkscreen 10px, --celadon, centrado
y=152   ─────────────── (separador) ───────────────
y=162   EXPIRA EN                      Silkscreen 9px, --pink-dim, centrado

y=180   ┌──────────────────┐
        │     14:59        │  Silkscreen Bold 28px, --neon-pink
        └──────────────────┘  caja 160×52px, --bg-panel-2, border 1px --neon-pink (.5)
                               animation: timerPulse 1.8s ease-in-out infinite
        Posición: centrado en formW  (x = formX + (formW-160)/2)

y=240   MM : SS                        Silkscreen 8px, --pink-faint, centrado
y=252   ─────────────── (separador) ───────────────
y=262   INGRESA TU CODIGO:             Silkscreen 9px, --pink-dim, centrado

y=276   [  |  ]  [___]  [___]  —  [___]  [___]  [___]
        ↑ 6 cajas 52×64px, gap 12px entre cajas
        ↑ separador — (VT323 Bold 24px, --pink-faint) entre dígito 3 y 4
        ↑ totalW = 6×52 + 5×12 = 372px  →  startX = formX + (formW-372)/2
        Caja 1 (activa):  border 2px --neon-pink, fondo --bg-panel
                          cursor rect 2×32px --neon-pink, centrado, animation:caretBlink
        Cajas 2–6:        border 1px rgba(--pink-faint,.4), fondo --bg-panel-2
                          placeholder _ Silkscreen Bold 18px --pink-faint, centrado

y=358   ─────────────── (separador) ───────────────
y=372   ► VERIFICAR CODIGO             BiosButton selected, ancho formW, alto 40px
y=426   REENVIAR CODIGO                BiosButton inactivo, ancho formW, alto 40px
y=478   DISPONIBLE SI EL TIEMPO EXPIRA.  Silkscreen 8px, --pink-faint, centrado
y=492   ─────────────── (separador) ───────────────
y=504   REGRESAR AL REGISTRO           Silkscreen 9px, --pink-dim, centrado, subrayado completo
y=H-28  ARCADEVS · VERIFICACION · VER 1.0 · [TEMA]  Silkscreen 8px, --pink-faint, centrado
```

---

## 10. Flujo de navegación entre pantallas

```
┌────────────┐   CREAR CUENTA   ┌────────────┐
│   LOGIN    │ ───────────────► │  REGISTRO  │
│ (pendiente)│                  └─────┬──────┘
└────────────┘                        │ ► REGISTRARSE
      ▲                               ▼
      │                        ┌──────────────┐
      │   VERIFICAR CODIGO     │ VERIFICACION │
      └────────────────────────└──────────────┘
                                      │ REGRESAR AL REGISTRO
                                      └──────────────────────► REGISTRO
```

- **Registro → Verificación:** al pulsar `► REGISTRARSE` exitosamente.
- **Verificación → Login:** al pulsar `► VERIFICAR CODIGO` con código correcto.
- **Verificación → Registro:** link `REGRESAR AL REGISTRO`.
- **Login** (*pendiente de diseño*): acceso desde link `INICIA SESION` en Registro.

---

## 11. Lógica de estado — componentes dinámicos

```js
class Component extends DCLogic {
  state = {
    timer_verificacion: 900,  // 15:00 en segundos → 14:59 al iniciar el tick
    clock: '',
  };

  componentDidMount()    { this.tick(); this._iv = setInterval(() => this.tick(), 1000); }
  componentWillUnmount() { clearInterval(this._iv); }

  tick() {
    const d  = new Date();
    const cl = [d.getHours(), d.getMinutes(), d.getSeconds()]
                 .map(n => String(n).padStart(2,'0')).join(':');
    this.setState(s => ({
      timer_verificacion: Math.max(0, s.timer_verificacion - 1),
      clock: cl,
    }));
  }

  fmt_mm_ss(seg) {
    const m = String(Math.floor(seg / 60)).padStart(2, '0');
    const s = String(seg % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  // true cuando el usuario puede reenviar el código
  get codigo_expirado() { return this.state.timer_verificacion === 0; }
}
```

**Holes de plantilla:**
- `{{ timer }}` → `fmt_mm_ss(timer_verificacion)` — muestra `14:59`, decrece cada segundo.
- `{{ reenviar_disabled }}` → `!codigo_expirado` — el BiosButton `REENVIAR CODIGO` lleva `disabled` mientras el timer no llegue a `0`.

### Props / Tweaks (`data-props`)

```json
{
  "$preview": { "width": 1280, "height": 800 },
  "theme":     { "editor": "enum", "options": ["sakura","amber","blue"], "default": "sakura", "section": "CRT" },
  "scanlines": { "editor": "boolean", "default": true,  "section": "CRT" },
  "curvature": { "editor": "boolean", "default": true,  "section": "CRT" }
}
```

---

## 12. Contenido y voz

- **Idioma:** español en toda la UI. Sin ningún texto en otros idiomas.
- **Mayúsculas** en todos los elementos de UI, con `letter-spacing: 0.10–0.16em`.
- **Sin emoji** en ninguna pantalla.
- **Tono:** escueto, tipo sistema. Mensajes directos: `INGRESA TUS DATOS`, `EL CODIGO EXPIRA EN 15 MINUTOS`, `CAMPO OBLIGATORIO`. Sin lenguaje de marketing.
- **Emails maskeados:** siempre formato `ju***@dominio.com` en `--celadon`.
- **Errores de validación** (*pendiente de diseño*): texto en `--neon-pink`, borde del input al 100% opacidad, prefijo `▸ ERROR:` en Silkscreen Bold.

---

## 13. Checklist de fidelidad

- [ ] Frame `1280 × 800px`; panel izquierdo `460px`; formulario centrado en `420px`.
- [ ] `--bg-left` en panel izquierdo; `--bg-screen` en panel derecho; ambos con viñeta radial.
- [ ] Divisor vertical `1px` + glow difuso `6px`.
- [ ] Solo Silkscreen / DotGothic16 / VT323; cero fuentes sans.
- [ ] `border-radius:0` en **todos** los elementos sin excepción.
- [ ] Separadores horizontales = `1px` con gradiente centrado (desvanece en extremos).
- [ ] Todo texto de UI en **español** y **mayúsculas**.
- [ ] Marcadores `!` (neón) y botón `?` (celadón) en cada campo de formulario.
- [ ] Leyenda `? = INFO DEL CAMPO` y `! = CAMPO OBLIGATORIO` visible encima del primer campo, alineada a `formX`.
- [ ] Panel izquierdo: solo logo, línea, hero L1/L2, línea decorativa, subtexto y badge — sin íconos adicionales.
- [ ] Display timer `MM:SS` con `animation:timerPulse` en pantalla de Verificación.
- [ ] 6 cajas de dígito `52×64px`; separador `—` entre dígito 3 y 4; caja 1 con cursor parpadeante (`caretBlink`).
- [ ] `REENVIAR CODIGO` deshabilitado mientras `timer_verificacion > 0`.
- [ ] Badge `[ SAKURA / AMBER / BLUE ]` en esquina inferior-izquierda del panel hero.
- [ ] Footer centrado: `ARCADEVS · [PANTALLA] · VER 1.0 · [TEMA]` en `--pink-faint`.
- [ ] Scanlines + viñeta + barrido de carga activos al entrar en cada pantalla.
- [ ] Los tres temas recoloran automáticamente vía `--glow-*`.