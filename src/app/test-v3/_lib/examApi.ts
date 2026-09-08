import { apisAttempt, apisExam } from "@/utils/api.customize";
import {
  InternalDeliveryExam,
} from "@/components/exam-v3/types";

interface ApiResult<T> {
  isSuccess: boolean;
  message?: string;
  data: T;
}

export async function fetchExamDeliveryPaper(
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

export async function submitExamAttempt(
  attemptId: string,
  answers: {
    questionId: string;
    sectionId: string;
    idx: number;
    selectedOptionIds?: string[];
    textAnswer?: string;
  }[]
): Promise<unknown> {
  const res = await apisAttempt.post<ApiResult<unknown>>(
    `/attempt/${attemptId}:submit`,
    { answers }
  );
  return res.data?.data;
}

export async function autosaveExamAttempt(
  attemptId: string,
  answers: {
    questionId: string;
    sectionId: string;
    idx: number;
    selectedOptionIds?: string[];
    textAnswer?: string;
  }[]
): Promise<unknown> {
  const res = await apisAttempt.put<ApiResult<unknown>>(
    `/attempt/${attemptId}:autosave`,
    { answers }
  );
  return res.data?.data;
}
