"use client";

import { useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import SleepPenguinMini from "./SleepPenguinMini";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Xin chào, mình là trợ lý Langfens.\nHãy hỏi mình bất cứ điều gì về tiếng Anh, bài test hoặc cách dùng Langfens nhé!",
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
    </div>
  );
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    let botIndex = -1;

    setMessages((prev) => {
      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const botMsg: ChatMessage = { role: "assistant", content: "" };
      botIndex = prev.length + 1;
      return [...prev, userMsg, botMsg];
    });

    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_GATEWAY_URL ?? ""
        }/api-chatbot/ielts/chat-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: trimmed }],
          }),
        }
      );

      if (!res.body) {
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let botText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        botText += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          if (botIndex < 0 || botIndex >= prev.length) return prev;
          const next = [...prev];
          next[botIndex] = {
            ...next[botIndex],
            content: botText,
          };
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="
    fixed bottom-6 right-6
    bg-white
    p-2 rounded-full shadow-xl z-[9999]
    hover:scale-105 transition-all duration-300
    animate-[chatbot-pop_0.35s_ease-out]
    flex items-center justify-center
  "
        >
          <SleepPenguinMini />
        </button>
      )}

      {open && (
        <div
          className="
            fixed bottom-6 right-6 w-80 h-96
            bg-gradient-to-b from-slate-50 to-slate-100
            rounded-2xl shadow-2xl z-[9999]
            flex flex-col border border-slate-200
            animate-[chatbot-open_0.35s_ease-out]
          "
        >
          <div
            className="
              px-4 py-3 flex justify-between items-center
              rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-500
              text-white
            "
          >
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Langfens Assistant</span>
              <span className="text-[11px] text-blue-100">
                Hỗ trợ tiếng Anh & bài test
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-blue-100 hover:text-white transition"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="flex-1 px-3 py-2 overflow-y-auto text-sm space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  "flex " +
                  (m.role === "user" ? "justify-end" : "justify-start")
                }
              >
                <div
                  className={
                    "max-w-[85%] px-3 py-2 rounded-2xl whitespace-pre-wrap text-[13px] shadow-sm transition-all duration-150 " +
                    (m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-gray-900 rounded-bl-sm border border-slate-100")
                  }
                >
                  {m.role === "assistant" && !m.content && loading ? (
                    <TypingIndicator />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSend}
            className="
              p-3 bg-slate-50 rounded-b-2xl
              border-t border-slate-200 flex gap-2
            "
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
              className="
                flex-1 px-3 py-2 rounded-xl bg-white text-gray-900 text-[13px]
                border border-slate-200
                focus:outline-none focus:ring-2 focus:ring-blue-500
                placeholder:text-slate-400 transition
              "
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="
                px-3 py-2 rounded-xl text-xs font-semibold
                bg-blue-600 text-white disabled:opacity-50
                hover:bg-blue-700 transition shadow-sm
              "
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </>
  );
}
