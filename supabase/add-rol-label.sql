-- ============================================================================
-- Rol/descripción editable por usuario — dashboard-publibe
-- ============================================================================
-- Agrega una columna de texto libre para el subtítulo que se muestra debajo
-- del nombre en la tarjeta del sidebar (hoy fijo: "Administrador" o
-- "Miembro del equipo" según el permiso administrativo). Queda vacía por
-- defecto para todos los usuarios existentes: mientras esté vacía, la app
-- sigue mostrando exactamente el mismo texto de siempre — no rompe nada.
--
-- Correr en Supabase -> SQL Editor -> New query -> pegar -> Run.
-- ============================================================================

alter table users add column if not exists "rolLabel" text;
