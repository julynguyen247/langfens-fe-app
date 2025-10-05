"use client";
import PracticeBank, { PracticeItem } from "@/components/PracticeBank";

const demoItems: PracticeItem[] = Array.from({ length: 96 }, (_, i) => ({
  id: `${i + 1}`,
  title: "Cambridge 17",
  summary: "Gap Filling",
  section: "Section 1",
  thumb:
    "https://images.unsplash.com/photo-1526481280698-8fcc13fd5f1d?q=80&w=1200&auto=format&fit=crop",
  attemps: 42341,
  done: i % 5 === 0, // rải rác vài bài đã làm
}));

export default function Page() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6">
      <PracticeBank
        items={demoItems}
        pageSize={12}
        onClickItem={(it) => console.log("Open item:", it)}
      />
    </main>
  );
}
