import { apisAttempt } from "../utils/api.customize";

// Notes API
export async function createNote(payload: {
  attemptId?: string;
  sectionId?: string;
  selectedText?: string;
  content: string;
}) {
  const res = await apisAttempt.post("/notes", payload);
  return res;
}

export async function getNotes(params?: {
  attemptId?: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await apisAttempt.get("/notes", {
    params: {
      attemptId: params?.attemptId,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    },
  });
  return res;
}

export async function updateNote(noteId: string, content: string) {
  const res = await apisAttempt.put(`/notes/${noteId}`, { content });
  return res;
}

export async function deleteNote(noteId: string) {
  const res = await apisAttempt.delete(`/notes/${noteId}`);
  return res;
}
