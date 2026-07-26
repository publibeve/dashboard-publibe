-- ============================================================================
-- Diagnóstico y reset de usuarios — correr en Supabase -> SQL Editor
-- Usar SOLO si, después de aplicar el fix de código (email en demoUsers),
-- el login sigue sin funcionar o los usuarios no son los correctos.
-- ============================================================================

-- 1) DIAGNÓSTICO — mirá esto primero, no cambia nada todavía.

-- ¿Qué hay ahora mismo en la tabla users?
select id, nombre, email, clave, permisos from users;

-- ¿La bandera de "usuarios ya sembrados" quedó marcada como true aunque la
-- tabla esté vacía o incompleta? (esto pasaba si el insert fallaba por el
-- NOT NULL de email, pero el código -antes del fix- igual marcaba "listo").
select * from kv_store where key = 'publibe-seeded-users';

-- ============================================================================
-- 2) RESET — corré esto SOLO si el diagnóstico de arriba mostró un problema
--    (tabla vacía, usuarios duplicados, o la bandera en true con la tabla
--    vacía/incompleta). Esto borra los usuarios actuales y la bandera, para
--    que la próxima carga de la app los vuelva a crear desde cero, ya con
--    los permisos y el email correctos.
--
--    OJO: esto NO afecta tareas/pagos/notas/facturas/etc — solo la tabla
--    users y esa bandera puntual.
-- ============================================================================

-- delete from users;
-- delete from kv_store where key = 'publibe-seeded-users';

-- ============================================================================
-- 3) Alternativa más quirúrgica: si preferís no borrar y volver a sembrar,
--    podés insertar/corregir a Diego y Ariana a mano con esta consulta
--    (reemplazá los valores de "clave" si querés otras claves reales).
--    Los permisos deben coincidir con utils/constants.js -> PERMISOS_LIST:
--    editar, eliminar, administrativo, verClaves, gestionarClientes,
--    datosEjemplo, gestionarUsuarios, configurarIA, configurarIntegraciones.
-- ============================================================================

-- insert into users (id, nombre, email, clave, permisos) values
--   (
--     'diego-' || substr(md5(random()::text), 1, 8),
--     'Diego Toro', 'diego@publibe.net', '198913',
--     '{"editar":true,"eliminar":true,"administrativo":true,"verClaves":true,"gestionarClientes":true,"datosEjemplo":true,"gestionarUsuarios":true,"configurarIA":true,"configurarIntegraciones":true}'::jsonb
--   ),
--   (
--     'ariana-' || substr(md5(random()::text), 1, 8),
--     'Ariana Martínez', 'ariana@publibe.net', '000000',
--     '{"editar":false,"eliminar":false,"administrativo":false,"verClaves":false,"gestionarClientes":false,"datosEjemplo":false,"gestionarUsuarios":false,"configurarIA":false,"configurarIntegraciones":false}'::jsonb
--   )
-- on conflict (id) do nothing;
