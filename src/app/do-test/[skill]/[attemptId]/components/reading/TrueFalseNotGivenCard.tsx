"use client";

import { memo } from "react";
import {
  StatementChoiceCard,
  type StatementChoiceCardProps,
  type StatementOption,
} from "./StatementChoiceCard";

type SelectionValue = "TRUE" | "FALSE" | "NOT_GIVEN";

const OPTIONS: readonly StatementOption<SelectionValue>[] = [
  {
    value: "TRUE",
    label: "TRUE",
    aliases: ["TRUE", "T"],
    selectedClassName: "bg-[var(--skill-speaking)] text-white border-[var(--skill-speaking-border)] ring-2 ring-[var(--skill-speaking)]/30",
  },
  {
    value: "FALSE",
    label: "FALSE",
    aliases: ["FALSE", "F"],
    selectedClassName: "bg-[var(--destructive)] text-white border-[var(--destructive)] ring-2 ring-[var(--destructive)]/30",
  },
  {
    value: "NOT_GIVEN",
    label: "NOT GIVEN",
    aliases: ["NOT_GIVEN", "NG", "NOTGIVEN"],
    selectedClassName: "bg-[var(--primary)] text-white border-[var(--primary-dark)] ring-2 ring-[var(--primary)]/30",
  },
];

const TrueFalseNotGivenCard = memo(function TrueFalseNotGivenCard(
  props: StatementChoiceCardProps<SelectionValue>
) {
  return <StatementChoiceCard {...props} options={OPTIONS} />;
});

export default TrueFalseNotGivenCard;
