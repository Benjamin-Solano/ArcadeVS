-- =============================================================================
-- Migración 002 — Verificación de correo por código de 6 dígitos
-- =============================================================================
-- Agrega:
--   * usuarios.verificado      → FALSE hasta que el usuario confirma su correo.
--   * codigos_verificacion     → códigos de un solo uso, hasheados y con expiración.
--
-- Flujo resultante:
--   - Registro: crea la cuenta como no verificada y emite un código.
--   - Login: bloqueado (403 CUENTA_NO_VERIFICADA) hasta que verificado = TRUE.
--   - Verificar: valida el código vigente y marca la cuenta como verificada.
--
-- El código se guarda hasheado (bcrypt), nunca en texto plano. La columna
-- intentos limita la fuerza bruta; expira_en acota la ventana de validez.
--
-- Idempotente (usa IF NOT EXISTS): se puede reejecutar sin error.
-- =============================================================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS codigos_verificacion (
    id_codigo      UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
    id_usuario     UUID      NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    codigo_hash    TEXT      NOT NULL,
    expira_en      TIMESTAMP NOT NULL,
    usado          BOOLEAN   NOT NULL DEFAULT FALSE,
    intentos       INTEGER   NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Buscar el código vigente de un usuario (verificación y reenvío).
CREATE INDEX IF NOT EXISTS idx_codigos_usuario ON codigos_verificacion (id_usuario);

COMMENT ON COLUMN usuarios.verificado             IS 'FALSE hasta que el usuario confirma su correo con el código de verificación. El login se bloquea mientras sea FALSE.';
COMMENT ON TABLE  codigos_verificacion            IS 'Códigos de verificación de correo de un solo uso, hasheados y con expiración.';
COMMENT ON COLUMN codigos_verificacion.codigo_hash IS 'Hash bcrypt del código de 6 dígitos. Nunca se almacena texto plano.';
COMMENT ON COLUMN codigos_verificacion.expira_en   IS 'Instante en que el código deja de ser válido (por defecto 15 minutos tras crearse).';
COMMENT ON COLUMN codigos_verificacion.usado       IS 'TRUE cuando el código ya se consumió o fue invalidado por uno nuevo.';
COMMENT ON COLUMN codigos_verificacion.intentos    IS 'Intentos fallidos de verificación. Red de seguridad contra fuerza bruta.';
