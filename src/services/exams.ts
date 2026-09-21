import { apisExam } from "../utils/api.customize";

export async function getPublicExams(
  page: number,
  pageSize: number,
  opts?: { category?: string; level?: string; questionTypes?: string }
) {
  const res = await apisExam.get("/public/exam/getall", {
    params: {
      page,
      pageSize,
      category: opts?.category,
      level: opts?.level,
      questionTypes: opts?.questionTypes,
    },
  });
  return res;
}

export async function getQuestionTypes(skill?: string) {
  const res = await apisExam.get("/question-bank/types", {
    params: skill ? { skill } : undefined,
  });
  return res;
}

export async function getQuestionsByType(
  type: string,
  skill?: string,
  page: number = 1,
  pageSize: number = 20
) {
  const res = await apisExam.get("/question-bank/questions", {
    params: { type, skill, page, pageSize },
  });
  return res;
}

export async function getExamsByQuestionType(
  type?: string,
  page: number = 1,
  pageSize: number = 50
) {
  const res = await apisExam.get("/question-bank/exams", {
    params: { type, page, pageSize },
  });
  return res;
}
