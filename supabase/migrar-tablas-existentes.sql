-- ============================================================================
-- CAUSA RAÍZ de los errores 400 en cascada + seeding fallido
-- ============================================================================
-- Las tablas users/clients/tasks/notes/payments/invoices YA EXISTÍAN en tu
-- Supabase ANTES de correr nuestro schema.sql, con OTRA estructura (ej:
-- users.id es int8/serial, email NOT NULL, y las tablas de dominio no tienen
-- las columnas "empresa" y "data" que el código consulta).
--
-- Nuestro schema.sql usa `create table if not exists`, que NO MODIFICA una
-- tabla que ya existe — así que esas tablas quedaron con su estructura vieja.
-- Consecuencias exactas:
--   * El código genera ids de TEXTO (ej: "mdk3ab12xz"). Insertar eso en un
--     id int8 -> 400. Por eso el seeding de Diego/Ariana falla.
--   * loadObjectsTable hace `select id, empresa, data` — si esas columnas no
--     existen en la tabla vieja -> 400. Por eso TODAS las tablas fallan a la
--     vez: no es un bug distinto por tabla, es el mismo desajuste en todas.
--
-- PASO 1: DIAGNÓSTICO (solo lectura — corré esto y compartí el resultado)
-- ============================================================================
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('users','clients','tasks','notes','payments','invoices','kv_store')
order by table_name, ordinal_position;

-- ¿Tienen filas con datos reales que haya que conservar?
select 'users' as tabla, count(*) from users
union all select 'clients', count(*) from clients
union all select 'tasks', count(*) from tasks
union all select 'notes', count(*) from notes
union all select 'payments', count(*) from payments
union all select 'invoices', count(*) from invoices;

-- ============================================================================
-- PASO 2: MIGRACIÓN — alinear las tablas con lo que el código espera.
--
-- ⚠️ DESTRUCTIVO: borra las tablas viejas y las recrea. Si el diagnóstico del
-- paso 1 mostró filas con información REAL que quieras conservar, NO corras
-- esto todavía — avisame qué hay y armamos una migración que las preserve.
-- Si están vacías o solo tienen datos de prueba fallidos, descomentá y corré.
-- ============================================================================

-- drop table if exists users cascade;
-- drop table if exists clients cascade;
-- drop table if exists tasks cascade;
-- drop table if exists notes cascade;
-- drop table if exists payments cascade;
-- drop table if exists invoices cascade;
-- delete from kv_store where key = 'publibe-seeded-users';
-- delete from kv_store where key like 'publibe-seeded-%';

-- PASO 3: después del drop, corré COMPLETO el archivo supabase/schema.sql
-- (crea las tablas con la estructura correcta: id text, empresa, data jsonb,
--  email en users, RLS y Realtime). Luego recargá la app: Diego y Ariana se
--  siembran solos con sus permisos y sus emails.
