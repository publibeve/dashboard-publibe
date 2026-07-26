-- ============================================================================
-- Retirar public_directory — dashboard-publibe
-- ============================================================================
-- El login dejó de mostrar un selector de "¿Quién eres?" (ahora es solo
-- correo + clave, ver plan de rediseño del login), así que la vista
-- `public_directory` (creada en auth-migration.sql para poblar ESE selector
-- sin necesitar sesión) ya no la usa nadie. Se retira: es buena práctica no
-- dejar una superficie legible-sin-sesión dando vueltas una vez que dejó de
-- cumplir su propósito, aunque nunca expuso nada sensible (solo
-- nombre/email/foto, nunca permisos).
--
-- Correr en Supabase -> SQL Editor -> New query -> pegar -> Run.
-- No afecta el login en sí (que ya no depende de esta vista) ni ningún otro
-- dato — es un cleanup, no un cambio funcional.
-- ============================================================================

drop view if exists public_directory;
