import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

// Gelembung chat bersama. `me` = "student" | "admin"
export default function ChatThread({ messages, me, onSend, placeholder = "Tulis pesan…", disabled }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length]);

  const submit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await onSend(body);
      setText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 space-y-2 py-3 overflow-y-auto" aria-live="polite">
        {messages.map((m) => {
          const mine = m.sender === me;
          return (
            <div key={m.id} className={`flex animate-fade-up ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-4 py-2.5 border-2 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${mine ? "bg-brand border-edge text-on-brand font-bold rounded-br-md" : "bg-soft border-line text-fg rounded-bl-md"}`}>
                {m.body}
                <span className={`block mt-1 text-[10px] font-semibold ${mine ? "text-white/75" : "text-fg-4"}`}>
                  {new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form onSubmit={submit} className="flex items-end gap-2 pt-3 border-line border-t-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 1024) submit(e); }}
          rows={1}
          maxLength={2000}
          disabled={disabled}
          placeholder={placeholder}
          className="field flex-1 max-h-32 resize-none"
        />
        <button type="submit" disabled={!text.trim() || busy || disabled} aria-label="Kirim" className="place-items-center grid bg-brand disabled:opacity-40 rounded-2xl size-11 text-on-brand active:scale-90 transition shrink-0">
          <Send size={18} strokeWidth={2.6} />
        </button>
      </form>
    </div>
  );
}
