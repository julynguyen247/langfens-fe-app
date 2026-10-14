import { apisSpeaking } from "../utils/api.customize";
import { webmToWavFile } from "../utils/audio";

export async function audioSubmitFromUrl(mediaBlobUrl: string) {
  const file = await webmToWavFile(mediaBlobUrl);

  const form = new FormData();
  form.append("request", file);

  const resp = await apisSpeaking.post("/speaking/transcript", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: (data) => data,
  });

  return resp;
}

export async function getSpeakingExams() {
  const res = await apisSpeaking.get("/speaking/exams");
  return res;
}

export async function startSpeakingExam(examId: string) {
  const res = await apisSpeaking.post(`/speaking/start/${examId}`);
  return res;
}

export async function getSpeakingExamsById(examId: string) {
  const res = await apisSpeaking.get(`/speaking/exams/${examId}`);
  return res;
}

export async function gradeSpeaking(params: {
  examId: string;
  timeSpentSeconds: number;
  speech: Blob | File;
}) {
  const { examId, timeSpentSeconds, speech } = params;

  const formData = new FormData();
  formData.append("examId", examId);
  formData.append("timeSpentSeconds", String(timeSpentSeconds));

  const filename =
    speech instanceof File ? speech.name : "speaking-recording.webm";

  formData.append("speech", speech, filename);

  const res = await apisSpeaking.post("/speaking/grade", formData, {
    headers: {
      "Content-Type": undefined,
    },
    withCredentials: true,
  });

  return res;
}

export async function uploadFile(params: { file: Blob | File }) {
  const { file } = params;
  const filename = file instanceof File ? file.name : "speaking-recording.webm";
  const formData = new FormData();
  formData.append("file", file, filename);
  const res = await apisSpeaking.post("/upload/audio", formData, {
    headers: {
      "Content-Type": undefined,
    },
    withCredentials: true,
  });
  return res;
}

export async function getSpeakingHistory() {
  const res = await apisSpeaking.get("/speaking/history");
  return res;
}

export async function getSpeakingHistoryById(submissionId: string) {
  const res = await apisSpeaking.get(`/speaking/history/${submissionId}`);
  return res;
}
