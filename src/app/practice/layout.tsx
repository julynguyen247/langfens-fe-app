import type { ReactNode } from "react";
import PracticeSidebar from "./components/Sidebar";

export default function PracticeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 bg-gray-50">
      <div className="flex gap-4">
        <PracticeSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
