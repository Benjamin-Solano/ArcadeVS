# Esquema de Base de Datos — ArcadeVS
**Versión:** 2.0.0 | **Fecha:** Junio 2026

> Cambios respecto a v1: PKs migradas a UUID, tabla `Sesion` eliminada (delegada a Supabase Auth), restricción de duplicados invertidos en `SolicitudAmistad`, tabla `Tag` normalizada, campo `slug` agregado a `Juego`, restricciones de consistencia `Partida ↔ Torneo`, índice compuesto en `MensajeEstado`, protección de integridad en `RankingJuego`.

---

#### **1. Usuario**

* **`id` — UUID, PK, generado automáticamente (`gen_random_uuid()`), no visible al usuario**
* **`nombre_usuario` — string, obligatorio, máx. 50 caracteres, único**
* **`email` — string, obligatorio, único, validado por formato**
* **`contrasena_hash` — string, obligatorio, resultado de bcrypt/argon2, nunca texto plano**
* **`codigo_amigo` — string, 12 caracteres, único, generado aleatoriamente al crear la cuenta**
* **`nacionalidad` — string, elegido de una lista fija (no texto libre)**
* **`fecha_nacimiento` — DATE, formato `YYYY-MM-DD` a nivel BD**
* **`fecha_creacion` — DATETIME, asignado automáticamente por el sistema**

> ℹ️ La gestión de sesiones y tokens JWT se delega completamente a **Supabase Auth**. No se almacenan tokens en la base de datos propia.

---

#### **2. SolicitudAmistad**

* **`id` — UUID, PK, generado automáticamente**
* **`id_solicitante` — FK → Usuario (UUID)**
* **`id_receptor` — FK → Usuario (UUID)**
* **`estado` — enumerado: `pendiente`, `aceptado`, `rechazado`, `bloqueado`**
* **`fecha_solicitud` — DATETIME**
* **`fecha_respuesta` — DATETIME, nullable**
* **Restricción:** `CHECK (id_solicitante < id_receptor)` — previene duplicados invertidos; la relación `(A,B)` y `(B,A)` no pueden coexistir
* **Restricción:** `UNIQUE (id_solicitante, id_receptor)` — una sola solicitud activa por par de usuarios

---

#### **3. Juego**

* **`id` — UUID, PK, generado automáticamente**
* **`nombre` — string, único**
* **`slug` — string, único, formato kebab-case (ej: `"ajedrez"`, `"dots-and-boxes"`), usado en URLs `/juegos/:slug`**
* **`descripcion` — string**

---

#### **4. Tag**

* **`id` — UUID, PK, generado automáticamente**
* **`nombre` — string, único, normalizado en minúsculas (ej: `"estrategia"`, `"puzzle"`, `"clásico"`)**

> ℹ️ Tabla normalizada que reemplaza el campo libre anterior. Evita fragmentación por variaciones de capitalización o plural.

---

#### **5. JuegoTag** *(tabla de unión)*

* **`id_juego` — FK → Juego (UUID)**
* **`id_tag` — FK → Tag (UUID)**
* **PK compuesta:** `(id_juego, id_tag)`

---

#### **6. Modalidad**

* **`id` — UUID, PK, generado automáticamente**
* **`nombre` — string (ej: `"Mejor de 3"`, `"Victoria única"`)**
* **`descripcion` — string**
* **`permite_bot` — booleano**
* **`puntua` — booleano (`false` = no suma al ranking, ej: partidas contra bot)**

---

#### **7. Torneo**

* **`id` — UUID, PK, generado automáticamente**
* **`id_juego` — FK → Juego (UUID)**
* **`id_modalidad` — FK → Modalidad (UUID)**
* **`nombre` — string**
* **`estado` — enumerado: `inscripcion`, `en_curso`, `finalizado`**
* **`fecha_inicio` — DATETIME**
* **`fecha_fin` — DATETIME**
* **`max_participantes` — entero**

---

#### **8. TorneoParticipante**

* **`id` — UUID, PK, generado automáticamente**
* **`id_torneo` — FK → Torneo (UUID)**
* **`id_usuario` — FK → Usuario (UUID)**
* **`fecha_inscripcion` — DATETIME**
* **Restricción:** `UNIQUE (id_torneo, id_usuario)` — un usuario no puede inscribirse dos veces al mismo torneo

---

#### **9. Partida**

* **`id` — UUID, PK, generado automáticamente**
* **`id_juego` — FK → Juego (UUID)**
* **`id_modalidad` — FK → Modalidad (UUID)**
* **`id_torneo` — FK → Torneo (UUID), nullable — `null` si es partida casual**
* **`fecha_inicio` — DATETIME**
* **`fecha_fin` — DATETIME, nullable**
* **`estado` — enumerado: `en_curso`, `finalizada`, `abandonada`**
* **Restricción de integridad:** cuando `id_torneo IS NOT NULL`, `Partida.id_juego` debe coincidir con `Torneo.id_juego` y `Partida.id_modalidad` con `Torneo.id_modalidad`. Validado vía trigger o a nivel de aplicación antes de insertar.

---

#### **10. PartidaJugador**

* **`id` — UUID, PK, generado automáticamente**
* **`id_partida` — FK → Partida (UUID)**
* **`id_usuario` — FK → Usuario (UUID), nullable — `null` si el jugador es bot**
* **`es_bot` — booleano**
* **`puntuacion` — entero**
* **`resultado` — enumerado: `victoria`, `derrota`, `empate`**

---

#### **11. RankingJuego**

* **`id` — UUID, PK, generado automáticamente**
* **`id_usuario` — FK → Usuario (UUID)**
* **`id_juego` — FK → Juego (UUID)**
* **`puntuacion_total` — entero**
* **`partidas_jugadas` — entero**
* **`victorias` — entero**
* **`ultima_actualizacion` — DATETIME**
* **Restricción:** `UNIQUE (id_usuario, id_juego)`
* **Restricción de integridad:** `CHECK (victorias <= partidas_jugadas)` — protección ante desincronización de contadores
* **Nota de actualización:** los campos `partidas_jugadas` y `victorias` deben actualizarse siempre dentro de una misma transacción junto con el insert en `PartidaJugador`, para garantizar consistencia.

---

#### **12. Chat**

* **`id` — UUID, PK, generado automáticamente**
* **`tipo` — enumerado: `privado`, `partida`**
* **`id_partida` — FK → Partida (UUID), nullable — solo si `tipo = 'partida'`**
* **`fecha_creacion` — DATETIME**
* **Nota:** para chats de tipo `privado`, la capa de aplicación garantiza que `ChatParticipante` contenga exactamente dos usuarios al momento de la creación.

---

#### **13. ChatParticipante**

* **`id` — UUID, PK, generado automáticamente**
* **`id_chat` — FK → Chat (UUID)**
* **`id_usuario` — FK → Usuario (UUID)**
* **`fecha_union` — DATETIME**
* **Restricción:** `UNIQUE (id_chat, id_usuario)`

---

#### **14. Mensaje**

* **`id` — UUID, PK, generado automáticamente**
* **`id_chat` — FK → Chat (UUID)**
* **`id_usuario` — FK → Usuario (UUID)**
* **`texto` — string**
* **`hora_envio` — DATETIME**

---

#### **15. MensajeEstado**

* **`id` — UUID, PK, generado automáticamente**
* **`id_mensaje` — FK → Mensaje (UUID)**
* **`id_usuario` — FK → Usuario (UUID) — el receptor**
* **`estado` — enumerado: `enviado`, `entregado`, `leido`**
* **`fecha_cambio` — DATETIME**
* **Índice:** `(id_mensaje, id_usuario)` — tabla de alto volumen; índice compuesto obligatorio para queries de estado de lectura

---

### **Resumen de decisiones clave**

**PKs como UUID:** todas las tablas usan `UUID` generado por `gen_random_uuid()` en lugar de enteros autoincrementales. Previene enumeración de recursos por usuarios malintencionados y es consistente con Supabase.

**Sesiones delegadas a Supabase Auth:** la tabla `Sesion` fue eliminada. Supabase Auth gestiona tokens JWT, expiración y estado de sesión de forma nativa, evitando dos fuentes de verdad para autenticación.

**Amistad bidireccional con `CHECK` de orden canónico:** `SolicitudAmistad` usa `CHECK (id_solicitante < id_receptor)` junto con `UNIQUE (id_solicitante, id_receptor)` para que no puedan coexistir `(A→B)` y `(B→A)`. Se filtra por `estado = 'aceptado'` para obtener amigos confirmados.

**Tags normalizados:** `JuegoTag` ahora referencia una tabla `Tag` con nombre único y normalizado, en lugar de un campo de texto libre. Elimina fragmentación por variaciones de capitalización.

**Slug en Juego:** campo `slug` único y en kebab-case, necesario para URLs amigables como `/juegos/ajedrez`.

**Partidas contra bot:** manejadas en `PartidaJugador` con `es_bot = true` e `id_usuario = null`. No requiere tabla aparte.

**Integridad Partida ↔ Torneo:** cuando `id_torneo IS NOT NULL`, el juego y la modalidad de la partida deben coincidir con los del torneo. Validado antes de cada insert.

**Rankings consistentes:** `CHECK (victorias <= partidas_jugadas)` como red de seguridad; actualizaciones siempre en transacción atómica junto con `PartidaJugador`.

**Chat unificado:** `tipo` y `id_partida` nullable cubren chat privado y chat de sala. Chats privados se restringen a exactamente dos participantes en la capa de aplicación.

**MensajeEstado indexado:** índice compuesto `(id_mensaje, id_usuario)` obligatorio dado el alto volumen esperado en sesiones de torneo con múltiples jugadores.
