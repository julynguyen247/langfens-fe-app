"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicExams, getWritingExams, getSpeakingExams } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";
import PracticeBank, { PracticeItem } from "@/components/PracticeBank";

function detectSkill(
  title: string
): "reading" | "listening" | "writing" | "speaking" | "unknown" {
  const t = title.toLowerCase();

  if (t.includes("reading")) return "reading";
  if (t.includes("listening")) return "listening";
  if (t.includes("writing")) return "writing";
  if (t.includes("speaking")) return "speaking";

  return "unknown";
}

export default function GroupPage() {
  const { group } = useParams<{ group: string }>();
  const sp = useSearchParams();
  const tab = (sp.get("tab") ?? "todo") as "todo" | "done";
  const q = (sp.get("q") ?? "").toLowerCase();
  const { user } = useUserStore();
  const [items, setItems] = useState<PracticeItem[]>([]);

  useEffect(() => {
    async function fetchTests() {
      if (group === "writing") {
        const res = await getWritingExams();
        const data: PracticeItem[] = res.data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          summary: item.taskText ?? "",
          thumb: undefined,
          attemps: 0,
          done: false,
          skill: "writing",
        }));
        setItems(data);
        return;
      }

      if (group === "speaking") {
        const res = await getSpeakingExams();
        const data: PracticeItem[] = res.data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          summary: item.taskText ?? "",
          thumb: undefined,
          attemps: 0,
          done: false,
          skill: "speaking",
        }));
        setItems(data);
        return;
      }
      const res = await getPublicExams(1, 24, { category: group as string });
      const data: PracticeItem[] = res.data.data.map((item: any) => ({
        ...item,
        skill: detectSkill(item.title),
      }));
      setItems(data);
    }

    fetchTests();
  }, [group]);

  const filtered = useMemo(
    () =>
      items
        .filter((it) => it.skill === group)
        .filter((it) => (tab === "todo" ? !it.done : it.done))
        .filter(
          (it) =>
            !q ||
            it.title.toLowerCase().includes(q) ||
            it.summary.toLowerCase().includes(q)
        ),
    [items, group, tab, q]
  );

  if (!user?.id) {
    return (
      <div className="p-6 text-center text-slate-600">Bạn cần đăng nhập…</div>
    );
  }

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6">
      <PracticeBank
        items={filtered}
        pageSize={12}
        userId={user.id}
        skill={group as string}
      />
    </main>
  );
}
