-- =============================================================================
-- Migración 001 — Modelo de autorización dueño-admin para torneos
-- =============================================================================
-- Agrega:
--   * usuarios.rol       → 'jugador' (por defecto) o 'admin'.
--   * torneos.id_creador → el usuario dueño del torneo (quien lo creó).
--
-- Autorización resultante:
--   - Crear torneo: cualquier usuario autenticado; queda como dueño.
--   - Iniciar/finalizar: el dueño (id_creador) o cualquier admin.
--   - Promover a admin: solo un admin (el primer admin se siembra a mano).
--
-- Idempotente (usa IF NOT EXISTS): se puede reejecutar sin error.
-- =============================================================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'jugador'
  CHECK (rol IN ('jugador', 'admin'));

ALTER TABLE torneos
  ADD COLUMN IF NOT EXISTS id_creador UUID
  REFERENCES usuarios(id_usuario) ON DELETE SET NULL;

-- Consultar los torneos creados por un usuario ("mis torneos").
CREATE INDEX IF NOT EXISTS idx_torneos_creador ON torneos (id_creador);

COMMENT ON COLUMN usuarios.rol       IS 'jugador | admin. Los admin pueden gestionar cualquier torneo y promover a otros usuarios.';
COMMENT ON COLUMN torneos.id_creador IS 'Usuario dueño del torneo (quien lo creó). NULL si el dueño fue eliminado; entonces solo un admin puede gestionarlo.';
