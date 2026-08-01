import {
  Type,
} from "lucide-react";
import { fmtBs, fmtDate, fmtMonto } from "../utils/helpers";
import { plainLinesFromHtml } from "../utils/richTextEditor";
import { readJSON, writeJSON } from "./storage.service";

export const GEMINI_KEY_STORAGE = "publibe-gemini-key-v1";

export const AI_CHAT_HISTORY_KEY = "publibe-ai-chat-v1";

export async function loadGeminiKey() {
  return await readJSON(GEMINI_KEY_STORAGE, true, "");
}

export async function persistGeminiKey(key) {
  await writeJSON(GEMINI_KEY_STORAGE, key, true);
}

export async function loadAIChatHistory() {
  return await readJSON(AI_CHAT_HISTORY_KEY, false, []);
}

export async function persistAIChatHistory(msgs) {
  await writeJSON(AI_CHAT_HISTORY_KEY, msgs, false);
}

export function buildAIDataContext({ selectedClient, tasks, payments, inversiones, debts, posts, notes, tareasGenerales, invoices, expenses, canSeeAdmin, canSeeMontos = false }) {
  // Sin el permiso "Ver montos de inversión y facturación", el asistente NO
  // debe poder decir cifras de Pagos publicitarios / Inversión por semana
  // aunque se las pidan directo — no alcanza con ocultarlas en la UI si el
  // contexto que le mandamos a Gemini igual las tiene. Se enmascaran ACÁ,
  // antes de armar el texto, para que sea imposible que el modelo las repita.
  const mMonto = (v) => (canSeeMontos ? fmtMonto(v) : "(oculto — el usuario no tiene permiso para ver montos)");
  const mBs = (v) => (canSeeMontos ? fmtBs(v) : "(oculto)");
  const scope = selectedClient === "__ALL__" ? null : selectedClient;
  const inScope = (arr) => (arr || []).filter((x) => !scope || x.empresa === scope);
  const t = inScope(tasks);
  const pay = inScope(payments);
  const inv = inScope(inversiones);
  const deb = inScope(debts);
  const po = inScope(posts);
  const no = inScope(notes);
  const tg = tareasGenerales || []; // no están ligadas a un cliente

  const totalInvertido = inv.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalPagado = pay.reduce((s, p) => s + Number(p.monto || 0), 0);
  const totalPendiente = deb.reduce((s, d) => s + Number(d.monto || 0), 0);
  const porEstado = {};
  t.forEach((x) => { porEstado[x.estado] = (porEstado[x.estado] || 0) + 1; });

  const lines = [];
  lines.push(`Vista actual: ${scope || "Todas las cuentas"}.`);
  lines.push(
    "Instrucción: abajo tienes el detalle completo, con fechas, de tareas, pagos, inversión publicitaria y " +
    "publicaciones. Si te preguntan por un mes, semana o periodo específico, filtra y suma tú mismo los " +
    "movimientos con esas fechas — no te limites a los totales acumulados generales."
  );

  lines.push(`Tareas (Creativos) — TOTALES acumulados: ${t.length} en total. Por estado: ${JSON.stringify(porEstado)}.`);
  lines.push(`Pagos publicitarios — TOTALES acumulados: ${mMonto(totalPagado)} pagado, ${mMonto(totalInvertido)} invertido, ${mMonto(totalPendiente)} pendiente.`);
  if (deb.length) lines.push(`Pendientes por pagar: ${deb.map((d) => `${d.concepto} (${mMonto(d.monto)})`).join("; ")}.`);

  // Tareas (Creativos): detalle completo con fechas y responsable, no solo las últimas.
  if (t.length) {
    const tareasLines = t.slice(-60).map((x) =>
      `- "${x.titulo}" (${x.empresa}, ${x.estado}, asignada a ${x.asignado || "sin asignar"}, solicitada ${x.fechaSolicitud || "?"}, entrega ${x.fechaEntrega || "sin fecha"})`
    );
    lines.push(`Detalle de tareas de Creativos (${t.length} en total${t.length > 60 ? ", mostrando las 60 más recientes" : ""}):\n${tareasLines.join("\n")}`);
  }

  // Pagos: cada pago con su fecha real, para poder sumar por mes/semana cuando lo pidan.
  if (pay.length) {
    const pagosLines = pay.slice(-80).map((p) =>
      `- ${fmtDate(p.fecha)}: ${mMonto(p.monto)} (${p.metodoPago}${p.moneda === "Bs" ? `, ${mBs(p.montoBs)} a tasa ${p.tasaCambio}` : ""})${p.empresa && !scope ? ` — ${p.empresa}` : ""}`
    );
    lines.push(`Detalle de pagos publicitarios (${pay.length} en total${pay.length > 80 ? ", mostrando los 80 más recientes" : ""}):\n${pagosLines.join("\n")}`);
  }

  // Inversión por semana: incluye la fecha real de cada semana y su desglose si lo tiene.
  if (inv.length) {
    const invLines = inv.slice(-80).map((i) => {
      const desglose = (i.desglose || []).map((d) => `${d.concepto}: ${mMonto(d.monto)}`).join(", ");
      return `- ${fmtDate(i.fecha)} (${i.semana}): ${mMonto(i.monto)}${i.empresa && !scope ? ` — ${i.empresa}` : ""}${desglose ? ` [${desglose}]` : ""}`;
    });
    lines.push(`Detalle de inversión publicitaria por semana (${inv.length} en total${inv.length > 80 ? ", mostrando las 80 más recientes" : ""}):\n${invLines.join("\n")}`);
  }

  // Planificación: cada publicación con su fecha, no solo la cantidad.
  if (po.length) {
    const postLines = po.slice(-60).map((p) =>
      `- ${fmtDate(p.fecha)}${p.hora ? " " + p.hora : ""}: "${p.titulo}" (${p.redSocial}, ${p.formato}${p.empresa && !scope ? `, ${p.empresa}` : ""})`
    );
    lines.push(`Detalle de publicaciones planificadas (${po.length} en total${po.length > 60 ? ", mostrando las 60 más recientes" : ""}):\n${postLines.join("\n")}`);
  } else {
    lines.push("Publicaciones planificadas: ninguna registrada.");
  }

  // Tareas generales del estudio, con detalle completo (antes solo se mandaba el número).
  if (tg.length) {
    const tgLines = tg.slice(-30).map((x) => {
      const detalle = plainLinesFromHtml(x.notas || "").join(" ").slice(0, 200);
      return `- "${x.titulo}" (categoría: ${x.categoria}, asignada a ${x.asignado}, estado: ${x.estado}, fecha ${x.fecha || "sin fecha"}${detalle ? `, detalle: ${detalle}` : ""})`;
    });
    lines.push(`Tareas generales del estudio (${tg.length} en total, mostrando las más recientes):\n${tgLines.join("\n")}`);
  } else {
    lines.push("Tareas generales del estudio: ninguna registrada.");
  }

  // Notas, con su contenido real (antes solo se mandaba la cantidad) para que pueda
  // buscar y resumir lo que el usuario pida, ej. "resume la nota que dice tal cosa".
  if (no.length) {
    const notasLines = no.slice(-30).map((n) => {
      const cuerpo = plainLinesFromHtml(n.cuerpo || "").join(" ").slice(0, 300);
      return `- "${n.titulo || "(sin título)"}" (${n.empresa}): ${cuerpo || "(sin contenido de texto)"}`;
    });
    lines.push(`Notas guardadas (${no.length} en total, mostrando las más recientes):\n${notasLines.join("\n")}`);
  }

  // Datos administrativos (facturas y gastos) — solo se incluyen si quien pregunta
  // tiene el permiso "administrativo". Así el asistente respeta los mismos permisos
  // que ya existen en el dashboard, en vez de filtrar información que ese usuario
  // no podría ver de todas formas abriendo el panel Administrativo.
  if (canSeeAdmin) {
    const facturas = inScope(invoices);
    if (facturas.length) {
      const facLines = facturas.slice(-15).map((f) => {
        const abonado = (f.abonos || []).reduce((s, a) => s + Number(a.monto || 0), 0);
        const ultimoAbono = (f.abonos || []).slice(-1)[0];
        return `- ${f.empresa} — "${f.concepto}": ${fmtMonto(f.monto)} total, ${fmtMonto(abonado)} abonado` +
          (ultimoAbono ? `, último abono ${fmtDate(ultimoAbono.fecha)} por ${fmtMonto(ultimoAbono.monto)}` : ", sin abonos") +
          (f.nota ? `. Nota: ${f.nota}` : "");
      });
      lines.push(`Facturas administrativas (a clientes, incluye honorarios; ${facturas.length} en total):\n${facLines.join("\n")}`);
    } else {
      lines.push("Facturas administrativas: ninguna registrada.");
    }

    const gastos = expenses || [];
    if (gastos.length) {
      const gastoLines = gastos.map((g) => `- ${g.concepto} (${g.categoria}, ${g.frecuencia}): ${fmtMonto(g.monto)}, próximo pago ${g.proximoPago ? fmtDate(g.proximoPago) : "sin fecha"}`);
      lines.push(`Gastos operativos y nómina del estudio (${gastos.length} en total):\n${gastoLines.join("\n")}`);
    }
  } else {
    lines.push("Nota: quien pregunta no tiene permiso para ver información administrativa (facturas, honorarios, gastos operativos) — si te preguntan por eso, indica que no tienes acceso, no lo inventes.");
  }

  return lines.join("\n");
}

export const GEMINI_MODEL_DEFAULT = "gemini-3.1-flash-lite";

export const GEMINI_MODEL_OVERRIDE_KEY = "publibe-gemini-model-v1";

export async function loadGeminiModelOverride() {
  return await readJSON(GEMINI_MODEL_OVERRIDE_KEY, true, "");
}

export async function persistGeminiModelOverride(model) {
  await writeJSON(GEMINI_MODEL_OVERRIDE_KEY, model, true);
}

export async function listGeminiModels(apiKey) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => (m.name || "").replace("models/", ""))
    .filter(Boolean);
}

export async function callGeminiModel(apiKey, model, systemInstruction, contents) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction, contents }),
    }
  );
}

export async function askGemini(apiKey, history, userMessage, dataContext) {
  const systemInstruction = {
    parts: [{
      text: "Eres el asistente de publiBe, una agencia gráfica en Mérida, Venezuela. " +
        "Ayudas con ideas creativas, redacción de copys, y respondes preguntas sobre la información " +
        "del dashboard usando SOLO los datos reales que se te dan a continuación — si algo no está en " +
        "esos datos, dilo claramente en vez de inventar cifras. Responde siempre en español, de forma breve y directa.\n\n" +
        "DATOS ACTUALES DEL DASHBOARD:\n" + dataContext,
    }],
  };
  const contents = [
    ...history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const savedOverride = await loadGeminiModelOverride();
  const primaryModel = savedOverride || GEMINI_MODEL_DEFAULT;

  let res = await callGeminiModel(apiKey, primaryModel, systemInstruction, contents);

  // Google retira/renombra modelos con frecuencia. Si el que tenemos configurado ya no
  // existe para esta clave (404), buscamos en vivo cuál SÍ funciona y reintentamos una
  // sola vez — así la próxima vez que Google cambie de modelo, la app se autocorrige
  // en vez de quedar rota hasta que alguien la actualice a mano.
  if (res.status === 404) {
    const available = await listGeminiModels(apiKey);
    const candidate =
      available.find((m) => /flash-lite/i.test(m) && !/preview|exp/i.test(m)) ||
      available.find((m) => /flash/i.test(m) && !/preview|exp|image|tts|audio/i.test(m)) ||
      available.find((m) => /flash/i.test(m)) ||
      available[0];
    if (candidate && candidate !== primaryModel) {
      const retryRes = await callGeminiModel(apiKey, candidate, systemInstruction, contents);
      if (retryRes.ok) {
        persistGeminiModelOverride(candidate); // recordado para la próxima vez, sin volver a fallar
        res = retryRes;
      } else if (available.length) {
        throw new Error(
          `El modelo configurado ya no existe para tu clave. Modelos que sí responden ahora mismo: ${available.slice(0, 6).join(", ")}.`
        );
      }
    } else if (available.length === 0) {
      throw new Error("Tu clave de Gemini no tiene ningún modelo disponible en este momento (revísala en Google AI Studio).");
    }
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Gemini respondió ${res.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!text) throw new Error("Gemini no devolvió una respuesta.");
  return text;
}

/* ---------------- Importar guiones (extracción estructurada) --------------
 * A diferencia de askGemini (que arma una conversación con el asistente
 * general de la app), esto es una llamada de una sola vez, con su propia
 * instrucción de sistema enfocada solo en extraer datos — nunca usa el
 * contexto del dashboard ni mezcla nada de eso.
 * ---------------------------------------------------------------------- */

function buildImportGuionesPrompt(categoriasDisponibles) {
  return `Sos un asistente que convierte guiones de video escritos en texto libre (formato humano, sin estructura fija — a veces "Gancho/Contexto/Desarrollo/Cierre", a veces "Setup/Complicación/Remate", listas de ideas sueltas, etc.) en JSON estructurado.

El documento puede describir VARIOS guiones (por ejemplo, una pauta completa de un mes, organizada en grupos). Identificá dónde empieza y termina cada guion individual.

Reglas importantes, basadas en cómo se escriben estos documentos en la práctica:
- La categoría muchas veces se declara UNA VEZ por GRUPO de guiones (ej. un encabezado "## GRUPO A" seguido de "Categoría: Contenido de valor"), y aplica a todos los guiones de ese grupo hasta que aparezca otra categoría declarada. No hace falta que cada guion repita su categoría.
- Después del nombre de la categoría puede venir texto extra en la misma línea (notas de estilo, instrucciones) — ignoralo, quedate solo con el nombre de la categoría.
- Si el documento tiene una sección aparte de ideas sueltas, notas generales de producción, o dice explícitamente que "esto no son guiones" — NO generes guiones a partir de esa sección. Extraé solo entradas que tengan estructura real de guion (título + tomas/bloques).
- El campo de tema puede aparecer como "Tema:", "Elenco:", o algo similar — usá lo que mejor describa de qué trata o quién participa en el guion.
- En "Voz/texto", si el documento pone una nota entre paréntesis en vez de una frase literal (ej. "(libre)", "(actuado)", "(sin diálogo)", "(libre, guiada por la comparación en cámara)") — copiá esa nota tal cual como vozTexto, no la trates como vacío: es información real sobre cómo grabar esa parte, aunque no sea una línea fija.
- La etiqueta entre paréntesis junto al número de toma (ej. "Toma 1 (Gancho)", "Toma 2 (Complicación)") es solo contexto narrativo — no hace falta guardarla aparte, se pierde y no importa.

Cada guion tiene:
- "titulo": título corto del guion/reel.
- "duracionEstimada": duración tal cual la escribe el documento (ej: "42s", "45 seg", "1 min"), sin convertir unidades. Si NO se menciona para ese guion en particular, usá null — NUNCA inventes un número.
- "categoria": elegí la que mejor calce de esta lista EXACTA (usá el texto tal cual, no inventes categorías nuevas): ${categoriasDisponibles.join(", ")}. Si ninguna calza bien, usá la primera de la lista.
- "tema": el producto, referencia, tema principal o elenco del guion, en pocas palabras.
- "bloques": lista ordenada de los pasos/tomas del guion, en el mismo orden en que aparecen. Cada bloque tiene:
  - "tipo": "toma" si es algo que se graba directo a cámara (una persona, un lugar, una acción real, actuado o no). "secuenciaVoz" SOLO si el texto describe material visual YA EXISTENTE o externo (un video de stock, un clip de otra fuente, contenido ya grabado) combinado con una voz en off que hay que grabar aparte — es la excepción, no la regla; ante cualquier duda, usá "toma".
  - Si tipo="toma": "planoLugar" (dónde/qué plano, texto corto), "queSeRealiza" (qué pasa visualmente, puede ser más largo), "vozTexto" (la frase, narración, o nota de dirección de esa toma — ver regla de arriba; si de verdad no hay nada, string vacío).
  - Si tipo="secuenciaVoz": "nota" (qué material visual usar, texto corto), "vozTexto" (el texto de la voz en off, o nota de dirección si no hay línea fija).

Devolvé SOLO este JSON, sin texto antes ni después, sin bloques de código markdown, sin comentarios:
{"guiones":[{"titulo":"","duracionEstimada":null,"categoria":"","tema":"","bloques":[{"tipo":"toma","planoLugar":"","queSeRealiza":"","vozTexto":""}]}]}`;
}

export async function extractGuionesFromText(apiKey, texto, categoriasDisponibles) {
  const systemInstruction = { parts: [{ text: buildImportGuionesPrompt(categoriasDisponibles) }] };
  const contents = [{ role: "user", parts: [{ text: texto }] }];
  const savedOverride = await loadGeminiModelOverride();
  const primaryModel = savedOverride || GEMINI_MODEL_DEFAULT;

  // maxOutputTokens generoso a propósito: un documento con 20+ guiones
  // devuelve un JSON grande, y sin esto Gemini podía cortar la respuesta a
  // mitad de camino con su límite por defecto.
  async function call(model) {
    return fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemInstruction, contents, generationConfig: { maxOutputTokens: 16384, temperature: 0.2 } }),
      }
    );
  }

  let res = await call(primaryModel);
  if (res.status === 404) {
    const available = await listGeminiModels(apiKey);
    const candidate =
      available.find((m) => /flash-lite/i.test(m) && !/preview|exp/i.test(m)) ||
      available.find((m) => /flash/i.test(m) && !/preview|exp|image|tts|audio/i.test(m)) ||
      available.find((m) => /flash/i.test(m)) ||
      available[0];
    if (candidate) {
      const retryRes = await call(candidate);
      persistGeminiModelOverride(candidate);
      res = retryRes;
    } else if (available.length === 0) {
      throw new Error("Tu clave de Gemini no tiene ningún modelo disponible en este momento (revísala en Google AI Studio).");
    }
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Gemini respondió ${res.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await res.json();
  const finishReason = data?.candidates?.[0]?.finishReason;
  const rawText = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!rawText) throw new Error("Gemini no devolvió nada — probá de nuevo, o con un documento más corto.");

  // Gemini a veces envuelve el JSON en \`\`\`json ... \`\`\` a pesar de la
  // instrucción — se limpia antes de parsear, por las dudas.
  const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    if (finishReason === "MAX_TOKENS") {
      throw new Error("El documento es demasiado largo para procesarlo de una — probá pegándolo en dos partes más chicas.");
    }
    throw new Error("La IA no devolvió un JSON válido esta vez. Probá de nuevo, o con el documento dividido en partes más chicas.");
  }
  if (!parsed || !Array.isArray(parsed.guiones)) {
    throw new Error("La respuesta de la IA no tuvo la forma esperada. Probá de nuevo.");
  }
  return parsed.guiones;
}
