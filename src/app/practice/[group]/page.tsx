"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicExams } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";
import PracticeBank, { PracticeItem } from "@/components/PracticeBank";

export default function GroupPage() {
  const { group } = useParams<{ group: string }>();
  const sp = useSearchParams();
  const tab = (sp.get("tab") ?? "todo") as "todo" | "done";
  const q = (sp.get("q") ?? "").toLowerCase();
  const { user } = useUserStore();
  const [items, setItems] = useState<PracticeItem[]>([]);

  useEffect(() => {
    async function fetchTest() {
      const res = await getPublicExams(1, 24, {
        category: group as string,
      });
      console.log(res);
      setItems(res.data.data);
    }
    fetchTest();
  }, [group]);

  if (!user?.id)
    return (
      <div className="p-6 text-center text-slate-600">Bạn cần đăng nhập…</div>
    );

  const filtered = items
    .filter((it) => (tab === "todo" ? !it.done : it.done))
    .filter(
      (it) =>
        !q ||
        it.title.toLowerCase().includes(q) ||
        it.summary.toLowerCase().includes(q)
    );

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
