"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (message: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  disabled?: boolean;
  isRecording?: boolean;
}

export function ChatInput({ onSend, onRecordingChange, disabled, isRecording }: Props) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim() || disabled) return;

      onSend(message.trim());
      setMessage("");

      // Focus back on input after sending
      inputRef.current?.focus();
    },
    [message, disabled, onSend]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift for new line)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleRecording = () => {
    onRecordingChange?.(!isRecording);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={cn(
          "flex items-end gap-2 p-3 border-t bg-white rounded-xl",
          disabled && "opacity-50"
        )}
      >
        {/* Voice input button */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={disabled}
          className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
            isRecording
              ? "bg-red-500 text-white animate-pulse"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            disabled && "cursor-not-allowed"
          )}
          title={isRecording ? "Stop recording" : "Start voice recording"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type your message..."
            rows={1}
            className={cn(
              "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl",
              "resize-none text-sm placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:cursor-not-allowed"
            )}
            style={{
              minHeight: "44px",
              maxHeight: "120px",
            }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
            message.trim() && !disabled
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-400",
            disabled && "cursor-not-allowed"
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
          Recording...
        </div>
      )}
    </form>
  );
}
