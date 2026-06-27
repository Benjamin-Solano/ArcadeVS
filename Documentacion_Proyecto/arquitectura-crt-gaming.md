# Documento de Arquitectura Técnica
## CRT Retro Gaming — Sitio Web de Videojuegos Tradicionales

**Versión:** 1.0.0  
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
- Despliegue gratuito en plataformas cloud (Vercel, Railway, Supabase)
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
| Auth | Supabase Auth (JWT) | Auth completo sin implementación manual |
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
  id_usuario    UUID PRIMARY KEY,
  nombre        VARCHAR(50),
  fecha_registro TIMESTAMP
);

CREATE TABLE puntajes (
  id_puntaje  UUID PRIMARY KEY,
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

# Autenticación
AUTH_JWT_SECRETO=
AUTH_EXPIRACION_TOKEN=7d

# Supabase
SUPABASE_URL=
SUPABASE_CLAVE_PUBLICA=
SUPABASE_CLAVE_PRIVADA=

# Servidor
SERVIDOR_PUERTO=3000
SERVIDOR_ENTORNO=desarrollo
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
| `juego:partida_iniciada` | Cliente → Servidor | `{ id_juego, id_usuario }` | El usuario comienza una partida |
| `juego:partida_terminada` | Cliente → Servidor | `{ id_juego, id_usuario, puntaje, duracion_segundos }` | La partida finalizó |
| `juego:puntaje_actualizado` | Servidor → Cliente | `{ id_juego, tabla_puntajes[] }` | Leaderboard actualizado en tiempo real |
| `juego:error` | Servidor → Cliente | `{ codigo, mensaje }` | Error durante la partida |

### 5.2 Dominio: `usuario`

| Evento | Dirección | Payload | Descripción |
|---|---|---|---|
| `usuario:conectado` | Servidor → Sala | `{ id_usuario, nombre }` | Usuario se conectó al sistema |
| `usuario:desconectado` | Servidor → Sala | `{ id_usuario }` | Usuario perdió conexión |
| `usuario:perfil_actualizado` | Servidor → Cliente | `{ id_usuario, datos_perfil }` | Confirmación de actualización de perfil |

### 5.3 Dominio: `amigo`

| Evento | Dirección | Payload | Descripción |
|---|---|---|---|
| `amigo:solicitud_enviada` | Cliente → Servidor | `{ id_usuario_destino }` | Se envía solicitud de amistad |
| `amigo:solicitud_recibida` | Servidor → Cliente | `{ id_usuario_origen, nombre }` | Notificación de solicitud entrante |
| `amigo:solicitud_aceptada` | Cliente → Servidor | `{ id_solicitud }` | Usuario acepta amistad |
| `amigo:solicitud_rechazada` | Cliente → Servidor | `{ id_solicitud }` | Usuario rechaza amistad |
| `amigo:vinculo_confirmado` | Servidor → ambos | `{ id_usuario_a, id_usuario_b }` | Amistad establecida |

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

```sql
-- Usuarios del sistema
CREATE TABLE usuarios (
  id_usuario      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre          VARCHAR(50) UNIQUE NOT NULL,
  correo          VARCHAR(255) UNIQUE NOT NULL,
  avatar_url      TEXT,
  fecha_registro  TIMESTAMP DEFAULT NOW(),
  ultima_conexion TIMESTAMP
);

-- Catálogo de juegos
CREATE TABLE juegos (
  id_juego     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  descripcion  TEXT,
  slug         VARCHAR(100) UNIQUE NOT NULL,
  thumbnail_url TEXT,
  activo       BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Relaciones de amistad
CREATE TABLE amistades (
  id_amistad   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario_a UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_usuario_b UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  estado       VARCHAR(20) CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
  fecha        TIMESTAMP DEFAULT NOW(),
  UNIQUE(id_usuario_a, id_usuario_b)
);

-- Puntajes para leaderboards
CREATE TABLE puntajes (
  id_puntaje  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario  UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_juego    UUID REFERENCES juegos(id_juego) ON DELETE CASCADE,
  puntaje     INTEGER NOT NULL,
  fecha       TIMESTAMP DEFAULT NOW()
);

-- Historial de sesiones de juego
CREATE TABLE sesiones_juego (
  id_sesion         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario        UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_juego          UUID REFERENCES juegos(id_juego) ON DELETE CASCADE,
  duracion_segundos INTEGER,
  puntaje_obtenido  INTEGER,
  fecha             TIMESTAMP DEFAULT NOW()
);
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
   │                          │── guardar_sesion() ────────►│
   │                          │── actualizar_puntaje() ─────►│
   │                          │── verificar_logros() ───────►│
   │                          │◄── top 10 puntajes ──────────│
   │◄── juego:puntaje_actualizado │                           │
   │   { tabla_puntajes[] }    │                           │
```

### 8.2 Flujo: Solicitud de Amistad

```
Usuario A (Cliente)         Servidor              Usuario B (Cliente)
   │                           │                        │
   │── amigo:solicitud_enviada ──►│                        │
   │                           │── guardar_solicitud() ──►DB
   │                           │── emit a socket de B ──►│
   │                           │                        │── amigo:solicitud_recibida
   │                           │◄── amigo:solicitud_aceptada ──│
   │                           │── actualizar_estado() ──►DB
   │◄── amigo:vinculo_confirmado│── amigo:vinculo_confirmado ──►│
```

---

## 9. Despliegue

| Servicio | Plataforma | URL de producción |
|---|---|---|
| Frontend | Vercel | `https://crt-gaming.vercel.app` |
| Backend | Railway | `https://api-crt-gaming.railway.app` |
| Base de datos | Supabase | Gestionado internamente |

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
```

### Reglas Generales

1. Ningún archivo de código supera las 200 líneas. Si ocurre, se divide en módulos.
2. Toda función pública tiene un comentario JSDoc en español.
3. Los eventos Socket.io se documentan en este archivo antes de implementarse.
4. Las variables de entorno nunca se suben al repositorio. Siempre van en `.env.local`.
5. Cada juego vive en su propia carpeta bajo `/juegos/` y no importa código de otros juegos.

---

*Documento generado: Junio 2026 — CRT Retro Gaming v1.0.0*
