import { apisWriting } from "../utils/api.customize";

export async function createExam(
  title: string,
  taskText: string,
  examType: number,
  level: string,
  tag: string
) {
  const res = await apisWriting.post(`/admin/writing/create`, {
    title,
    taskText,
    examType,
    level,
    tag,
  });
  return res;
}

export async function gradeWriting(
  examId: string,
  answer: string,
  timeSpentSeconds: number
) {
  const res = await apisWriting.post(`/writing/grade`, {
    examId,
    answer,
    timeSpentSeconds,
  });

  return res;
}

export async function getWritingExams() {
  const res = await apisWriting.get("/writing/exams");
  return res;
}

export async function getWritingExamById(examId: string) {
  const res = await apisWriting.get(`/writing/exams/${examId}`);
  return res;
}

export async function startWritingExam(examId: string) {
  const res = await apisWriting.post(`/writing/start/${examId}`, {});

  return res;
}

export async function getWritingHistory() {
  const res = await apisWriting.get("/writing/history");
  return res;
}

export async function getWritingHistoryById(submissionId: string) {
  const res = await apisWriting.get(`/writing/history/${submissionId}`);
  return res;
}
