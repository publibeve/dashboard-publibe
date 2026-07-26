-- ============================================================================
-- MIGRACIÓN A SUPABASE AUTH — dashboard-publibe
-- ============================================================================
-- Correr en Supabase -> SQL Editor -> New query -> pegar TODO -> Run.
-- Es seguro correrlo de nuevo.
--
-- ANTES de correr esto, creá a las personas en Supabase Authentication (no
-- se puede hacer por SQL, es un paso manual — ver instrucciones abajo).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Tabla `users`: se usa de acá en más SOLO para nombre/email/permisos/foto
--    (el perfil dentro de la app). El login en sí ya no lo valida esta tabla
--    ni el navegador — lo valida Supabase Auth.
-- ----------------------------------------------------------------------------

-- Se agrega por si faltaba (la app ya la usaba, pero no estaba en el schema
-- original — hallazgo de esta migración, de paso se corrige).
alter table users add column if not exists "avatarUrl" text;

-- La clave en texto plano se retira: a partir de acá, la contraseña de cada
-- persona vive únicamente en Supabase Auth (hasheada, no legible ni por vos).
alter table users drop column if exists clave;

-- ----------------------------------------------------------------------------
-- 2) Vista pública para la pantalla de login (ANTES de iniciar sesión)
-- ----------------------------------------------------------------------------
-- La pantalla de login necesita mostrar el dropdown con nombre + foto de cada
-- persona SIN que todavía haya una sesión iniciada (para eso está el
-- dropdown). Pero la tabla `users` completa (con los permisos de cada quien)
-- va a quedar cerrada a "solo autenticados" en el paso 4.
--
-- Esta vista expone ÚNICAMENTE id/nombre/email/foto (nunca permisos) y sigue
-- siendo legible sin sesión — es información de directorio, no sensible.
-- La marca "security_invoker = false" es la que hace que la vista pueda leer
-- la tabla `users` (protegida por RLS) igual, sin heredar esa restricción:
-- corre con los permisos de quien la creó (vos, dueño de la tabla), no con
-- los del que consulta.
create or replace view public_directory
with (security_invoker = false) as
  select id, nombre, email, "avatarUrl" from users;

grant select on public_directory to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3) RLS: cerrado a "solo autenticados" en las 7 tablas
-- ----------------------------------------------------------------------------
-- Este es el cambio central de toda la migración: antes, "to anon,
-- authenticated" significaba que la clave pública (anon key, visible en el
-- bundle del sitio) alcanzaba para leer/escribir todo. Ahora se saca "anon":
-- sin haber iniciado sesión de verdad con Supabase Auth, cualquier consulta
-- a estas tablas devuelve 0 filas / error de permisos.
do $$
declare
  t text;
begin
  foreach t in array array['users','clients','tasks','notes','payments','invoices','kv_store']
  loop
    execute format('drop policy if exists "allow_anon_all_%1$s" on %1$s', t);
    execute format(
      'create policy "allow_authenticated_all_%1$s" on %1$s for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- ============================================================================
-- VERIFICACIÓN (correr esto en una pestaña de incógnito, en la consola del
-- navegador, SIN haber iniciado sesión en el dashboard — o con curl/Postman
-- usando solo la anon key). Debe devolver un array vacío o un error de
-- permisos en las 7 tablas. Si devuelve filas, algo quedó mal aplicado.
--
--   fetch("https://TU-PROYECTO.supabase.co/rest/v1/users", {
--     headers: { apikey: "TU-ANON-KEY", Authorization: "Bearer TU-ANON-KEY" }
--   }).then(r => r.json()).then(console.log);
-- ============================================================================
