"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/types/speaking";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { cn } from "@/lib/utils";

interface Props {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  isRecording?: boolean;
  disabled?: boolean;
}

export function ChatInterface({
  messages,
  onSendMessage,
  onRecordingChange,
  isRecording,
  disabled,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      onSendMessage(message);
    },
    [onSendMessage]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm">Start the conversation</p>
              <p className="text-xs mt-1">
                Type a message or use voice input
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatBubble key={message.id || index} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-gray-50">
        <ChatInput
          onSend={handleSend}
          onRecordingChange={onRecordingChange}
          isRecording={isRecording}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
