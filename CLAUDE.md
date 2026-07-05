# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ArcadeVS** (CRT Retro Gaming) is a browser-based platform for classic arcade games with a CRT phosphor screen aesthetic. The system handles user profiles, match history, friend lists, leaderboards per game, and tournaments — all in real time.

The repository holds the database schema (`BD_ArcadeVS/`), architecture/design docs (`Documentacion_Proyecto/`), the Fastify backend (`Backend_ArcadeVS/`), and the React frontend (`Frontend_ArcadeVS/`). Implemented so far: user registration with email verification, login (JWT), profiles, friends, tournaments, and the real-time match/leaderboard flow. Everything follows the specs in `Documentacion_Proyecto/`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| HTTP client | axios (instancia única en `servicio-api.js`) |
| Games | Canvas API + Vanilla JS |
| Real-time | Socket.io |
| Backend | Node.js + Fastify (+ `@fastify/cors`) |
| Database | PostgreSQL (Supabase) |
| Auth | bcrypt (hash de contraseñas) + JWT propio firmado por el backend — no custom session table |
| Email | Nodemailer + Gmail SMTP — verificación de cuenta por código de 6 dígitos |
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
├── servicios/      # servicio-api.js (axios), servicio-autenticacion.js, almacenamiento-sesion.js, servicio-socket.js
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
| `amigo:error` | Server → Client | `codigo, mensaje` |
| `sala:unirse` | Client → Server | `id_sala` |

### REST Auth Endpoints (`/auth`)

CORS is enabled on Fastify via `@fastify/cors` (origin from `CORS_ORIGEN`) so the browser frontend can call these.

| Endpoint | Body | Response |
|---|---|---|
| `POST /auth/registro` | `nombre, apellido, correo, contrasena` | `201 { usuario, pendiente_verificacion }` (+ `codigo_dev` only when `SERVIDOR_ENTORNO=desarrollo`). **No token** — account is created unverified and a 6-digit code is emailed. |
| `POST /auth/verificar` | `correo, codigo` | `200 { usuario, verificado }` — activates the account. |
| `POST /auth/reenviar` | `correo` | `200 { pendiente_verificacion }` — issues a fresh code (invalidates the previous one). |
| `POST /auth/login` | `correo, contrasena` | `200 { usuario, token }`. Returns `403 CUENTA_NO_VERIFICADA` until the email is verified. |

**Account verification flow:** `registro` (creates unverified user + emails code) → `verificar` (confirms code, sets `usuarios.verificado = true`) → `login` (blocked with 403 until verified). Codes are stored bcrypt-hashed in `codigos_verificacion` with a 15-min expiry and a max-attempts guard. Email is sent by `servicio-correo.js`; with `CORREO_HABILITADO=false` it only logs the code to the console (dev mode), so tests never send real mail.

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
| Env vars | `SCREAMING_SNAKE_CASE` | `DB_URL`, `SERVIDOR_JWT_SECRETO` |

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
- No custom sessions table — the backend issues stateless JWTs signed with a server secret (`SERVIDOR_JWT_SECRETO`); passwords are hashed with bcrypt.
- `solicitudes_amistad` enforces canonical order: `id_solicitante < id_receptor`. The server must normalize UUID order before every INSERT to prevent inverted duplicates.
- `rankings_juego` uses denormalized counters (`partidas_jugadas`, `victorias`) for performance. These must be updated atomically with `partidas_jugadores` in the same transaction.
- The constraint `victorias <= partidas_jugadas` is a safety net against counter desync.
- Authorization is owner-admin: `usuarios.rol` (`jugador` | `admin`) plus `torneos.id_creador`. Any user creates a tournament and owns it; starting/finishing it is allowed to the owner or an admin. Admins are granted via a protected endpoint (an admin promotes another), so the first admin is seeded manually. Roles are read fresh from the DB at authorization time (not from the JWT).
- Email verification: `usuarios.verificado` (bool, default false) gates login. Codes live in `codigos_verificacion` (bcrypt-hashed `codigo_hash`, `expira_en`, `usado`, `intentos`) — never plaintext. Issuing a new code marks the previous unused ones `usado = true`, so at most one code is valid per user.

The schema is in `BD_ArcadeVS/arcadevs_schema.sql`. Incremental changes ship as idempotent migrations (`BD_ArcadeVS/migracion-XXX-*.sql`, run manually against the local DB): `001` (owner-admin authorization), `002` (email verification).

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

# Autenticación (JWT propio — bcrypt para el hash de contraseñas)
SERVIDOR_JWT_SECRETO=
SERVIDOR_JWT_EXPIRACION=7d

# Servidor
SERVIDOR_PUERTO=3000
SERVIDOR_ENTORNO=desarrollo
CORS_ORIGEN=*

# Correo de verificación (Gmail SMTP — gratis)
# CORREO_HABILITADO=false → modo desarrollo: el código se imprime en consola, no se envía correo real.
# Para envío real: activar verificación en 2 pasos en Gmail, generar una "contraseña de aplicación"
# de 16 caracteres, ponerla en SMTP_CONTRASENA y cambiar CORREO_HABILITADO=true.
CORREO_HABILITADO=false
SMTP_HOST=smtp.gmail.com
SMTP_PUERTO=587
SMTP_USUARIO=
SMTP_CONTRASENA=
CORREO_REMITENTE="ArcadeVS <tucorreo@gmail.com>"
CODIGO_VERIFICACION_EXPIRA_MIN=15
```

The **frontend** reads its own vars (prefixed `VITE_`) from `Frontend_ArcadeVS/.env.local`: `VITE_URL_BASE_API` and `VITE_URL_SOCKET` (both `http://localhost:3000` in dev).

Environment variables go in `.env.local` for development and in Vercel/Railway platform vars for production — never committed to the repository.
