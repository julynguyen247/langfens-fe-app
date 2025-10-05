import { useState } from "react";
import {
  FiChevronLeft,
  FiFilter,
  FiEdit3,
  FiBookOpen,
  FiHeadphones,
  FiMic,
} from "react-icons/fi";

type Item = { id: string; label: string };
type Group = {
  id: string;
  title: string;
  icon: "writing" | "reading" | "listening" | "speaking";
  items: Item[];
};

const ICONS = {
  writing: FiEdit3,
  reading: FiBookOpen,
  listening: FiHeadphones,
  speaking: FiMic,
};

export type PracticeSidebarProps = {
  className?: string;
  defaultOpen?: boolean;
  groups?: Group[];
  onChangeSelection?: (payload: { groupId: string; itemId: string }) => void;
};

const DEFAULT_GROUPS: Group[] = [
  {
    id: "writing",
    title: "Writing",
    icon: "writing",
    items: [
      { id: "writing_task1", label: "Task 1" },
      { id: "writing_task2", label: "Task 2" },
    ],
  },
  {
    id: "reading",
    title: "Reading",
    icon: "reading",
    items: [
      { id: "reading_full", label: "Full test" },
      { id: "reading_section", label: "Section" },
    ],
  },
  {
    id: "listening",
    title: "Listening",
    icon: "listening",
    items: [
      { id: "listening_full", label: "Full test" },
      { id: "listening_section", label: "Section" },
    ],
  },
  {
    id: "speaking",
    title: "Speaking",
    icon: "speaking",
    items: [
      { id: "speaking_part1", label: "Part 1" },
      { id: "speaking_part2", label: "Part 2" },
      { id: "speaking_part3", label: "Part 3" },
    ],
  },
];

export default function PracticeSidebar({
  className = "",
  defaultOpen = true,
  groups = DEFAULT_GROUPS,
  onChangeSelection,
}: PracticeSidebarProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [selectedId, setSelectedId] = useState<string>("");

  return (
    <aside
      className={[
        "sticky top-16 h-[calc(100vh-4rem)]  transition-all",
        open ? "w-72" : "w-16",
        className,
      ].join(" ")}
      aria-label="Practice filters"
    >
      <div className="h-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiFilter className="h-4 w-4 text-slate-600" />
            {open && (
              <span className="text-sm font-medium text-slate-700">Filter</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            title={open ? "Collapse" : "Expand"}
          >
            <FiChevronLeft
              className={[
                "h-4 w-4 text-slate-600 transition-transform",
                open ? "" : "rotate-180",
              ].join(" ")}
            />
          </button>
        </div>

        {groups.map((g) => {
          const Icon = ICONS[g.icon];
          return (
            <section key={g.id} className={open ? "mb-3" : "mb-2"}>
              <div
                className={[
                  "flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50",
                  open ? "px-3 py-1.5" : "justify-center py-1",
                ].join(" ")}
              >
                <div className="flex items-center gap-2 text-slate-700">
                  {open && (
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full border border-slate-300" />
                      <span className="inline-block h-2 w-2 rounded-full border border-slate-300" />
                    </div>
                  )}
                  <Icon className="h-4 w-4" />
                  {open && (
                    <span className="text-sm font-semibold">{g.title}</span>
                  )}
                </div>
              </div>
              <div
                className={[
                  "mt-2 rounded-lg border border-slate-200",
                  open ? "px-3 py-2" : "px-1 py-1",
                ].join(" ")}
              >
                {g.items.map((it) => {
                  const value = `${g.id}:${it.id}`;
                  return (
                    <label
                      key={it.id}
                      className={[
                        "flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50",
                        !open && "justify-center",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="practice-radio"
                        value={value}
                        className="h-4 w-4 accent-slate-700"
                        checked={selectedId === value}
                        onChange={() => {
                          setSelectedId(value);
                          onChangeSelection?.({ groupId: g.id, itemId: it.id });
                        }}
                      />
                      {open && (
                        <span className="text-slate-700">{it.label}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
