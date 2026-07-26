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

-- Usuarios (login por PIN, no Supabase Auth — ver nota de seguridad al final)
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
-- Nota de seguridad importante: la app NO usa Supabase Auth (el login es un
-- PIN de 6 dígitos comparado en el navegador, igual que en la versión
-- original). Eso significa que no hay un "usuario autenticado" real desde el
-- punto de vista de Supabase — todo el tráfico llega con la clave anónima
-- (anon key), que es pública por diseño (va en el bundle del frontend).
--
-- Con RLS "abierto a anon" (como se deja acá) el nivel de seguridad es
-- EQUIVALENTE al que ya tenía la app (el PIN es una barrera de interfaz, no
-- de base de datos: cualquiera con la URL del sitio y algo de curiosidad
-- técnica podría leer/escribir la DB directo, sin pasar por el login). Si
-- más adelante querés que el PIN sea una barrera real, hay que migrar a
-- Supabase Auth (o al menos a Edge Functions con una service role key del
-- lado del servidor) — avisame si querés que lo dejemos armado para la
-- próxima iteración.

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
