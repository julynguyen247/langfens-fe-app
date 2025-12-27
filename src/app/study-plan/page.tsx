"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiTarget, FiCalendar, FiClock, FiTrendingUp, FiPlus, FiTrash2, FiCheck, FiAlertCircle } from "react-icons/fi";
import {
  createStudyGoal,
  getActiveStudyGoal,
  getStudyProgress,
  deleteStudyGoal,
} from "@/utils/api";

type StudyGoal = {
  id: string;
  targetBandScore: number;
  targetDate: string;
  focusSkills: string[];
  studyHoursPerDay: number;
  isActive: boolean;
  createdAt: string;
};

type Progress = {
  goal: StudyGoal;
  current: {
    avgScore: number;
    testsCompleted: number;
    studyTimeHours: number;
  };
  progress: {
    scoreProgress: number;
    timeProgress: number;
    status: "ON_TRACK" | "BEHIND" | "AHEAD";
  };
};

const SKILLS = [
  { id: "reading", label: "Reading", icon: "📖" },
  { id: "listening", label: "Listening", icon: "🎧" },
  { id: "writing", label: "Writing", icon: "✍️" },
  { id: "speaking", label: "Speaking", icon: "🗣️" },
];

export default function StudyPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [targetScore, setTargetScore] = useState(7.0);
  const [targetDate, setTargetDate] = useState("");
  const [focusSkills, setFocusSkills] = useState<string[]>(["reading", "listening", "writing", "speaking"]);
  const [studyHours, setStudyHours] = useState(2);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getStudyProgress().catch(() => null);
      const data = (res as any)?.data?.data ?? (res as any)?.data;
      if (data?.goal) {
        setProgress(data);
      } else {
        setProgress(null);
        setShowCreate(true);
      }
    } catch (e) {
      console.error("Failed to load study plan:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!targetDate) return;
    setSaving(true);
    try {
      await createStudyGoal({
        targetBandScore: targetScore,
        targetDate: targetDate,
        focusSkills: focusSkills,
        studyHoursPerDay: studyHours,
      });
      setShowCreate(false);
      await loadData();
    } catch (e) {
      console.error("Failed to create goal:", e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!progress?.goal?.id) return;
    if (!confirm("Bạn có chắc muốn xóa mục tiêu này?")) return;
    setDeleting(true);
    try {
      await deleteStudyGoal(progress.goal.id);
      setProgress(null);
      setShowCreate(true);
    } catch (e) {
      console.error("Failed to delete goal:", e);
    } finally {
      setDeleting(false);
    }
  }

  function toggleSkill(skill: string) {
    setFocusSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function getDaysRemaining(date: string) {
    const target = new Date(date);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "AHEAD": return "text-green-600 bg-green-50";
      case "ON_TRACK": return "text-blue-600 bg-blue-50";
      case "BEHIND": return "text-orange-600 bg-orange-50";
      default: return "text-slate-600 bg-slate-50";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "AHEAD": return "Vượt tiến độ";
      case "ON_TRACK": return "Đúng tiến độ";
      case "BEHIND": return "Chậm tiến độ";
      default: return status;
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-64 bg-slate-200 rounded" />
            <div className="h-64 bg-slate-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FiTarget className="w-7 h-7 text-blue-600" />
              Kế hoạch học tập
            </h1>
            <p className="text-slate-500 mt-1">Đặt mục tiêu và theo dõi tiến độ của bạn</p>
          </div>
          {progress && !showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Mục tiêu mới
            </button>
          )}
        </div>

        {/* Current Goal & Progress */}
        {progress && !showCreate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Goal Overview Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Mục tiêu hiện tại</h2>
                  <p className="text-sm text-slate-500">
                    Tạo ngày {new Date(progress.goal.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(progress.progress.status)}`}>
                  {getStatusLabel(progress.progress.status)}
                </span>
              </div>

              {/* Stats Grid - Classic Style */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg border border-blue-100 bg-blue-50">
                  <div className="text-xs text-slate-500 mb-1">Mục tiêu Band</div>
                  <div className="text-2xl font-bold text-blue-600">{progress.goal.targetBandScore}</div>
                </div>
                <div className="p-4 rounded-lg border border-blue-100 bg-blue-50">
                  <div className="text-xs text-slate-500 mb-1">Còn lại</div>
                  <div className="text-2xl font-bold text-purple-600">{getDaysRemaining(progress.goal.targetDate)} <span className="text-base font-medium">ngày</span></div>
                </div>
                <div className="p-4 rounded-lg border border-blue-100 bg-blue-50">
                  <div className="text-xs text-slate-500 mb-1">Điểm hiện tại</div>
                  <div className="text-2xl font-bold text-emerald-600">{progress.current.avgScore.toFixed(1)}</div>
                </div>
                <div className="p-4 rounded-lg border border-blue-100 bg-blue-50">
                  <div className="text-xs text-slate-500 mb-1">Đã hoàn thành</div>
                  <div className="text-2xl font-bold text-amber-600">{progress.current.testsCompleted} <span className="text-base font-medium">bài</span></div>
                </div>
              </div>

              {/* Progress Bars - Classic Style */}
              <div className="space-y-4 pt-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Tiến độ điểm số</span>
                    <span className="font-medium text-slate-900">{progress.progress.scoreProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, progress.progress.scoreProgress)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Thời gian học ({progress.current.studyTimeHours}h / {Math.round(getDaysRemaining(progress.goal.targetDate) * progress.goal.studyHoursPerDay)}h)</span>
                    <span className="font-medium text-slate-900">{progress.progress.timeProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, progress.progress.timeProgress)}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Focus Skills */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Kỹ năng tập trung</h3>
                <div className="flex flex-wrap gap-2">
                  {progress.goal.focusSkills.map((skill) => {
                    const skillInfo = SKILLS.find(s => s.id === skill.toLowerCase());
                    return (
                      <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                        {skillInfo?.icon} {skillInfo?.label || skill}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Delete Button */}
              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2 text-sm"
                >
                  <FiTrash2 className="w-4 h-4" />
                  {deleting ? "Đang xóa..." : "Xóa mục tiêu"}
                </button>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
              <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                <FiAlertCircle className="w-5 h-5" />
                Gợi ý hôm nay
              </h3>
              <ul className="space-y-2 text-amber-700 text-sm">
                <li>• Luyện tập ít nhất {progress.goal.studyHoursPerDay} giờ mỗi ngày</li>
                <li>• Tập trung vào {progress.goal.focusSkills.length > 1 ? "các kỹ năng" : "kỹ năng"}: {progress.goal.focusSkills.join(", ")}</li>
                <li>• Hoàn thành ít nhất 1 bài test đầy đủ mỗi tuần</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Create Goal Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-sm p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Tạo mục tiêu mới</h2>
                {progress && (
                  <button
                    onClick={() => setShowCreate(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Target Band Score */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <FiTarget className="inline w-4 h-4 mr-1" />
                  Mục tiêu Band Score
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="4.5"
                    max="9"
                    step="0.5"
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-2xl font-bold text-blue-600 w-16 text-center">{targetScore}</span>
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <FiCalendar className="inline w-4 h-4 mr-1" />
                  Ngày mục tiêu
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Focus Skills */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <FiTrendingUp className="inline w-4 h-4 mr-1" />
                  Kỹ năng tập trung
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SKILLS.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                        focusSkills.includes(skill.id)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <span className="text-2xl">{skill.icon}</span>
                      <span className="text-sm font-medium">{skill.label}</span>
                      {focusSkills.includes(skill.id) && (
                        <FiCheck className="w-4 h-4 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Hours */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <FiClock className="inline w-4 h-4 mr-1" />
                  Giờ học mỗi ngày
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={studyHours}
                    onChange={(e) => setStudyHours(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-xl font-bold text-blue-600 w-20 text-center">{studyHours} giờ</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCreate}
                disabled={saving || !targetDate || focusSkills.length === 0}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Tạo mục tiêu
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
