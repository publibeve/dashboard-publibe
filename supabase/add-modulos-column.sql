-- ============================================================================
-- Acceso a módulos por usuario — dashboard-publibe
-- ============================================================================
-- CAUSA DEL BUG "le saqué Guiones a Ariana y al volver estaba activo de
-- nuevo": la tabla `users` usa columnas explícitas (no un jsonb "data" como
-- guiones/pautas), y la columna `modulos` nunca se creó — cada guardado del
-- toggle fallaba en Supabase con "column modulos does not exist", sin
-- mostrarse en pantalla, y al recargar volvía el valor viejo del servidor.
--
-- Correr en Supabase -> SQL Editor -> New query -> pegar -> Run.
-- Es seguro correrlo más de una vez (add column if not exists).
-- ============================================================================

alter table users add column if not exists modulos jsonb not null default '{}'::jsonb;

-- Verificación rápida (opcional): debería listar la columna nueva.
-- select column_name from information_schema.columns where table_name = 'users';
