"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicExams, getWritingExams, getSpeakingExams, getExamsByQuestionType } from "@/utils/api";
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
  // Check for both "part1" and "task1" patterns
  const m = itemParam.toLowerCase().match(/(?:part|task)[\s_]?([123])/);
  return m ? (m[1] as "1" | "2" | "3") : null;
}

export default function GroupPage() {
  const { group } = useParams<{ group: string }>();
  const sp = useSearchParams();
  const itemParam = sp.get("item") ?? "";
  const { user } = useUserStore();
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [questionTypesFilter, setQuestionTypesFilter] = useState<string[]>([]);

  const groupId = String(group || "").toLowerCase();
  const partFilter = detectPartFromQuery(itemParam);

  const fetchExams = useCallback(async (types: string[]) => {
    console.log("[DEBUG] fetchExams called with types:", types);
    if (groupId === "writing") {
      const res = await getWritingExams();
      setItems(
        (res as any).data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          summary: item.taskText ?? "",
          imageUrl: item.imageUrl,
          thumb: undefined,
          attemps: 0,
          done: false,
          skill: "writing",
          slug: item.slug ?? "",
          tags: (item.tag ?? "").split(",").map((t: string) => t.trim()),
          examType: item.examType,
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
          imageUrl: item.imageUrl,
          attemps: 0,
          done: false,
          skill: "speaking",
          slug: item.slug ?? "",
        }))
      );
      return;
    }

    // For reading/listening
    let examsData;
    if (types.length > 0) {
      // Use question bank API when filtering by question types
      console.log("[DEBUG] Calling getExamsByQuestionType with:", types.join(","));
      const res = await getExamsByQuestionType(types.join(","), 1, 500);
      examsData = (res as any).data?.data ?? [];
      console.log("[DEBUG] getExamsByQuestionType response:", examsData.length, "items");
    } else {
      // Use regular API when no filter
      const res = await getPublicExams(1, 500, { category: "IELTS" });
      examsData = (res as any).data?.data ?? [];
    }
    
    setItems(
      examsData.map((item: any) => ({
        ...item,
        skill: detectSkillFromSlug(item.slug),
      }))
    );
  }, [groupId]);

  useEffect(() => {
    fetchExams(questionTypesFilter);
  }, [groupId, questionTypesFilter, fetchExams]);

  const handleQuestionTypesChange = useCallback((types: string[]) => {
    setQuestionTypesFilter(types);
  }, []);

  const filtered = useMemo(() => {
    if (groupId === "writing" || groupId === "speaking") {
      let base = items;
      if (itemParam) {
        const keyword = itemParam.toLowerCase().replace(/writing_?/gi, "").replace(/speaking_?/gi, "");
        if (keyword) {
          const partMatch = keyword.match(/(?:part|task)_?([123])/);
          if (partMatch) {
            const taskNum = Number(partMatch[1]);
            base = base.filter((it: any) => it.examType === taskNum);
          } else {
            base = base.filter((it: any) => it.slug?.toLowerCase().includes(keyword));
          }
        }
      }
      return base;
    }

    // Filter by skill using slug (reading/listening)
    return items.filter((it: any) => detectSkillFromSlug(it.slug) === groupId);
  }, [items, groupId, itemParam]);

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
        onQuestionTypesChange={handleQuestionTypesChange}
      />
    </main>
  );
}
