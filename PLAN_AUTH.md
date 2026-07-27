# Migración a Supabase Auth — ESTADO: código listo, faltan 2 pasos manuales tuyos

El código de esta migración ya está implementado (login real con Supabase
Auth, RLS cerrado a solo autenticados, columna `clave` eliminada). Lo que
falta es enteramente manual, del lado de Supabase — ningún ajuste de código
adicional depende de esto.

## Qué falta (hacelo en este orden)

1. **Correr `supabase/auth-migration.sql`** en el SQL Editor de Supabase.
2. **Crear a Diego y Ariana en Supabase Authentication** (Authentication →
   Users → Add user) con sus emails (`ceo@publibe.net`, `designer@publibe.net`)
   y contraseñas NUEVAS — las viejas (198913 / la de Ariana) quedaron
   expuestas en la base anterior en texto plano, no reutilizarlas.
   Marcar "Auto Confirm User" en ambas.

Instrucciones detalladas con capturas de dónde hacer clic: `DEPLOY.md`,
sección 7.

## Cómo se sabe que quedó bien

- Podés iniciar sesión en el dashboard con el email/contraseña nuevos de
  cada quien (la pantalla se ve igual que antes: elegir usuario + clave).
- Una consulta a cualquier tabla con SOLO la anon key (sin sesión iniciada)
  devuelve vacío o error de permisos — hay un ejemplo de fetch para probarlo
  al final de `auth-migration.sql`.

## Qué cambió para quien usa la app día a día

- Nada visualmente: se sigue eligiendo el nombre de un desplegable y
  escribiendo la clave.
- La clave de cada quien ya no se cambia desde Administrativo → Usuarios y
  permisos (se sacó ese campo) — se gestiona desde Supabase Authentication
  por ahora. Un "cambiar mi contraseña" self-service dentro de la app es un
  agregado chico para más adelante, si hace falta.
- Crear un usuario nuevo sigue siendo dos pasos: el botón "Agregar usuario"
  en la app (perfil + permisos) y, aparte, crearlo en Supabase Authentication
  con el mismo email para que pueda iniciar sesión.

## Después de esto (fase separada, no urgente)

Encriptar los Accesos de clientes (las contraseñas de las cuentas de tus
clientes que guardás en ese módulo) para que ni siquiera queden legibles en
la tabla. Con Auth ya activo, esto pasa a ser viable de forma correcta
(antes no lo era: cualquier clave de cifrado en el frontend sin un login
real detrás es decorativa). Se decide cuándo encararlo.

## Actualización — reseteo de clave por correo (ya implementado)

Se agregó autoservicio de reseteo de clave: en Administrativo → Usuarios y
permisos, botón de llave junto a cada persona → manda un correo con un link
de Supabase para que ella misma elija su clave nueva → al guardarla, entra
directo al dashboard (sin pedir un login aparte). No requiere la
service-role key en ningún momento.

**Paso manual pendiente para que funcione** (ver `DEPLOY.md`, sección 7,
Paso 3): agregar los dominios de la app a Supabase → Authentication → URL
Configuration → Redirect URLs. Sin esto, el correo se manda pero el link no
deja completar el cambio de clave.
