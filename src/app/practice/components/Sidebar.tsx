"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  FiChevronLeft,
  FiFilter,
  FiEdit3,
  FiBookOpen,
  FiHeadphones,
  FiMic,
} from "react-icons/fi";
import { GROUPS, GroupId } from "@/lib/practice.meta";
import { useMemo, useState } from "react";

const ICONS = {
  writing: FiEdit3,
  reading: FiBookOpen,
  listening: FiHeadphones,
  speaking: FiMic,
} as const;

export default function PracticeSidebar({
  defaultOpen = true,
  className = "",
}: {
  defaultOpen?: boolean;
  className?: string;
}) {
  const params = useParams<{ group?: string }>();
  const searchParams = useSearchParams();

  const currentGroup = params.group as GroupId | undefined;
  const currentItem = searchParams.get("item") ?? undefined;

  const [open, setOpen] = useState(defaultOpen);
  const selectedId = useMemo(
    () => (currentGroup && currentItem ? `${currentGroup}:${currentItem}` : ""),
    [currentGroup, currentItem]
  );

  return (
    <aside
      className={[
        "sticky top-16 h-[calc(100vh-4rem)] transition-all",
        open ? "w-72" : "w-16",
        className,
      ].join(" ")}
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
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100"
            aria-expanded={open}
          >
            <FiChevronLeft
              className={[
                "h-4 w-4 text-slate-600 transition-transform",
                open ? "" : "rotate-180",
              ].join(" ")}
            />
          </button>
        </div>

        {(Object.keys(GROUPS) as GroupId[]).map((g) => {
          const Icon = ICONS[g];

          return (
            <section key={g} className={open ? "mb-3" : "mb-2"}>
              <Link
                href={`/practice/${g}`}
                className={[
                  "flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50",
                  open ? "px-3 py-1.5" : "justify-center py-1",
                  currentGroup === g ? "ring-1 ring-slate-300" : "",
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
                    <span className="text-sm font-semibold">
                      {GROUPS[g].title}
                    </span>
                  )}
                </div>
              </Link>

              <div
                className={[
                  "mt-2 rounded-lg border border-slate-200",
                  open ? "px-3 py-2" : "px-1 py-1",
                ].join(" ")}
              >
                {GROUPS[g].items.map((it) => {
                  const href = `/practice/${g}?item=${encodeURIComponent(
                    it.id
                  )}`;
                  const active = selectedId === `${g}:${it.id}`;

                  return (
                    <Link
                      key={it.id}
                      href={href}
                      className={[
                        "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm",
                        active
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-50",
                        !open && "justify-center",
                      ].join(" ")}
                      aria-current={active ? "page" : undefined}
                    >
                      <span
                        className={[
                          "grid h-4 w-4 place-items-center rounded-full border",
                          active
                            ? "border-slate-200 bg-white"
                            : "border-slate-300 bg-transparent",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "block h-2 w-2 rounded-full",
                            active ? "bg-slate-900" : "bg-transparent",
                          ].join(" ")}
                        />
                      </span>
                      {open && <span>{it.label}</span>}
                    </Link>
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
