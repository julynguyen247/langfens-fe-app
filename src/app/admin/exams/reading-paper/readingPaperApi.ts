import { apisExam } from "@/utils/api.customize";
import type {
  FeedbackReviewRequest,
  HumanFeedback,
} from "@/app/admin/_lib/feedbackTaxonomy";

export interface ReadingSource {
  pmcid: string;
  title: string;
  authors: string | null;
  doi: string | null;
  url: string;
  license: string;
  wordCount: number;
  openAlexId?: string | null;
  topicId?: string | null;
  sourceType?: string | null;
  content?: string | null;
  contentPreview?: string | null;
  metadata?: Record<string, string | null> | null;
}

export interface IngestSourcePayload {
  payload: string;
  type?: "auto" | "url" | "text" | "html" | "markdown" | "pmc";
  title?: string;
  url?: string;
  authors?: string;
  license?: string;
}

export interface ReadingQuestion {
  number: number;
  prompt: string;
  answer: string;
  options: string[];
  evidenceQuote: string;
  explanation: string;
}

export interface ReadingSection {
  title: string;
  passage: string;
  source: ReadingSource;
  groups: { type: string; instruction: string; questions: ReadingQuestion[] }[];
}

export interface ReadingJobLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface ReadingJob {
  id: string;
  topic: string;
  status: "Pending" | "Running" | "NeedsSources" | "Failed" | "Cancelled" | "Completed";
  completedSections: number;
  error: string | null;
  examId: string | null;
  sources: ReadingSource[];
  sections: ReadingSection[];
  logs?: ReadingJobLog[];
}

export type ReadingJobSummary = Pick<ReadingJob, "id" | "topic" | "status" | "completedSections" | "error" | "examId">;

function unwrapEnvelope<T>(val: unknown): T {
  if (val && typeof val === "object" && "data" in val && val.data !== undefined) {
    return val.data as T;
  }
  return val as T;
}

export async function searchReadingSources(topic: string) {
  const response = await apisExam.get<{
    sources: ReadingSource[];
    selectedPmcids: string[];
    message: string | null;
  }>("/admin/reading-paper/sources", { params: { topic } });
  return response.data;
}

export async function createReadingJob(
  topic: string,
  pmcids?: string[],
  sources?: ReadingSource[],
  provider?: string
) {
  const payload: { topic: string; pmcids?: string[]; sources?: ReadingSource[]; provider?: string } = { topic };
  if (sources && sources.length > 0) {
    payload.sources = sources;
  } else if (pmcids && pmcids.length > 0) {
    payload.pmcids = pmcids;
  }
  if (provider && provider !== "auto") {
    payload.provider = provider;
  }
  const response = await apisExam.post<ReadingJob>("/admin/reading-paper/jobs", payload);
  return unwrapEnvelope<ReadingJob>(response.data);
}

export async function ingestReadingSource(payload: IngestSourcePayload) {
  const response = await apisExam.post<ReadingSource>("/admin/reading-paper/sources/ingest", payload);
  return response.data;
}

export async function getReadingJob(id: string) {
  const response = await apisExam.get<ReadingJob>(`/admin/reading-paper/jobs/${id}`);
  return unwrapEnvelope<ReadingJob>(response.data);
}

export async function listReadingJobs() {
  const response = await apisExam.get<ReadingJobSummary[]>("/admin/reading-paper/jobs");
  const data = unwrapEnvelope<ReadingJobSummary[]>(response.data);
  return Array.isArray(data) ? data : [];
}

export async function replaceReadingSources(
  id: string,
  topic: string,
  pmcids?: string[],
  sources?: ReadingSource[],
  provider?: string
) {
  const payload: { topic: string; pmcids?: string[]; sources?: ReadingSource[]; provider?: string } = { topic };
  if (sources && sources.length > 0) {
    payload.sources = sources;
  } else if (pmcids && pmcids.length > 0) {
    payload.pmcids = pmcids;
  }
  if (provider && provider !== "auto") {
    payload.provider = provider;
  }
  const response = await apisExam.put<ReadingJob>(`/admin/reading-paper/jobs/${id}/sources`, payload);
  return unwrapEnvelope<ReadingJob>(response.data);
}

export async function retryReadingJob(id: string) {
  const response = await apisExam.post<ReadingJob>(`/admin/reading-paper/jobs/${id}/retry`);
  return unwrapEnvelope<ReadingJob>(response.data);
}
export async function cancelReadingJob(id: string) {
  const response = await apisExam.post<ReadingJob>(`/admin/reading-paper/jobs/${id}/cancel`);
  return unwrapEnvelope<ReadingJob>(response.data);
}

export interface FeedbackListResponse {
  total: number;
  page: number;
  maxSize: number;
  items: HumanFeedback[];
}

export async function getFeedbackList(params?: {
  examId?: string;
  runId?: string;
  curationStatus?: string;
  page?: number;
  maxSize?: number;
}): Promise<FeedbackListResponse> {
  const response = await apisExam.get<FeedbackListResponse>("/v2/reading/feedback", {
    params,
  });
  return response.data;
}

export async function getFeedbackDetail(id: string): Promise<HumanFeedback> {
  const response = await apisExam.get<HumanFeedback>(`/v2/reading/feedback/${id}`);
  return response.data;
}

export async function reviewFeedback(
  id: string,
  payload: FeedbackReviewRequest
): Promise<HumanFeedback> {
  const response = await apisExam.post<HumanFeedback>(
    `/v2/reading/feedback/${id}/review`,
    payload
  );
  return response.data;
}

export async function acceptPaper(
  examId: string,
  payload?: { reasons?: string[]; comment?: string; idempotencyKey?: string }
): Promise<{
  examId: string;
  status: string;
  reasons?: string[];
  comment?: string;
  feedbackId?: string;
  message: string;
}> {
  const key = payload?.idempotencyKey || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined);
  const headers = key ? { "Idempotency-Key": key } : undefined;
  const response = await apisExam.post<{
    examId: string;
    status: string;
    reasons?: string[];
    comment?: string;
    feedbackId?: string;
    message: string;
  }>(`/v2/reading/papers/${examId}/accept`, payload ?? {}, { headers });
  return response.data;
}

export async function rejectPaper(
  examId: string,
  payload?: { reasons?: string[]; comment?: string; idempotencyKey?: string }
): Promise<{
  examId: string;
  status: string;
  reasons?: string[];
  comment?: string;
  feedbackId?: string;
  message: string;
}> {
  const key = payload?.idempotencyKey || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined);
  const headers = key ? { "Idempotency-Key": key } : undefined;
  const response = await apisExam.post<{
    examId: string;
    status: string;
    reasons?: string[];
    comment?: string;
    feedbackId?: string;
    message: string;
  }>(`/v2/reading/papers/${examId}/reject`, payload ?? {}, { headers });
  return response.data;
}

export async function publishPaper(
  examId: string,
  payload?: { comment?: string; idempotencyKey?: string }
): Promise<{
  examId: string;
  slug?: string;
  title?: string;
  status: string;
  message: string;
}> {
  const key = payload?.idempotencyKey || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined);
  const headers = key ? { "Idempotency-Key": key } : undefined;
  const response = await apisExam.post<{
    examId: string;
    slug?: string;
    title?: string;
    status: string;
    message: string;
  }>(`/v2/reading/papers/${examId}/publish`, payload ?? {}, { headers });
  return response.data;
}
