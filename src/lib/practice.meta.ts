// lib/practice.meta.ts
export type GroupId = "writing" | "reading" | "listening" | "speaking";

export const GROUPS: Record<
  GroupId,
  { title: string; items: { id: string; label: string }[] }
> = {
  writing: {
    title: "Writing",
    items: [
      { id: "writing_task1", label: "Task 1" },
      { id: "writing_task2", label: "Task 2" },
    ],
  },
  reading: {
    title: "Reading",
    items: [
      { id: "reading_full", label: "Full test" },
      { id: "reading_section", label: "Section" },
    ],
  },
  listening: {
    title: "Listening",
    items: [
      { id: "listening_full", label: "Full test" },
      { id: "listening_section", label: "Section" },
    ],
  },
  speaking: {
    title: "Speaking",
    items: [
      { id: "speaking_part1", label: "Part 1" },
      { id: "speaking_part2", label: "Part 2" },
      { id: "speaking_part3", label: "Part 3" },
    ],
  },
};

export function isValidGroup(g: string): g is GroupId {
  return g in GROUPS;
}
export function isValidItem(group: GroupId, item: string) {
  return GROUPS[group].items.some((it) => it.id === item);
}
export function firstItemOf(group: GroupId) {
  return GROUPS[group].items[0]?.id;
}
