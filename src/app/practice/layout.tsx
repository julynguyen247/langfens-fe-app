import type { ReactNode } from "react";
import PracticeSidebar from "./components/Sidebar";

export default function PracticeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      {/* Centered container with consistent padding like other pages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <PracticeSidebar />
          
          {/* Right Content - Fluid width */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
