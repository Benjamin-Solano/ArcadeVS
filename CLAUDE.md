# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ArcadeVS** (CRT Retro Gaming) is a browser-based platform for classic arcade games with a CRT phosphor screen aesthetic. The system handles user profiles, match history, friend lists, leaderboards per game, and tournaments — all in real time.

The repository currently holds the database schema and architecture/design documentation. The application code (frontend and backend) is to be developed following the specs in `Documentacion_Proyecto/`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Games | Canvas API + Vanilla JS |
| Real-time | Socket.io |
| Backend | Node.js + Fastify |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT — no custom session table) |
| Deploy Frontend | Vercel |
| Deploy Backend | Railway |

---

## Architecture

The system is **event-driven** around a central Socket.io bus. When a significant action occurs (match ends, friend request sent, etc.), the responsible component emits an event. Subscribed services react independently without calling each other directly.

```
Client (React) → Socket.io → Event Bus (Node.js)
                                  ├── ServicioLeaderboard
                                  ├── ServicioHistorial
                                  └── ServicioLogros
                                          ↓
                                     PostgreSQL
```

### Backend Layer Structure

```
backend/src/
├── eventos/        # Socket.io event handlers (manejar-juego.js, etc.)
├── servicios/      # Business logic (servicio-leaderboard.js, etc.)
├── repositorios/   # PostgreSQL access (repositorio-usuario.js, etc.)
├── rutas/          # Fastify REST endpoints
└── configuracion/  # DB, Socket.io, env setup
```

### Frontend Layer Structure

```
frontend/src/
├── componentes/    # Reusable React components
├── juegos/         # Each game as an independent module (logica + renderizador)
├── servicios/      # servicio-socket.js, servicio-api.js
├── contextos/      # React Context for global state
└── paginas/        # Main views/screens
```

**Key architectural rules:**
- No service calls another service directly — only through events.
- Each game lives in its own folder under `juegos/` and never imports from other games.
- No file exceeds 200 lines; split into modules if it does.
- `partidas_jugadores` and `rankings_juego` must always be updated in the same DB transaction.

### Socket.io Event Catalog

Events follow `dominio:accion` format in lowercase Spanish:

| Event | Direction | Key payload fields |
|---|---|---|
| `juego:partida_iniciada` | Client → Server | `id_juego, id_usuario` |
| `juego:partida_terminada` | Client → Server | `id_juego, id_usuario, puntaje, duracion_segundos` |
| `juego:puntaje_actualizado` | Server → Client | `id_juego, tabla_puntajes[]` |
| `usuario:conectado` | Server → Room | `id_usuario, nombre` |
| `amigo:solicitud_enviada` | Client → Server | `id_usuario_destino` |
| `amigo:vinculo_confirmado` | Server → Both | `id_usuario_a, id_usuario_b` |
| `sala:unirse` | Client → Server | `id_sala` |

---

## Naming Conventions

**Everything in Spanish.** Applies to identifiers, comments, commits, and all UI text.

| Context | Convention | Example |
|---|---|---|
| Variables | `snake_case` | `puntaje_actual`, `nombre_usuario` |
| Global constants | `SCREAMING_SNAKE_CASE` | `PUERTO_SERVIDOR`, `TIEMPO_MAXIMO_PARTIDA` |
| Functions | `snake_case` with verb prefix | `obtener_historial_usuario()` |
| Classes / React components | `PascalCase` | `ServicioLeaderboard`, `PantallaJuego` |
| Files / folders | `kebab-case` | `servicio-leaderboard.js`, `pantalla-juego.jsx` |
| DB tables | `snake_case`, plural | `usuarios`, `rankings_juego` |
| DB columns | `snake_case` | `id_usuario`, `fecha_registro` |
| Env vars | `SCREAMING_SNAKE_CASE` | `DB_URL`, `SUPABASE_CLAVE_PUBLICA` |

**Function verb prefixes:**

| Prefix | Use |
|---|---|
| `obtener_` | Queries that return data |
| `guardar_` | Persistence to DB |
| `actualizar_` | Updating existing records |
| `eliminar_` | Deleting records |
| `validar_` | Data validation |
| `emitir_` | Firing Socket.io events |
| `manejar_` | Handling incoming events |

---

## Database Design Decisions

- All PKs are `UUID` (`gen_random_uuid()`) — prevents resource enumeration.
- No custom sessions table — Supabase Auth manages JWT tokens natively.
- `solicitudes_amistad` enforces canonical order: `id_solicitante < id_receptor`. The server must normalize UUID order before every INSERT to prevent inverted duplicates.
- `rankings_juego` uses denormalized counters (`partidas_jugadas`, `victorias`) for performance. These must be updated atomically with `partidas_jugadores` in the same transaction.
- The constraint `victorias <= partidas_jugadas` is a safety net against counter desync.

The schema is in `BD_ArcadeVS/arcadevs_schema.sql`.

---

## Design System (CRT Phosphor Aesthetic)

Full specification in `Documentacion_Proyecto/diseño-crt-gaming.md`.

**Core principles:**
- Everything is phosphor emission, not ink — every text and border emits a bloom halo.
- Hierarchy via **brightness**, not font weight.
- `border-radius: 0` on every element, no exceptions.
- No emoji — iconography uses 7×7 pixel sprites rendered as SVGs.
- No sans-serif fonts — only `DotGothic16`, `VT323`, `Silkscreen` (Google Fonts).
- All UI text in **Spanish and UPPERCASE**.
- Use CSS custom properties (`--neon-pink`, `--phosphor-pink`, etc.) always — never raw hex values.

**Three CRT themes:** `sakura` (default), `amber`, `blue` — switched via `document.documentElement.setAttribute('data-theme', ...)`.

**Styling rule:** inline styles only for component-level styles. Only `:root` tokens, `[data-theme]` overrides, `@keyframes`, body reset, and font `<link>` tags go in a `<style>` block.

---

## Commit Convention

Format: `tipo(alcance): descripcion en español`

| Type | Use |
|---|---|
| `feat` | New functionality |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `refactor` | Refactoring without functional change |
| `style` | Formatting or aesthetic changes |
| `test` | Adding or modifying tests |

Examples:
```
feat(leaderboard): agregar actualización en tiempo real vía socket
fix(autenticacion): corregir expiración de token JWT
refactor(bd): migrar PKs de entero a UUID en todas las tablas
```

---

## Environment Variables

```
# Base de datos
DB_URL=
DB_PUERTO=5432

# Supabase
SUPABASE_URL=
SUPABASE_CLAVE_PUBLICA=
SUPABASE_CLAVE_PRIVADA=

# Servidor
SERVIDOR_PUERTO=3000
SERVIDOR_ENTORNO=desarrollo
```

Environment variables go in `.env.local` for development and in Vercel/Railway platform vars for production — never committed to the repository.
