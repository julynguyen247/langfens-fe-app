// app/practice/[group]/[item]/do/layout.tsx
"use client";

import TopBar from "./components/TopBar";
import PassageFooter from "./components/PassageFooter";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex-1 grid grid-cols-[1fr_420px] gap-4 p-6 pb-24 overflow-hidden">
        {children}
      </div>

      {/* Footer dính đáy */}
      <PassageFooter
        passages={[
          { id: "p1", label: "Passage 1", total: 13, done: 0 },
          { id: "p2", label: "Passage 2", total: 13, done: 0 },
          { id: "p3", label: "Passage 3", total: 14, done: 0 },
        ]}
        currentPassageId="p1"
        onChangePassage={(id) => {
          // TODO: gọi state/store để đổi passage
          console.log("change passage ->", id);
        }}
        onJumpRange={(dir) => {
          // TODO: cuộn tới dải câu 1–6 / 7–13...
          console.log("jump", dir);
        }}
        onGridClick={() => {
          // TODO: mở answer sheet
          console.log("open answer sheet");
        }}
        rangeLabel="07–13"
        rangePrevLabel="0–0"
      />
    </div>
  );
}
