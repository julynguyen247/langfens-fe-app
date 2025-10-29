import { useUserStore } from "@/app/store/userStore";
import PracticeBank, { PracticeItem } from "@/components/PracticeBank";
import { isValidGroup } from "@/lib/practice.meta";

type Props = {
  params: Promise<{ group: string }>;
  searchParams: Promise<{ tab?: "todo" | "done"; q?: string }>;
};

export default async function GroupPage({ params, searchParams }: Props) {
  const { group } = await params;
  const sp = await searchParams;
  const tab = (sp.tab ?? "todo") as "todo" | "done";
  const q = (sp.q ?? "").toLowerCase();

  const { user } = useUserStore();

  if (!isValidGroup(group))
    return import("next/navigation").then((m) => m.notFound());

  const demoItems: PracticeItem[] = Array.from({ length: 24 }, (_, i) => ({
    id: `reading-set-${i + 1}`,
    title: `Practice ${i + 1}`,
    summary: "Gap Filling",
    section: `Section ${(i % 3) + 1}`,
    thumb:
      "https://images.unsplash.com/photo-1526481280698-8fcc13fd5f1d?q=80&w=1200&auto=format&fit=crop",
    attemps: 500 + i * 7,
    done: i % 5 === 0,
    tags: [group],
    skill: group,
  }));

  const items = demoItems
    .filter((it) => it.tags?.includes(group))
    .filter((it) => (tab === "todo" ? !it.done : it.done))
    .filter(
      (it) =>
        !q ||
        it.title.toLowerCase().includes(q) ||
        it.summary.toLowerCase().includes(q)
    );

  if (!user?.id) {
    return (
      <div className="p-6 text-center text-slate-600">
        Bạn cần đăng nhập để xem danh sách bài luyện tập.
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6">
      <PracticeBank
        items={items}
        pageSize={12}
        userId={user.id}
        skill={group}
      />
    </main>
  );
}
