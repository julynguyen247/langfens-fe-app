"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { startAttempt, startWritingExam, startSpeakingExam } from "@/utils/api";
import { useAttemptStore } from "@/app/store/useAttemptStore";

type Skill = "reading" | "listening" | "writing" | "speaking";

export default function StartAttemptPage() {
  const { skill, examId } = useParams() as { skill: Skill; examId: string };
  const router = useRouter();
  const setAttempt = useAttemptStore((s) => s.setAttempt);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        if (skill === "reading" || skill === "listening") {
          const res = await startAttempt(examId);
          const payload = res?.data?.data ?? res?.data;
          const attemptId: string | undefined =
            payload?.attemptId ?? payload?.id;

          if (!attemptId) throw new Error("Missing attemptId");

          if (!cancelled) {
            setAttempt({ ...payload, attemptId });
            router.replace(`/do-test/${skill}/${attemptId}`);
          }
          return;
        }

        if (skill === "writing") {
          const res = await startWritingExam(examId);
          const payload = res?.data?.data ?? res?.data;
          const writingExamId: string = payload?.id ?? examId;
          
          if (!cancelled) {
            // Store the exam data so WritingScreen can use it directly
            setAttempt({ ...payload, examId: writingExamId, attemptId: writingExamId });
            router.replace(`/do-test/${skill}/${writingExamId}`);
          }
          return;
        }

        if (skill === "speaking") {
          await startSpeakingExam(examId);
          if (!cancelled) router.replace(`/do-test/${skill}/${examId}`);
          return;
        }

        throw new Error("Unknown skill");
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          alert("Không thể bắt đầu bài thi. Vui lòng thử lại.");
          router.back();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skill, examId, router, setAttempt]);

  if (!loading) return null;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
    </div>
  );
}
