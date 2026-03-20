"use client";

import { useRouter } from "next/navigation";
import React from "react";

interface TopBarProps {
  title?: string;           // Test title (e.g., "The Invention of Television")
  subtitle?: string;        // Subtitle (e.g., "Reading Passage 1")
  onClose?: () => void;     // Exit test callback
  rightSlot?: React.ReactNode;  // Timer component
  submitButton?: React.ReactNode;  // Submit button
}

export default function TopBar({
  title = "Reading Test",
  subtitle = "IELTS Online Test",
  onClose,
  rightSlot,
  submitButton,
}: TopBarProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  return (
    <header className="fixed top-0 left-0 w-full h-14 md:h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-3 md:px-6 z-50">
      {/* LEFT: Exit & Title */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        {/* Exit Button */}
        <button
          onClick={handleClose}
          className="w-8 h-8 md:w-9 md:h-9 rounded-full border-b-[3px] flex items-center justify-center hover:bg-[var(--background)] transition-colors flex-shrink-0"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          title="Exit Test"
        >
          <span className="text-base md:text-lg font-bold leading-none">&times;</span>
        </button>
        
        {/* Title & Subtitle */}
        <div className="min-w-0">
          <h1 className="font-sans font-bold text-sm md:text-lg text-[var(--foreground)] leading-tight truncate max-w-[150px] sm:max-w-xs md:max-w-md">
            {title}
          </h1>
          <p className="hidden sm:block text-xs text-[var(--text-muted)] font-sans truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* RIGHT: Timer & Submit */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Timer Slot */}
        {rightSlot}
        
        {/* Submit Button Slot */}
        {submitButton}
      </div>
    </header>
  );
}
