"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicExams, getWritingExams, getSpeakingExams } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";
import PracticeBank, { PracticeItem } from "@/components/PracticeBank";

function detectSkillFromSlug(
  slug: string
): "reading" | "listening" | "writing" | "speaking" | "unknown" {
  const s = slug.toLowerCase();
  if (s.includes("reading")) return "reading";
  if (s.includes("listening")) return "listening";
  if (s.includes("writing")) return "writing";
  if (s.includes("speaking")) return "speaking";
  return "unknown";
}

function detectPartFromQuery(itemParam: string): "1" | "2" | "3" | null {
  const m = itemParam.toLowerCase().match(/part[\s_]?([123])/);
  return m ? (m[1] as "1" | "2" | "3") : null;
}

export default function GroupPage() {
  const { group } = useParams<{ group: string }>();
  const sp = useSearchParams();
  const itemParam = sp.get("item") ?? "";
  const { user } = useUserStore();
  const [items, setItems] = useState<PracticeItem[]>([]);

  const groupId = String(group || "").toLowerCase();
  const partFilter = detectPartFromQuery(itemParam);

  useEffect(() => {
    async function fetchTests() {
      if (groupId === "writing") {
        const res = await getWritingExams();
        setItems(
          (res as any).data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            summary: item.taskText ?? "",
            thumb: undefined,
            attemps: 0,
            done: false,
            skill: "writing",
          }))
        );
        return;
      }

      if (groupId === "speaking") {
        const res = await getSpeakingExams();
        setItems(
          (res as any).data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            summary: item.taskText ?? "",
            thumb: undefined,
            attemps: 0,
            done: false,
            skill: "speaking",
          }))
        );
        return;
      }

      const res = await getPublicExams(1, 500, { category: groupId });
      setItems(
        (res as any).data.data.map((item: any) => ({
          ...item,
          skill: detectSkillFromSlug(item.slug),
        }))
      );
    }

    fetchTests();
  }, [groupId]);

  const filtered = useMemo(() => {
    if (groupId === "writing" || groupId === "speaking") {
      let base = items;
      if (partFilter) {
        base = base.filter((it) => {
          const meta = `${it.title} ${it.summary ?? ""}`.toLowerCase();
          return new RegExp(`part[\\s_]?${partFilter}`).test(meta);
        });
      }
      return base;
    }

    return items.filter((it: any) => detectSkillFromSlug(it.slug) === groupId);
  }, [items, groupId, partFilter]);

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
        skill={groupId}
      />
    </main>
  );
}
