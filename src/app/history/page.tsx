"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAttempt, getWritingHistory, getSpeakingHistory } from "@/utils/api";

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
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { color: string; text: string }> = {
    GRADED: { color: "bg-green-100 text-green-700", text: "Đã chấm" },
    SUBMITTED: { color: "bg-blue-100 text-blue-700", text: "Đã nộp" },
    IN_PROGRESS: { color: "bg-yellow-100 text-yellow-700", text: "Đang làm" },
    STARTED: { color: "bg-yellow-100 text-yellow-700", text: "Đang làm" },
    EXPIRED: { color: "bg-red-100 text-red-700", text: "Hết giờ" },
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

      const readingData = readingRes?.data?.data || readingRes?.data || [];
      setReadingAttempts(
        Array.isArray(readingData)
          ? readingData.map((a: any) => ({
              id: a.id || a.attemptId,
              examTitle: a.examTitle || a.title || "Untitled Exam",
              skill: a.skill || "READING",
              status: a.status || "GRADED",
              bandScore: a.bandScore || a.ieltsBand,
              correctCount: a.correctCount || a.correct,
              totalQuestions: a.totalQuestions || a.totalPoints,
              finishedAt: a.finishedAt || a.submittedAt || a.gradedAt,
            }))
          : []
      );

      const writingData = writingRes?.data?.data || writingRes?.data || [];
      setWritingAttempts(
        Array.isArray(writingData)
          ? writingData.map((w: any) => ({
              id: w.submissionId || w.id,
              examTitle: w.examTitle || w.title || "Writing Task",
              skill: "WRITING",
              status: w.status || "GRADED",
              overallBand: w.overallBand,
              finishedAt: w.gradedAt || w.submittedAt,
            }))
          : []
      );

      const speakingData = speakingRes?.data?.data || speakingRes?.data || [];
      setSpeakingAttempts(
        Array.isArray(speakingData)
          ? speakingData.map((s: any) => ({
              id: s.submissionId || s.id,
              examTitle: s.examTitle || s.title || "Speaking Task",
              skill: "SPEAKING",
              status: s.status || "GRADED",
              overallBand: s.overallBand,
              finishedAt: s.gradedAt || s.submittedAt,
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Lịch sử luyện tập
          </h1>
          <p className="text-slate-500 text-sm">
            Xem lại các bài thi bạn đã làm
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500">Đang tải...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-slate-500 mb-4">Chưa có bài thi nào</p>
            <button
              onClick={() => router.push("/practice")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Bắt đầu luyện tập
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => handleViewResult(item)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900">
                        {item.examTitle}
                      </h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatDate(item.finishedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {(item.bandScore || item.overallBand) && (
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">
                          {(item.overallBand ?? item.bandScore)?.toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-400">Band</div>
                      </div>
                    )}
                    <span className="text-slate-400">→</span>
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
