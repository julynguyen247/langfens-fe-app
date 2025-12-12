"use client";

import { useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const botIndex = messages.length + 1;
    setMessages([
      ...messages,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ message: trimmed }),
      });

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

        const chunkText = decoder.decode(value, { stream: true });

        botText += chunkText;

        setMessages((prev) => {
          const next = [...prev];
          if (!next[botIndex]) return next;
          next[botIndex] = {
            ...next[botIndex],
            content: botText,
          };
          return next;
        });
      }
    } catch (err) {
      console.error("Chat stream error:", err);
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
            fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 
            text-white p-4 rounded-full shadow-xl z-[9999]
            transition-all duration-300 
            animate-[chatbot-pop_0.35s_ease-out]
          "
        >
          <FiMessageCircle size={24} />
        </button>
      )}

      {open && (
        <div
          className="
            fixed bottom-6 right-6 w-80 h-96 bg-white rounded-xl shadow-2xl z-[9999] 
            flex flex-col 
            animate-[chatbot-open_0.35s_ease-out]
          "
        >
          <div className="p-3 flex justify-between items-center bg-white rounded-t-xl shadow-sm">
            <h3 className="font-semibold text-gray-900">Chat hỗ trợ</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto text-sm text-gray-800 space-y-2">
            {messages.length === 0 && (
              <p className="text-gray-400 text-xs">
                Hãy hỏi mình bất cứ điều gì về bài test, đăng ký, v.v. 👋
              </p>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <div
                  className={
                    "inline-block px-3 py-2 rounded-lg max-w-[90%] whitespace-pre-wrap " +
                    (m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none")
                  }
                >
                  {m.content ||
                    (m.role === "assistant" && loading
                      ? "Đang trả lời..."
                      : "")}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 bg-white rounded-b-xl shadow-sm flex gap-2"
          >
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              className="
                flex-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-900 
                focus:outline-none focus:ring-2 focus:ring-blue-500 transition
              "
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="
                px-3 py-2 rounded-lg text-sm font-medium
                bg-blue-600 text-white disabled:opacity-50
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
