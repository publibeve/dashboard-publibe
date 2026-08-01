-- ============================================================================
-- Nivel "Pauta" dentro de Guiones — dashboard-publibe
-- ============================================================================
-- Misma estructura que el resto de las tablas de dominio. Cada Guion
-- referencia su Pauta con un "pautaId" adentro del jsonb (no hace falta una
-- columna ni una foreign key — el resto de la app tampoco las usa).
--
-- Correr en Supabase -> SQL Editor -> New query -> pegar -> Run.
-- ============================================================================

create table if not exists pautas (
  id         text primary key,
  empresa    text,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pautas_empresa_idx on pautas (empresa);

alter table pautas enable row level security;

drop policy if exists "allow_authenticated_all_pautas" on pautas;
create policy "allow_authenticated_all_pautas" on pautas
  for all to authenticated using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pautas'
  ) then
    execute 'alter publication supabase_realtime add table pautas';
  end if;
end $$;
