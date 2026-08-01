import { useState, useEffect } from "react";
import { loadGuionCategoriasCustom, persistGuionCategoriasCustom, GUION_CATEGORIAS_CUSTOM_KEY } from "../services/data.service";
import { subscribeKvKey } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";
import { GUION_CATEGORIAS_EXTRA_COLORS } from "../utils/constants";

export function useGuionCategoriasCustom(setAppError) {
  const [custom, setCustom] = useState(null);

  useEffect(() => {
    loadGuionCategoriasCustom().then(setCustom);
  }, []);

  useRealtimeReload(
    (onChange) => subscribeKvKey(GUION_CATEGORIAS_CUSTOM_KEY, onChange),
    () => loadGuionCategoriasCustom().then(setCustom)
  );

  function addCategoria(nombre) {
    const clean = (nombre || "").trim();
    if (!clean) return;
    const list = custom || [];
    if (list.some((c) => c.value.toLowerCase() === clean.toLowerCase())) return; // ya existe, no duplicar
    const color = GUION_CATEGORIAS_EXTRA_COLORS[list.length % GUION_CATEGORIAS_EXTRA_COLORS.length];
    const next = [...list, { value: clean, color }];
    try {
      setCustom(next);
      persistGuionCategoriasCustom(next);
    } catch (e) {
      setAppError("No se pudo agregar la categoría: " + (e && e.message ? e.message : e));
    }
  }

  return { customCategorias: custom || [], addCategoria };
}
