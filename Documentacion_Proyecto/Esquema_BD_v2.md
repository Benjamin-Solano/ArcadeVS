# Esquema de Base de Datos — ArcadeVS
**Versión:** 2.0.0 | **Fecha:** Junio 2026

> Cambios respecto a v1: PKs migradas a UUID, tabla `Sesion` eliminada (autenticación con JWT propio *stateless*, sin estado de sesión en BD), restricción de duplicados invertidos en `SolicitudAmistad`, tabla `Tag` normalizada, campo `slug` agregado a `Juego`, restricciones de consistencia `Partida ↔ Torneo`, índice compuesto en `MensajeEstado`, protección de integridad en `RankingJuego`.
>
> Cambios posteriores (migraciones incrementales sobre `arcadevs_schema.sql`): `migracion-001` — modelo de autorización dueño-admin (`Usuario.rol`, `Torneo.id_creador`); `migracion-002` — verificación de correo (`Usuario.verificado` + tabla `CodigoVerificacion`).

---

#### **1. Usuario**

* **`id` — UUID, PK, generado automáticamente (`gen_random_uuid()`), no visible al usuario**
* **`nombre_usuario` — string, obligatorio, máx. 50 caracteres, único**
* **`apellido` — string, obligatorio, máx. 50 caracteres**
* **`email` — string, obligatorio, único, validado por formato**
* **`contrasena_hash` — string, obligatorio, resultado de bcrypt, nunca texto plano**
* **`codigo_amigo` — string, 12 caracteres, único, generado aleatoriamente al crear la cuenta**
* **`nacionalidad` — string, elegido de una lista fija (no texto libre)**
* **`fecha_nacimiento` — DATE, formato `YYYY-MM-DD` a nivel BD**
* **`rol` — enumerado: `jugador` (por defecto) o `admin`. Los admin gestionan cualquier torneo y promueven a otros usuarios**
* **`verificado` — booleano, por defecto `false`. Bloquea el login hasta que el usuario confirma su correo con el código de verificación**
* **`fecha_creacion` — DATETIME, asignado automáticamente por el sistema**

> ℹ️ La autenticación se gestiona en el backend: las contraseñas se guardan hasheadas con **bcrypt** y el login emite un **JWT** firmado con un secreto del servidor. Los tokens son *stateless* y no se almacenan en la base de datos (no hay tabla de sesiones).

> ℹ️ La verificación de correo es obligatoria antes del primer login: el registro crea al usuario con `verificado = false` y emite un código (ver **CodigoVerificacion**); `login` responde `403 CUENTA_NO_VERIFICADA` hasta confirmarlo.

---

#### **1b. CodigoVerificacion**

* **`id` — UUID, PK, generado automáticamente**
* **`id_usuario` — FK → Usuario (UUID), `ON DELETE CASCADE`**
* **`codigo_hash` — string, hash **bcrypt** del código de 6 dígitos (nunca se guarda en texto plano)**
* **`expira_en` — DATETIME, instante de expiración (15 minutos por defecto)**
* **`usado` — booleano, por defecto `false`. Se marca `true` al consumirse o al emitirse uno nuevo**
* **`intentos` — entero, por defecto `0`. Cuenta intentos fallidos; red de seguridad contra fuerza bruta**
* **`fecha_creacion` — DATETIME**
* **Índice:** `(id_usuario)` — buscar el código vigente de un usuario (verificación y reenvío)

> ℹ️ Emitir un código nuevo marca los anteriores del usuario como `usado = true`, garantizando **como máximo un código vigente** por usuario. El envío de correo lo hace Nodemailer (Gmail SMTP); en modo desarrollo (`CORREO_HABILITADO=false`) el código solo se imprime en la consola del backend.

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
* **`id_creador` — FK → Usuario (UUID), nullable — el dueño que creó el torneo (`ON DELETE SET NULL`)**

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

**PKs como UUID:** todas las tablas usan `UUID` generado por `gen_random_uuid()` en lugar de enteros autoincrementales. Previene enumeración de recursos por usuarios malintencionados.

**Autenticación propia sin tabla de sesiones:** la tabla `Sesion` fue eliminada. El backend hashea las contraseñas con bcrypt y emite JWT firmados con un secreto propio; al ser *stateless*, la expiración vive en el token y no se persiste estado de sesión en la BD, evitando dos fuentes de verdad para autenticación.

**Verificación de correo obligatoria:** `Usuario.verificado` bloquea el login hasta confirmar el correo. Los códigos viven en `CodigoVerificacion` hasheados con bcrypt, con expiración e intentos limitados; emitir uno nuevo invalida el anterior (máximo un código vigente por usuario). Envío por Nodemailer (Gmail SMTP), con modo desarrollo que imprime el código en consola para no depender de correo real en pruebas.

**Autorización dueño-admin para torneos:** `usuarios.rol` (`jugador` | `admin`) y `torneos.id_creador` implementan un modelo mínimo de permisos. Cualquier usuario crea torneos y queda como dueño; iniciar/finalizar los permite el dueño o un admin. Los admin se otorgan vía endpoint protegido (solo un admin promueve a otro), por lo que el primer admin se siembra manualmente. `id_creador` es `ON DELETE SET NULL`: si el dueño se elimina, el torneo sobrevive y solo un admin puede gestionarlo.

**Amistad bidireccional con `CHECK` de orden canónico:** `SolicitudAmistad` usa `CHECK (id_solicitante < id_receptor)` junto con `UNIQUE (id_solicitante, id_receptor)` para que no puedan coexistir `(A→B)` y `(B→A)`. Se filtra por `estado = 'aceptado'` para obtener amigos confirmados.

**Tags normalizados:** `JuegoTag` ahora referencia una tabla `Tag` con nombre único y normalizado, en lugar de un campo de texto libre. Elimina fragmentación por variaciones de capitalización.

**Slug en Juego:** campo `slug` único y en kebab-case, necesario para URLs amigables como `/juegos/ajedrez`.

**Partidas contra bot:** manejadas en `PartidaJugador` con `es_bot = true` e `id_usuario = null`. No requiere tabla aparte.

**Integridad Partida ↔ Torneo:** cuando `id_torneo IS NOT NULL`, el juego y la modalidad de la partida deben coincidir con los del torneo. Validado antes de cada insert.

**Rankings consistentes:** `CHECK (victorias <= partidas_jugadas)` como red de seguridad; actualizaciones siempre en transacción atómica junto con `PartidaJugador`.

**Chat unificado:** `tipo` y `id_partida` nullable cubren chat privado y chat de sala. Chats privados se restringen a exactamente dos participantes en la capa de aplicación.

**MensajeEstado indexado:** índice compuesto `(id_mensaje, id_usuario)` obligatorio dado el alto volumen esperado en sesiones de torneo con múltiples jugadores.
