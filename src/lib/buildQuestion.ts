import { deriveUiKind, isWordListBlank } from "@/lib/deriveUiKind";
import type { Question as UiQuestion } from "@/types/question.type";

export function buildQuestion(q: any): UiQuestion {
  const uiKind =
    q.type === "MATCHING_INFORMATION"
      ? isWordListBlank(q.promptMd ?? "")
        ? "matching_information"
        : "matching_paragraph"
      : deriveUiKind(q.type);

  const base: UiQuestion = {
    id: q.id,
    idx: q.idx,
    stem: q.promptMd,
    backendType: q.type,
    uiKind,
    explanationMd: q.explanationMd,
    imageUrl: q.imageUrl ?? null,
    modelAnswers: q.modelAnswers ?? null,
    wordList: q.wordList ?? null,
    groupId: q.groupId ?? null,
  };

  if (uiKind === "forice_single" || uiKind === "forice_multiple") {
    return {
      ...base,
      forices: (q.options ?? []).map((opt: any) => ({
        value: opt.id,
        label: String(opt.contentMd).replace(/^[A-Z]\.\s+/, ""),
      })),
    };
  }

  if (uiKind === "flow_chart") {
    return { ...base, flowChartNodes: q.flowChartNodes ?? [] };
  }

  if (uiKind === "matching_heading" && q.options?.length) {
    return {
      ...base,
      forices: q.options.map((opt: any) => ({
        value: String(opt.contentMd).split(".")[0].trim(),
        label: opt.contentMd,
      })),
    };
  }

  return base;
}
