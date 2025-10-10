import { notFound } from "next/navigation";
import { GroupId, isValidGroup } from "@/lib/practice.meta";

function makeItemDetail(group: GroupId, itemId: string) {
  return {
    id: itemId,
    title: `Detail for ${itemId}`,
    questions: 40,
  };
}

export default function ItemPage({
  params,
}: {
  params: { group: string; item: string };
}) {
  const group = params.group as GroupId;
  const itemId = params.item;
  if (!isValidGroup(group)) notFound();

  const data = makeItemDetail(group, itemId);
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-xl font-bold">{data.title}</h1>
      <p className="text-slate-600">Questions: {data.questions}</p>
    </main>
  );
}
