import { useState, useEffect, useRef } from "react";
import {
  X,
  Trash2,
  Send,
  AlertTriangle,
  Check,
  Sparkles,
  Copy,
  Mic,
} from "lucide-react";
import { copyToClipboard, renderMarkdownLite } from "../../utils/helpers";

export function AIChatButton({ onClick, hasNewIndicator }) {
  return (
    <button type="button" className="ai-fab" onClick={onClick} title="Asistente IA">
      <Sparkles size={20} />
      {hasNewIndicator && <span className="ai-fab-dot" />}
    </button>
  );
}

export function AIChatPanel({ messages, sending, error, onSend, onClose, onClear }) {
  const [draft, setDraft] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const listRef = useRef(null);
  const recognitionRef = useRef(null);
  const draftBeforeVoiceRef = useRef("");

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  function submit() {
    if (!draft.trim() || sending) return;
    onSend(draft);
    setDraft("");
  }

  function handleCopy(i, text) {
    copyToClipboard(text, () => {
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex((c) => (c === i ? null : c)), 1500);
    });
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceUnsupported(true);
      setTimeout(() => setVoiceUnsupported(false), 3000);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "es-VE";
    recognition.continuous = true;
    recognition.interimResults = true;
    draftBeforeVoiceRef.current = draft ? draft + " " : "";

    recognition.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += chunk + " ";
        else interimText += chunk;
      }
      setDraft(draftBeforeVoiceRef.current + finalText + interimText);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-head">
        <span className="ai-chat-title"><Sparkles size={15} /> Asistente publiBe</span>
        <div className="ai-chat-head-actions">
          {messages.length > 0 && (
            <button type="button" className="icon-btn subtle" onClick={onClear} title="Limpiar conversación"><Trash2 size={13} /></button>
          )}
          <button type="button" className="icon-btn subtle" onClick={onClose}><X size={16} /></button>
        </div>
      </div>

      <div className="ai-chat-messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="ai-chat-empty">
            <Sparkles size={22} />
            <p>Pregúntame lo que sea — desde ideas para un post hasta "¿cuánto llevo pagado este mes?"</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div className={"ai-msg-wrap" + (m.role === "user" ? " ai-msg-wrap-user" : " ai-msg-wrap-assistant")} key={i}>
            <div className={"ai-msg" + (m.role === "user" ? " ai-msg-user" : " ai-msg-assistant")}>
              {m.role === "assistant" ? (
                <span dangerouslySetInnerHTML={{ __html: renderMarkdownLite(m.text) }} />
              ) : (
                m.text
              )}
            </div>
            <button
              type="button" className="ai-msg-copy" onClick={() => handleCopy(i, m.text)}
              title="Copiar"
            >
              {copiedIndex === i ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
            </button>
          </div>
        ))}
        {sending && (
          <div className="ai-msg ai-msg-assistant ai-msg-typing">
            <span></span><span></span><span></span>
          </div>
        )}
      </div>

      {error && <div className="form-error ai-chat-error"><AlertTriangle size={13} /> {error}</div>}
      {voiceUnsupported && (
        <div className="form-error ai-chat-error"><AlertTriangle size={13} /> Tu navegador no soporta dictado por voz — funciona en Chrome y Edge.</div>
      )}

      <div className="ai-chat-input-row">
        <button
          type="button"
          className={"icon-btn ai-chat-mic" + (listening ? " ai-chat-mic-active" : "")}
          onClick={toggleVoice}
          title={listening ? "Detener dictado" : "Dictar por voz"}
        >
          <Mic size={15} />
        </button>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={listening ? "Escuchando…" : "Escribe tu pregunta…"}
          rows={1}
        />
        <button type="button" className="btn-primary ai-chat-send" onClick={submit} disabled={sending || !draft.trim()}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
