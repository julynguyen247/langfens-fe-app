"use client";

import { autoSaveAttempt } from "@/utils/api";
import { useRef } from "react";
import type { UserAnswerValue } from "@/app/do-test/[skill]/[attemptId]/_lib/types";

type QA = Record<string, UserAnswerValue>;

// Discriminator: MCQ-multiple option ids are UUIDs; FlowChart node keys are
// slug-style strings (e.g. "a", "step-2"). Both arrive at this hook as
// `string[]`, but the BE graders split them by field — `MultipleChoiceGrader`
// (Grader.cs:42) reads only `SelectedOptionIds`, `FlowChartGrader`
// (Grader.cs:333) parses `TextAnswer` as a JSON array. So we split on GUID
// shape at the wire-format boundary.
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildAnswerPayload(
  answers: QA,
  buildSectionId: (qid: string) => string | undefined,
  buildTextAnswer?: (qid: string, value: string) => string | undefined
) {
  return {
    answers: Object.entries(answers).map(([questionId, value]) => {
      let selectedOptionIds: string[] = [];
      let textAnswer: string | undefined;

      if (Array.isArray(value)) {
        const allGuids =
          value.length > 0 && value.every((v) => GUID_RE.test(String(v)));
        if (allGuids) {
          // MCQ_MULTIPLE — Spec D4: selectedOptionIds holds option UUIDs,
          // textAnswer absent (MultipleChoiceGrader ignores TextAnswer).
          selectedOptionIds = value.map(String);
          textAnswer = undefined;
        } else {
          // FlowChart (and any other non-UUID string[]) — Spec D4: textAnswer
          // carries a JSON-stringified ordered node list.
          textAnswer = JSON.stringify(value.map(String));
        }
      } else if (value && typeof value === "object") {
        // Record<string, string> — Completion / Matching / Label family.
        textAnswer = JSON.stringify(value);
      } else if (typeof value === "string") {
        const isGuid = GUID_RE.test(value);
        if (isGuid) {
          // MCQ_SINGLE / TFNG / YNNG / MCQ-single-image — Spec D4: single
          // GUID routes to selectedOptionIds, textAnswer absent.
          selectedOptionIds = [value];
          textAnswer = undefined;
        } else {
          // ShortAnswer raw text, or any other free-text answer.
          textAnswer = value;
        }
      }

      // Caller may override textAnswer (legacy flow — see page.tsx:198,
      // TestV2Runner.tsx:166). `buildTextAnswer` keeps the (qid, string)
      // signature on purpose: callers stringify through their own adapters.
      const customText = buildTextAnswer?.(questionId, value as string);
      if (
        customText !== undefined &&
        customText !== null &&
        customText.length > 0
      ) {
        textAnswer = customText;
      }

      return {
        questionId,
        sectionId: buildSectionId(questionId) ?? "",
        selectedOptionIds,
        textAnswer,
      };
    }),
    clientRevision: Date.now(),
  };
}

export function useDebouncedAutoSave(
  userId: string | undefined,
  attemptId: string
) {
  const t = useRef<NodeJS.Timeout | null>(null);

  const run = (
    answers: QA,
    buildSectionId: (qid: string) => string | undefined,
    buildTextAnswer?: (qid: string, value: string) => string | undefined
  ) => {
    if (!userId) return;
    if (t.current) clearTimeout(t.current);

    t.current = setTimeout(async () => {
      try {
        const payload = buildAnswerPayload(answers, buildSectionId, buildTextAnswer);
        await autoSaveAttempt(attemptId, payload);
      } catch {}
    }, 2000);
  };

  // Immediate save (no debounce) - use before submit
  const saveNow = async (
    answers: QA,
    buildSectionId: (qid: string) => string | undefined,
    buildTextAnswer?: (qid: string, value: string) => string | undefined
  ) => {
    if (t.current) clearTimeout(t.current);
    const payload = buildAnswerPayload(answers, buildSectionId, buildTextAnswer);
    await autoSaveAttempt(attemptId, payload);
  };

  const cancel = () => {
    if (t.current) {
      clearTimeout(t.current);
      t.current = null;
    }
  };

  return { run, cancel, saveNow };
}
