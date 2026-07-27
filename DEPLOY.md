# Deploy: Supabase + Netlify + dominio publibe.net

## 1. Supabase — crear las tablas

1. Entrá a tu proyecto en [supabase.com](https://supabase.com) → **SQL Editor** → **New query**.
2. Pegá todo el contenido de `supabase/schema.sql` (está en este mismo repo) → **Run**.
   - Es seguro correrlo más de una vez.
   - Si `users`, `clients`, `tasks`, `notes`, `payments` o `invoices` **ya existían** con otras columnas, avisame la estructura real antes de correr esto — el código de `src/services/*.js` espera las columnas que están comentadas en el `.sql`.
3. Andá a **Project Settings → API** y copiá:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public key** (la clave pública, NO la `service_role` — esa nunca va en el frontend).
4. Después de esto, corré también `supabase/auth-migration.sql` (sección 7, más abajo) — es el que activa el login real y cierra el acceso a solo usuarios autenticados. Si es un proyecto nuevo, se puede correr `schema.sql` y `auth-migration.sql` seguidos, uno después del otro.

## 2. Variables de entorno en local

```bash
cp .env.example .env.local
```

Abrí `.env.local` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con lo que copiaste en el paso 1. `VITE_GEMINI_API_KEY` es opcional (podés dejarla vacía y cargar la clave de Gemini desde la app, en Administrativo → Usuarios y permisos → Asistente IA).

```bash
npm install
npm run dev
```

Abrí lo que te muestre la terminal (normalmente `http://localhost:5173`) y probá: crear una tarea, un pago, una nota — deberías verlos aparecer en Supabase → **Table Editor**.

## 3. GitHub

```bash
git add .
git commit -m "Conectar Supabase, preparar deploy en Netlify"
git push
```

## 4. Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → elegí GitHub → el repo `dashboard-publibe`.
2. Netlify va a detectar `netlify.toml` solo (build command `npm run build`, carpeta `dist`) — no hace falta tocar nada ahí.
3. **Antes de darle Deploy**, o después en Site settings → **Environment variables**, agregá las mismas 3 variables de `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY` (opcional)
4. Deploy site. Con cada `git push` a la rama principal, Netlify vuelve a buildear y publicar solo.

## 5. Dominio publibe.net

1. En el sitio ya creado en Netlify → **Domain settings → Add a domain** → escribí `publibe.net` → Netlify te va a ofrecer dos caminos:
   - **Opción A (más simple): usar los nameservers de Netlify.** Netlify te da 4 nameservers; los cargás en el panel de tu registrador de dominio (donde compraste `publibe.net`) reemplazando los que tenga puestos. Netlify maneja todo el DNS (y el certificado HTTPS) automáticamente. Tarda de unos minutos a ~24-48h en propagar.
   - **Opción B: dejar el DNS donde está.** Agregás en tu registrador:
     - Un registro **A** para `publibe.net` apuntando a `75.2.60.5` (la IP de balanceo de Netlify), o
     - Un registro **CNAME** para `www.publibe.net` apuntando a `TU-SITIO.netlify.app`.
     - Netlify te muestra los valores exactos para tu caso en esa misma pantalla.
2. Una vez que Netlify detecta el DNS correcto, activa el certificado SSL solo (Let's Encrypt) — no hay que hacer nada más.
3. Decidí si querés que `publibe.net` sea el dominio principal y `www.publibe.net` redirija (o al revés) — se configura en la misma pantalla de Domain settings.

Si querés, en el momento de hacer este paso puedo ayudarte a clickear Netlify/tu panel de DNS en vivo usando el navegador — para eso necesito que tengas la sesión iniciada en tu Chrome.

## 7. Supabase Auth — login real (hecho, requiere 2 pasos manuales tuyos)

El login dejó de ser un PIN comparado en el navegador: ahora usa Supabase Auth
de verdad. Sin estos 2 pasos manuales (que Claude no puede hacer por vos —
requieren tu cuenta de Supabase), nadie va a poder entrar al dashboard.

### Corrección posterior — pantalla de login congelada + errores 401/42501

Después del primer deploy de esta migración, el primer login mostraba la
pantalla congelada y la consola llenaba de errores 401/42501 en `kv_store`,
`tasks`, `notes`, `payments`, `invoices` y `clients`. Causa: los hooks de
datos de la app (tareas, notas, pagos, facturas, gastos, clientes, etc.)
siempre empezaron a leer/escribir contra Supabase apenas la app monta —
incluso mientras se ve la pantalla de login, antes de que exista sesión. Con
RLS abierta a "anon" (como era antes) eso nunca importó; al cerrar las
políticas a "solo autenticados", esos primeros intentos empezaron a chocar
contra RLS. **Ya está corregido en el código** (`src/services/supabaseClient.js`
exporta `waitForSession()`, que los puntos de entrada compartidos —
`syncTable`, `loadObjectsTable`, `readJSON`/`writeJSON`/`deleteKey`,
`loadCustomClients` — esperan antes de hablar con Supabase). No requiere
correr SQL de nuevo ni ningún paso manual adicional; solo actualizar el
código a la versión más reciente.

### Paso 1 — Correr el SQL de migración

Supabase → SQL Editor → New query → pegar todo `supabase/auth-migration.sql`
→ Run. Esto: quita la columna `clave` (ya no se usa), agrega una vista de
solo-lectura para el selector de login, y cierra las políticas de las 7
tablas a **solo usuarios autenticados** (antes eran legibles por cualquiera
con la clave pública del sitio).

### Paso 2 — Crear a Diego y Ariana en Supabase Authentication

Supabase → **Authentication** → Users → **Add user** → **Create new user**,
una vez por persona:

| Nombre | Email | Contraseña |
|---|---|---|
| Diego Toro | `ceo@publibe.net` | elegí una nueva — la `198913` quedó expuesta en la base vieja, no la reuses |
| Ariana Martínez | `designer@publibe.net` | elegí una nueva — la anterior también quedó expuesta |

Marcá **"Auto Confirm User"** al crearlos (si no, Supabase espera que confirmen
por email, y no tenemos un flujo de correo configurado para eso).

Estos emails tienen que coincidir EXACTO con los de la tabla `users` (`nombre`
+ `email` + `permisos`, que sigue viviendo ahí para el perfil dentro de la
app) — ya vienen así configurados en el código (son los mismos que usás para
Zoho WorkDrive).

### Después de estos 2 pasos

- El botón "Agregar usuario" en Administrativo sigue creando el perfil dentro
  de la app (nombre, permisos, foto) — pero para que esa persona pueda
  ENTRAR, hay que repetir el Paso 2 con su email.
- Cambiar la propia contraseña: por ahora se hace desde Supabase
  Authentication (Users → esa persona → "Send password recovery" o
  actualizarla ahí directo). Un self-service "cambiar mi contraseña" dentro
  de la app es un agregado chico para cuando quieras.
- **Verificación de que quedó bien cerrado:** abrí una pestaña de incógnito
  (sin haber iniciado sesión en el dashboard) y en la consola del navegador
  corré el fetch de ejemplo que está al final de `auth-migration.sql` — tiene
  que devolver vacío o un error de permisos, nunca los usuarios reales.

### Paso 3 — Reseteo de clave por correo (nuevo — 1 paso manual más)

En "Administrativo → Usuarios y permisos" ahora hay un botón (ícono de
llave) para mandarle a alguien un correo de "recuperar clave" —
sin que vos tengas que entrar a Supabase. Para que funcione:

Supabase → **Authentication → URL Configuration → Redirect URLs** → agregar
(si no están ya, de la integración de Zoho):
- `https://publibedashboard.netlify.app`
- `https://publibe.net`
- `https://www.publibe.net`
- `http://localhost:5173` (desarrollo local)

**Por qué hace falta:** el link que Supabase manda por correo vuelve a la
app con `redirectTo` apuntando a uno de estos dominios — si la URL no está
en esta lista blanca, Supabase rechaza el link y la persona no puede llegar
a elegir su clave nueva. Sin este paso, el botón "manda" el correo pero el
link no funciona.

No hace falta configurar nada más (la plantilla de correo por defecto de
Supabase ya sirve) — el plan gratuito de Supabase limita el envío a pocos
correos por hora; para un equipo de 2 personas no es un problema.

### Paso 4 — Rol/descripción editable en el sidebar (nuevo)

Correr `supabase/add-rol-label.sql` (agrega una columna a `users`, vacía por
defecto — no rompe nada existente). Después, en "Usuarios y permisos" cada
persona tiene un campo para el texto que aparece debajo de su nombre en la
tarjeta del sidebar (por defecto sigue siendo "Administrador"/"Miembro del
equipo" si se deja vacío).

## 8. Gemini y Google Drive

- **Gemini**: no necesita nada especial para el deploy — la clave se guarda en Supabase (`kv_store`, compartida por todo el equipo) desde la propia app, en Administrativo.
- **Google Drive**: reemplazado por Zoho WorkDrive (ver sección más abajo) — Google Drive ya no se usa en la app.

## Zoho WorkDrive (integración real) — configurar


La integración usa el flujo de SPA de Zoho ("Client-based Applications"):
redirección + token en el navegador, **sin** Client Secret (no se usa ni se
copia a ningún lado). Pasos, con la cuenta ceo@publibe.net:

1. Entrá a [api-console.zoho.com](https://api-console.zoho.com) → **Add Client**
   → **Client-based Applications**.
2. Client Name: `publiBe Dashboard`. Homepage URL: `https://publibe.net`.
   **Authorized Redirect URIs** (los tres, más localhost para desarrollo):
   - `https://publibedashboard.netlify.app`
   - `https://publibe.net`
   - `https://www.publibe.net`
   - `http://localhost:5173`
3. Copiá el **Client ID** → ponelo como `VITE_ZOHO_CLIENT_ID` en `.env.local`
   y en Netlify → Environment variables → redeploy.
4. En [workdrive.zoho.com](https://workdrive.zoho.com), creá una carpeta
   llamada **publiBe — Adjuntos**, compartila con `designer@publibe.net`
   (rol Editor) desde la propia UI de WorkDrive, copiá el enlace de la
   carpeta, y pegalo en el dashboard: Administrativo → Zoho WorkDrive →
   "Carpeta raíz" → Guardar. (Se guarda compartido en Supabase: se configura
   una sola vez para todo el equipo.)
5. Administrativo → **Conectar Zoho WorkDrive** → autorizar con tu cuenta.
   Ariana hace lo mismo con la suya la primera vez que use adjuntos.

Después de eso, en cualquier modal con adjuntos: **"Subir a Zoho Drive"** abre
el selector de archivos de tu compu, sube con barra de progreso a la carpeta
correcta (`{cliente}/Creativos`, `Administrativo/Facturas/{empresa}`, etc. —
las carpetas se crean solas la primera vez), y el adjunto queda vinculado al
registro con su enlace real de WorkDrive.

Notas:
- El token de Zoho dura 1 hora; cuando vence, el botón de Administrativo pasa a
  "Volver a conectar" y se pide de nuevo con un clic.
- Si la cuenta Zoho estuviera en otro data center (.eu, .in), configurá
  `VITE_ZOHO_ACCOUNTS_DOMAIN` (ver .env.example).
