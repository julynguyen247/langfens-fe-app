"use client";

import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import React from "react";
import TimerDisplay from "./TimerDisplay";

interface TopBarProps {
  title?: string; // ví dụ: "Làm bài Reading"
  subtitle?: string; // ví dụ: "IELTS Online Test · CAM 20 · Test 1"
  showTimer?: boolean; // có hiển thị Timer không
  onClose?: () => void; // callback khi bấm nút đóng
  rightSlot?: React.ReactNode; // thay thế Timer (nếu cần custom)
}

export default function TopBar({
  title = "Làm bài",
  subtitle = "IELTS Online Test · CAM 20 · Test 1",
  showTimer = true,
  onClose,
  rightSlot,
}: TopBarProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  return (
    <header className="flex items-center justify-between h-14 border-b bg-white px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-8 h-8 border rounded-full hover:bg-gray-100 transition"
          title="Quay lại"
        >
          <FiX className="text-lg text-gray-700" />
        </button>

        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-600">LANGFENS</span>
            <span className="text-blue-600 font-semibold">{title}</span>
          </div>
          <span className="text-xs text-gray-500">{subtitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {rightSlot ? rightSlot : showTimer && <TimerDisplay />}
      </div>
    </header>
  );
}
