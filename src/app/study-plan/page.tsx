"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  createStudyGoal,
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

const FOCUS_AREAS = [
  { id: "w2", skill: "Writing Task 2", gap: -0.5, action: "Review coherence templates & linking words" },
  { id: "l3", skill: "Listening Part 3", gap: -0.3, action: "Practice multiple speakers tracking" },
  { id: "r3", skill: "Reading Passage 3", gap: -0.2, action: "Timed practice with academic texts" },
  { id: "s2", skill: "Speaking Part 2", gap: -0.1, action: "Record & review 2-min monologues" },
];

const SKILLS = [
  { id: "reading", label: "Reading" },
  { id: "listening", label: "Listening" },
  { id: "writing", label: "Writing" },
  { id: "speaking", label: "Speaking" },
];

const SKILL_BADGE_STYLES: Record<string, string> = {
  reading: "bg-[var(--skill-reading-light)] text-[var(--skill-reading)] border-[var(--skill-reading-border)]",
  listening: "bg-[var(--skill-listening-light)] text-[var(--skill-listening)] border-[var(--skill-listening-border)]",
  writing: "bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[var(--skill-writing-border)]",
  speaking: "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]",
};

export default function StudyPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (!confirm("Are you sure you want to delete this plan?")) return;
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

  function getStatusLabel(status: string) {
    switch (status) {
      case "AHEAD": return "Ahead";
      case "ON_TRACK": return "On Track";
      case "BEHIND": return "Behind";
      default: return status;
    }
  }

  function getStatusBadgeStyle(status: string) {
    switch (status) {
      case "AHEAD": return "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]";
      case "ON_TRACK": return "bg-[var(--skill-reading-light)] text-[var(--skill-reading)] border-[var(--skill-reading-border)]";
      case "BEHIND": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-[var(--background)] text-[var(--text-body)] border-[var(--border)]";
    }
  }

  function generateHeatmap() {
    return Array.from({ length: 35 }).map(() => Math.random());
  }

  const heatmapData = generateHeatmap();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 w-64 bg-[var(--border)] rounded-full" />
            <div className="h-64 bg-[var(--border)] rounded-[1.5rem]" />
          </div>
        </main>
      </div>
    );
  }

  // CREATE NEW PLAN VIEW
  if (showCreate || !progress) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b-[2px] border-[var(--border)]">
              <h1
                className="text-3xl font-extrabold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Create Study Plan
              </h1>
              <p className="text-[var(--text-muted)] mt-2">Set your target and let AI guide your journey</p>
            </div>

            {/* Form */}
            <div className="p-8 space-y-8">

              {/* Target Score */}
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-3">
                  Target Band Score
                </label>
                <div className="flex items-center gap-6">
                  <div
                    className="text-6xl font-extrabold text-[var(--primary)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {targetScore.toFixed(1)}
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="9"
                    step="0.5"
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseFloat(e.target.value))}
                    className="flex-1 h-3 bg-[var(--primary-light)] rounded-full appearance-none cursor-pointer accent-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-3">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border-[3px] border-[var(--border)] px-5 py-3 rounded-full text-[var(--foreground)] font-bold focus:outline-none focus:border-[var(--primary)] transition-all"
                />
              </div>

              {/* Focus Skills */}
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-3">
                  Focus Areas
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {SKILLS.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full border-[3px] font-bold transition-all ${
                        focusSkills.includes(skill.id)
                          ? "bg-[var(--primary)] text-white border-[var(--primary-dark)] border-b-[5px]"
                          : "bg-white text-[var(--text-body)] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5"
                      }`}
                    >
                      {skill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Hours */}
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-3">
                  Daily Commitment
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4].map((hrs) => (
                    <button
                      key={hrs}
                      onClick={() => setStudyHours(hrs)}
                      className={`flex-1 py-3 rounded-full border-[3px] text-center font-bold transition-all ${
                        studyHours === hrs
                          ? "bg-[var(--primary)] text-white border-[var(--primary-dark)] border-b-[5px]"
                          : "bg-white text-[var(--text-body)] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5"
                      }`}
                    >
                      <span style={{ fontFamily: "var(--font-mono)" }}>{hrs}</span>h
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleCreate}
                disabled={saving || !targetDate}
                className="w-full rounded-full bg-[var(--primary)] text-white py-4 font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Plan"}
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // STUDY PLAN DASHBOARD
  const daysRemaining = getDaysRemaining(progress.goal.targetDate);
  const adherence = Math.round(progress.progress.timeProgress);
  const currentEstimate = progress.current.avgScore ?? (progress.goal.targetBandScore - 0.5);
  const progressPercent = Math.min(100, (currentEstimate / progress.goal.targetBandScore) * 100);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden"
        >

          {/* HEADER: GAP ANALYSIS */}
          <div className="p-8 border-b-[2px] border-[var(--border)]">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10">

              {/* Left: Current vs Target */}
              <div className="flex-1 flex items-center gap-8 w-full lg:w-auto">
                <div className="text-center">
                  <div className="text-xs font-bold text-[var(--text-muted)] mb-2">Current</div>
                  <div
                    className="text-6xl font-extrabold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {currentEstimate.toFixed(1)}
                  </div>
                </div>

                {/* Progress Connector */}
                <div className="flex-1 h-3 bg-[var(--primary-light)] rounded-full relative mx-4 overflow-visible">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-[var(--primary)] rounded-full"
                  />
                  <div className={`absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full border-[2px] ${getStatusBadgeStyle(progress.progress.status)}`}>
                    {getStatusLabel(progress.progress.status)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs font-bold text-[var(--primary)] mb-2">Target</div>
                  <div
                    className="text-6xl font-extrabold text-[var(--primary)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {progress.goal.targetBandScore.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Right: Stats Grid */}
              <div className="flex gap-6 lg:border-l-[2px] lg:border-[var(--border)] lg:pl-8">
                <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-5 py-4 text-center">
                  <div
                    className={`text-3xl font-extrabold ${daysRemaining < 7 ? 'text-[var(--destructive)]' : 'text-[var(--foreground)]'}`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {daysRemaining}<span className="text-sm text-[var(--text-muted)] font-bold">d</span>
                  </div>
                  <div className="text-xs font-bold text-[var(--text-muted)] mt-1">Remaining</div>
                </div>
                <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-5 py-4 text-center">
                  <div
                    className="text-3xl font-extrabold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {adherence}%
                  </div>
                  <div className="text-xs font-bold text-[var(--text-muted)] mt-1">Adherence</div>
                </div>
                <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-5 py-4 text-center">
                  <div
                    className="text-3xl font-extrabold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {progress.goal.studyHoursPerDay}h
                  </div>
                  <div className="text-xs font-bold text-[var(--text-muted)] mt-1">Daily</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t-[2px] border-[var(--border)]">
              <button
                onClick={() => setShowCreate(true)}
                className="text-sm font-bold text-[var(--primary)] bg-[var(--primary-light)] px-5 py-2 rounded-full border-[2px] border-[var(--skill-reading-border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary-dark)] transition-all"
              >
                Edit Plan
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm font-bold text-[var(--destructive)] bg-red-50 px-5 py-2 rounded-full border-[2px] border-red-200 hover:bg-[var(--destructive)] hover:text-white hover:border-red-700 transition-all disabled:opacity-50"
              >
                {deleting ? "..." : "Delete"}
              </button>
            </div>
          </div>

          {/* BODY CONTENT */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT: HEATMAP */}
            <div>
              <h3
                className="font-bold text-xl text-[var(--foreground)] mb-6"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Study Rhythm
              </h3>
              <div className="bg-[var(--primary-light)] rounded-[1.5rem] p-6 border-[3px] border-[var(--skill-reading-border)]">
                <div className="flex flex-wrap gap-1.5">
                  {heatmapData.map((intensity, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-md ${
                        intensity > 0.7 ? 'bg-[var(--primary)]' :
                        intensity > 0.4 ? 'bg-[var(--skill-reading-border)]' :
                        intensity > 0.2 ? 'bg-[var(--skill-reading-light)]' : 'bg-white'
                      }`}
                      title={`Day ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs font-bold text-[var(--text-muted)]">Last 35 Days</p>
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <span>Less</span>
                    <div className="flex gap-0.5">
                      <div className="w-2.5 h-2.5 bg-white rounded-sm border border-[var(--skill-reading-border)]" />
                      <div className="w-2.5 h-2.5 bg-[var(--skill-reading-light)] rounded-sm" />
                      <div className="w-2.5 h-2.5 bg-[var(--skill-reading-border)] rounded-sm" />
                      <div className="w-2.5 h-2.5 bg-[var(--primary)] rounded-sm" />
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center p-4 bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)]">
                  <span className="text-sm font-bold text-[var(--text-body)]">Tests Completed</span>
                  <span
                    className="font-extrabold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {progress.current.testsCompleted}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)]">
                  <span className="text-sm font-bold text-[var(--text-body)]">Study Hours</span>
                  <span
                    className="font-extrabold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {progress.current.studyTimeHours.toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: FOCUS AREAS */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="font-bold text-xl text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Critical Focus Areas
                </h3>
                <button className="text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] px-4 py-1.5 rounded-full border-[2px] border-[var(--skill-reading-border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary-dark)] transition-all">
                  View Full Plan
                </button>
              </div>

              <div className="space-y-4">
                {FOCUS_AREAS.map((area) => (
                  <div
                    key={area.id}
                    className="group flex items-center justify-between p-4 bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] transition-all hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)]"
                  >
                    <div>
                      <h4
                        className="font-bold text-[var(--foreground)]"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {area.skill}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{area.action}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border-[2px] ${
                        area.gap <= -0.5 ? 'text-red-700 bg-red-50 border-red-200' :
                        area.gap <= -0.2 ? 'text-orange-700 bg-orange-50 border-orange-200' : 'text-[var(--text-muted)] bg-[var(--background)] border-[var(--border)]'
                      }`}>
                        {area.gap.toFixed(1)} Gap
                      </span>
                      <button
                        onClick={() => router.push("/practice")}
                        className="text-sm font-bold text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--primary-light)] px-4 py-1.5 rounded-full border-[2px] border-[var(--skill-reading-border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary-dark)]"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Focus Skills Tags */}
              <div className="mt-8 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[var(--text-muted)]">Active Skills:</span>
                {progress.goal.focusSkills.map((skill) => (
                  <span
                    key={skill}
                    className={`px-3 py-1 text-xs font-bold rounded-full border-[2px] capitalize ${SKILL_BADGE_STYLES[skill] || "bg-[var(--primary-light)] text-[var(--primary)] border-[var(--skill-reading-border)]"}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </motion.div>

      </main>
    </div>
  );
}
