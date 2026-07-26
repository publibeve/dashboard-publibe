-- ============================================================================
-- dashboard-publibe — schema de Supabase
-- ============================================================================
-- Corré esto en Supabase -> SQL Editor -> New query -> pegar todo -> Run.
-- Es seguro correrlo de nuevo (usa IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- Si "users", "clients", "tasks", "notes", "payments" o "invoices" YA EXISTEN
-- en tu proyecto con otras columnas: avisame la estructura real y ajusto el
-- código de src/services/*.js para que calce, en vez de forzarte a recrearlas.
-- ============================================================================

-- Usuarios (perfil dentro de la app: nombre/email/permisos/foto). El login en
-- sí ya NO se valida acá — ver supabase/auth-migration.sql, que quita la
-- columna `clave` y lo reemplaza por Supabase Authentication de verdad.
create table if not exists users (
  id        text primary key,
  nombre    text not null,
  email     text not null unique,
  clave     text not null,
  permisos  jsonb not null default '{}'::jsonb
);
-- Por si la tabla ya existía sin esta columna (create table if not exists no
-- altera una tabla existente): la agrega solo si hace falta.
alter table users add column if not exists email text;

-- Clientes agregados/editados desde la app (se suman a los predefinidos en
-- utils/constants.js, que siguen viviendo en el código, no en la DB)
create table if not exists clients (
  name       text primary key,
  color      text,
  "iconKey"  text
);

-- Tareas creativas (tablero "Flujo de diseño")
create table if not exists tasks (
  id         text primary key,
  empresa    text,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_empresa_idx on tasks (empresa);

-- Notas
create table if not exists notes (
  id         text primary key,
  empresa    text,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_empresa_idx on notes (empresa);

-- Pagos publicitarios
create table if not exists payments (
  id         text primary key,
  empresa    text,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_empresa_idx on payments (empresa);

-- Facturas
create table if not exists invoices (
  id         text primary key,
  empresa    text,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_empresa_idx on invoices (empresa);

-- Todo lo demás (publicaciones/calendario, pendientes por cobrar, saldo a
-- favor, gastos y nómina, inversiones, tareas generales, accesos de clientes,
-- historial de actividad, lecturas de comentarios, clave de Gemini, override
-- de modelo, estado de conexión de Drive, fecha del último backup): clave/valor
-- genérico, mismo patrón que tenía window.storage.
create table if not exists kv_store (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- NOTA: este bloque deja las políticas abiertas a "anon" como estaban en la
-- versión original de la app (login por PIN sin Supabase Auth). Esto YA NO
-- refleja el estado actual: correr `supabase/auth-migration.sql` DESPUÉS de
-- este archivo reemplaza estas políticas por "solo autenticados" y cierra el
-- acceso a la clave pública. Ver ese archivo para el detalle y las
-- instrucciones de verificación.

alter table users     enable row level security;
alter table clients   enable row level security;
alter table tasks     enable row level security;
alter table notes     enable row level security;
alter table payments  enable row level security;
alter table invoices  enable row level security;
alter table kv_store  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['users','clients','tasks','notes','payments','invoices','kv_store']
  loop
    execute format('drop policy if exists "allow_anon_all_%1$s" on %1$s', t);
    execute format(
      'create policy "allow_anon_all_%1$s" on %1$s for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- ============================================================================
-- Realtime (sincronización entre pestañas/dispositivos)
-- ============================================================================
-- Sin esto, las suscripciones desde el dashboard (supabase.channel(...).on
-- ("postgres_changes", ...)) quedan abiertas pero nunca reciben ningún evento
-- — es la causa más común de "el realtime no sincroniza nada". Agrega cada
-- tabla a la publicación `supabase_realtime` (ya existe por defecto en todo
-- proyecto de Supabase).
do $$
declare
  t text;
begin
  foreach t in array array['users','clients','tasks','notes','payments','invoices','kv_store']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
