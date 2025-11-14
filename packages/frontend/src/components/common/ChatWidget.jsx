import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Minus } from "lucide-react";
import { api, endpoints } from "../../lib/api.js";

/**
 * Floating Chat Widget backed by AI service
 */
export default function ChatWidget({ title = "Fitnexus Assistant" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Chào bạn! Mình là trợ lý AI của Fitnexus. Hãy hỏi mình về tính năng, cách sử dụng, hoặc kiến trúc dự án nhé.",
    },
  ]);
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Simple outside click to close (only when header close is not used)
  useEffect(() => {
    function handleClickOutside(e) {
      if (!open) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const toggle = document.getElementById("fitnexus-chat-toggle");
        if (toggle && toggle.contains(e.target)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (!open) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function sendMessage(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    const next = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const history = next.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post(endpoints.ai.chat, { message: trimmed, history });
      const reply = res?.data?.data?.reply || "(Chưa nhận được phản hồi)";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi gửi tin nhắn";
      setMessages((prev) => [...prev, { role: "assistant", content: `Đã xảy ra lỗi: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed z-[60] right-10 bottom-12 md:right-14 md:bottom-16">
      {/* Floating Toggle Button */}
      {!open && (
        <button
          id="fitnexus-chat-toggle"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="group relative flex items-center gap-2 rounded-full border border-black/10 bg-gradient-to-b from-red-500 to-red-600 text-white pl-3 pr-5 py-2.5 shadow-[0_2px_0_#00000026,0_10px_28px_rgba(0,0,0,0.25)] hover:from-red-600 hover:to-red-700 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-transform"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 ring-1 ring-white/30">
            <MessageCircle size={18} className="text-white" />
          </span>
          <span className="font-semibold tracking-wide">Chat</span>
          <span className="absolute inline-flex items-center justify-center w-5 h-5 -top-1 -right-1">
            <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-60 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white ring-2 ring-red-600" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          ref={containerRef}
          role="dialog"
          aria-label="Chat window"
          className="flex h-[70vh] w-[92vw] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/80 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.28)] animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white/80">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center font-bold text-white bg-red-600 rounded-full shadow-sm h-9 w-9">
                F
              </div>
              <div className="leading-tight">
                <span className="block text-sm font-semibold text-gray-900">{title}</span>
                <span className="text-[11px] text-gray-500">Beta</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Minimize"
                title="Minimize"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-200/60 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                aria-label="Close"
                title="Close"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-200/60 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="flex-1 px-4 py-3 overflow-y-auto text-sm space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "assistant"
                    ? "p-3 rounded-lg bg-gray-50 text-gray-800 whitespace-pre-wrap break-words leading-relaxed"
                    : "p-3 rounded-lg bg-red-50 text-gray-900 border border-red-100 ml-8 whitespace-pre-wrap break-words leading-relaxed"
                }
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-lg bg-gray-50 text-gray-500 italic">Đang soạn trả lời…</div>
            )}
          </div>

          {/* Composer */}
          <div className="p-3 bg-white border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Nhập tin nhắn…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 text-xs font-semibold text-white rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                Gửi
              </button>
            </form>
            <div className="mt-2 text-center text-[11px] text-gray-400">
              Tin nhắn có thể được ghi log để cải thiện chất lượng.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

