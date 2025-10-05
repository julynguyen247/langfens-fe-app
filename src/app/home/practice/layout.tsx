"use client";
import PracticeSidebar from "./components/Sidebar";
import PracticeHeader from "./components/TestHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="">
        <PracticeHeader
          title="Luyện tập"
          subtitle="Writing task 1"
          href="/practice/writing/task1"
          description="Practice your writing with confidence, improve step by step, and achieve the IELTS score you deserve."
        />
      </div>

      <div className=" max-w-7xl  flex gap-2">
        <PracticeSidebar onChangeSelection={() => {}} />
        <main className="min-h-[60vh]">{children}</main>
      </div>
    </div>
  );
}
