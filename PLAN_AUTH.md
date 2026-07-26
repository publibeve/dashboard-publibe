# PLAN — Migración a Supabase Auth (seguridad real)

**Prioridad:** alta — el dashboard maneja datos financieros reales y contraseñas
de clientes, y hoy la base es legible por cualquiera que extraiga la anon key
del bundle (2 minutos para un desarrollador). Ver nota de seguridad en
`supabase/schema.sql` y `DEPLOY.md`.

## Objetivo

Que el PIN deje de ser una barrera solo de interfaz y pase a ser una barrera a
nivel de base de datos: sin sesión válida, la anon key no puede leer ni
escribir nada.

## Qué cambia (resumen técnico)

1. **Login real con Supabase Auth**
   - Cada usuario pasa a existir en Supabase Auth (email + contraseña).
     Emails ya definidos: `ceo@publibe.net` (Diego), `designer@publibe.net` (Ariana).
   - La pantalla de login mantiene la MISMA experiencia visual (dropdown de
     usuario + clave); por debajo, en vez de comparar la clave en el navegador,
     hace `supabase.auth.signInWithPassword({ email, password })`.
   - Las claves quedan hasheadas por Supabase (nadie puede verlas en ninguna
     tabla, ni siquiera el administrador — eso es lo correcto).
   - La sesión la maneja supabase-js (persistencia y refresh automáticos);
     se elimina el `publibe:current-user-id` manual de localStorage.

2. **RLS cerrado**
   - Todas las políticas `to anon, authenticated using (true)` se reemplazan
     por políticas `to authenticated` (solo con sesión válida).
   - La tabla `users` de la app se conserva para nombre/permisos/avatar, pero
     SIN la columna `clave` (se elimina). Se enlaza por email o por el uuid de
     Auth.
   - Verificación clave: con las políticas nuevas, una consulta con la anon
     key sola debe devolver 0 filas / error en TODAS las tablas.

3. **Migración de usuarios existentes**
   - Script/pasos para crear a Diego y Ariana en Auth (desde el panel de
     Supabase, 2 minutos) con contraseñas nuevas elegidas por cada uno.
   - Las claves actuales (198913 / 000000) quedan obsoletas — están en texto
     plano en la DB actual, así que deben considerarse comprometidas y NO
     reutilizarse como contraseñas de Auth.

4. **Ajustes en la app**
   - `useAuth` pasa a envolver `supabase.auth` (onAuthStateChange para la
     sincronización entre pestañas — reemplaza el listener manual de storage).
   - El gate de permisos (`can`/`requestPermission`) no cambia: sigue leyendo
     de la tabla `users` por el usuario autenticado.
   - El "master password" de acciones sensibles dentro de la app puede
     mantenerse como segunda confirmación de UI, pero ya no es la barrera real.

5. **Después (paso separado, solo tiene sentido con Auth ya activo)**
   - Encriptar los Accesos de clientes (contraseñas de cuentas de clientes)
     para que ni siquiera queden legibles en la tabla. Opciones: pgsodium /
     Vault de Supabase, o cifrado con clave derivada del login. Se decide en
     su momento.

## Hasta que se haga la migración

- **No cargar contraseñas reales de clientes en el módulo Accesos** (o
  sacarlas si ya hay). Es el dato más sensible y hoy es legible.
- Asumir que las claves de login actuales son públicas; al migrar, elegir
  contraseñas nuevas.

## Estimación

Una sesión de trabajo completa (similar a la migración inicial a Supabase):
código + SQL de políticas + pasos manuales en el panel de Supabase + pruebas
de que la anon key sola no lee nada.
