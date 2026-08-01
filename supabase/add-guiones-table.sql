-- ============================================================================
-- Módulo Guiones — dashboard-publibe
-- ============================================================================
-- Misma estructura que el resto de las tablas de dominio (tasks, notes,
-- payments, etc.): id + empresa + un jsonb "data" con el objeto completo.
-- Cierra el acceso a "solo autenticados" desde el vamos (no hace falta un
-- segundo paso como con las tablas viejas que empezaron abiertas a anon).
--
-- Correr en Supabase -> SQL Editor -> New query -> pegar -> Run.
-- ============================================================================

create table if not exists guiones (
  id         text primary key,
  empresa    text,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guiones_empresa_idx on guiones (empresa);

alter table guiones enable row level security;

drop policy if exists "allow_authenticated_all_guiones" on guiones;
create policy "allow_authenticated_all_guiones" on guiones
  for all to authenticated using (true) with check (true);

-- Realtime (sincronización entre pestañas/dispositivos — mismo patrón que
-- las demás tablas de dominio, aunque Guiones no lo necesite para el uso
-- normal de a una persona a la vez, no cuesta nada dejarlo consistente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'guiones'
  ) then
    execute 'alter publication supabase_realtime add table guiones';
  end if;
end $$;
