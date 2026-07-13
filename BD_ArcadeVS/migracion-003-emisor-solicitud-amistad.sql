-- =============================================================================
-- Migración 003 — Emisor real de la solicitud de amistad
-- =============================================================================
-- Problema: id_solicitante/id_receptor se normalizan a orden canónico (UUID
-- menor/mayor) para que el CHECK (id_solicitante < id_receptor) evite
-- duplicados invertidos. Por eso id_solicitante NO indica quién inició
-- realmente la solicitud (el comentario original de la tabla lo sugería, pero
-- es incorrecto: ver la nota de diseño en repositorio-amistad.js).
--
-- Sin esa dirección real, el cliente no puede distinguir "solicitudes que
-- debo responder" de "solicitudes que ya envié y espero" — necesario para la
-- UI de amigos.
--
-- Agrega id_emisor (nullable: las filas existentes no tienen esa información
-- y quedan sin distinguir dirección; el servidor la completa en cada
-- INSERT/reactivación desde este punto en adelante).
--
-- Idempotente (usa IF NOT EXISTS): se puede reejecutar sin error.
-- =============================================================================

ALTER TABLE solicitudes_amistad
  ADD COLUMN IF NOT EXISTS id_emisor UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE;

COMMENT ON COLUMN solicitudes_amistad.id_emisor IS 'UUID de quien realmente inició/reenvió la solicitud. NULL en filas anteriores a esta migración. id_solicitante/id_receptor son solo el orden canónico (menor/mayor), no la dirección real.';
