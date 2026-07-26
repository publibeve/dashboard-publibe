# Deploy: Supabase + Netlify + dominio publibe.net

## 1. Supabase — crear las tablas

1. Entrá a tu proyecto en [supabase.com](https://supabase.com) → **SQL Editor** → **New query**.
2. Pegá todo el contenido de `supabase/schema.sql` (está en este mismo repo) → **Run**.
   - Es seguro correrlo más de una vez.
   - Si `users`, `clients`, `tasks`, `notes`, `payments` o `invoices` **ya existían** con otras columnas, avisame la estructura real antes de correr esto — el código de `src/services/*.js` espera las columnas que están comentadas en el `.sql`.
3. Andá a **Project Settings → API** y copiá:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public key** (la clave pública, NO la `service_role` — esa nunca va en el frontend).

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

## 6. Gemini y Google Drive

- **Gemini**: no necesita nada especial para el deploy — la clave se guarda en Supabase (`kv_store`, compartida por todo el equipo) desde la propia app, en Administrativo.
- **Google Drive**: el botón de "conectar Drive" en el original es una **maqueta visual** (guarda un `true/false`, no hace OAuth real). Si querés que sea una conexión real con subida/lectura de archivos de Drive, es un desarrollo aparte (OAuth 2.0 + Google Drive API) — avisame si querés que lo armemos como siguiente paso.

## 7. Nota de seguridad (leer antes de publicar con datos reales)

La app sigue usando un login por PIN comparado en el navegador (no Supabase Auth). Las políticas de RLS del `schema.sql` dejan la base **abierta a la clave anónima** para que la app funcione igual que antes — el nivel de seguridad es el mismo que ya tenía (el PIN es una barrera de interfaz, no de base de datos). Si vas a manejar datos sensibles de clientes reales y querés que el PIN sea también una barrera a nivel de base de datos, la mejora natural es migrar a Supabase Auth; puedo armarlo en una próxima vuelta sin tocar el resto de la app.
