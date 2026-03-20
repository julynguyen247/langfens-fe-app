"use client";

import { useState } from "react";
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
      <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.2s]" style={{ backgroundColor: "var(--text-muted)" }} />
      <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.1s]" style={{ backgroundColor: "var(--text-muted)" }} />
      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--text-muted)" }} />
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
    p-2 rounded-full shadow-xl z-[9999]
    hover:scale-105 transition-all duration-300
    animate-[chatbot-pop_0.35s_ease-out]
    flex items-center justify-center
  "
          style={{ backgroundColor: "var(--background)" }}
        >
          <SleepPenguinMini />
        </button>
      )}

      {open && (
        <div
          className="
            fixed bottom-6 right-6 w-80 h-96
            rounded-[2rem] z-[9999]
            flex flex-col border-[3px]
            shadow-[0_4px_0_rgba(0,0,0,0.08)]
            animate-[chatbot-open_0.35s_ease-out]
          "
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="
              px-4 py-3 flex justify-between items-center
              rounded-t-[calc(2rem-3px)] text-white
            "
            style={{ backgroundColor: "var(--primary)" }}
          >
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Langfens Assistant</span>
              <span className="text-[11px] opacity-80">
                Hỗ trợ tiếng Anh & bài test
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="opacity-80 hover:opacity-100 transition text-white font-bold text-sm"
            >
              x
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
                    "max-w-[85%] px-3 py-2 rounded-2xl whitespace-pre-wrap text-[13px] transition-all duration-150 " +
                    (m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "rounded-bl-sm border")
                  }
                  style={
                    m.role === "user"
                      ? { backgroundColor: "var(--primary)" }
                      : {
                          backgroundColor: "var(--background)",
                          color: "var(--foreground)",
                          borderColor: "var(--border)",
                        }
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
              p-3 rounded-b-[calc(2rem-3px)]
              border-t flex gap-2
            "
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
              className="
                flex-1 px-3 py-2 rounded-xl text-[13px]
                border
                focus:outline-none focus:ring-2
                transition
              "
              style={{
                backgroundColor: "var(--background)",
                color: "var(--foreground)",
                borderColor: "var(--border)",
                // @ts-ignore
                "--tw-ring-color": "var(--primary)",
              } as React.CSSProperties}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="
                px-3 py-2 rounded-full text-xs font-semibold
                text-white disabled:opacity-50
                transition border-b-[4px]
              "
              style={{
                backgroundColor: "var(--primary)",
                borderBottomColor: "var(--primary-dark)",
              }}
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </>
  );
}
