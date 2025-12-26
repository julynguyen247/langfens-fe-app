"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FiBook, FiPlay, FiCheck, FiArrowLeft, FiFileText, 
  FiChevronDown, FiChevronRight, FiClock, FiMenu, FiX,
  FiCheckCircle, FiCircle, FiPlayCircle
} from "react-icons/fi";
import { getCourseBySlug, getLessonById, completeLesson } from "@/utils/api";
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

export default function CourseLearnPage() {
  const params = useParams();
  const slug = params?.id as string;
  const router = useRouter();
  const { user } = useUserStore();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<string>("");
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"content" | "quiz" | "notes">("content");

  // Fetch course
  useEffect(() => {
    async function fetchCourse() {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await getCourseBySlug(slug);
        const data = (res as any).data?.data;
        if (Array.isArray(data) && data.length > 0) {
          const courseData = data[0];
          setCourse(courseData);
          if (courseData.lessons?.length > 0) {
            const sortedLessons = [...courseData.lessons].sort((a, b) => a.idx - b.idx);
            setSelectedLesson(sortedLessons[0]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch course:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [slug]);

  // Fetch lesson content
  useEffect(() => {
    async function fetchLesson() {
      if (!selectedLesson?.id) return;
      try {
        setLoadingLesson(true);
        setActiveTab("content");
        const res = await getLessonById(selectedLesson.id);
        const data = (res as any).data?.data;
        setLessonContent(data?.contentMd || "");
      } catch (e) {
        console.error("Failed to fetch lesson:", e);
        setLessonContent("");
      } finally {
        setLoadingLesson(false);
      }
    }
    fetchLesson();
  }, [selectedLesson?.id]);

  const handleCompleteLesson = async () => {
    if (!selectedLesson || !user?.id) return;
    try {
      await completeLesson(user.id, selectedLesson.id);
      setCompletedLessons(prev => new Set([...prev, selectedLesson.id]));
      
      // Go to next lesson
      if (course?.lessons) {
        const sorted = [...course.lessons].sort((a, b) => a.idx - b.idx);
        const currentIdx = sorted.findIndex(l => l.id === selectedLesson.id);
        if (currentIdx < sorted.length - 1) {
          setSelectedLesson(sorted[currentIdx + 1]);
        }
      }
    } catch (e) {
      console.error("Failed to complete lesson:", e);
    }
  };

  const progress = course?.lessons 
    ? Math.round((completedLessons.size / course.lessons.length) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-700">Không tìm thấy khóa học</h2>
        <Link href="/courses" className="mt-4 text-blue-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const sortedLessons = [...(course.lessons || [])].sort((a, b) => a.idx - b.idx);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg mr-2 lg:hidden"
        >
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
        
        <Link href="/courses" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <FiArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Khóa học</span>
        </Link>
        
        <div className="mx-4 h-6 w-px bg-slate-200" />
        
        <h1 className="text-sm font-medium text-slate-900 truncate flex-1">
          {course.title}
        </h1>
        
        {/* Progress pill */}
        <div className="flex items-center gap-2 ml-4">
          <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <span className="text-xs text-slate-600">{progress}%</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Lesson list */}
        <aside className={`
          w-80 bg-white border-r border-slate-200 flex-shrink-0 overflow-y-auto
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          absolute lg:relative z-20 h-[calc(100vh-3.5rem)]
        `}>
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Nội dung khóa học</h2>
            <p className="text-sm text-slate-500 mt-1">{sortedLessons.length} bài học</p>
          </div>
          
          <nav className="p-2">
            {sortedLessons.map((lesson, idx) => {
              const isActive = selectedLesson?.id === lesson.id;
              const isCompleted = completedLessons.has(lesson.id);
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLesson(lesson);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`
                    w-full text-left rounded-lg p-3 mb-1 flex items-start gap-3 transition
                    ${isActive 
                      ? "bg-blue-50 border-l-4 border-blue-500" 
                      : "hover:bg-slate-50 border-l-4 border-transparent"
                    }
                  `}
                >
                  {/* Status icon */}
                  <span className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <FiCheckCircle className="h-5 w-5 text-green-500" />
                    ) : isActive ? (
                      <FiPlayCircle className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FiCircle className="h-5 w-5 text-slate-300" />
                    )}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isActive ? "text-blue-700" : "text-slate-700"}`}>
                      {idx + 1}. {lesson.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      {lesson.durationMin && (
                        <span className="flex items-center gap-1">
                          <FiClock className="h-3 w-3" />
                          {lesson.durationMin} min
                        </span>
                      )}
                      {lesson.quizExamId && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <FiFileText className="h-3 w-3" />
                          Quiz
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {selectedLesson ? (
            <div className="max-w-4xl mx-auto">
              {/* Tabs */}
              <div className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("content")}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                      activeTab === "content" 
                        ? "border-blue-500 text-blue-600" 
                        : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Nội dung bài học
                  </button>
                  {selectedLesson.quizExamId && (
                    <button
                      onClick={() => setActiveTab("quiz")}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                        activeTab === "quiz" 
                          ? "border-blue-500 text-blue-600" 
                          : "border-transparent text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Bài tập
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                      activeTab === "notes" 
                        ? "border-blue-500 text-blue-600" 
                        : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Ghi chú
                  </button>
                </div>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === "content" && (
                  <div>
                    {/* Lesson header */}
                    <div className="mb-6">
                      <span className="text-sm text-slate-500">
                        Bài {selectedLesson.idx} / {sortedLessons.length}
                      </span>
                      <h2 className="text-2xl font-bold text-slate-900 mt-1">
                        {selectedLesson.title}
                      </h2>
                      {selectedLesson.durationMin && (
                        <span className="text-sm text-slate-500 flex items-center gap-1 mt-2">
                          <FiClock className="h-4 w-4" />
                          Thời lượng: {selectedLesson.durationMin} phút
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    {loadingLesson ? (
                      <div className="flex justify-center py-20">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                      </div>
                    ) : lessonContent ? (
                      <article className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:leading-relaxed">
                        <ReactMarkdown>{lessonContent}</ReactMarkdown>
                      </article>
                    ) : (
                      <div className="text-center py-20 text-slate-500">
                        <FiBook className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>Chưa có nội dung cho bài học này.</p>
                      </div>
                    )}

                    {/* Complete button */}
                    <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        {completedLessons.has(selectedLesson.id) ? (
                          <span className="flex items-center gap-2 text-green-600">
                            <FiCheckCircle className="h-5 w-5" />
                            Đã hoàn thành
                          </span>
                        ) : null}
                      </div>
                      
                      <button
                        onClick={handleCompleteLesson}
                        disabled={completedLessons.has(selectedLesson.id)}
                        className={`
                          px-6 py-3 rounded-lg font-medium transition
                          ${completedLessons.has(selectedLesson.id)
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                          }
                        `}
                      >
                        {completedLessons.has(selectedLesson.id) 
                          ? "Đã hoàn thành" 
                          : "Hoàn thành & Tiếp tục"
                        }
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "quiz" && selectedLesson.quizExamId && (
                  <div className="text-center py-10">
                    <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 p-8">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiFileText className="h-8 w-8 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Bài tập thực hành
                      </h3>
                      <p className="text-slate-600 text-sm mb-6">
                        Làm bài tập để kiểm tra kiến thức bạn đã học trong bài này.
                      </p>
                      <Link
                        href={`/do-test/${selectedLesson.quizExamId}`}
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition"
                      >
                        <FiPlay className="h-4 w-4" />
                        Bắt đầu làm bài
                      </Link>
                    </div>
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="text-center py-10">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiBook className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Ghi chú của bạn
                      </h3>
                      <p className="text-slate-600 text-sm mb-6">
                        Tính năng ghi chú sẽ sớm được cập nhật.
                      </p>
                      <textarea
                        placeholder="Ghi chú của bạn ở đây..."
                        className="w-full h-40 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FiBook className="h-12 w-12 mx-auto text-slate-300" />
                <p className="mt-4 text-slate-600">Chọn một bài học để bắt đầu</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
