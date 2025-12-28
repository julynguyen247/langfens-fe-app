"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  createStudyGoal,
  getStudyProgress,
  deleteStudyGoal,
} from "@/utils/api";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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

// Priority focus areas
const FOCUS_AREAS = [
  { id: "w2", skill: "Writing Task 2", gap: -0.5, action: "Review coherence templates & linking words", icon: "edit_note" },
  { id: "l3", skill: "Listening Part 3", gap: -0.3, action: "Practice multiple speakers tracking", icon: "headphones" },
  { id: "r3", skill: "Reading Passage 3", gap: -0.2, action: "Timed practice with academic texts", icon: "auto_stories" },
  { id: "s2", skill: "Speaking Part 2", gap: -0.1, action: "Record & review 2-min monologues", icon: "mic" },
];

const SKILLS = [
  { id: "reading", label: "Reading", icon: "auto_stories" },
  { id: "listening", label: "Listening", icon: "headphones" },
  { id: "writing", label: "Writing", icon: "edit_note" },
  { id: "speaking", label: "Speaking", icon: "mic" },
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

  function getStatusColor(status: string) {
    switch (status) {
      case "AHEAD": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "ON_TRACK": return "bg-blue-50 text-blue-600 border-blue-100";
      case "BEHIND": return "bg-orange-50 text-orange-600 border-orange-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  }

  // Generate heatmap data
  function generateHeatmap() {
    return Array.from({ length: 35 }).map(() => Math.random());
  }

  const heatmapData = generateHeatmap();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 w-64 bg-slate-200 rounded-xl" />
            <div className="h-64 bg-slate-200 rounded-[2rem]" />
          </div>
        </main>
      </div>
    );
  }

  // =============================================
  // CREATE NEW PLAN VIEW
  // =============================================
  if (showCreate || !progress) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <main className="max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="p-10 border-b border-slate-100">
              <h1 className="font-serif text-3xl font-bold text-slate-900">Create Study Plan</h1>
              <p className="text-slate-500 mt-2">Set your target and let AI guide your journey</p>
            </div>

            {/* Form */}
            <div className="p-10 space-y-8">
              
              {/* Target Score */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                  Target Band Score
                </label>
                <div className="flex items-center gap-6">
                  <div className="font-serif text-6xl font-bold text-[#3B82F6]">{targetScore.toFixed(1)}</div>
                  <input
                    type="range"
                    min="5"
                    max="9"
                    step="0.5"
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#3B82F6]"
                  />
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>

              {/* Focus Skills */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                  Focus Areas
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {SKILLS.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        focusSkills.includes(skill.id)
                          ? "bg-[#3B82F6] text-white border-[#3B82F6]"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Icon name={skill.icon} className="text-xl" />
                      <span className="font-medium">{skill.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Hours */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                  Daily Commitment
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4].map((hrs) => (
                    <button
                      key={hrs}
                      onClick={() => setStudyHours(hrs)}
                      className={`flex-1 py-3 rounded-xl border text-center font-bold transition-all ${
                        studyHours === hrs
                          ? "bg-[#3B82F6] text-white border-[#3B82F6]"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleCreate}
                disabled={saving || !targetDate}
                className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white py-4 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Plan"}
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // =============================================
  // STUDY PLAN DASHBOARD (Classic Paper Style)
  // =============================================
  const daysRemaining = getDaysRemaining(progress.goal.targetDate);
  const adherence = Math.round(progress.progress.timeProgress);
  const currentEstimate = progress.current.avgScore ?? (progress.goal.targetBandScore - 0.5);
  const progressPercent = Math.min(100, (currentEstimate / progress.goal.targetBandScore) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="max-w-5xl mx-auto px-4 py-12">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden"
        >
          
          {/* =============================================
              1. HEADER: GAP ANALYSIS
          ============================================= */}
          <div className="p-10 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
              
              {/* Left: Current vs Target */}
              <div className="flex-1 flex items-center gap-8 w-full lg:w-auto">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current</div>
                  <div className="text-6xl font-serif font-bold text-slate-800">{currentEstimate.toFixed(1)}</div>
                </div>
                
                {/* Progress Connector */}
                <div className="flex-1 h-2 bg-slate-100 rounded-full relative mx-4 overflow-visible">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-[#3B82F6] rounded-full"
                  />
                  <div className={`absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full border ${getStatusColor(progress.progress.status)}`}>
                    {getStatusLabel(progress.progress.status)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-widest mb-2">Target</div>
                  <div className="text-6xl font-serif font-bold text-[#3B82F6]">{progress.goal.targetBandScore.toFixed(1)}</div>
                </div>
              </div>

              {/* Right: Stats Grid */}
              <div className="flex gap-10 lg:border-l lg:border-slate-100 lg:pl-10">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${daysRemaining < 7 ? 'text-red-600' : 'text-slate-800'}`}>
                    {daysRemaining}<span className="text-sm text-slate-400 font-normal">d</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-800">{adherence}%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Adherence</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-800">{progress.goal.studyHoursPerDay}h</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Daily</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-50">
              <button
                onClick={() => setShowCreate(true)}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 px-4 py-2"
              >
                Edit Plan
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm font-medium text-red-500 hover:text-red-700 px-4 py-2 disabled:opacity-50"
              >
                {deleting ? "..." : "Delete"}
              </button>
            </div>
          </div>

          {/* =============================================
              2. BODY CONTENT
          ============================================= */}
          <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* LEFT: HEATMAP */}
            <div>
              <h3 className="font-serif font-bold text-xl text-slate-900 mb-6">Study Rhythm</h3>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex flex-wrap gap-1.5">
                  {heatmapData.map((intensity, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-sm ${
                        intensity > 0.7 ? 'bg-[#3B82F6]' :
                        intensity > 0.4 ? 'bg-blue-300' :
                        intensity > 0.2 ? 'bg-blue-100' : 'bg-slate-200'
                      }`}
                      title={`Day ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-slate-400 font-medium">Last 35 Days</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>Less</span>
                    <div className="flex gap-0.5">
                      <div className="w-2 h-2 bg-slate-200 rounded-sm" />
                      <div className="w-2 h-2 bg-blue-100 rounded-sm" />
                      <div className="w-2 h-2 bg-blue-300 rounded-sm" />
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-sm" />
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-500">Tests Completed</span>
                  <span className="font-bold text-slate-800">{progress.current.testsCompleted}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-500">Study Hours</span>
                  <span className="font-bold text-slate-800">{progress.current.studyTimeHours.toFixed(1)}h</span>
                </div>
              </div>
            </div>

            {/* RIGHT: FOCUS AREAS */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif font-bold text-xl text-slate-900">Critical Focus Areas</h3>
                <button className="text-xs font-bold text-slate-400 hover:text-[#3B82F6] transition-colors">
                  View Full Plan
                </button>
              </div>

              <div className="space-y-4">
                {FOCUS_AREAS.map((area) => (
                  <div
                    key={area.id}
                    className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        area.gap <= -0.5 ? 'bg-red-50 text-red-600' :
                        area.gap <= -0.2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Icon name={area.icon} className="text-xl" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-slate-800">{area.skill}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{area.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        area.gap <= -0.5 ? 'text-red-600 bg-red-50' :
                        area.gap <= -0.2 ? 'text-orange-600 bg-orange-50' : 'text-slate-500 bg-slate-100'
                      }`}>
                        {area.gap.toFixed(1)} Gap
                      </span>
                      <button
                        onClick={() => router.push("/practice")}
                        className="text-sm font-bold text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        Start <Icon name="arrow_forward" className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Focus Skills Tags */}
              <div className="mt-8 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Active Skills:</span>
                {progress.goal.focusSkills.map((skill) => (
                  <span key={skill} className="px-3 py-1 text-xs font-medium bg-blue-50 text-[#3B82F6] rounded-full capitalize">
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
