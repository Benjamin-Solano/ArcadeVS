
-- =============================================================================
-- ARCADEVS — Script de Base de Datos PostgreSQL
-- Versión: 2.0.0 | Junio 2026
-- Descripción: Esquema completo con tablas, restricciones, índices y comentarios
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSIONES
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- habilita gen_random_uuid()


-- =============================================================================
-- TABLAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. usuarios
-- -----------------------------------------------------------------------------

CREATE TABLE usuarios (
    id_usuario       UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre           VARCHAR(50)  UNIQUE NOT NULL,
    apellido         VARCHAR(50)  NOT NULL,
    correo           VARCHAR(255) UNIQUE NOT NULL,
    contrasena_hash  TEXT         NOT NULL,
    codigo_amigo     CHAR(12)     UNIQUE NOT NULL,
    nacionalidad     VARCHAR(100),
    fecha_nacimiento DATE,
    avatar_url       TEXT,
    rol              VARCHAR(20)  NOT NULL DEFAULT 'jugador'
                     CHECK (rol IN ('jugador', 'admin')),
    verificado       BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_registro   TIMESTAMP    NOT NULL DEFAULT NOW(),
    ultima_conexion  TIMESTAMP
);

COMMENT ON TABLE  usuarios                  IS 'Perfiles de usuario registrados en el sistema.';
COMMENT ON COLUMN usuarios.id_usuario       IS 'PK UUID — evita enumeración de recursos.';
COMMENT ON COLUMN usuarios.nombre           IS 'Nombre del usuario. Único: funciona también como identificador visible (display name).';
COMMENT ON COLUMN usuarios.apellido         IS 'Apellido del usuario. Campo obligatorio capturado en el registro.';
COMMENT ON COLUMN usuarios.codigo_amigo     IS 'Código de 12 caracteres generado aleatoriamente al registrarse, usado para buscar amigos.';
COMMENT ON COLUMN usuarios.contrasena_hash  IS 'Hash bcrypt/argon2. Nunca se almacena texto plano.';
COMMENT ON COLUMN usuarios.nacionalidad     IS 'Seleccionado de una lista fija en la aplicación, no texto libre.';
COMMENT ON COLUMN usuarios.verificado       IS 'FALSE hasta que el usuario confirma su correo con el código de verificación. El login se bloquea mientras sea FALSE.';


-- -----------------------------------------------------------------------------
-- 1b. codigos_verificacion
-- -----------------------------------------------------------------------------
-- Códigos de verificación de correo de un solo uso. El código se guarda
-- hasheado (bcrypt), nunca en texto plano. Al emitir uno nuevo, los anteriores
-- del usuario se marcan usado = TRUE. intentos limita la fuerza bruta.
-- -----------------------------------------------------------------------------

CREATE TABLE codigos_verificacion (
    id_codigo      UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
    id_usuario     UUID      NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    codigo_hash    TEXT      NOT NULL,
    expira_en      TIMESTAMP NOT NULL,
    usado          BOOLEAN   NOT NULL DEFAULT FALSE,
    intentos       INTEGER   NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  codigos_verificacion             IS 'Códigos de verificación de correo de un solo uso, hasheados y con expiración.';
COMMENT ON COLUMN codigos_verificacion.codigo_hash IS 'Hash bcrypt del código de 6 dígitos. Nunca se almacena texto plano.';
COMMENT ON COLUMN codigos_verificacion.expira_en   IS 'Instante en que el código deja de ser válido (por defecto 15 minutos tras crearse).';
COMMENT ON COLUMN codigos_verificacion.usado       IS 'TRUE cuando el código ya se consumió o fue invalidado por uno nuevo.';
COMMENT ON COLUMN codigos_verificacion.intentos    IS 'Intentos fallidos de verificación. Red de seguridad contra fuerza bruta.';


-- -----------------------------------------------------------------------------
-- 2. solicitudes_amistad
-- -----------------------------------------------------------------------------
-- La restricción CHECK (id_solicitante < id_receptor) garantiza orden canónico:
-- (A, B) y (B, A) no pueden coexistir, eliminando el problema de duplicados
-- invertidos. El servidor debe normalizar el orden antes de cada INSERT.
-- -----------------------------------------------------------------------------

CREATE TABLE solicitudes_amistad (
    id_solicitud    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    id_solicitante  UUID        NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_receptor     UUID        NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_emisor       UUID        REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'aceptado', 'rechazado', 'bloqueado')),
    fecha_solicitud TIMESTAMP   NOT NULL DEFAULT NOW(),
    fecha_respuesta TIMESTAMP,

    -- Orden canónico: previene duplicados invertidos (A→B y B→A simultáneos)
    CHECK (id_solicitante < id_receptor),
    -- Una sola solicitud activa por par de usuarios
    UNIQUE (id_solicitante, id_receptor)
);

COMMENT ON TABLE  solicitudes_amistad                IS 'Solicitudes de amistad entre usuarios. Cubre tanto solicitudes pendientes como amistades confirmadas (estado = aceptado).';
COMMENT ON COLUMN solicitudes_amistad.id_solicitante IS 'UUID menor del par en orden canónico. NO es necesariamente quien inició la solicitud (ver id_emisor).';
COMMENT ON COLUMN solicitudes_amistad.id_receptor    IS 'UUID mayor del par en orden canónico. NO es necesariamente quien recibió la solicitud (ver id_emisor).';
COMMENT ON COLUMN solicitudes_amistad.id_emisor      IS 'UUID de quien realmente inició/reenvió la solicitud. NULL en filas creadas antes de la migración 003.';
COMMENT ON COLUMN solicitudes_amistad.estado         IS 'pendiente | aceptado | rechazado | bloqueado. Filtrar por aceptado para obtener amigos confirmados.';


-- -----------------------------------------------------------------------------
-- 3. juegos
-- -----------------------------------------------------------------------------

CREATE TABLE juegos (
    id_juego       UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre         VARCHAR(100) UNIQUE NOT NULL,
    slug           VARCHAR(100) UNIQUE NOT NULL,
    descripcion    TEXT,
    thumbnail_url  TEXT,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  juegos          IS 'Catálogo de juegos disponibles en la plataforma.';
COMMENT ON COLUMN juegos.slug     IS 'Identificador kebab-case para URLs amigables: /juegos/:slug. Ej: "ajedrez", "dots-and-boxes".';
COMMENT ON COLUMN juegos.activo   IS 'FALSE oculta el juego sin eliminarlo del historial.';


-- -----------------------------------------------------------------------------
-- 4. tags
-- -----------------------------------------------------------------------------

CREATE TABLE tags (
    id_tag UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

COMMENT ON TABLE  tags        IS 'Catálogo normalizado de etiquetas para juegos. Valores controlados en minúsculas.';
COMMENT ON COLUMN tags.nombre IS 'Siempre en minúsculas. Ej: "estrategia", "puzzle", "clasico". Evita fragmentación por capitalización.';


-- -----------------------------------------------------------------------------
-- 5. juegos_tags  (tabla de unión)
-- -----------------------------------------------------------------------------

CREATE TABLE juegos_tags (
    id_juego UUID NOT NULL REFERENCES juegos(id_juego) ON DELETE CASCADE,
    id_tag   UUID NOT NULL REFERENCES tags(id_tag)     ON DELETE CASCADE,
    PRIMARY KEY (id_juego, id_tag)
);

COMMENT ON TABLE juegos_tags IS 'Relación muchos-a-muchos entre juegos y tags.';


-- -----------------------------------------------------------------------------
-- 6. modalidades
-- -----------------------------------------------------------------------------

CREATE TABLE modalidades (
    id_modalidad UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    descripcion  TEXT,
    permite_bot  BOOLEAN      NOT NULL DEFAULT FALSE,
    puntua       BOOLEAN      NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE  modalidades             IS 'Modos de juego disponibles. Controlan reglas y si la partida suma al ranking.';
COMMENT ON COLUMN modalidades.permite_bot IS 'TRUE permite que uno de los jugadores sea un bot.';
COMMENT ON COLUMN modalidades.puntua      IS 'FALSE = la partida no suma al ranking. Ej: partidas casuales vs bot.';


-- -----------------------------------------------------------------------------
-- 7. torneos
-- -----------------------------------------------------------------------------

CREATE TABLE torneos (
    id_torneo         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    id_juego          UUID         NOT NULL REFERENCES juegos(id_juego)           ON DELETE RESTRICT,
    id_modalidad      UUID         NOT NULL REFERENCES modalidades(id_modalidad)   ON DELETE RESTRICT,
    nombre            VARCHAR(255) NOT NULL,
    estado            VARCHAR(20)  NOT NULL DEFAULT 'inscripcion'
                      CHECK (estado IN ('inscripcion', 'en_curso', 'finalizado')),
    fecha_inicio      TIMESTAMP,
    fecha_fin         TIMESTAMP,
    max_participantes INTEGER      CHECK (max_participantes > 0),
    id_creador        UUID         REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

COMMENT ON TABLE  torneos                  IS 'Torneos organizados por juego y modalidad.';
COMMENT ON COLUMN torneos.id_juego         IS 'El juego al que pertenecen todas las partidas del torneo.';
COMMENT ON COLUMN torneos.id_modalidad     IS 'La modalidad que aplica a todas las partidas del torneo.';
COMMENT ON COLUMN torneos.estado           IS 'inscripcion → en_curso → finalizado. Transición unidireccional.';
COMMENT ON COLUMN torneos.max_participantes IS 'Límite de inscritos. NULL = sin límite.';
COMMENT ON COLUMN torneos.id_creador       IS 'Usuario dueño del torneo (quien lo creó). NULL si el dueño fue eliminado; entonces solo un admin puede gestionarlo.';


-- -----------------------------------------------------------------------------
-- 8. torneos_participantes
-- -----------------------------------------------------------------------------

CREATE TABLE torneos_participantes (
    id_participacion  UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
    id_torneo         UUID      NOT NULL REFERENCES torneos(id_torneo)   ON DELETE CASCADE,
    id_usuario        UUID      NOT NULL REFERENCES usuarios(id_usuario)  ON DELETE CASCADE,
    fecha_inscripcion TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (id_torneo, id_usuario)
);

COMMENT ON TABLE torneos_participantes IS 'Inscripciones de usuarios a torneos. UNIQUE evita doble inscripción.';


-- -----------------------------------------------------------------------------
-- 9. partidas
-- -----------------------------------------------------------------------------
-- Cuando id_torneo IS NOT NULL, id_juego e id_modalidad deben coincidir
-- con los del torneo. Esta restricción se valida en la capa de aplicación
-- (función validar_consistencia_partida_torneo) antes de cada INSERT.
-- -----------------------------------------------------------------------------

CREATE TABLE partidas (
    id_partida   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    id_juego     UUID        NOT NULL REFERENCES juegos(id_juego)          ON DELETE RESTRICT,
    id_modalidad UUID        NOT NULL REFERENCES modalidades(id_modalidad)  ON DELETE RESTRICT,
    id_torneo    UUID        REFERENCES torneos(id_torneo)                  ON DELETE SET NULL,
    fecha_inicio TIMESTAMP   NOT NULL DEFAULT NOW(),
    fecha_fin    TIMESTAMP,
    estado       VARCHAR(20) NOT NULL DEFAULT 'en_curso'
                 CHECK (estado IN ('en_curso', 'finalizada', 'abandonada'))
);

COMMENT ON TABLE  partidas            IS 'Partidas jugadas, casuales o de torneo.';
COMMENT ON COLUMN partidas.id_torneo  IS 'NULL = partida casual. NOT NULL = partida dentro de un torneo.';
COMMENT ON COLUMN partidas.id_juego   IS 'Debe coincidir con torneo.id_juego cuando id_torneo IS NOT NULL.';
COMMENT ON COLUMN partidas.id_modalidad IS 'Debe coincidir con torneo.id_modalidad cuando id_torneo IS NOT NULL.';


-- -----------------------------------------------------------------------------
-- 10. partidas_jugadores
-- -----------------------------------------------------------------------------

CREATE TABLE partidas_jugadores (
    id_partida_jugador UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    id_partida         UUID        NOT NULL REFERENCES partidas(id_partida)  ON DELETE CASCADE,
    id_usuario         UUID        REFERENCES usuarios(id_usuario)            ON DELETE SET NULL,
    es_bot             BOOLEAN     NOT NULL DEFAULT FALSE,
    puntuacion         INTEGER     NOT NULL DEFAULT 0,
    resultado          VARCHAR(10) CHECK (resultado IN ('victoria', 'derrota', 'empate')),

    -- Si es_bot = TRUE entonces id_usuario debe ser NULL, y viceversa
    CHECK (
        (es_bot = TRUE  AND id_usuario IS NULL) OR
        (es_bot = FALSE AND id_usuario IS NOT NULL)
    )
);

COMMENT ON TABLE  partidas_jugadores           IS 'Jugadores (humanos o bots) participantes en cada partida.';
COMMENT ON COLUMN partidas_jugadores.id_usuario IS 'NULL cuando es_bot = TRUE. Referencia a usuarios cuando es_bot = FALSE.';
COMMENT ON COLUMN partidas_jugadores.es_bot     IS 'TRUE = jugador bot. La modalidad debe tener permite_bot = TRUE.';
COMMENT ON COLUMN partidas_jugadores.resultado  IS 'NULL mientras la partida está en curso. Se asigna al finalizar.';


-- -----------------------------------------------------------------------------
-- 11. rankings_juego
-- -----------------------------------------------------------------------------
-- Los contadores partidas_jugadas y victorias se actualizan siempre dentro
-- de la misma transacción que el INSERT en partidas_jugadores.
-- El CHECK (victorias <= partidas_jugadas) actúa como red de seguridad.
-- -----------------------------------------------------------------------------

CREATE TABLE rankings_juego (
    id_ranking           UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
    id_usuario           UUID      NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_juego             UUID      NOT NULL REFERENCES juegos(id_juego)     ON DELETE CASCADE,
    puntuacion_total     INTEGER   NOT NULL DEFAULT 0,
    partidas_jugadas     INTEGER   NOT NULL DEFAULT 0,
    victorias            INTEGER   NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (id_usuario, id_juego),
    CHECK  (puntuacion_total  >= 0),
    CHECK  (partidas_jugadas  >= 0),
    CHECK  (victorias         >= 0),
    CHECK  (victorias         <= partidas_jugadas)
);

COMMENT ON TABLE  rankings_juego                      IS 'Leaderboard por usuario y juego. Solo se actualizan partidas donde modalidad.puntua = TRUE.';
COMMENT ON COLUMN rankings_juego.puntuacion_total     IS 'Acumulado de puntuaciones de partidas que puntúan.';
COMMENT ON COLUMN rankings_juego.partidas_jugadas     IS 'Contador. Actualizar siempre en la misma transacción que partidas_jugadores.';
COMMENT ON COLUMN rankings_juego.victorias            IS 'Contador. CHECK garantiza victorias <= partidas_jugadas como red de seguridad.';


-- -----------------------------------------------------------------------------
-- 12. chats
-- -----------------------------------------------------------------------------

CREATE TABLE chats (
    id_chat        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo           VARCHAR(10) NOT NULL CHECK (tipo IN ('privado', 'partida')),
    id_partida     UUID        REFERENCES partidas(id_partida) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP   NOT NULL DEFAULT NOW(),

    -- id_partida solo aplica cuando tipo = 'partida'
    CHECK (
        (tipo = 'partida' AND id_partida IS NOT NULL) OR
        (tipo = 'privado' AND id_partida IS NULL)
    )
);

COMMENT ON TABLE  chats            IS 'Salas de chat unificadas: privadas (2 usuarios) o de sala de partida.';
COMMENT ON COLUMN chats.tipo       IS 'privado = chat 1-a-1 entre amigos. partida = chat de sala de juego.';
COMMENT ON COLUMN chats.id_partida IS 'NULL para chats privados. NOT NULL para chats de partida.';


-- -----------------------------------------------------------------------------
-- 13. chats_participantes
-- -----------------------------------------------------------------------------

CREATE TABLE chats_participantes (
    id_participacion UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
    id_chat          UUID      NOT NULL REFERENCES chats(id_chat)       ON DELETE CASCADE,
    id_usuario       UUID      NOT NULL REFERENCES usuarios(id_usuario)  ON DELETE CASCADE,
    fecha_union      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (id_chat, id_usuario)
);

COMMENT ON TABLE chats_participantes IS 'Miembros de cada chat. Para tipo privado la aplicación garantiza exactamente 2 participantes al crear el chat.';


-- -----------------------------------------------------------------------------
-- 14. mensajes
-- -----------------------------------------------------------------------------

CREATE TABLE mensajes (
    id_mensaje UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
    id_chat    UUID      NOT NULL REFERENCES chats(id_chat)       ON DELETE CASCADE,
    id_usuario UUID      REFERENCES usuarios(id_usuario)           ON DELETE SET NULL,
    texto      TEXT      NOT NULL,
    hora_envio TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  mensajes           IS 'Mensajes enviados en cualquier chat.';
COMMENT ON COLUMN mensajes.id_usuario IS 'SET NULL si el usuario es eliminado; el mensaje queda como [usuario eliminado].';


-- -----------------------------------------------------------------------------
-- 15. mensajes_estado
-- -----------------------------------------------------------------------------

CREATE TABLE mensajes_estado (
    id_estado    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    id_mensaje   UUID        NOT NULL REFERENCES mensajes(id_mensaje)  ON DELETE CASCADE,
    id_usuario   UUID        NOT NULL REFERENCES usuarios(id_usuario)   ON DELETE CASCADE,
    estado       VARCHAR(10) NOT NULL DEFAULT 'enviado'
                 CHECK (estado IN ('enviado', 'entregado', 'leido')),
    fecha_cambio TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  mensajes_estado          IS 'Estado de lectura por receptor. Tabla de mayor volumen: N filas por mensaje en salas de torneo.';
COMMENT ON COLUMN mensajes_estado.id_usuario IS 'El receptor del mensaje, no el emisor.';
COMMENT ON COLUMN mensajes_estado.estado     IS 'Transición unidireccional: enviado → entregado → leido.';


-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- usuarios
-- -----------------------------------------------------------------------------
-- nombre y correo ya tienen índice implícito por UNIQUE.
-- Búsqueda de usuarios por código de amigo (flujo de agregar amigos).
CREATE INDEX idx_usuarios_codigo_amigo     ON usuarios (codigo_amigo);
-- Filtrar usuarios activos recientemente (lobby, presencia online).
CREATE INDEX idx_usuarios_ultima_conexion  ON usuarios (ultima_conexion DESC);


-- -----------------------------------------------------------------------------
-- codigos_verificacion
-- -----------------------------------------------------------------------------
-- Buscar el código vigente de un usuario (verificación y reenvío).
CREATE INDEX idx_codigos_usuario           ON codigos_verificacion (id_usuario);


-- -----------------------------------------------------------------------------
-- solicitudes_amistad
-- -----------------------------------------------------------------------------
-- Listar todas las solicitudes enviadas por un usuario.
CREATE INDEX idx_solicitudes_solicitante   ON solicitudes_amistad (id_solicitante);
-- Listar todas las solicitudes recibidas por un usuario (notificaciones).
CREATE INDEX idx_solicitudes_receptor      ON solicitudes_amistad (id_receptor);
-- Filtrar amigos confirmados de un usuario: WHERE estado = 'aceptado'.
CREATE INDEX idx_solicitudes_estado        ON solicitudes_amistad (id_solicitante, id_receptor, estado);


-- -----------------------------------------------------------------------------
-- juegos
-- -----------------------------------------------------------------------------
-- slug ya tiene índice implícito por UNIQUE.
-- Listar solo juegos activos en el catálogo.
CREATE INDEX idx_juegos_activo             ON juegos (activo) WHERE activo = TRUE;


-- -----------------------------------------------------------------------------
-- juegos_tags
-- -----------------------------------------------------------------------------
-- PK compuesta (id_juego, id_tag) ya cubre búsquedas por juego.
-- Búsqueda inversa: todos los juegos que tienen un tag específico.
CREATE INDEX idx_juegos_tags_tag           ON juegos_tags (id_tag);


-- -----------------------------------------------------------------------------
-- torneos
-- -----------------------------------------------------------------------------
-- Filtrar torneos por juego (página de un juego específico).
CREATE INDEX idx_torneos_juego             ON torneos (id_juego);
-- Filtrar torneos activos (inscripcion o en_curso).
CREATE INDEX idx_torneos_estado            ON torneos (estado);
-- Torneos próximos a iniciar (orden por fecha).
CREATE INDEX idx_torneos_fecha_inicio      ON torneos (fecha_inicio ASC);
-- Torneos creados por un usuario ("mis torneos").
CREATE INDEX idx_torneos_creador           ON torneos (id_creador);


-- -----------------------------------------------------------------------------
-- torneos_participantes
-- -----------------------------------------------------------------------------
-- Todos los torneos en los que participa un usuario (historial de torneos).
CREATE INDEX idx_tp_usuario                ON torneos_participantes (id_usuario);
-- UNIQUE (id_torneo, id_usuario) ya cubre búsquedas por torneo.


-- -----------------------------------------------------------------------------
-- partidas
-- -----------------------------------------------------------------------------
-- Historial de partidas por juego (leaderboard, estadísticas).
CREATE INDEX idx_partidas_juego            ON partidas (id_juego);
-- Partidas pertenecientes a un torneo (reconstrucción de bracket).
CREATE INDEX idx_partidas_torneo           ON partidas (id_torneo) WHERE id_torneo IS NOT NULL;
-- Partidas en curso (polling del servidor para detectar partidas colgadas).
CREATE INDEX idx_partidas_estado           ON partidas (estado) WHERE estado = 'en_curso';
-- Historial cronológico de partidas por juego.
CREATE INDEX idx_partidas_juego_fecha      ON partidas (id_juego, fecha_inicio DESC);


-- -----------------------------------------------------------------------------
-- partidas_jugadores
-- -----------------------------------------------------------------------------
-- Historial de partidas de un usuario (perfil, estadísticas).
CREATE INDEX idx_pj_usuario                ON partidas_jugadores (id_usuario);
-- Todos los jugadores de una partida específica.
CREATE INDEX idx_pj_partida                ON partidas_jugadores (id_partida);
-- Filtrar solo victorias de un usuario (cálculo de ratio).
CREATE INDEX idx_pj_usuario_resultado      ON partidas_jugadores (id_usuario, resultado);


-- -----------------------------------------------------------------------------
-- rankings_juego
-- -----------------------------------------------------------------------------
-- UNIQUE (id_usuario, id_juego) ya cubre la búsqueda del ranking de un usuario.
-- Top N del leaderboard de un juego específico (consulta más frecuente).
CREATE INDEX idx_ranking_juego_puntaje     ON rankings_juego (id_juego, puntuacion_total DESC);
-- Ranking global de un usuario a través de todos sus juegos.
CREATE INDEX idx_ranking_usuario           ON rankings_juego (id_usuario);


-- -----------------------------------------------------------------------------
-- chats
-- -----------------------------------------------------------------------------
-- Chat de una partida específica (carga del chat al entrar a la sala).
CREATE INDEX idx_chats_partida             ON chats (id_partida) WHERE id_partida IS NOT NULL;


-- -----------------------------------------------------------------------------
-- chats_participantes
-- -----------------------------------------------------------------------------
-- Todos los chats de un usuario (bandeja de mensajes).
CREATE INDEX idx_cp_usuario                ON chats_participantes (id_usuario);
-- UNIQUE (id_chat, id_ciudad) ya cubre búsquedas por chat.


-- -----------------------------------------------------------------------------
-- mensajes
-- -----------------------------------------------------------------------------
-- Historial de mensajes de un chat en orden cronológico (carga del chat).
CREATE INDEX idx_mensajes_chat_hora        ON mensajes (id_chat, hora_envio ASC);
-- Mensajes enviados por un usuario (moderación, auditoría).
CREATE INDEX idx_mensajes_usuario          ON mensajes (id_usuario);


-- -----------------------------------------------------------------------------
-- mensajes_estado  ← tabla de mayor volumen
-- -----------------------------------------------------------------------------
-- Consulta principal: ¿cuál es el estado de un mensaje para un receptor?
-- También cubre: todos los mensajes no leídos de un usuario.
CREATE INDEX idx_me_mensaje_usuario        ON mensajes_estado (id_mensaje, id_usuario);
-- Mensajes no leídos de un usuario en todos sus chats (badge de notificaciones).
CREATE INDEX idx_me_usuario_estado         ON mensajes_estado (id_usuario, estado) WHERE estado != 'leido';


-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================
