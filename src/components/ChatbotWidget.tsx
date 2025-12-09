"use client";

import { useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);

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

          <div className="flex-1 p-3 overflow-y-auto text-sm text-gray-800">
            Chatbot ở đây...
          </div>

          <div className="p-3 bg-white rounded-b-xl shadow-sm">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              className="
                w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-900 
                focus:outline-none focus:ring-2 focus:ring-blue-500 transition
              "
            />
          </div>
        </div>
      )}
    </>
  );
}
