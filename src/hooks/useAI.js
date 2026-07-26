import { useState, useEffect } from "react";
import {
  loadGeminiKey, persistGeminiKey, loadAIChatHistory, persistAIChatHistory,
  buildAIDataContext, askGemini, GEMINI_KEY_STORAGE, AI_CHAT_HISTORY_KEY,
} from "../services/ai.service";
import { subscribeKvKey } from "../services/supabaseClient";
import { onLocalStorageChange } from "../services/storage.service";
import { useRealtimeReload } from "./useRealtimeSync";

/**
 * Estado y envío de mensajes del panel de chat con el asistente IA.
 * `sendAIMessage` recibe el texto y un `dataBundle` (armado en App.jsx con los
 * datos actuales de tareas/pagos/notas/etc.) para poder responder con cifras reales.
 */
export function useAI(logActivity) {
  const [geminiKey, setGeminiKey] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiSending, setAiSending] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    loadGeminiKey().then((k) => setGeminiKey(k));
    loadAIChatHistory().then((h) => setAiMessages(h));
  }, []);

  // La clave de Gemini es compartida por todo el equipo (kv_store): si alguien
  // la cambia desde otra pestaña/computadora, esta se actualiza sola.
  useRealtimeReload(
    (onChange) => subscribeKvKey(GEMINI_KEY_STORAGE, onChange),
    () => loadGeminiKey().then((k) => setGeminiKey(k))
  );

  // El historial del chat es local del dispositivo (localStorage) — se
  // sincroniza entre pestañas del mismo navegador con el evento "storage".
  useEffect(() => {
    return onLocalStorageChange(AI_CHAT_HISTORY_KEY, (value) => setAiMessages(value || []));
  }, []);

  function saveGeminiKey(key) {
    setGeminiKey(key);
    persistGeminiKey(key);
    if (logActivity) logActivity("Se actualizó la clave del asistente IA");
  }

  async function sendAIMessage(text, dataBundle) {
    if (!text.trim()) return;
    if (!geminiKey) {
      setAiError('Falta configurar la clave de Gemini. Ve a Administrativo → Usuarios y permisos → Asistente IA.');
      return;
    }
    setAiError("");
    const userMsg = { role: "user", text: text.trim() };
    const nextMessages = [...aiMessages, userMsg];
    setAiMessages(nextMessages);
    persistAIChatHistory(nextMessages);
    setAiSending(true);
    try {
      const dataContext = buildAIDataContext(dataBundle);
      const reply = await askGemini(geminiKey, aiMessages, userMsg.text, dataContext);
      const withReply = [...nextMessages, { role: "assistant", text: reply }];
      setAiMessages(withReply);
      persistAIChatHistory(withReply);
    } catch (e) {
      setAiError("No se pudo contactar a Gemini: " + (e && e.message ? e.message : e));
    } finally {
      setAiSending(false);
    }
  }
  function clearAIChat() {
    setAiMessages([]);
    persistAIChatHistory([]);
  }

  return {
    geminiKey, saveGeminiKey, aiMessages, aiSending, aiError,
    showAIChat, setShowAIChat, sendAIMessage, clearAIChat,
  };
}
