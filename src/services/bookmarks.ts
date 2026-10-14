import { apisAttempt } from "../utils/api.customize";

// Bookmark APIs
export async function createBookmark(
  questionId: string,
  opts?: {
    attemptId?: string;
    questionContent?: string;
    skill?: string;
    questionType?: string;
    note?: string;
  }
) {
  const res = await apisAttempt.post("/bookmarks", {
    questionId,
    attemptId: opts?.attemptId,
    questionContent: opts?.questionContent,
    skill: opts?.skill,
    questionType: opts?.questionType,
    note: opts?.note,
  });
  return res;
}

export async function getBookmarks(opts?: {
  skill?: string;
  questionType?: string;
  hasNote?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const res = await apisAttempt.get("/bookmarks", {
    params: {
      ...opts,
      page: opts?.page ?? 1,
      pageSize: opts?.pageSize ?? 50,
    },
  });
  return res;
}

export async function deleteBookmark(questionId: string) {
  const res = await apisAttempt.delete(`/bookmarks/${questionId}`);
  return res;
}

export async function checkBookmark(questionId: string) {
  const res = await apisAttempt.get(`/bookmarks/check/${questionId}`);
  return res;
}
