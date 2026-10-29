"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { InternalDeliveryQuestion, UserAnswerValue } from "@/features/exam/types";
import { normalizeDeliveryQuestion } from "@/features/exam/contract";
import { QuestionRenderer } from "@/features/exam/components/QuestionRenderer";
import { getMeta } from "@/app/admin/_lib/questionTypeRegistry";
import { AdminPreviewFrame } from "./AdminPreviewFrame";

export function AdminQuestionPreview({ question, displayIdx }: { question: InternalDeliveryQuestion; displayIdx?: number }) {
  const [value, setValue] = useState<UserAnswerValue>("");
  const q = normalizeDeliveryQuestion(question);
  const meta = getMeta(q.type);
  return <AdminPreviewFrame title={`Preview Q${displayIdx ?? q.displayIdx ?? q.idx} — ${meta.label}`} hint="Interactive — answer like a candidate">
    <div className="space-y-4">
      <div className="prose prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{q.promptMd ?? ""}</ReactMarkdown></div>
      <QuestionRenderer question={q} value={value} onChange={setValue} />
    </div>
  </AdminPreviewFrame>;
}
