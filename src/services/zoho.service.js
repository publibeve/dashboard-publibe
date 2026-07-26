/**
 * Integración con Zoho WorkDrive (reemplaza la integración de Google Drive).
 *
 * OAuth: esta app es una SPA sin backend, así que se usa el flujo para
 * "Client-based Applications" de Zoho: redirección a accounts.zoho.com con
 * response_type=token; el access token vuelve en el fragmento (#) de la URL.
 * No existe ni se usa Client Secret en este flujo (nunca debe ir en el
 * frontend). El token es POR PERSONA y POR NAVEGADOR (localStorage) — cada
 * quien autoriza con su propia cuenta de Zoho (ceo@ / designer@publibe.net).
 *
 * Carpetas: en vez de crear TODA la estructura de una vez con una bandera
 * "ya creado" (frágil: es exactamente la misma condición de carrera que nos
 * borró los usuarios, y además no cubre clientes nuevos), las carpetas se
 * crean BAJO DEMANDA la primera vez que alguien sube un archivo a esa ruta.
 * El mapa ruta→id se guarda COMPARTIDO en Supabase (kv_store) — no en
 * localStorage — para que el navegador de Ariana no recree carpetas
 * duplicadas que ya creó el de Diego.
 *
 * Carpeta raíz: se crea a mano UNA vez en WorkDrive ("publiBe — Adjuntos"),
 * se comparte ahí mismo con designer@publibe.net, y se pega su ID en el
 * panel de Administrativo. Así el compartir usa la UI oficial de Zoho (dos
 * clics, permisos visibles) en vez de un endpoint de permisos frágil.
 */

import { readJSON, writeJSON } from "./storage.service";

const CLIENT_ID = import.meta.env.VITE_ZOHO_CLIENT_ID || "";
// Cuentas Zoho de otro data center: .eu, .in, etc. (por defecto .com)
const ACCOUNTS_DOMAIN = import.meta.env.VITE_ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";
const API_BASE = "https://www.zohoapis.com/workdrive/api/v1";
const SCOPE = "WorkDrive.files.ALL";

const TOKEN_KEY = "publibe:zoho-token";
const TOKEN_EXPIRY_KEY = "publibe:zoho-token-expiry";
export const ZOHO_ROOT_FOLDER_KEY = "publibe-zoho-root-folder-v1";
export const ZOHO_FOLDER_MAP_KEY = "publibe-zoho-folder-ids-v1";

export function zohoConfigured() {
  return !!CLIENT_ID;
}

/* ---------------- OAuth (flujo implícito con redirección) ---------------- */

export function startZohoAuth() {
  if (!zohoConfigured()) {
    throw new Error("Falta VITE_ZOHO_CLIENT_ID en las variables de entorno (ver DEPLOY.md).");
  }
  const params = new URLSearchParams({
    response_type: "token",
    client_id: CLIENT_ID,
    scope: SCOPE,
    redirect_uri: window.location.origin,
    prompt: "consent",
  });
  // Guardamos a dónde volver (pestaña Administrativo) para retomar tras el redirect.
  sessionStorage.setItem("publibe:zoho-auth-return", "1");
  window.location.href = `${ACCOUNTS_DOMAIN}/oauth/v2/auth?${params.toString()}`;
}

/**
 * Llamar UNA vez al arrancar la app (main.jsx): si la URL trae el token de
 * vuelta de Zoho en el fragmento (#access_token=...), lo guarda y limpia la URL.
 * Devuelve true si acabamos de volver del login de Zoho.
 */
export function handleZohoRedirect() {
  if (!window.location.hash.includes("access_token=")) return false;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("access_token");
  const expiresIn = Number(params.get("expires_in") || 3600);
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
    console.log("✅ Token de Zoho capturado del redirect y guardado");
  } else {
    console.error("❌ Volvimos de Zoho pero sin access_token en el fragmento de la URL");
  }
  // Limpia el token de la URL (que no quede en el historial del navegador).
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return !!token;
}

export function getZohoToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) || 0);
  if (!token || Date.now() > expiry - 60_000) return null;
  return token;
}

export function zohoConnected() {
  return !!getZohoToken();
}

export function clearZohoToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

function authHeaders() {
  const token = getZohoToken();
  if (!token) {
    const e = new Error("La sesión de Zoho venció o no está iniciada. Volvé a conectar en Administrativo.");
    e.code = "NO_TOKEN";
    throw e;
  }
  return { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/vnd.api+json" };
}

/* ---------------- Carpeta raíz (pegada una vez desde Administrativo) ------ */

export async function loadZohoRootFolder() {
  return await readJSON(ZOHO_ROOT_FOLDER_KEY, true, "");
}

export async function persistZohoRootFolder(idOrLink) {
  // Acepta el link completo de WorkDrive o el ID pelado; guarda solo el ID.
  const raw = String(idOrLink || "").trim();
  const m = raw.match(/(?:folders?|file)\/([A-Za-z0-9]+)/);
  const id = m ? m[1] : raw;
  await writeJSON(ZOHO_ROOT_FOLDER_KEY, id, true);
  return id;
}

/* ---------------- Carpetas: crear bajo demanda, mapa compartido ----------- */

export async function createZohoFolder(name, parentId) {
  const res = await fetch(`${API_BASE}/files`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/vnd.api+json" },
    body: JSON.stringify({ data: { attributes: { name, parent_id: parentId }, type: "files" } }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`No se pudo crear la carpeta "${name}" en Zoho (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return { id: json?.data?.id, name };
}

/**
 * Garantiza que exista la ruta completa (ej: "ToyoReyna/Creativos" o
 * "Administrativo/Facturas/MundoFord") bajo la carpeta raíz, creando lo que
 * falte, y devuelve el ID de la carpeta final. El mapa ruta→id vive en
 * kv_store (compartido) para no duplicar carpetas entre dispositivos.
 */
export async function ensureZohoFolderPath(path) {
  const rootId = await loadZohoRootFolder();
  if (!rootId) {
    const e = new Error("Falta configurar la carpeta raíz de Zoho en Administrativo → Zoho WorkDrive.");
    e.code = "NO_ROOT";
    throw e;
  }
  const segments = String(path || "").split("/").map((s) => s.trim()).filter(Boolean);
  let map = (await readJSON(ZOHO_FOLDER_MAP_KEY, true, {})) || {};
  if (typeof map !== "object" || Array.isArray(map)) map = {};

  let parentId = rootId;
  let acc = "";
  for (const seg of segments) {
    acc = acc ? `${acc}/${seg}` : seg;
    if (map[acc]) {
      parentId = map[acc];
      continue;
    }
    const folder = await createZohoFolder(seg, parentId);
    map[acc] = folder.id;
    parentId = folder.id;
    await writeJSON(ZOHO_FOLDER_MAP_KEY, map, true);
  }
  return parentId;
}

/* ---------------- Subida con progreso ------------------------------------ */

/**
 * Sube un archivo a la carpeta indicada. `onProgress` recibe 0–100.
 * Devuelve { driveId, nombre, url } listo para guardar como adjunto del
 * registro (que persiste en Supabase con la tarea/factura/gasto).
 */
export function uploadZohoFile(folderId, file, onProgress) {
  const token = getZohoToken();
  if (!token) {
    const e = new Error("La sesión de Zoho venció o no está iniciada. Volvé a conectar en Administrativo.");
    e.code = "NO_TOKEN";
    return Promise.reject(e);
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const params = new URLSearchParams({
      parent_id: folderId,
      filename: file.name,
      "override-name-exist": "false",
    });
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let driveId = "";
        let permalink = "";
        try {
          const json = JSON.parse(xhr.responseText);
          const first = Array.isArray(json?.data) ? json.data[0] : json?.data;
          const attrs = first?.attributes || {};
          // La respuesta de upload de WorkDrive a veces trae los detalles como
          // string JSON dentro de attributes["File INFO"] — se parsea defensivo.
          let info = attrs;
          if (typeof attrs["File INFO"] === "string") {
            try { info = JSON.parse(attrs["File INFO"]); } catch (e2) { /* se queda con attrs */ }
          }
          driveId = info.resource_id || info.RESOURCE_ID || first?.id || "";
          permalink = info.Permalink || info.permalink || "";
        } catch (e) { /* respuesta inesperada: se usa el fallback de abajo */ }
        resolve({
          driveId,
          nombre: file.name,
          url: permalink || (driveId ? `https://workdrive.zoho.com/file/${driveId}` : ""),
        });
      } else {
        reject(new Error(`La subida a Zoho falló (${xhr.status}): ${String(xhr.responseText || "").slice(0, 200)}`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Error de conexión subiendo a Zoho. Verificá tu internet.")));
    xhr.open("POST", `${API_BASE}/upload?${params.toString()}`);
    xhr.setRequestHeader("Authorization", `Zoho-oauthtoken ${token}`);
    xhr.setRequestHeader("Accept", "application/vnd.api+json");
    const form = new FormData();
    form.append("content", file, file.name);
    xhr.send(form);
  });
}

/* ---------------- Vista previa y eliminación ------------------------------ */

/**
 * Descarga el contenido de un archivo de WorkDrive CON el token (los enlaces
 * de WorkDrive no se pueden incrustar directo en <img>/<iframe>: son páginas
 * protegidas por la sesión de Zoho, no la imagen en sí — por eso el modal
 * decía "no se pudo cargar la vista previa"). Devuelve un blob URL local,
 * que sí se puede mostrar en el modal de imagen o abrir como PDF.
 */
export async function fetchZohoFileBlobUrl(driveId) {
  const token = getZohoToken();
  if (!token) {
    const e = new Error("La sesión de Zoho venció. Volvé a conectar en Administrativo.");
    e.code = "NO_TOKEN";
    throw e;
  }
  const candidates = [
    `${API_BASE}/download/${driveId}`,
    `https://download.zoho.com/v1/workdrive/download/${driveId}`,
  ];
  let lastError = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
      if (!res.ok) { lastError = new Error(`Descarga falló (${res.status})`); continue; }
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("No se pudo descargar el archivo de Zoho.");
}

/**
 * Manda un archivo de WorkDrive a la papelera de Zoho (status 51). Se usa la
 * papelera y no el borrado definitivo a propósito: si alguien elimina un
 * adjunto por error, se puede recuperar desde la papelera de WorkDrive.
 */
export async function trashZohoFile(driveId) {
  const res = await fetch(`${API_BASE}/files/${driveId}`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/vnd.api+json" },
    body: JSON.stringify({ data: { attributes: { status: 51 }, type: "files" } }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`No se pudo eliminar el archivo en Zoho (${res.status}): ${text.slice(0, 200)}`);
  }
  return true;
}
