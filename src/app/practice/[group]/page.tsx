"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicExams, getWritingExams, getSpeakingExams, getExamsByQuestionType } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";
import PracticeBank, { PracticeItem } from "@/components/PracticeBank";
import { SkillBadge } from "@/components/ui/SkillBadge";

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
  const m = itemParam.toLowerCase().match(/(?:part|task)[\s_]?([123])/);
  return m ? (m[1] as "1" | "2" | "3") : null;
}

// Skill metadata
const SKILL_META: Record<string, { title: string; description: string }> = {
  reading: {
    title: "Reading Quests",
    description: "Improve your comprehension and scanning techniques",
  },
  listening: {
    title: "Listening Quests",
    description: "Enhance your audio comprehension skills",
  },
  writing: {
    title: "Writing Quests",
    description: "Master essay structure and task responses",
  },
  speaking: {
    title: "Speaking Quests",
    description: "Build confidence with interview simulations",
  },
};

export default function GroupPage() {
  const { group } = useParams<{ group: string }>();
  const sp = useSearchParams();
  const itemParam = sp.get("item") ?? "";
  const { user } = useUserStore();
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionTypesFilter, setQuestionTypesFilter] = useState<string[]>([]);

  const groupId = String(group || "").toLowerCase();
  const partFilter = detectPartFromQuery(itemParam);
  const skillMeta = SKILL_META[groupId] || SKILL_META.reading;

  const fetchExams = useCallback(async (types: string[]) => {
    setLoading(true);
    try {
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
        const res = await getExamsByQuestionType(types.join(","), 1, 500);
        examsData = (res as any).data?.data ?? [];
      } else {
        const res = await getPublicExams(1, 500, { category: "IELTS" });
        examsData = (res as any).data?.data ?? [];
      }

      setItems(
        examsData.map((item: any) => ({
          ...item,
          skill: detectSkillFromSlug(item.slug),
        }))
      );
    } catch (e) {
      console.error("Error loading exams:", e);
    } finally {
      setLoading(false);
    }
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 text-center max-w-sm">
          <div
            className="w-14 h-14 rounded-full bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-4"
          >
            <span
              className="text-lg font-bold text-[var(--primary)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              ?
            </span>
          </div>
          <p
            className="text-[var(--text-body)] font-semibold mb-1"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Login required
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Please log in to access the quest board
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Quest Board Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <SkillBadge skill={groupId} size="md" />
          <span
            className="text-sm font-semibold text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Quest Board
          </span>
        </div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-1"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {skillMeta.title}
        </h1>
        <p className="text-[var(--text-muted)] text-base">
          {skillMeta.description}
        </p>
      </div>

      {/* Quest Cards */}
      <PracticeBank
        items={filtered}
        pageSize={12}
        userId={user.id}
        skill={groupId}
        onQuestionTypesChange={handleQuestionTypesChange}
        loading={loading}
      />
    </div>
  );
}
