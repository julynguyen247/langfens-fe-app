"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiPlayCircle,
  FiDownload,
} from "react-icons/fi";

type TranscriptLine = { t: number; text: string }; // seconds
type Resource = { label: string; href: string; type?: "file" | "link" };
type Lesson = {
  id: string;
  title: string;
  duration: string;
  videoUrl: string; // mp4 để chủ động seek
  description: string;
  transcript?: TranscriptLine[];
  resources?: Resource[];
};

const LESSONS: Lesson[] = [
  {
    id: "1",
    title: "Giới thiệu khóa học & định hướng học tập",
    duration: "08:32",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description:
      "Mục tiêu, lộ trình và cách học hiệu quả để tối ưu thời gian và điểm số.",
    transcript: [
      { t: 5, text: "Chào mừng bạn đến với khóa học." },
      { t: 25, text: "Cách sử dụng trang học và đánh dấu hoàn thành." },
      { t: 60, text: "Tips quản lý thời gian, lập kế hoạch." },
    ],
    resources: [
      { label: "Syllabus.pdf", href: "/files/syllabus.pdf", type: "file" },
      { label: "Bảng tiêu chí chấm Writing", href: "#", type: "link" },
    ],
  },
  {
    id: "2",
    title: "Cấu trúc bài Writing Task 2",
    duration: "12:14",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "Bố cục Task 2, các dạng đề phổ biến, cách mở bài mạch lạc.",
    transcript: [
      { t: 10, text: "Ôn nhanh cấu trúc 4 phần của bài." },
      { t: 70, text: "Phân loại dạng đề & định hướng ý." },
    ],
    resources: [{ label: "Template mở bài", href: "#", type: "file" }],
  },
  {
    id: "3",
    title: "Phát triển ý và lập dàn bài",
    duration: "10:50",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description:
      "Brainstorm, sắp xếp ý tưởng logic giúp bài viết mạch lạc và có chiều sâu.",
    transcript: [
      { t: 15, text: "Kỹ thuật brainstorm nhanh 3 phút." },
      { t: 90, text: "Chuyển từ ý thô thành dàn bài." },
    ],
    resources: [{ label: "Checklist dàn bài", href: "#", type: "file" }],
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

  // Load completed + note từ localStorage
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

  // Phím tắt: Space play/pause, ←/→ seek 5s
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
    <main className="mx-auto max-w-6xl p-4 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 overflow-scroll">
      {/* MAIN */}
      <section className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Header nhỏ: tiến độ + next/prev */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-700">
              Tiến độ: {progress}%
            </div>
            <div className="h-2 w-40 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-sky-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={currentIdx === 0}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <FiChevronLeft /> Trước
            </button>
            <button
              onClick={goNext}
              disabled={currentIdx === LESSONS.length - 1}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Tiếp <FiChevronRight />
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
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {current.title}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Thời lượng: {current.duration}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="rounded-md border bg-white px-2 py-1 text-sm"
                title="Tốc độ phát"
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
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                  completed.includes(current.id)
                    ? "bg-green-100 text-green-700 cursor-default"
                    : "bg-slate-900 text-white hover:brightness-95"
                }`}
              >
                <FiCheckCircle />
                {completed.includes(current.id)
                  ? "Đã hoàn thành"
                  : "Hoàn thành bài học"}
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-700">{current.description}</p>

          {/* Transcript */}
          {current.transcript?.length ? (
            <div className="rounded-lg border">
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-2 text-left font-semibold"
              >
                <span className="inline-flex items-center gap-2">
                  <FiFileText /> Transcript
                </span>
                <FiChevronDown
                  className={`transition-transform ${
                    showTranscript ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showTranscript && (
                <ul className="divide-y text-sm">
                  {current.transcript.map((line, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-3 px-4 py-2 hover:bg-slate-50"
                    >
                      <span className="text-slate-700">{line.text}</span>
                      <button
                        onClick={() => seekTo(line.t)}
                        className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        {formatTime(line.t)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {/* Ghi chú (lưu theo từng bài) */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">
                Ghi chú của bạn
              </h3>
              <span className="text-xs text-slate-500">
                Tự động lưu theo từng bài
              </span>
            </div>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                localStorage.setItem(`note-${current.id}`, e.target.value);
              }}
              placeholder="Ghi lại ý chính, cấu trúc, từ vựng..."
              className="mt-2 w-full resize-y rounded-md border p-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              rows={4}
            />
          </div>

          {/* Tài nguyên */}
          {current.resources?.length ? (
            <div className="rounded-lg border p-3">
              <h3 className="font-semibold text-slate-900 text-sm">
                Tài nguyên đính kèm
              </h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2 text-sm">
                {current.resources.map((r, i) => (
                  <li key={i}>
                    <a
                      href={r.href}
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-slate-50"
                    >
                      <FiDownload />
                      <span className="font-medium">{r.label}</span>
                      <span className="text-xs text-slate-500">
                        {r.type === "file" ? "File" : "Link"}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {/* SIDEBAR: mục lục */}
      <aside className="mt-6 lg:mt-0">
        <div className="rounded-xl border bg-white shadow-sm">
          <button
            onClick={() => setShowList((v) => !v)}
            className="flex w-full items-center justify-between p-4 font-semibold text-slate-900"
          >
            <span>Nội dung khóa học</span>
            <FiChevronDown
              className={`transition-transform ${showList ? "rotate-180" : ""}`}
            />
          </button>

          {showList && (
            <ul className="divide-y">
              {LESSONS.map((lesson, idx) => {
                const active = idx === currentIdx;
                const done = completed.includes(lesson.id);
                return (
                  <li
                    key={lesson.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`cursor-pointer p-4 text-sm hover:bg-slate-50 ${
                      active ? "bg-slate-100" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiPlayCircle
                          className={active ? "text-sky-500" : "text-slate-400"}
                        />
                        <span className="font-medium text-slate-800">
                          {lesson.title}
                        </span>
                      </div>
                      {done && <FiCheckCircle className="text-green-500" />}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {lesson.duration}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </main>
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
