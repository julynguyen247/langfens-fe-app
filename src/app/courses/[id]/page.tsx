"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getCourseBySlug } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";
import ReactMarkdown from "react-markdown";

type Lesson = {
  id: string;
  idx: number;
  title: string;
  durationMin?: number;
  quizExamId?: string;
  contentMd?: string;
};

type Course = {
  id: string;
  slug: string;
  title: string;
  descriptionMd?: string;
  category?: string;
  level?: string;
  status: string;
  lessons: Lesson[];
};

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params?.id as string;
  const router = useRouter();
  const { user } = useUserStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await getCourseBySlug(slug);
        const data = (res as any).data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setCourse(data[0]);
        }
      } catch (e) {
        console.error("Failed to fetch course:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-10 h-10 border-[3px] border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <h2
          className="text-xl font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Course not found
        </h2>
        <Link
          href="/courses"
          className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] font-bold"
        >
          Back to courses
        </Link>
      </div>
    );
  }

  const sortedLessons = [...(course.lessons || [])].sort((a, b) => a.idx - b.idx);
  const totalDuration = sortedLessons.reduce((sum, l) => sum + (l.durationMin ?? 0), 0);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/courses"
            className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
          >
            Back to courses
          </Link>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 sm:p-10 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              {course.category && (
                <span className="inline-block text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] px-3 py-1 rounded-full border-[2px] border-[var(--border)] mb-4">
                  {course.category}
                </span>
              )}
              <h1
                className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mb-3"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {course.title}
              </h1>
              {course.descriptionMd && (
                <div className="prose prose-sm max-w-none text-[var(--text-body)] leading-relaxed">
                  <ReactMarkdown>{course.descriptionMd}</ReactMarkdown>
                </div>
              )}
              {course.level && (
                <span className="inline-block mt-4 text-xs font-bold text-[var(--skill-writing)] bg-[var(--skill-writing-light)] px-3 py-1 rounded-full border-[2px] border-[var(--skill-writing-border)]">
                  {course.level}
                </span>
              )}
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => router.push(`/courses/${slug}/learn`)}
                className="rounded-full bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] text-white font-bold px-8 py-4 text-lg hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
              >
                Start Course
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 text-center">
            <span
              className="text-3xl font-extrabold text-[var(--foreground)] block mb-1"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {sortedLessons.length}
            </span>
            <span className="text-sm font-bold text-[var(--text-muted)]">Lessons</span>
          </div>
          <div className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 text-center">
            <span
              className="text-3xl font-extrabold text-[var(--foreground)] block mb-1"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {totalDuration > 0 ? `${totalDuration}` : "--"}
            </span>
            <span className="text-sm font-bold text-[var(--text-muted)]">Minutes estimated</span>
          </div>
          <div className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 text-center">
            <span
              className="text-3xl font-extrabold text-[var(--foreground)] block mb-1"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {course.level || "All"}
            </span>
            <span className="text-sm font-bold text-[var(--text-muted)]">Difficulty</span>
          </div>
        </motion.div>

        {/* Lesson List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2
            className="text-2xl font-bold text-[var(--foreground)] mb-6"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Course content
          </h2>

          <div className="space-y-3">
            {sortedLessons.map((lesson, idx) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.03 }}
                className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 flex items-center gap-4 hover:-translate-y-[2px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all"
              >
                {/* Number circle */}
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--primary-light)] border-[2px] border-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--primary)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[var(--text-body)]">
                    {lesson.title}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {lesson.durationMin && (
                      <span
                        className="text-xs font-bold text-[var(--text-muted)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {lesson.durationMin} min
                      </span>
                    )}
                    {lesson.quizExamId && (
                      <span className="text-xs font-bold text-[var(--skill-writing)] bg-[var(--skill-writing-light)] px-2 py-0.5 rounded-full border border-[var(--skill-writing-border)]">
                        Quiz
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        {sortedLessons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-10 text-center"
          >
            <button
              onClick={() => router.push(`/courses/${slug}/learn`)}
              className="rounded-full bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] text-white font-bold px-10 py-4 text-lg hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
            >
              Start Course
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
