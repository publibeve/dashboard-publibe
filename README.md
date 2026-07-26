# dashboard-publibe

Refactorización modular de `DashboardApp_by_publiBe.jsx` (11.645 líneas, un solo
archivo) siguiendo el REFACTORING-MAP acordado. Mismo comportamiento y mismo
aspecto visual; el código quedó separado en ~95 archivos organizados por
responsabilidad.

> **Conectado a Supabase.** `window.storage` (API exclusiva de Artifacts de
> Claude) fue reemplazado por Supabase + localStorage. Para poner esto en
> producción (Netlify + dominio propio), seguí **[DEPLOY.md](./DEPLOY.md)**.

## Cómo correrlo

```bash
cp .env.example .env.local   # completá con tus credenciales de Supabase
npm install
npm run dev       # entorno de desarrollo
npm run build     # build de producción (ya validado, compila sin errores)
```

## Estructura

```
src/
├─ components/   # UI por dominio: layout, dashboard, task, notes, admin, ai, common
├─ hooks/        # useTasks, usePayments, useNotes, useInvoices, useExpenses,
│                #   useAccesos, useInversiones, useTareasGenerales, useDebts,
│                #   useAuth, usePermissions, useActivity, useAI, useBackup,
│                #   useClients, useStorage
├─ services/     # auth.service, ai.service, client.service, data.service, storage.service
├─ context/      # AuthContext, ClientsContext, TasksContext, NotesContext,
│                #   PaymentsContext, AppContext (Providers opcionales, ver abajo)
├─ utils/        # constants, helpers, validators, permissions, richTextEditor
├─ styles/       # index/layout/components/task/admin/ai .css
├─ config/       # constants.json
└─ App.jsx       # composición: llama a todos los hooks y arma el layout
```

## Decisiones de diseño (para que no haya sorpresas)

1. **CSS**: el original tenía un solo template string de ~1.860 líneas
   inyectado con `<style>{CSS}</style>`. Se dividió en 6 archivos `.css` reales,
   importados en el mismo orden secuencial del original desde `index.css`
   (vía `@import`), para no alterar la cascada/especificidad. Los estilos del
   chat IA están intercalados en el CSS original junto con los de Overlay/Modal
   genérico — quedaron juntos en `components.css` por la misma razón; `ai.css`
   lo documenta.

2. **`App.jsx` sigue siendo el más grande** (por diseño, no por descuido): es el
   componente raíz que junta los ~16 hooks de dominio, arma el JSX del layout, y
   maneja el puñado de estado que es genuinamente de UI (pestaña activa, filtros,
   qué modal está abierto). Eso es justamente lo que dice el mapa que debía
   hacer ("Importa todos los Contexts, wrapping de la app, lógica de
   inicialización"). Los ~80 estados y handlers del archivo original que SÍ eran
   lógica de dominio (tareas, pagos, notas, facturas, gastos, accesos,
   inversiones, tareas generales, deudas, usuarios, IA, backup, clientes) se
   movieron a sus hooks correspondientes.

3. **Context/**: los Providers están armados y funcionan, pero `App.jsx` sigue
   pasando los datos a los componentes por props explícitas — exactamente como
   el archivo original — en vez de migrar todo a Context. Es la opción de
   menor riesgo: cero componentes cambiaron su forma de recibir datos. Los
   Providers quedan disponibles para pantallas nuevas que prefieran Context.

4. **`services/storage.service.js`**: originalmente era un wrapper opcional,
   sin uso real. Con la migración a Supabase pasó a ser el punto central real:
   `shared:true` → tabla `kv_store` de Supabase, `shared:false` → `localStorage`
   del navegador (para lo que es realmente "de este dispositivo", como la
   sesión actual o el historial local del chat IA). Los dominios con tabla
   propia en Supabase — `users`, `clients`, `tasks`, `notes`, `payments`,
   `invoices` — no pasan por acá, hablan directo con esas tablas (ver
   `supabaseClient.js`: `syncTable`/`loadObjectsTable`/`syncObjectsTable`).
   Detalle completo del reparto tabla-vs-kv_store en `DEPLOY.md` y
   `supabase/schema.sql`.

5. **`utils/validators.js`**: el original no tenía validadores centralizados
   (cada modal valida sus campos inline). Se agregaron dos validadores
   genéricos reales; el resto de la validación sigue donde estaba, para no
   tocar el comportamiento de cada formulario.

6. **`CLIENTES`**: sigue siendo, como en el original, un arreglo mutable a
   nivel de módulo (no un estado de React). Se exporta desde
   `utils/constants.js` y se muta in-place (`.splice(...)`) en vez de
   reasignarse, porque los "named imports" de ES modules son bindings de solo
   lectura — no se puede hacer `CLIENTES = [...]` desde otro archivo. El efecto
   visual es idéntico; `clientsBump` sigue forzando el re-render igual que antes.

## Validación hecha

- El archivo original se procesó con un extractor que identificó las 244
  piezas de código de nivel superior (funciones, componentes, constantes) y
  las movió a su archivo correspondiente sin reescribir su lógica interna.
- `npm run build` corre limpio (Vite + Rollup), lo que confirma que todos los
  imports/exports entre los ~95 archivos están bien resueltos y no hay errores
  de sintaxis.
- Lo que **no** se pudo validar en este entorno: pruebas manuales click-por-click
  en el navegador. Recomiendo darle una pasada visual completa (crear/editar
  tarea, pago, nota, factura, etc., y confirmar el chat IA y el backup) antes
  de reemplazar el archivo único en producción.
