"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicExams, getWritingExams, getSpeakingExams, getExamsByQuestionType } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";
import PracticeBank, { PracticeItem } from "@/components/PracticeBank";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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
const SKILL_META: Record<string, { title: string; description: string; icon: string }> = {
  reading: {
    title: "Reading Practice",
    description: "Improve your comprehension and scanning techniques",
    icon: "menu_book",
  },
  listening: {
    title: "Listening Practice",
    description: "Enhance your audio comprehension skills",
    icon: "headphones",
  },
  writing: {
    title: "Writing Practice",
    description: "Master essay structure and task responses",
    icon: "edit_note",
  },
  speaking: {
    title: "Speaking Practice",
    description: "Build confidence with interview simulations",
    icon: "mic",
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
        <div className="text-center">
          <Icon name="lock" className="text-5xl text-slate-300 mb-3" />
          <p className="text-slate-600">Please log in to access the practice library</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
            <Icon name={skillMeta.icon} className="text-2xl text-[#3B82F6]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-slate-800">{skillMeta.title}</h1>
            <p className="text-sm text-slate-500">{skillMeta.description}</p>
          </div>
        </div>
      </div>

      {/* Practice Bank */}
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
