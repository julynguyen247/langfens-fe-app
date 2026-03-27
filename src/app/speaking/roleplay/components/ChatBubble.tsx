"use client";

import { ChatMessage } from "@/types/speaking";
import { cn } from "@/lib/utils";

interface Props {
  message: ChatMessage;
}

export function ChatBubble({ message }: Props) {
  const isAgent = message.role === "agent";

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isAgent ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isAgent ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
        )}
      >
        {isAgent ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isAgent
            ? "bg-blue-50 text-gray-900 rounded-tl-sm"
            : "bg-blue-600 text-white rounded-tr-sm"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <div
          className={cn(
            "text-xs mt-1",
            isAgent ? "text-gray-500" : "text-blue-100"
          )}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
