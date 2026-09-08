import { apisExam } from "@/utils/api.customize";
import {
  AdminExamCreate,
  AdminExamListItem,
  AdminExamUpdate,
  AdminOptionItem,
  AdminOptionUpdate,
  AdminOptionUpsert,
  AdminQuestionItem,
  AdminQuestionUpdate,
  AdminQuestionUpsert,
  AdminSectionItem,
  AdminSectionUpdate,
  AdminSectionUpsert,
  ApiResult,
  InternalDeliveryExam,
  InternalDeliveryQuestion,
  InternalDeliverySection,
} from "./types";

// ── Exam CRUD ────────────────────────────────────────────────────────────────

export async function listExams(): Promise<AdminExamListItem[]> {
  const res = await apisExam.get<ApiResult<AdminExamListItem[]>>("/admin/exam/all");
  return res.data?.data ?? [];
}

export async function createExam(dto: AdminExamCreate): Promise<{ id: string; slug: string }> {
  const res = await apisExam.post<ApiResult<{ id: string; slug: string }>>(
    "/admin/exam/addexam",
    dto
  );
  return res.data?.data;
}

export async function updateExam(id: string, dto: AdminExamUpdate): Promise<void> {
  await apisExam.put(`/admin/exam/update/${id}`, dto);
}

export async function deleteExam(id: string): Promise<void> {
  await apisExam.delete(`/admin/exam/delete/${id}`);
}

// ── Section CRUD ─────────────────────────────────────────────────────────────

export async function getSectionsByExam(examId: string): Promise<AdminSectionItem[]> {
  const res = await apisExam.get<ApiResult<AdminSectionItem[]>>(
    `/admin/section/by-exam/${examId}`
  );
  return res.data?.data ?? [];
}

export async function createSection(dto: AdminSectionUpsert): Promise<AdminSectionItem> {
  const res = await apisExam.post<ApiResult<AdminSectionItem>>("/admin/section/add", dto);
  return res.data?.data;
}

export async function updateSection(id: string, dto: AdminSectionUpdate): Promise<void> {
  await apisExam.put(`/admin/section/update/${id}`, dto);
}

export async function deleteSection(id: string): Promise<void> {
  await apisExam.delete(`/admin/section/delete/${id}`);
}

// ── Question CRUD ────────────────────────────────────────────────────────────

export async function getQuestionsBySection(sectionId: string): Promise<AdminQuestionItem[]> {
  const res = await apisExam.get<ApiResult<AdminQuestionItem[]>>(
    `/admin/question/by-section/${sectionId}`
  );
  return res.data?.data ?? [];
}

export async function createQuestion(dto: AdminQuestionUpsert): Promise<AdminQuestionItem> {
  const res = await apisExam.post<ApiResult<AdminQuestionItem>>("/admin/question/add", dto);
  return res.data?.data;
}

export async function updateQuestion(id: string, dto: AdminQuestionUpdate): Promise<void> {
  await apisExam.put(`/admin/question/update/${id}`, dto);
}

export async function deleteQuestion(id: string): Promise<void> {
  await apisExam.delete(`/admin/question/delete/${id}`);
}

// ── Option CRUD ──────────────────────────────────────────────────────────────

export async function getOptionsByQuestion(questionId: string): Promise<AdminOptionItem[]> {
  const res = await apisExam.get<ApiResult<AdminOptionItem[]>>(
    `/admin/option/by-question/${questionId}`
  );
  return res.data?.data ?? [];
}

export async function createOption(dto: AdminOptionUpsert): Promise<AdminOptionItem> {
  const res = await apisExam.post<ApiResult<AdminOptionItem>>("/admin/option/add", dto);
  return res.data?.data;
}

export async function updateOption(id: string, dto: AdminOptionUpdate): Promise<void> {
  await apisExam.put(`/admin/option/update/${id}`, dto);
}

export async function deleteOption(id: string): Promise<void> {
  await apisExam.delete(`/admin/option/delete/${id}`);
}

// ── Delivery & Question Bank ─────────────────────────────────────────────────

export async function getExamDelivery(
  examId: string,
  showAnswer: boolean = true
): Promise<InternalDeliveryExam> {
  const res = await apisExam.get<ApiResult<InternalDeliveryExam>>(
    `/internal/exams/${examId}/delivery`,
    {
      params: { showAnswers: showAnswer },
    }
  );
  return res.data?.data;
}

export async function getQuestionBankTypes(skill?: string) {
  const res = await apisExam.get("/question-bank/types", {
    params: skill ? { skill } : undefined,
  });
  return res.data?.data ?? res.data ?? [];
}

export async function getQuestionBankQuestions(params: {
  type: string;
  skill?: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await apisExam.get("/question-bank/questions", { params });
  return res.data?.data ?? res.data;
}

export async function getQuestionBankExams(params: {
  type?: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await apisExam.get("/question-bank/exams", { params });
  return res.data?.data ?? res.data;
}

// ── Full Exam Loader for Editor ──────────────────────────────────────────────
// Merges Delivery Snapshot (all answer keys, markdown, group structures)
// with Admin Section and Question database UUIDs.
export async function getFullExamForEditor(examId: string): Promise<InternalDeliveryExam> {
  const [delivery, adminSections] = await Promise.all([
    getExamDelivery(examId, true),
    getSectionsByExam(examId).catch(() => [] as AdminSectionItem[]),
  ]);

  if (!delivery) {
    throw new Error("Exam not found or delivery payload empty");
  }

  // Map of Section Idx -> AdminSectionItem
  const sectionByIdx = new Map<number, AdminSectionItem>();
  for (const s of adminSections) {
    sectionByIdx.set(s.idx, s);
  }

  // For each section, fetch its questions to obtain database question UUIDs
  const questionsBySectionId = new Map<string, AdminQuestionItem[]>();
  await Promise.all(
    adminSections.map(async (sec) => {
      try {
        const qs = await getQuestionsBySection(sec.id);
        questionsBySectionId.set(sec.id, qs);
      } catch {
        // tolerate empty or error
      }
    })
  );

  const enrichedSections: InternalDeliverySection[] = (delivery.sections || []).map(
    (sec, secIndex) => {
      const adminSec = adminSections[secIndex] || sectionByIdx.get(sec.idx);
      const secId = adminSec?.id;

      const adminQuestions = secId ? questionsBySectionId.get(secId) || [] : [];
      adminQuestions.sort((a, b) => a.idx - b.idx);
      const questionByIdx = new Map<number, AdminQuestionItem>();
      for (const q of adminQuestions) {
        questionByIdx.set(q.idx, q);
      }

      const enrichQuestion = (q: InternalDeliveryQuestion, qIndex: number): InternalDeliveryQuestion => {
        const matched = adminQuestions[qIndex] || questionByIdx.get(q.idx);
        return {
          ...q,
          id: matched?.id || q.id,
          sectionId: secId,
        };
      };

      const rawQuestions =
        sec.questions && sec.questions.length > 0
          ? sec.questions
          : (sec.questionGroups || []).flatMap((grp) => grp.questions || []);

      const enrichedQuestions = rawQuestions.map(enrichQuestion);

      const enrichedGroups = (sec.questionGroups || []).map((grp) => ({
        ...grp,
        questions: (grp.questions || []).map(enrichQuestion),
      }));
      return {
        ...sec,
        id: secId || sec.id,
        title: sec.title || adminSec?.title || `Section ${sec.idx}`,
        instructionsMd: sec.instructionsMd ?? adminSec?.instructionsMd ?? null,
        passageMd: sec.passageMd ?? adminSec?.passageMd ?? null,
        audioUrl: sec.audioUrl ?? adminSec?.audioUrl ?? null,
        transcriptMd: sec.transcriptMd ?? adminSec?.transcriptMd ?? null,
        questions: enrichedQuestions,
        questionGroups: enrichedGroups,
      };
    }
  );

  return {
    ...delivery,
    sections: enrichedSections,
  };
}
