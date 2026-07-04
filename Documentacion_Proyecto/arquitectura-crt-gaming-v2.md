# Documento de Arquitectura Técnica
## CRT Retro Gaming — Sitio Web de Videojuegos Tradicionales

**Versión:** 2.0.0  
**Fecha:** Junio 2026  
**Autor:** Equipo de Desarrollo

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura Event-Driven](#3-arquitectura-event-driven)
4. [Convenciones de Nomenclatura](#4-convenciones-de-nomenclatura)
5. [Catálogo de Eventos Socket.io](#5-catálogo-de-eventos-socketio)
6. [Esquema de Base de Datos](#6-esquema-de-base-de-datos)
7. [Estructura de Carpetas](#7-estructura-de-carpetas)
8. [Flujos Principales del Sistema](#8-flujos-principales-del-sistema)
9. [Despliegue](#9-despliegue)
10. [Guía de Contribución](#10-guía-de-contribución)

---

## 1. Visión General

CRT Retro Gaming es una plataforma web de videojuegos arcade clásicos jugables en el navegador, con estética de monitor CRT. El sistema gestiona perfiles de usuario, historial de partidas, listas de amigos y tablas de clasificación (leaderboards) independientes por juego, en tiempo real.

### Objetivos Técnicos

- Comunicación en tiempo real entre clientes mediante WebSockets
- Arquitectura desacoplada basada en eventos para facilitar la extensión del sistema
- Despliegue gratuito en plataformas cloud (Vercel, Railway, Supabase como Postgres gestionado)
- Código legible, consistente y mantenible por un solo desarrollador

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React + Vite | Ecosistema maduro, HMR rápido, conocimiento previo |
| Juegos | Canvas API + Vanilla JS | Control total del render, sin dependencias externas |
| Tiempo real | Socket.io | Abstracción robusta sobre WebSockets, soporte a eventos con namespaces |
| Backend | Node.js + Fastify | Alto rendimiento, validación nativa de schemas JSON |
| Base de datos | PostgreSQL (Supabase) | Relacional, confiable, tier gratuito generoso |
| Auth | bcrypt + JWT propio | Autenticación gestionada en el backend: contraseñas hasheadas con bcrypt y JWT firmados con un secreto propio (`jsonwebtoken`); sin dependencia de un proveedor externo de auth |
| Deploy Frontend | Vercel | CDN global, despliegue automático desde GitHub |
| Deploy Backend | Railway | Soporte nativo Node.js, 500h/mes gratis |
| Almacenamiento | Supabase Storage | Assets de juegos e imágenes de perfil |

---

## 3. Arquitectura Event-Driven

El sistema se organiza alrededor de un **bus de eventos central**. Cuando ocurre una acción significativa (terminar una partida, enviar solicitud de amistad, etc.), el componente responsable emite un evento. Los servicios suscritos reaccionan de forma independiente, sin conocerse entre sí.

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTE (React)                        │
│   Canvas Game Loop → emit("juego:partida_terminada", datos)  │
└───────────────────────────────┬──────────────────────────────┘
                                │ Socket.io (WebSocket)
┌───────────────────────────────▼──────────────────────────────┐
│                   BUS DE EVENTOS (Socket.io Server)           │
│                  on("juego:partida_terminada")                │
└──────────┬──────────────────┬──────────────────┬─────────────┘
           │                  │                  │
    ┌──────▼──────┐   ┌───────▼──────┐   ┌──────▼──────┐
    │  Servicio   │   │   Servicio   │   │  Servicio   │
    │ Leaderboard │   │  Historial   │   │   Logros    │
    └──────┬──────┘   └───────┬──────┘   └──────┬──────┘
           │                  │                  │
    ┌──────▼──────────────────▼──────────────────▼──────┐
    │                   PostgreSQL                        │
    └───────────────────────────────────────────────────┘
```

### Principios de la Arquitectura

- **Desacoplamiento:** Ningún servicio llama directamente a otro. La comunicación es exclusivamente mediante eventos.
- **Extensibilidad:** Agregar un nuevo servicio (ej. sistema de notificaciones) solo requiere suscribirse a eventos existentes, sin modificar código previo.
- **Trazabilidad:** Todo evento queda registrado con su payload, facilitando el debugging.

---

## 4. Convenciones de Nomenclatura

### 4.1 Idioma

Todo identificador de código se escribe en **español**. Los comentarios, documentación y mensajes de commit también van en español.

```javascript
// ✅ Correcto
const puntaje_maximo = 9999;
function obtener_historial_usuario() {}

// ❌ Incorrecto
const maxScore = 9999;
function getUserHistory() {}
```

### 4.2 Variables

Se usa **snake_case** para todas las variables, sin excepción.

```javascript
// ✅ Correcto
const nombre_usuario = "jugador_01";
const puntaje_actual = 0;
let tiempo_restante = 60;

// ❌ Incorrecto
const nombreUsuario = "jugador_01";
const PuntajeActual = 0;
```

### 4.3 Constantes Globales

Las constantes de configuración global se escriben en **SCREAMING_SNAKE_CASE**.

```javascript
// ✅ Correcto
const PUERTO_SERVIDOR = 3000;
const TIEMPO_MAXIMO_PARTIDA = 300;
const URL_BASE_API = "https://api.crtgaming.com";
```

### 4.4 Funciones

Las funciones usan **snake_case** con un verbo de acción como prefijo que describe su intención.

| Prefijo | Uso |
|---|---|
| `obtener_` | Consultas que retornan datos |
| `guardar_` | Persistencia en base de datos |
| `actualizar_` | Modificación de registros existentes |
| `eliminar_` | Borrado de registros |
| `validar_` | Verificación de datos |
| `emitir_` | Disparo de eventos Socket.io |
| `manejar_` | Handlers de eventos entrantes |

```javascript
// ✅ Correcto
async function obtener_puntajes_juego(id_juego) {}
async function guardar_resultado_partida(datos_partida) {}
function validar_nombre_usuario(nombre) {}
function emitir_fin_partida(sala_id, puntaje) {}
function manejar_conexion_usuario(socket) {}

// ❌ Incorrecto
async function getGameScores(gameId) {}
async function score(data) {}
function check(name) {}
```

### 4.5 Clases y Componentes React

Las clases y componentes React usan **PascalCase** en español.

```javascript
// ✅ Clases
class ServicioLeaderboard {}
class RepositorioUsuario {}
class ManejadorEventos {}

// ✅ Componentes React
function PantallaJuego() {}
function PerfilUsuario() {}
function TablaClasificacion() {}
```

### 4.6 Archivos y Carpetas

Los nombres de archivos y carpetas usan **kebab-case** en español.

```
✅ Correcto
servicios/
  servicio-leaderboard.js
  servicio-historial.js
componentes/
  pantalla-juego.jsx
  perfil-usuario.jsx

❌ Incorrecto
servicios/
  leaderboardService.js
  HistorialServicio.js
```

### 4.7 Tablas de Base de Datos

Las tablas y columnas de PostgreSQL usan **snake_case** en español, en plural para tablas.

```sql
-- ✅ Correcto
CREATE TABLE usuarios (
  id_usuario    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre        VARCHAR(50),
  fecha_registro TIMESTAMP
);

CREATE TABLE puntajes (
  id_puntaje  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario  UUID REFERENCES usuarios(id_usuario),
  id_juego    UUID REFERENCES juegos(id_juego),
  puntaje     INTEGER,
  fecha       TIMESTAMP
);
```

### 4.8 Variables de Entorno

Las variables de entorno usan **SCREAMING_SNAKE_CASE** con prefijo por contexto.

```env
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
```

---

## 5. Catálogo de Eventos Socket.io

Los eventos siguen el formato **`dominio:accion`** en minúsculas y español, con palabras separadas por guión bajo dentro de cada parte.

### Formato General

```
dominio:accion
```

Donde:
- `dominio` — área del sistema que origina el evento (`juego`, `usuario`, `amigo`, `sala`)
- `accion` — describe qué ocurrió, en tiempo pasado o presente simple

### 5.1 Dominio: `juego`

| Evento | Dirección | Payload | Descripción |
|---|---|---|---|
| `juego:partida_iniciada` | Cliente → Servidor | `{ id_juego, id_usuario }` | El usuario comienza una partida (une el socket a la sala del juego) |
| `juego:partida_terminada` | Cliente → Servidor | `{ id_juego, id_modalidad, id_usuario, puntaje, duracion_segundos, resultado?, id_torneo? }` | La partida finalizó |
| `juego:puntaje_actualizado` | Servidor → Sala | `{ id_juego, tabla_puntajes[] }` | Leaderboard actualizado en tiempo real |
| `juego:error` | Servidor → Cliente | `{ codigo, mensaje }` | Error durante la partida |

> **Nota de implementación:** `juego:partida_terminada` incluye `id_modalidad` porque el servidor necesita saber si la modalidad puntúa (`modalidad.puntua`) y si permite bots antes de actualizar `rankings_juego`. El payload admite dos formas: la forma arcade de un jugador (`id_usuario`, `puntaje`, `resultado`) o la forma multijugador (`jugadores[]` con `{ id_usuario|es_bot, puntuacion, resultado }`). El campo `resultado` (`victoria`/`derrota`/`empate`) es opcional para juegos de solo puntaje.

### 5.2 Dominio: `usuario`

| Evento | Dirección | Payload | Descripción |
|---|---|---|---|
| `usuario:conectado` | Servidor → Sala | `{ id_usuario, nombre }` | Usuario se conectó al sistema |
| `usuario:desconectado` | Servidor → Sala | `{ id_usuario }` | Usuario perdió conexión |
| `usuario:perfil_actualizado` | Servidor → Cliente | `{ id_usuario, datos_perfil }` | Confirmación de actualización de perfil |

> **Presencia dirigida a los amigos:** la "Sala" destino de `usuario:conectado` y `usuario:desconectado` son las salas personales `usuario:<id_usuario>` de los **amigos** del usuario. Al conectarse un socket autenticado, el servidor consulta sus amigos y emite `usuario:conectado` a cada sala personal (los amigos desconectados tienen la sala vacía, así que no reciben nada). Para no duplicar avisos con varias pestañas abiertas, la conexión se anuncia solo en el primer socket del usuario y la desconexión solo cuando se va el último (contando los sockets que siguen en su sala personal).

> **Puente REST → bus (`usuario:perfil_actualizado`):** la actualización de perfil ocurre por REST (`PUT /usuarios/perfil`), pero su confirmación se difunde por el bus. Tras persistir el cambio, la ruta emite `usuario:perfil_actualizado` con `{ id_usuario, datos_perfil }` a la sala personal del dueño, de modo que **todas sus conexiones** (pestañas/dispositivos) reciban el perfil actualizado. La instancia de Socket.io se expone a las rutas como el decorador `io` de Fastify (asignado en `index.js`).

### 5.3 Dominio: `amigo`

| Evento | Dirección | Payload | Descripción |
|---|---|---|---|
| `amigo:solicitud_enviada` | Cliente → Servidor | `{ id_usuario_destino }` | Se envía solicitud de amistad |
| `amigo:solicitud_recibida` | Servidor → Cliente | `{ id_usuario_origen, nombre }` | Notificación de solicitud entrante |
| `amigo:solicitud_aceptada` | Cliente → Servidor | `{ id_solicitud }` | Usuario acepta amistad |
| `amigo:solicitud_rechazada` | Cliente → Servidor | `{ id_solicitud }` | Usuario rechaza amistad |
| `amigo:vinculo_confirmado` | Servidor → ambos | `{ id_usuario_a, id_usuario_b }` | Amistad establecida |
| `amigo:error` | Servidor → Cliente | `{ codigo, mensaje }` | Error al procesar una acción de amistad |

> **Identidad del socket y salas personales:** los eventos de `amigo` operan sobre el usuario autenticado, no sobre un id enviado por el cliente. Al conectarse, el cliente adjunta su JWT en `handshake.auth.token`; un middleware de Socket.io lo verifica y guarda `id_usuario` en `socket.data`. El socket se une entonces a su **sala personal** `usuario:<id_usuario>`, que el servidor usa para entregarle notificaciones dirigidas (`amigo:solicitud_recibida`, `amigo:vinculo_confirmado`). Las conexiones sin token se aceptan como anónimas (solo lectura de leaderboard público); las acciones de `amigo` sin autenticar responden `amigo:error`.

### 5.4 Dominio: `sala`

| Evento | Dirección | Payload | Descripción |
|---|---|---|---|
| `sala:unirse` | Cliente → Servidor | `{ id_sala }` | Usuario entra a sala de un juego |
| `sala:salir` | Cliente → Servidor | `{ id_sala }` | Usuario sale de la sala |

### 5.5 Ejemplo de Implementación

**Emisión desde el cliente (fin de partida):**
```javascript
// En el loop del juego Canvas
function emitir_fin_partida(puntaje_final) {
  socket.emit("juego:partida_terminada", {
    id_juego: juego_actual.id_juego,
    id_usuario: sesion_usuario.id_usuario,
    puntaje: puntaje_final,
    duracion_segundos: cronometro.obtener_segundos()
  });
}
```

**Manejo en el servidor (Fastify + Socket.io):**
```javascript
function manejar_fin_partida(socket, datos) {
  const { id_juego, id_usuario, puntaje, duracion_segundos } = datos;

  // Cada servicio reacciona de forma independiente
  servicio_historial.guardar_sesion({ id_usuario, id_juego, duracion_segundos });
  servicio_leaderboard.actualizar_puntaje({ id_usuario, id_juego, puntaje });
  servicio_logros.verificar_logros({ id_usuario, puntaje });
}

io.on("connection", (socket) => {
  socket.on("juego:partida_terminada", (datos) => {
    manejar_fin_partida(socket, datos);
  });
});
```

---

## 6. Esquema de Base de Datos

> **Decisión de diseño — PKs como UUID:** todas las tablas usan `UUID` generado por `gen_random_uuid()` en lugar de enteros autoincrementales. Esto previene la enumeración de recursos por usuarios malintencionados (un ID secuencial expone `/partidas/42`, `/partidas/43`, etc.).

> **Decisión de diseño — Autenticación propia con JWT sin tabla de sesiones:** no existe tabla `sesiones` propia. El backend hashea las contraseñas con **bcrypt** y, tras un login válido, firma un **JWT** con un secreto del servidor (`SERVIDOR_JWT_SECRETO`) mediante `jsonwebtoken`. Los tokens son *stateless*: la validez y expiración van dentro del propio token, por lo que no se persiste estado de sesión en la BD. Las rutas protegidas validan el JWT en un hook `preHandler` de Fastify antes del handler.

```sql
-- Usuarios del sistema
CREATE TABLE usuarios (
  id_usuario      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre          VARCHAR(50) UNIQUE NOT NULL,
  apellido        VARCHAR(50) NOT NULL,
  correo          VARCHAR(255) UNIQUE NOT NULL,
  contrasena_hash TEXT NOT NULL,
  codigo_amigo    CHAR(12) UNIQUE NOT NULL,
  nacionalidad    VARCHAR(100),
  fecha_nacimiento DATE,
  avatar_url      TEXT,
  rol             VARCHAR(20) NOT NULL DEFAULT 'jugador' CHECK (rol IN ('jugador', 'admin')),
  fecha_registro  TIMESTAMP DEFAULT NOW(),
  ultima_conexion TIMESTAMP
);

-- Catálogo de juegos
CREATE TABLE juegos (
  id_juego       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre         VARCHAR(100) UNIQUE NOT NULL,
  slug           VARCHAR(100) UNIQUE NOT NULL, -- kebab-case, usado en URLs /juegos/:slug
  descripcion    TEXT,
  thumbnail_url  TEXT,
  activo         BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tags normalizados (valores controlados, sin texto libre)
CREATE TABLE tags (
  id_tag UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL -- siempre en minúsculas, ej: "estrategia", "puzzle"
);

-- Relación juego ↔ tag (muchos a muchos)
CREATE TABLE juegos_tags (
  id_juego UUID REFERENCES juegos(id_juego) ON DELETE CASCADE,
  id_tag   UUID REFERENCES tags(id_tag) ON DELETE CASCADE,
  PRIMARY KEY (id_juego, id_tag)
);

-- Modalidades de juego
CREATE TABLE modalidades (
  id_modalidad UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  descripcion  TEXT,
  permite_bot  BOOLEAN DEFAULT FALSE,
  puntua       BOOLEAN DEFAULT TRUE -- false = no suma al ranking (ej: partida vs bot)
);

-- Relaciones de amistad
-- CHECK garantiza orden canónico: (A, B) y (B, A) no pueden coexistir
CREATE TABLE solicitudes_amistad (
  id_solicitud   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_solicitante UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_receptor    UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  estado         VARCHAR(20) CHECK (estado IN ('pendiente', 'aceptado', 'rechazado', 'bloqueado')),
  fecha_solicitud TIMESTAMP DEFAULT NOW(),
  fecha_respuesta TIMESTAMP,
  CHECK (id_solicitante < id_receptor),        -- previene duplicados invertidos
  UNIQUE (id_solicitante, id_receptor)
);

-- Torneos
CREATE TABLE torneos (
  id_torneo          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_juego           UUID REFERENCES juegos(id_juego) ON DELETE RESTRICT,
  id_modalidad       UUID REFERENCES modalidades(id_modalidad) ON DELETE RESTRICT,
  nombre             VARCHAR(255) NOT NULL,
  estado             VARCHAR(20) CHECK (estado IN ('inscripcion', 'en_curso', 'finalizado')),
  fecha_inicio       TIMESTAMP,
  fecha_fin          TIMESTAMP,
  max_participantes  INTEGER,
  id_creador         UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Participantes de torneo
CREATE TABLE torneos_participantes (
  id_participacion UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_torneo        UUID REFERENCES torneos(id_torneo) ON DELETE CASCADE,
  id_usuario       UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  fecha_inscripcion TIMESTAMP DEFAULT NOW(),
  UNIQUE (id_torneo, id_usuario)
);

-- Partidas (casuales y de torneo)
-- Cuando id_torneo IS NOT NULL, id_juego e id_modalidad deben coincidir con el torneo.
-- Esta restricción se valida en la capa de aplicación antes de cada INSERT.
CREATE TABLE partidas (
  id_partida   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_juego     UUID REFERENCES juegos(id_juego) ON DELETE RESTRICT,
  id_modalidad UUID REFERENCES modalidades(id_modalidad) ON DELETE RESTRICT,
  id_torneo    UUID REFERENCES torneos(id_torneo) ON DELETE SET NULL, -- null = partida casual
  fecha_inicio TIMESTAMP DEFAULT NOW(),
  fecha_fin    TIMESTAMP,
  estado       VARCHAR(20) CHECK (estado IN ('en_curso', 'finalizada', 'abandonada'))
);

-- Jugadores por partida (incluye bots: id_usuario = null, es_bot = true)
CREATE TABLE partidas_jugadores (
  id_partida_jugador UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_partida         UUID REFERENCES partidas(id_partida) ON DELETE CASCADE,
  id_usuario         UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL, -- null si es bot
  es_bot             BOOLEAN DEFAULT FALSE,
  puntuacion         INTEGER DEFAULT 0,
  resultado          VARCHAR(10) CHECK (resultado IN ('victoria', 'derrota', 'empate'))
);

-- Rankings por juego (contadores desnormalizados para rendimiento)
-- IMPORTANTE: victorias y partidas_jugadas deben actualizarse en la misma transacción
-- que el INSERT en partidas_jugadores para garantizar consistencia.
CREATE TABLE rankings_juego (
  id_ranking         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario         UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_juego           UUID REFERENCES juegos(id_juego) ON DELETE CASCADE,
  puntuacion_total   INTEGER DEFAULT 0,
  partidas_jugadas   INTEGER DEFAULT 0,
  victorias          INTEGER DEFAULT 0,
  ultima_actualizacion TIMESTAMP DEFAULT NOW(),
  UNIQUE (id_usuario, id_juego),
  CHECK (victorias <= partidas_jugadas)  -- protección ante desincronización de contadores
);

-- Chats (privados entre usuarios o de sala de partida)
CREATE TABLE chats (
  id_chat    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo       VARCHAR(10) CHECK (tipo IN ('privado', 'partida')),
  id_partida UUID REFERENCES partidas(id_partida) ON DELETE CASCADE, -- null si tipo = 'privado'
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Participantes de chat
-- Para tipo 'privado': la aplicación garantiza exactamente 2 participantes al crear el chat.
CREATE TABLE chats_participantes (
  id_participacion UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_chat          UUID REFERENCES chats(id_chat) ON DELETE CASCADE,
  id_usuario       UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  fecha_union      TIMESTAMP DEFAULT NOW(),
  UNIQUE (id_chat, id_usuario)
);

-- Mensajes
CREATE TABLE mensajes (
  id_mensaje UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_chat    UUID REFERENCES chats(id_chat) ON DELETE CASCADE,
  id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  texto      TEXT NOT NULL,
  hora_envio TIMESTAMP DEFAULT NOW()
);

-- Estado de lectura por receptor (tabla de alto volumen)
CREATE TABLE mensajes_estado (
  id_estado   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_mensaje  UUID REFERENCES mensajes(id_mensaje) ON DELETE CASCADE,
  id_usuario  UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE, -- el receptor
  estado      VARCHAR(10) CHECK (estado IN ('enviado', 'entregado', 'leido')),
  fecha_cambio TIMESTAMP DEFAULT NOW()
);
-- Índice obligatorio: tabla de alto volumen en sesiones de torneo
CREATE INDEX idx_mensajes_estado_lookup ON mensajes_estado (id_mensaje, id_usuario);
```

---

## 7. Estructura de Carpetas

```
crt-retro-gaming/
├── frontend/                        # React + Vite
│   ├── public/
│   ├── src/
│   │   ├── componentes/             # Componentes React reutilizables
│   │   │   ├── perfil-usuario/
│   │   │   ├── tabla-clasificacion/
│   │   │   └── pantalla-juego/
│   │   ├── juegos/                  # Cada juego como módulo independiente
│   │   │   ├── tetris/
│   │   │   │   ├── logica-tetris.js
│   │   │   │   └── renderizador-tetris.js
│   │   │   └── space-invaders/
│   │   ├── servicios/               # Comunicación con API y Socket.io
│   │   │   ├── servicio-socket.js
│   │   │   └── servicio-api.js
│   │   ├── contextos/               # React Context para estado global
│   │   └── paginas/                 # Vistas principales
│
├── backend/                         # Node.js + Fastify
│   ├── src/
│   │   ├── eventos/                 # Handlers de eventos Socket.io
│   │   │   ├── manejador-juego.js
│   │   │   ├── manejador-usuario.js
│   │   │   └── manejador-amigo.js
│   │   ├── servicios/               # Lógica de negocio
│   │   │   ├── servicio-leaderboard.js
│   │   │   ├── servicio-historial.js
│   │   │   └── servicio-amistades.js
│   │   ├── repositorios/            # Acceso a PostgreSQL
│   │   │   ├── repositorio-usuario.js
│   │   │   ├── repositorio-puntaje.js
│   │   │   └── repositorio-juego.js
│   │   ├── rutas/                   # Endpoints REST de Fastify
│   │   └── configuracion/           # Config de DB, Socket.io, env
│   └── index.js
│
└── README.md
```

---

## 8. Flujos Principales del Sistema

### 8.1 Flujo: Fin de Partida y Actualización de Leaderboard

```
Cliente                    Servidor                  Base de Datos
   │                          │                           │
   │── juego:partida_terminada ──►│                           │
   │   { id_juego, puntaje }   │                           │
   │                          │── BEGIN TRANSACTION ───────►│
   │                          │── guardar_sesion() ─────────►│ (partidas_jugadores)
   │                          │── actualizar_ranking() ──────►│ (rankings_juego — atómico con lo anterior)
   │                          │── COMMIT ───────────────────►│
   │                          │── verificar_logros() ───────►│
   │                          │◄── top 10 puntajes ──────────│
   │◄── juego:puntaje_actualizado │                           │
   │   { tabla_puntajes[] }    │                           │
```

> La actualización de `partidas_jugadores` y `rankings_juego` ocurre en una sola transacción para garantizar que los contadores `partidas_jugadas` y `victorias` nunca se desincronicen.

### 8.2 Flujo: Solicitud de Amistad

```
Usuario A (Cliente)         Servidor              Usuario B (Cliente)
   │                           │                        │
   │── amigo:solicitud_enviada ──►│                        │
   │                           │── validar orden UUID ───►│ (garantiza id_a < id_b)
   │                           │── guardar_solicitud() ──►DB
   │                           │── emit a socket de B ──►│
   │                           │                        │── amigo:solicitud_recibida
   │                           │◄── amigo:solicitud_aceptada ──│
   │                           │── actualizar_estado() ──►DB
   │◄── amigo:vinculo_confirmado│── amigo:vinculo_confirmado ──►│
```

> Antes de insertar en `solicitudes_amistad`, el servidor normaliza el orden de los UUIDs (`id_solicitante < id_receptor`) para respetar la restricción `CHECK` de la tabla.

---

## 9. Despliegue

| Servicio | Plataforma | URL de producción |
|---|---|---|
| Frontend | Vercel | `https://crt-gaming.vercel.app` |
| Backend | Railway | `https://api-crt-gaming.railway.app` |
| Base de datos | Supabase (Postgres gestionado) | Gestionado internamente |
| Auth | Backend propio (bcrypt + JWT) | Secreto JWT en variables de Railway |

### Variables de entorno por entorno

```
desarrollo  → .env.local      (no se sube al repositorio)
producción  → Variables en Vercel y Railway respectivamente
```

---

## 10. Guía de Contribución

### Commits

Formato: `tipo(alcance): descripcion en español`

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `refactor` | Refactorización sin cambio funcional |
| `style` | Cambios de formato o estética |
| `test` | Adición o modificación de pruebas |

**Ejemplos:**
```
feat(leaderboard): agregar actualización en tiempo real vía socket
fix(autenticacion): corregir expiración de token JWT
docs(arquitectura): actualizar catálogo de eventos de amigos
refactor(bd): migrar PKs de entero a UUID en todas las tablas
```

### Reglas Generales

1. Ningún archivo de código supera las 200 líneas. Si ocurre, se divide en módulos.
2. Toda función pública tiene un comentario JSDoc en español.
3. Los eventos Socket.io se documentan en este archivo antes de implementarse.
4. Las variables de entorno nunca se suben al repositorio. Siempre van en `.env.local`.
5. Cada juego vive en su propia carpeta bajo `/juegos/` y no importa código de otros juegos.
6. Toda operación que modifique `partidas_jugadores` y `rankings_juego` simultáneamente debe ejecutarse dentro de una transacción de base de datos.
7. El orden canónico `(id_solicitante < id_receptor)` debe normalizarse en el servidor antes de cualquier INSERT en `solicitudes_amistad`.

---

*Documento generado: Junio 2026 — CRT Retro Gaming v2.0.0*
