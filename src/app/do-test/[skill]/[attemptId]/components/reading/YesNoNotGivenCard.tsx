"use client";

import { memo } from "react";
import {
  StatementChoiceCard,
  type StatementChoiceCardProps,
  type StatementOption,
} from "./StatementChoiceCard";

type SelectionValue = "YES" | "NO" | "NOT_GIVEN";

const OPTIONS: readonly StatementOption<SelectionValue>[] = [
  {
    value: "YES",
    label: "YES",
    aliases: ["YES", "Y"],
    selectedClassName: "bg-emerald-500 text-[var(--card)] border-emerald-600 ring-2 ring-emerald-500/30",
  },
  {
    value: "NO",
    label: "NO",
    aliases: ["NO", "N"],
    selectedClassName: "bg-[var(--destructive)] text-[var(--card)] border-[var(--destructive-dark)] ring-2 ring-[var(--destructive)]/30",
  },
  {
    value: "NOT_GIVEN",
    label: "NOT GIVEN",
    aliases: ["NOT_GIVEN", "NG", "NOTGIVEN"],
    selectedClassName: "bg-[var(--primary)] text-[var(--card)] border-[var(--primary-dark)] ring-2 ring-[var(--primary)]/30",
  },
];

const YesNoNotGivenCard = memo(function YesNoNotGivenCard(
  props: StatementChoiceCardProps<SelectionValue>
) {
  return <StatementChoiceCard {...props} options={OPTIONS} />;
});

export default YesNoNotGivenCard;
