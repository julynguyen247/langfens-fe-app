"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { GROUPS, GroupId } from "@/lib/practice.meta";
import { useMemo, useState } from "react";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

// Skill icons mapping
const SKILL_ICONS: Record<string, string> = {
  reading: "menu_book",
  listening: "headphones",
  writing: "edit_note",
  speaking: "mic",
};

export default function PracticeSidebar({
  className = "",
}: {
  className?: string;
}) {
  const params = useParams<{ group?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentGroup = params.group as GroupId | undefined;
  const currentItem = searchParams.get("item") ?? undefined;

  // Track which accordion is open
  const [openGroup, setOpenGroup] = useState<GroupId | null>(currentGroup || null);

  const selectedId = useMemo(
    () => (currentGroup && currentItem ? `${currentGroup}:${currentItem}` : ""),
    [currentGroup, currentItem]
  );

  const handleGroupClick = (group: GroupId) => {
    setOpenGroup(openGroup === group ? null : group);
  };

  return (
    <aside
      className={[
        "sticky top-16 h-[calc(100vh-4rem)] w-72 bg-white border-r border-slate-200 overflow-hidden flex flex-col",
        className,
      ].join(" ")}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <h2 className="font-serif text-lg font-bold text-slate-800">
          Library Filters
        </h2>
        <p className="text-xs text-slate-500 mt-1">Browse by skill type</p>
      </div>

      {/* Filter Groups - Accordion style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {(Object.keys(GROUPS) as GroupId[]).map((g) => {
          const isOpen = openGroup === g;
          const isCurrentGroup = currentGroup === g;
          const iconName = SKILL_ICONS[g] || "folder";

          return (
            <div key={g} className="rounded-lg overflow-hidden">
              {/* Accordion Trigger */}
              <button
                onClick={() => handleGroupClick(g)}
                className={[
                  "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                  isCurrentGroup
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "hover:bg-slate-50 text-slate-700",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <Icon 
                    name={iconName} 
                    className={`text-xl ${isCurrentGroup ? "text-[#3B82F6]" : "text-slate-400"}`} 
                  />
                  <span className="font-medium text-sm">{GROUPS[g].title}</span>
                </div>
                <Icon
                  name="expand_more"
                  className={[
                    "text-xl text-slate-400 transition-transform duration-200",
                    isOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>

              {/* Accordion Content - Radio Items */}
              {isOpen && (
                <div className="bg-slate-50/50 border-l-2 border-slate-100 ml-4">
                  {GROUPS[g].items.map((it) => {
                    const href = `/practice/${g}?item=${encodeURIComponent(it.id)}`;
                    const active = selectedId === `${g}:${it.id}`;

                    return (
                      <Link
                        key={it.id}
                        href={href}
                        className={[
                          "flex items-center gap-3 px-4 py-2.5 text-sm transition-all",
                          active
                            ? "bg-[#EFF6FF] text-[#2563EB] border-r-2 border-[#3B82F6]"
                            : "text-slate-600 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {/* Radio indicator */}
                        <span
                          className={[
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            active ? "border-[#3B82F6]" : "border-slate-300",
                          ].join(" ")}
                        >
                          {active && (
                            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                          )}
                        </span>
                        <span className={active ? "font-medium" : ""}>{it.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full Test Button */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => router.push("/practice/reading?item=reading_full")}
          className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Icon name="play_circle" className="text-xl" />
          Start Full Test
        </button>
      </div>
    </aside>
  );
}
