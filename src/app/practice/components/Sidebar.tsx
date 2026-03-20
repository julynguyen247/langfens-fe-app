"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { GROUPS, GroupId } from "@/lib/practice.meta";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

// Skill node colors using CSS variables
const SKILL_NODE_COLORS: Record<
  string,
  { bg: string; border: string; text: string; glow: string; light: string }
> = {
  reading: {
    bg: "var(--skill-reading)",
    border: "var(--skill-reading-border)",
    text: "var(--skill-reading)",
    glow: "var(--skill-reading)",
    light: "var(--skill-reading-light)",
  },
  listening: {
    bg: "var(--skill-listening)",
    border: "var(--skill-listening-border)",
    text: "var(--skill-listening)",
    glow: "var(--skill-listening)",
    light: "var(--skill-listening-light)",
  },
  writing: {
    bg: "var(--skill-writing)",
    border: "var(--skill-writing-border)",
    text: "var(--skill-writing)",
    glow: "var(--skill-writing)",
    light: "var(--skill-writing-light)",
  },
  speaking: {
    bg: "var(--skill-speaking)",
    border: "var(--skill-speaking-border)",
    text: "var(--skill-speaking)",
    glow: "var(--skill-speaking)",
    light: "var(--skill-speaking-light)",
  },
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

  const [openGroup, setOpenGroup] = useState<GroupId | null>(
    currentGroup || null
  );

  const selectedId = useMemo(
    () =>
      currentGroup && currentItem ? `${currentGroup}:${currentItem}` : "",
    [currentGroup, currentItem]
  );

  const handleGroupClick = (group: GroupId) => {
    setOpenGroup(openGroup === group ? null : group);
  };

  const groupKeys = Object.keys(GROUPS) as GroupId[];

  return (
    <aside
      className={[
        "sticky top-16 h-[calc(100vh-4rem)] w-64 bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden flex flex-col",
        className,
      ].join(" ")}
    >
      {/* Header */}
      <div className="p-6 border-b-[2px] border-[var(--border)]">
        <h2
          className="text-lg font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Skill Tree
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Choose your quest path
        </p>
      </div>

      {/* Skill Tree - Vertical Node Tree */}
      <div className="flex-1 overflow-y-auto py-6 px-5">
        <div className="relative flex flex-col items-start">
          {groupKeys.map((g, groupIndex) => {
            const isCurrentGroup = currentGroup === g;
            const isOpen = openGroup === g;
            const colors = SKILL_NODE_COLORS[g];
            // Determine node state
            const isActive = isCurrentGroup;
            const isCompleted = false; // Could be derived from user progress
            const isLocked = false;

            return (
              <div key={g} className="relative w-full">
                {/* Connecting line from previous node */}
                {groupIndex > 0 && (
                  <div
                    className="absolute left-3 -top-4 w-[2px] h-4"
                    style={{
                      backgroundColor: isActive
                        ? colors.bg
                        : "var(--border)",
                    }}
                  />
                )}

                {/* Main skill node */}
                <motion.button
                  onClick={() => handleGroupClick(g)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative flex items-center gap-3 w-full py-2 text-left"
                  style={{ opacity: isLocked ? 0.5 : 1 }}
                >
                  {/* Node circle (24px) */}
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200"
                    style={{
                      backgroundColor: isCompleted
                        ? "#059669"
                        : isActive
                        ? colors.bg
                        : "var(--background)",
                      border: `3px solid ${
                        isCompleted
                          ? "#059669"
                          : isActive
                          ? colors.bg
                          : "var(--border)"
                      }`,
                      boxShadow: isActive
                        ? `0 0 0 3px ${colors.light}, 0 0 12px ${colors.bg}40`
                        : "none",
                    }}
                  >
                    {isCompleted && (
                      <span
                        className="text-white text-[10px] font-bold"
                        style={{ lineHeight: 1 }}
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className="font-semibold text-sm transition-colors duration-200"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: isActive
                        ? colors.text
                        : isLocked
                        ? "var(--text-muted)"
                        : "var(--text-body)",
                    }}
                  >
                    {GROUPS[g].title}
                  </span>

                  {/* Expand indicator */}
                  <span
                    className="ml-auto text-xs font-bold transition-transform duration-200"
                    style={{
                      color: "var(--text-muted)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    v
                  </span>
                </motion.button>

                {/* Sub-items (tree branches) */}
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 pl-5 relative"
                  >
                    {/* Vertical branch line */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[2px]"
                      style={{
                        backgroundColor: isActive
                          ? colors.border
                          : "var(--border)",
                      }}
                    />

                    {GROUPS[g].items.map((it, itemIndex) => {
                      const href = `/practice/${g}?item=${encodeURIComponent(
                        it.id
                      )}`;
                      const active = selectedId === `${g}:${it.id}`;

                      return (
                        <div key={it.id} className="relative">
                          {/* Horizontal branch connector */}
                          <div
                            className="absolute left-0 top-1/2 w-3 h-[2px] -translate-y-1/2"
                            style={{
                              backgroundColor: active
                                ? colors.bg
                                : "var(--border)",
                            }}
                          />
                          <Link
                            href={href}
                            className="flex items-center gap-2 py-2 pl-5 pr-3 rounded-lg text-sm transition-all duration-150"
                            style={{
                              backgroundColor: active
                                ? colors.light
                                : "transparent",
                              color: active
                                ? colors.text
                                : "var(--text-muted)",
                              fontWeight: active ? 600 : 400,
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            {/* Small sub-node dot */}
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: active
                                  ? colors.bg
                                  : "var(--border)",
                              }}
                            />
                            <span>{it.label}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Connecting line to next node */}
                {groupIndex < groupKeys.length - 1 && (
                  <div
                    className="ml-3 w-[2px] h-4"
                    style={{
                      backgroundColor: "var(--border)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
