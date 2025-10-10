"use client";

import { useRouter } from "next/navigation";
import TimerDisplay from "./TimerDisplay";
import { FiX } from "react-icons/fi";

export default function TopBar() {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between h-14 border-b bg-white px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Close button */}
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 border rounded-full hover:bg-gray-100"
          title="Quay lại"
        >
          <FiX className="text-lg text-gray-700" />
        </button>

        {/* Title group */}
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-600">LANGFENS</span>
            <span className="text-blue-600 font-semibold">Làm bài</span>
          </div>
          <span className="text-xs text-gray-500">
            IELTS Online Test · CAM 20 · Reading Test 1
          </span>
        </div>
      </div>

      {/* Right section */}
      <TimerDisplay />
    </header>
  );
}
