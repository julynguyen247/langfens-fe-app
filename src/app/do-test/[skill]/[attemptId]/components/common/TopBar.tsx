"use client";

import { useRouter } from "next/navigation";
import React from "react";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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
    <header className="fixed top-0 left-0 w-full h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 z-50">
      {/* LEFT: Exit & Title */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        {/* Exit Button */}
        <button
          onClick={handleClose}
          className="p-1.5 md:p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0"
          title="Exit Test"
        >
          <Icon name="close" className="text-xl md:text-2xl" />
        </button>
        
        {/* Title & Subtitle */}
        <div className="min-w-0">
          <h1 className="font-serif font-bold text-sm md:text-lg text-slate-900 leading-tight truncate max-w-[150px] sm:max-w-xs md:max-w-md">
            {title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 font-sans truncate">
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
