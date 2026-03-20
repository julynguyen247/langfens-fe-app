"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type TranscriptLine = { t: number; text: string }; // seconds
type Resource = { label: string; href: string; type?: "file" | "link" };
type Lesson = {
  id: string;
  title: string;
  duration: string;
  videoUrl: string; // mp4 to seek
  description: string;
  transcript?: TranscriptLine[];
  resources?: Resource[];
};

const LESSONS: Lesson[] = [
  {
    id: "1",
    title: "Course introduction and study orientation",
    duration: "08:32",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description:
      "Goals, roadmap, and effective study strategies to optimize your time and scores.",
    transcript: [
      { t: 5, text: "Welcome to the course." },
      { t: 25, text: "How to use the learning page and mark complete." },
      { t: 60, text: "Tips for time management and planning." },
    ],
    resources: [
      { label: "Syllabus.pdf", href: "/files/syllabus.pdf", type: "file" },
      { label: "Writing Band Descriptors", href: "#", type: "link" },
    ],
  },
  {
    id: "2",
    title: "Writing Task 2 Structure",
    duration: "12:14",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "Task 2 layout, common question types, and writing clear introductions.",
    transcript: [
      { t: 10, text: "Quick review of the 4-part structure." },
      { t: 70, text: "Question type classification and idea generation." },
    ],
    resources: [{ label: "Intro Template", href: "#", type: "file" }],
  },
  {
    id: "3",
    title: "Idea Development and Outlining",
    duration: "10:50",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description:
      "Brainstorming, organizing ideas logically for coherent and in-depth essays.",
    transcript: [
      { t: 15, text: "3-minute quick brainstorm technique." },
      { t: 90, text: "Converting raw ideas into an outline." },
    ],
    resources: [{ label: "Outline Checklist", href: "#", type: "file" }],
  },
];

export default function CourseLearnPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const current = LESSONS[currentIdx];
  const [completed, setCompleted] = useState<string[]>([]);
  const [showList, setShowList] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [rate, setRate] = useState(1);
  const [note, setNote] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load completed + note from localStorage
  useEffect(() => {
    const c = JSON.parse(localStorage.getItem("completed-lessons") || "[]");
    setCompleted(c);
  }, []);
  useEffect(() => {
    localStorage.setItem("completed-lessons", JSON.stringify(completed));
  }, [completed]);

  useEffect(() => {
    const saved = localStorage.getItem(`note-${current.id}`) || "";
    setNote(saved);
  }, [current.id]);

  const progress = useMemo(
    () => Math.round((completed.length / LESSONS.length) * 100),
    [completed.length]
  );

  const markDone = () => {
    if (!completed.includes(current.id)) {
      setCompleted((prev) => [...prev, current.id]);
    }
  };

  const goPrev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const goNext = () =>
    setCurrentIdx((i) => Math.min(LESSONS.length - 1, i + 1));

  const seekTo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      videoRef.current.play();
    }
  };

  // Keyboard shortcuts: Space play/pause, left/right seek 5s
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      if (["INPUT", "TEXTAREA"].includes((e.target as any)?.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
      } else if (e.code === "ArrowRight") {
        videoRef.current.currentTime += 5;
      } else if (e.code === "ArrowLeft") {
        videoRef.current.currentTime -= 5;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }, [rate]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Fixed progress bar at top */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-[var(--primary-light)] z-50">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-10 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
        {/* MAIN */}
        <section>
          {/* Video Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden"
          >
            {/* Header: progress + actions */}
            <div className="flex items-center justify-between px-5 py-3 border-b-[2px] border-[var(--border)] bg-[var(--background)]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[var(--text-body)]">
                  Progress:
                </span>
                <span
                  className="text-sm font-bold text-[var(--primary)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {progress}%
                </span>
                <div className="h-3 w-40 rounded-full bg-[var(--primary-light)] overflow-hidden border-[2px] border-[var(--border)]">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="rounded-full border-[2px] border-[var(--border)] bg-white px-3 py-1.5 text-sm font-bold text-[var(--text-body)] focus:border-[var(--primary)] outline-none transition-colors"
                  title="Playback speed"
                >
                  {[0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
                    <option key={r} value={r}>
                      {r}x
                    </option>
                  ))}
                </select>
                <button
                  onClick={markDone}
                  disabled={completed.includes(current.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    completed.includes(current.id)
                      ? "bg-green-50 text-green-700 border-[2px] border-green-200 cursor-default"
                      : "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]"
                  }`}
                >
                  {completed.includes(current.id)
                    ? "Completed"
                    : "Mark complete"}
                </button>
              </div>
            </div>

            {/* VIDEO */}
            <div className="aspect-video bg-black">
              <video
                ref={videoRef}
                controls
                className="w-full h-full"
                src={current.videoUrl}
              />
            </div>

            {/* BODY */}
            <div className="p-6 space-y-5">
              {/* Lesson info */}
              <div>
                <h1
                  className="text-xl font-bold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {current.title}
                </h1>
                <p
                  className="text-xs text-[var(--text-muted)] font-bold mt-1"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Duration: {current.duration}
                </p>
              </div>

              <p className="text-sm text-[var(--text-body)] leading-relaxed">{current.description}</p>

              {/* Transcript */}
              {current.transcript?.length ? (
                <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden">
                  <button
                    onClick={() => setShowTranscript((v) => !v)}
                    className="flex w-full items-center justify-between px-5 py-3 text-left font-bold text-sm text-[var(--foreground)] bg-[var(--background)] hover:bg-[var(--primary-light)] transition-colors"
                  >
                    <span>Transcript</span>
                    <span className="text-[var(--text-muted)] text-xs font-bold">
                      {showTranscript ? "Hide" : "Show"}
                    </span>
                  </button>
                  {showTranscript && (
                    <ul className="divide-y-[2px] divide-[var(--border)] text-sm">
                      {current.transcript.map((line, i) => (
                        <li
                          key={i}
                          className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-[var(--primary-light)] transition-colors"
                        >
                          <span className="text-[var(--text-body)]">{line.text}</span>
                          <button
                            onClick={() => seekTo(line.t)}
                            className="shrink-0 rounded-full border-[2px] border-[var(--border)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {formatTime(line.t)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {/* Notes (saved per lesson) */}
              <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5">
                <div className="flex items-center justify-between">
                  <h3
                    className="font-bold text-[var(--foreground)] text-sm"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Your notes
                  </h3>
                  <span className="text-xs text-[var(--text-muted)] font-bold">
                    Auto-saved per lesson
                  </span>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    localStorage.setItem(`note-${current.id}`, e.target.value);
                  }}
                  placeholder="Write down key ideas, structures, vocabulary..."
                  className="mt-3 w-full resize-y rounded-[1.5rem] border-[2px] border-[var(--border)] p-4 text-sm outline-none focus:border-[var(--primary)] text-[var(--text-body)] transition-colors"
                  rows={4}
                />
              </div>

              {/* Resources */}
              {current.resources?.length ? (
                <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5">
                  <h3
                    className="font-bold text-[var(--foreground)] text-sm"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Attached resources
                  </h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                    {current.resources.map((r, i) => (
                      <li key={i}>
                        <a
                          href={r.href}
                          className="inline-flex items-center gap-2 rounded-full border-[2px] border-[var(--border)] px-4 py-2 font-bold text-[var(--text-body)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
                        >
                          <span>{r.label}</span>
                          <span className="text-xs text-[var(--text-muted)] bg-[var(--background)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                            {r.type === "file" ? "File" : "Link"}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4 border-t-[2px] border-[var(--border)]">
                <button
                  onClick={goPrev}
                  disabled={currentIdx === 0}
                  className="px-6 py-3 rounded-full font-bold text-sm text-[var(--text-body)] bg-white border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-[var(--border)] disabled:hover:text-[var(--text-body)] transition-all"
                >
                  Previous Lesson
                </button>
                <button
                  onClick={goNext}
                  disabled={currentIdx === LESSONS.length - 1}
                  className="px-6 py-3 rounded-full bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] text-white font-bold text-sm hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] disabled:opacity-40 disabled:hover:translate-y-0 transition-all"
                >
                  Next Lesson
                </button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* SIDEBAR: table of contents */}
        <aside className="mt-6 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden sticky top-12"
          >
            <button
              onClick={() => setShowList((v) => !v)}
              className="flex w-full items-center justify-between p-5 font-bold text-[var(--foreground)] bg-[var(--background)] hover:bg-[var(--primary-light)] transition-colors"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <span>Course content</span>
              <span className="text-xs text-[var(--text-muted)] font-bold">
                {showList ? "Hide" : "Show"}
              </span>
            </button>

            {showList && (
              <ul className="divide-y-[2px] divide-[var(--border)]">
                {LESSONS.map((lesson, idx) => {
                  const active = idx === currentIdx;
                  const done = completed.includes(lesson.id);
                  return (
                    <li
                      key={lesson.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`cursor-pointer p-4 text-sm transition-all ${
                        active
                          ? "bg-[var(--primary-light)] border-l-[4px] border-l-[var(--primary)]"
                          : "hover:bg-[var(--background)] border-l-[4px] border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-[2px]
                            ${done
                              ? "bg-green-100 border-green-300 text-green-700"
                              : active
                              ? "bg-[var(--primary)] border-[var(--primary-dark)] text-white"
                              : "bg-[var(--background)] border-[var(--border)] text-[var(--text-muted)]"
                            }
                          `}>
                            {done ? "ok" : idx + 1}
                          </span>
                          <span className={`font-bold ${active ? "text-[var(--primary)]" : "text-[var(--text-body)]"}`}>
                            {lesson.title}
                          </span>
                        </div>
                      </div>
                      <div
                        className="text-xs text-[var(--text-muted)] mt-1 ml-8 font-bold"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {lesson.duration}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        </aside>
      </div>
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
}
