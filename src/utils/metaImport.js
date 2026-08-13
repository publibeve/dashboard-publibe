import * as XLSX from "xlsx";

/**
 * Parsea un reporte exportado de Meta Ads Manager (.xlsx) y devuelve un
 * grupo por cada bloque campaña/semana detectado, con su desglose por
 * anuncio.
 *
 * Por qué se agrupa por "All" secuencial y NO por nombre de campaña: en un
 * archivo real de Diego (ToyoMercedes, jul-ago 2026), el mismo nombre de
 * campaña ("VARIOS UTL - 20/07") aparece en el archivo como DOS bloques
 * distintos, con "All" y desgloses diferentes cada uno — agrupar por
 * nombre los hubiera mezclado en uno solo, sumando mal. Cada fila "All"
 * SIEMPRE arranca un bloque nuevo; todo lo que sigue (hasta el próximo
 * "All") le pertenece a ese bloque.
 */
export async function parseMetaExcelFile(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  // "Raw Data Report" es la hoja plana (nombre de campaña repetido en cada
  // fila) — mucho más simple de leer que "Formatted Report", que solo trae
  // el nombre en la primera fila del grupo y deja el resto vacío (fusión
  // visual, no dato real). Si algún archivo no trae esa hoja con ese
  // nombre exacto, se cae a la primera hoja como resguardo.
  const sheetName = wb.SheetNames.find((n) => /raw data/i.test(n)) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("El archivo no tiene ninguna hoja legible.");

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
  const headerIdx = rows.findIndex((r) => r.some((c) => String(c).trim() === "Nombre de la campaña"));
  if (headerIdx === -1) {
    throw new Error('No se encontró la columna "Nombre de la campaña" — ¿es un reporte de Meta Ads exportado a Excel?');
  }
  const headers = rows[headerIdx].map((h) => String(h).trim());
  const col = (name) => headers.indexOf(name);
  const colCampana = col("Nombre de la campaña");
  const colAnuncio = col("Nombre del anuncio");
  const colMonto = col("Importe gastado (USD)");
  const colInicio = col("Inicio del informe");
  if (colCampana === -1 || colAnuncio === -1 || colMonto === -1) {
    throw new Error("Faltan columnas esperadas en el archivo (Nombre de la campaña / Nombre del anuncio / Importe gastado).");
  }

  const dataRows = rows.slice(headerIdx + 1).filter((r) => (r[colCampana] || "").trim() || (r[colAnuncio] || "").trim());
  if (!dataRows.length) throw new Error("El archivo no tiene filas de datos.");

  // Año del período del reporte — el nombre de campaña solo trae día/mes
  // ("20/07"), nunca el año, así que se lo toma de la fecha de inicio del
  // informe (columna real del archivo, no del nombre del archivo).
  const primeraFechaInforme = dataRows.map((r) => r[colInicio]).find(Boolean);
  const anioReporte = primeraFechaInforme ? Number(String(primeraFechaInforme).slice(0, 4)) : new Date().getFullYear();

  const grupos = [];
  let actual = null;
  let ultimaCampana = "";
  for (const r of dataRows) {
    const campana = (r[colCampana] || "").trim() || ultimaCampana;
    ultimaCampana = campana || ultimaCampana;
    const anuncio = (r[colAnuncio] || "").trim();
    const monto = Math.round(Number(r[colMonto] || 0) * 100) / 100;
    if (!anuncio) continue;
    if (anuncio.toLowerCase() === "all") {
      actual = { campana, montoTotal: monto, items: [], fecha: extraerFechaDeCampana(campana, anioReporte) };
      grupos.push(actual);
    } else if (actual) {
      actual.items.push({ concepto: anuncio, monto });
    }
    // Fila de anuncio sin ningún "All" antes en el archivo — no debería
    // pasar en un export real de Meta, pero si pasa, se ignora en vez de
    // reventar (no hay a qué grupo asignarla).
  }

  return grupos;
}

function extraerFechaDeCampana(nombreCampana, anio) {
  // Busca un patrón día/mes tipo "20/07" en cualquier parte del nombre.
  const m = String(nombreCampana || "").match(/(\d{1,2})\s*\/\s*(\d{1,2})(?!\d)/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const iso = `${anio}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  // Validar que la fecha realmente exista (ej. no "31/02").
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime()) || d.getUTCDate() !== dd || d.getUTCMonth() + 1 !== mm) return null;
  return iso;
}
