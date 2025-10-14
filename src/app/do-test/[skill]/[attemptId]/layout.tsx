import TimerDisplay from "./components/common/TimerDisplay";
import TopBar from "./components/common/TopBar";

type Skill = "reading" | "listening" | "writing";
export default async function DoTestAttemptLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { skill: Skill; attemptId: string };
}) {
  const { skill, attemptId } = await params;
  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6]">
      <TopBar
        title={`Làm bài ${skill.charAt(0).toUpperCase() + skill.slice(1)}`}
        subtitle={`IELTS Online Test · ${attemptId.slice(0, 6)}...`}
        rightSlot={<TimerDisplay initialSeconds={75 * 60} />}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
