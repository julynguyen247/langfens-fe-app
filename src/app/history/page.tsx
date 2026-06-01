"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAttempt, getWritingHistory, getSpeakingHistory } from "@/utils/api";
import { Spinner } from "@/components/ui/spinner";

type TabType = "reading" | "writing" | "speaking";

type AttemptItem = {
  id: string;
  examTitle?: string;
  skill?: string;
  status: string;
  bandScore?: number;
  overallBand?: number;
  correctCount?: number;
  totalQuestions?: number;
  finishedAt?: string;
};

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { color: string; text: string }> = {
    GRADED: { color: "bg-green-100 text-green-700", text: "Graded" },
    SUBMITTED: { color: "bg-blue-100 text-blue-700", text: "Submitted" },
    IN_PROGRESS: { color: "bg-yellow-100 text-yellow-700", text: "In Progress" },
    STARTED: { color: "bg-yellow-100 text-yellow-700", text: "In Progress" },
    EXPIRED: { color: "bg-red-100 text-red-700", text: "Expired" },
  };
  const s = statusMap[status?.toUpperCase()] || {
    color: "bg-gray-100 text-gray-700",
    text: status || "—",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>
      {s.text}
    </span>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("reading");
  const [loading, setLoading] = useState(true);
  const [readingAttempts, setReadingAttempts] = useState<AttemptItem[]>([]);
  const [writingAttempts, setWritingAttempts] = useState<AttemptItem[]>([]);
  const [speakingAttempts, setSpeakingAttempts] = useState<AttemptItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [readingRes, writingRes, speakingRes] = await Promise.all([
        getAttempt(1, 50).catch(() => null),
        getWritingHistory().catch(() => null),
        getSpeakingHistory().catch(() => null),
      ]);

      const readingData = readingRes?.data?.data?.items ?? readingRes?.data?.items ?? readingRes?.data?.data ?? [];
      setReadingAttempts(
        Array.isArray(readingData)
          ? readingData.map((a: any) => ({
              id: a.attemptId ?? a.id,
              examTitle: a.title ?? a.examTitle ?? "Untitled Exam",
              skill: a.skill || "READING",
              status: a.status || "GRADED",
              bandScore: a.ieltsBand ?? a.bandScore,
              correctCount: a.correctCount || a.correct,
              totalQuestions: a.totalQuestions || a.totalPoints,
              finishedAt: a.submittedAt ?? a.finishedAt ?? a.gradedAt,
            }))
          : []
      );

      const writingData = writingRes?.data?.data || writingRes?.data || [];
      setWritingAttempts(
        Array.isArray(writingData)
          ? writingData.map((w: any) => ({
              id: w.submissionId ?? w.id,
              examTitle: w.title ?? w.examTitle ?? "Writing Task",
              skill: "WRITING",
              status: w.status || "GRADED",
              overallBand: w.overallBand,
              finishedAt: w.submittedAt ?? w.gradedAt,
            }))
          : []
      );

      const speakingData = speakingRes?.data?.data || speakingRes?.data || [];
      setSpeakingAttempts(
        Array.isArray(speakingData)
          ? speakingData.map((s: any) => ({
              id: s.submissionId ?? s.id,
              examTitle: s.title ?? s.examTitle ?? "Speaking Task",
              skill: "SPEAKING",
              status: s.status || "GRADED",
              overallBand: s.overallBand,
              finishedAt: s.submittedAt ?? s.gradedAt,
            }))
          : []
      );
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  const currentList =
    activeTab === "reading"
      ? readingAttempts
      : activeTab === "writing"
      ? writingAttempts
      : speakingAttempts;

  function handleViewResult(item: AttemptItem) {
    if (activeTab === "reading") {
      router.push(`/attempts/${item.id}`);
    } else if (activeTab === "writing") {
      router.push(`/attempts/${item.id}?source=writing`);
    } else {
      router.push(`/attempts/${item.id}?source=speaking`);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Practice History
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Review your past exam attempts
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "reading", label: "Reading / Listening", count: readingAttempts.length },
            { key: "writing", label: "Writing", count: writingAttempts.length },
            { key: "speaking", label: "Speaking", count: speakingAttempts.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeTab === tab.key
                  ? "border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 bg-[var(--primary)] text-white"
                  : "border-b-[4px] border-[var(--border)] hover:-translate-y-0.5 bg-[var(--card)] text-[var(--foreground)]"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-[var(--card)] rounded-[2rem] p-12 text-center">
            <Spinner className="mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">Loading...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="bg-[var(--card)] rounded-[2rem] p-12 text-center">
            <p className="text-[var(--text-muted)] mb-4">No exams yet</p>
            <button
              onClick={() => router.push("/practice")}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-full border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 transition"
            >
              Start Practice
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((item) => (
              <div
                key={item.id}
                className="bg-[var(--card)] rounded-[2rem] p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => handleViewResult(item)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                        {item.examTitle}
                      </h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {formatDate(item.finishedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {(item.bandScore || item.overallBand) && (
                      <div className="text-center">
                        <div className="text-xl font-bold text-[var(--primary)]" style={{ fontFamily: "var(--font-code)" }}>
                          {(item.overallBand ?? item.bandScore)?.toFixed(1)}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">Band</div>
                      </div>
                    )}
                    <span className="text-[var(--text-muted)]">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
