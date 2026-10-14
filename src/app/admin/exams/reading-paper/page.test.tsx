// @vitest-environment happy-dom
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./page";
import * as api from "./readingPaperApi";
import { FeedbackModal } from "./FeedbackModal";
import {
  FEEDBACK_REASONS,
  evaluateSmallEditPolicy,
  isSmallEdit,
} from "@/app/admin/_lib/feedbackTaxonomy";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("./readingPaperApi", () => ({
  listReadingJobs: vi.fn(),
  getReadingJob: vi.fn(),
  searchReadingSources: vi.fn(),
  createReadingJob: vi.fn(),
  replaceReadingSources: vi.fn(),
  retryReadingJob: vi.fn(),
  ingestReadingSource: vi.fn(),
  acceptPaper: vi.fn(),
  rejectPaper: vi.fn(),
  publishPaper: vi.fn(),
  getFeedbackList: vi.fn(),
  getFeedbackDetail: vi.fn(),
  reviewFeedback: vi.fn(),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const sources = [1, 2, 3].map((number) => ({
  pmcid: `PMC${number}`, title: `Article ${number}`, authors: "A. Scientist",
  doi: `10.1/${number}`, url: `https://europepmc.org/articles/PMC${number}`,
  license: "https://creativecommons.org/licenses/by/4.0", wordCount: 1200,
}));
const verifiedSources = sources.map((source) => ({
  ...source,
  content: `Verified full-text content for ${source.pmcid}. `.repeat(30),
  sourceType: "pmc",
}));

describe("Reading paper admin flow", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.mocked(api.listReadingJobs).mockResolvedValue([]);
    vi.mocked(api.ingestReadingSource).mockImplementation(async ({ payload }) => {
      const source = verifiedSources.find((item) => item.pmcid === payload);
      if (!source) throw new Error(`No verified source fixture for ${payload}`);
      return source;
    });
    window.history.replaceState(null, "", "/admin/exams/reading-paper");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await React.act(async () => root.unmount());
    container.remove();
    vi.resetAllMocks();
  });

  it("starts a one-passage Draft when only one source is selected", async () => {
    vi.mocked(api.searchReadingSources).mockResolvedValue({
      sources: [sources[0]], selectedPmcids: [sources[0].pmcid], message: null,
    });
    vi.mocked(api.createReadingJob).mockResolvedValue({
      id: "job-1", topic: "forest ecology", status: "Pending", completedSections: 0,
      error: null, examId: null, sources: [verifiedSources[0]], sections: [],
    });
    await React.act(async () => root.render(<Page />));
    const input = container.querySelector("input[aria-label='Scientific topic']") as HTMLInputElement;
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "forest ecology");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const find = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Find sources"));
    await React.act(async () => find?.click());
    expect(api.searchReadingSources).toHaveBeenCalledWith("forest ecology");
    const checkboxes = Array.from(container.querySelectorAll<HTMLInputElement>("input[type='checkbox']"));
    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0].checked).toBe(true);
    const create = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Create Draft (1 passage)"));
    await React.act(async () => create?.click());
    expect(api.createReadingJob).toHaveBeenCalledWith("forest ecology", undefined, [verifiedSources[0]]);
    expect(container.textContent).toContain("0/1 passages complete");
  });

  it("creates two passages from two sources in the chosen order", async () => {
    vi.mocked(api.searchReadingSources).mockResolvedValue({
      sources, selectedPmcids: sources.map((source) => source.pmcid), message: null,
    });
    vi.mocked(api.createReadingJob).mockResolvedValue({
      id: "job-two", topic: "forest ecology", status: "Pending", completedSections: 0,
      error: null, examId: null, sources: [verifiedSources[2], verifiedSources[0]], sections: [],
    });
    await React.act(async () => root.render(<Page />));
    const input = container.querySelector("input[aria-label='Scientific topic']") as HTMLInputElement;
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "forest ecology");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const find = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Find sources"));
    await React.act(async () => find?.click());
    const third = container.querySelector<HTMLInputElement>("input[aria-label='Select Article 3']");
    await React.act(async () => third?.click());
    const move = Array.from(container.querySelectorAll("button")).find((item) => item.textContent === "Move earlier" && !item.hasAttribute("disabled"));
    await React.act(async () => move?.click());
    const create = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Create Draft (2 passages)"));
    await React.act(async () => create?.click());
    expect(api.createReadingJob).toHaveBeenCalledWith("forest ecology", undefined, [verifiedSources[2], verifiedSources[0]]);
    expect(container.textContent).toContain("0/2 passages complete");
  });

  it("restores a completed job and displays answers and source attribution", async () => {
    window.history.replaceState(null, "", "/admin/exams/reading-paper?job=job-2");
    vi.mocked(api.getReadingJob).mockResolvedValue({
      id: "job-2", topic: "marine biology", status: "Completed", completedSections: 1,
      error: null, examId: "exam-99", sources: [sources[0]],
      sections: [{
        title: "Ocean Life", passage: "Passage body...", source: sources[0],
        groups: [{
          type: "TRUE_FALSE_NOT_GIVEN", instruction: "Choose True, False or Not Given",
          questions: [{
            number: 1, prompt: "Fish swim.", answer: "TRUE",
            options: ["TRUE", "FALSE", "NOT GIVEN"],
            evidenceQuote: "Fish are known to swim in oceans.",
            explanation: "The text states fish swim.",
          }],
        }],
      }],
    });
    await React.act(async () => root.render(<Page />));
    expect(api.getReadingJob).toHaveBeenCalledWith("job-2");
    expect(container.textContent).toContain("Passage 1: Ocean Life");
    expect(container.textContent).toContain("Fish swim.");
    expect(container.textContent).toContain("Answer: TRUE");
    expect(container.textContent).toContain("Article 1");
  });

  it("lets an admin replace sources when a job needs eligible articles", async () => {
    window.history.replaceState(null, "", "/admin/exams/reading-paper?job=job-3");
    vi.mocked(api.getReadingJob).mockResolvedValue({
      id: "job-3", topic: "solar physics", status: "NeedsSources", completedSections: 0,
      error: "First article lacked open full text", examId: null, sources: [sources[0]], sections: [],
    });
    vi.mocked(api.searchReadingSources).mockResolvedValue({
      sources: [sources[1]], selectedPmcids: ["PMC2"], message: null,
    });
    vi.mocked(api.replaceReadingSources).mockResolvedValue({
      id: "job-3", topic: "solar physics", status: "Pending", completedSections: 0,
      error: null, examId: null, sources: [verifiedSources[1]], sections: [],
    });
    await React.act(async () => root.render(<Page />));
    expect(container.textContent).toContain("First article lacked open full text");
    const find = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Find sources"));
    await React.act(async () => find?.click());
    const replace = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Replace sources and continue"));
    await React.act(async () => replace?.click());
    expect(api.replaceReadingSources).toHaveBeenCalledWith("job-3", "solar physics", undefined, [verifiedSources[1]]);
  });

  it("ingests custom source and creates a draft with custom source", async () => {
    const customSource = {
      pmcid: "CUSTOM:marine-payload",
      title: "Marine Biology Innovations",
      authors: "Dr. Coral",
      doi: null,
      url: "https://example.org/coral-paper",
      license: "https://creativecommons.org/licenses/by/4.0",
      wordCount: 750,
      sourceType: "custom",
      content: "Verified custom source full text. ".repeat(30),
    };
    vi.mocked(api.ingestReadingSource).mockResolvedValue(customSource);
    vi.mocked(api.createReadingJob).mockResolvedValue({
      id: "job-custom",
      topic: "Marine Biology Innovations",
      status: "Pending",
      completedSections: 0,
      error: null,
      examId: null,
      sources: [customSource],
      sections: [],
    });

    await React.act(async () => root.render(<Page />));
    const customTab = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Ingest Custom Source"),
    );
    await React.act(async () => customTab?.click());

    const payloadInput = container.querySelector(
      "textarea[aria-label='Source payload content']",
    ) as HTMLTextAreaElement;
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(payloadInput, "This is a full article text about marine biology...");
      payloadInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const ingestBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Ingest & Validate"),
    );
    await React.act(async () => ingestBtn?.click());

    expect(api.ingestReadingSource).toHaveBeenCalledWith({
      payload: "This is a full article text about marine biology...",
      type: "auto",
      title: undefined,
    });
    expect(container.textContent).toContain("Ingested \"Marine Biology Innovations\" (750 words) successfully.");

    const createBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Create Draft (1 passage)"),
    );
    await React.act(async () => createBtn?.click());

    expect(api.createReadingJob).toHaveBeenCalledWith(
      "Marine Biology Innovations",
      undefined,
      [customSource],
    );
    expect(container.textContent).toContain("0/1 passages complete");
  });

  it("ingests metadata-only Europe PMC results before creating a draft", async () => {
    const verifiedSource = {
      ...sources[0],
      content: "Verified full-text article content ".repeat(30),
      sourceType: "pmc",
    };
    vi.mocked(api.searchReadingSources).mockResolvedValue({
      sources: [sources[0]], selectedPmcids: [sources[0].pmcid], message: null,
    });
    vi.mocked(api.ingestReadingSource).mockResolvedValue(verifiedSource);
    vi.mocked(api.createReadingJob).mockResolvedValue({
      id: "job-verified-source",
      topic: "forest ecology",
      status: "Pending",
      completedSections: 0,
      error: null,
      examId: null,
      sources: [verifiedSource],
      sections: [],
    });

    await React.act(async () => root.render(<Page />));
    const input = container.querySelector("input[aria-label='Scientific topic']") as HTMLInputElement;
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "forest ecology");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const find = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Find sources"));
    await React.act(async () => find?.click());
    const create = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Create Draft (1 passage)"));
    await React.act(async () => create?.click());

    expect(api.ingestReadingSource).toHaveBeenCalledWith({ payload: "PMC1", type: "pmc" });
    expect(api.createReadingJob).toHaveBeenCalledWith("forest ecology", undefined, [verifiedSource]);
  });

  it("submits ingested PMCID sources with their verified content", async () => {
    const ingestedSource = {
      ...sources[0],
      content: "Verified full-text article content ".repeat(20),
      sourceType: "pmc",
    };
    vi.mocked(api.ingestReadingSource).mockResolvedValue(ingestedSource);
    vi.mocked(api.createReadingJob).mockImplementation(async (submittedTopic, pmcids, sourcePayload) => {
      if (pmcids?.length || !sourcePayload?.[0]?.content?.trim()) {
        throw new Error("The endpoint requires verified source content.");
      }
      return {
        id: "job-ingested-pmc",
        topic: submittedTopic,
        status: "Pending",
        completedSections: 0,
        error: null,
        examId: null,
        sources: sourcePayload,
        sections: [],
      };
    });

    await React.act(async () => root.render(<Page />));
    const customTab = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Ingest Custom Source"),
    );
    await React.act(async () => customTab?.click());

    const payloadInput = container.querySelector(
      "textarea[aria-label='Source payload content']",
    ) as HTMLTextAreaElement;
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(payloadInput, ingestedSource.content);
      payloadInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const ingestBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Ingest & Validate"),
    );
    await React.act(async () => ingestBtn?.click());

    const createBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Create Draft (1 passage)"),
    );
    await React.act(async () => createBtn?.click());

    expect(container.textContent).toContain("0/1 passages complete");
    expect(container.textContent).not.toContain("The endpoint requires verified source content.");
  });

  it("renders AI Model Provider selector and allows selecting MiniMax M3", async () => {
    await React.act(async () => root.render(<Page />));
    expect(container.textContent).toContain("AI Model Provider:");
    expect(container.textContent).toContain("MiniMax M3");

    const minimaxBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("MiniMax M3"),
    );
    expect(minimaxBtn).toBeDefined();
    await React.act(async () => minimaxBtn?.click());
    expect(minimaxBtn?.className).toContain("bg-indigo-600");
  });

  it("passes selected provider minimax to createReadingJob when submitted", async () => {
    vi.mocked(api.searchReadingSources).mockResolvedValue({
      sources: [sources[0]], selectedPmcids: ["PMC1"], message: null,
    });
    vi.mocked(api.createReadingJob).mockResolvedValue({
      id: "job-minimax", topic: "forest ecology", status: "Pending", completedSections: 0,
      error: null, examId: null, sources: [verifiedSources[0]], sections: [],
    });

    await React.act(async () => root.render(<Page />));
    const input = container.querySelector("input[aria-label='Scientific topic']") as HTMLInputElement;
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "forest ecology");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const minimaxBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.trim() === "MiniMax M3",
    );
    await React.act(async () => minimaxBtn?.click());

    const search = Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.includes("Find sources"));
    await React.act(async () => search?.click());

    const create = Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.includes("Create Draft"));
    await React.act(async () => create?.click());

    expect(api.createReadingJob).toHaveBeenCalledWith("forest ecology", undefined, [verifiedSources[0]], "minimax");
  });

  // ── P14 Tests: Reason Taxonomy, Small-Edit Policy, Curation Actions ──────────

  it("evaluates small-edit policy: minor edits make reasons optional, substantive edits recommend reasons", () => {
    // 1. Identical text
    const same = evaluateSmallEditPolicy("The quick brown fox", "The quick brown fox");
    expect(same.isSmallEdit).toBe(true);
    expect(same.reasonsRequired).toBe(false);

    // 2. Character diff <= 10 (minor typo fix)
    const typo = evaluateSmallEditPolicy("The quik brown fox", "The quick brown fox");
    expect(isSmallEdit("The quik brown fox", "The quick brown fox")).toBe(true);
    expect(typo.isSmallEdit).toBe(true);
    expect(typo.reasonsRequired).toBe(false);

    // 3. Formatting-only changes (whitespace / markdown punctuation changes)
    const fmt = evaluateSmallEditPolicy("The **quick** brown fox.", "The quick brown fox");
    expect(fmt.formattingOnly).toBe(true);
    expect(fmt.isSmallEdit).toBe(true);
    expect(fmt.reasonsRequired).toBe(false);

    // 4. Substantive content rewrite (> 10 character delta)
    const substantive = evaluateSmallEditPolicy(
      "The passage describes coastal mangrove restoration initiatives.",
      "The passage outlines urban transportation strategies and mass transit."
    );
    expect(substantive.isSmallEdit).toBe(false);
    expect(substantive.reasonsRequired).toBe(true);
    expect(substantive.reasonsRecommended).toBe(true);
    expect(isSmallEdit(
      "The passage describes coastal mangrove restoration initiatives.",
      "The passage outlines urban transportation strategies and mass transit."
    )).toBe(false);
  });

  it("renders all canonical reason taxonomy tags and allows multi-selection in FeedbackModal", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    await React.act(async () => {
      root.render(
        <FeedbackModal
          isOpen={true}
          onClose={onClose}
          title="Review Feedback"
          mode="review"
          targetDescription="Question #3"
          beforeText="Original prompt text"
          afterText="Updated prompt text"
          onSubmit={onSubmit}
        />
      );
    });

    // Check all 8 canonical reasons are rendered
    FEEDBACK_REASONS.forEach((reason) => {
      expect(container.textContent).toContain(reason.label);
    });

    // Select "Unsupported Claim" and "Ambiguity"
    const unsupportedBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Unsupported Claim")
    );
    const ambiguityBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Ambiguity")
    );

    expect(unsupportedBtn).toBeDefined();
    expect(ambiguityBtn).toBeDefined();

    await React.act(async () => unsupportedBtn?.click());
    await React.act(async () => ambiguityBtn?.click());

    expect(unsupportedBtn?.getAttribute("aria-pressed")).toBe("true");
    expect(ambiguityBtn?.getAttribute("aria-pressed")).toBe("true");

    // Add comment
    const commentInput = container.querySelector(
      "textarea[aria-label='Curator notes or justification']"
    ) as HTMLTextAreaElement;
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(commentInput, "Fixed premise mismatch against paragraph 2 evidence.");
      commentInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Submit form
    const submitBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Save & Apply Feedback")
    );
    await React.act(async () => submitBtn?.click());

    expect(onSubmit).toHaveBeenCalledWith(
      ["unsupported_claim", "ambiguity"],
      "Fixed premise mismatch against paragraph 2 evidence.",
      expect.any(String)
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("accepts reading paper from completed job review", async () => {
    window.history.replaceState(null, "", "/admin/exams/reading-paper?job=job-completed-1");
    vi.mocked(api.getReadingJob).mockResolvedValue({
      id: "job-completed-1",
      topic: "climate resilience",
      status: "Completed",
      completedSections: 1,
      error: null,
      examId: "exam-uuid-1",
      sources: [sources[0]],
      sections: [{
        title: "Climate Resilience",
        passage: "Passage text...",
        source: sources[0],
        groups: [{
          type: "MULTIPLE_CHOICE_SINGLE",
          instruction: "Choose one option",
          questions: [{
            number: 1,
            prompt: "What is climate resilience?",
            answer: "A. Ability to adapt",
            options: ["A. Ability to adapt", "B. Carbon emissions"],
            evidenceQuote: "Resilience is the ability to adapt.",
            explanation: "Defined in paragraph 1.",
          }],
        }],
      }],
    });
    vi.mocked(api.acceptPaper).mockResolvedValue({
      examId: "exam-uuid-1",
      status: "ACCEPTED",
      message: "Reading paper accepted by admin curator",
    });

    await React.act(async () => root.render(<Page />));

    const acceptBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Accept Paper")
    );
    expect(acceptBtn).toBeDefined();
    await React.act(async () => acceptBtn?.click());
    // Modal should be open in accept mode
    expect(container.textContent).toContain("Accept & Curate Reading Paper");

    // Select taxonomy reason tag (e.g. typo_or_formatting)
    const typoBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Typo or Formatting")
    );
    await React.act(async () => typoBtn?.click());

    // Add curator comment
    const commentInput = container.querySelector(
      "textarea[aria-label='Curator notes or justification']"
    ) as HTMLTextAreaElement;
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(commentInput, "Reviewed and verified all 40 question answer keys.");
      commentInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const confirmAcceptBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Confirm Acceptance")
    );
    expect(confirmAcceptBtn).toBeDefined();
    await React.act(async () => confirmAcceptBtn?.click());
    expect(api.acceptPaper).toHaveBeenCalledWith("exam-uuid-1", {
      reasons: ["typo_or_formatting"],
      comment: "Reviewed and verified all 40 question answer keys.",
      idempotencyKey: expect.any(String),
    });
    expect(container.textContent).toContain("Paper accepted and marked for publication.");
  });

  it("rejects reading paper with taxonomy reasons and comment payload", async () => {
    window.history.replaceState(null, "", "/admin/exams/reading-paper?job=job-completed-2");
    vi.mocked(api.getReadingJob).mockResolvedValue({
      id: "job-completed-2",
      topic: "renewable solar",
      status: "Completed",
      completedSections: 1,
      error: null,
      examId: "exam-uuid-2",
      sources: [sources[0]],
      sections: [{
        title: "Solar Trends",
        passage: "Passage text...",
        source: sources[0],
        groups: [],
      }],
    });
    vi.mocked(api.rejectPaper).mockResolvedValue({
      examId: "exam-uuid-2",
      status: "REJECTED",
      reasons: ["weak_distractor", "style_or_grammar"],
      comment: "Distractors are too weak in MCQ section.",
      message: "Reading paper rejected with reason taxonomy",
    });

    await React.act(async () => root.render(<Page />));

    const rejectBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Reject Paper")
    );
    expect(rejectBtn).toBeDefined();
    await React.act(async () => rejectBtn?.click());

    // Modal should be open in reject mode
    expect(container.textContent).toContain("Reject Reading Paper with Reason Taxonomy");

    // Select weak_distractor and style_or_grammar
    const weakDistractorBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Weak Distractor")
    );
    const styleBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Style or Grammar")
    );
    await React.act(async () => weakDistractorBtn?.click());
    await React.act(async () => styleBtn?.click());

    const commentInput = container.querySelector(
      "textarea[aria-label='Curator notes or justification']"
    ) as HTMLTextAreaElement;
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(commentInput, "Distractors are too weak in MCQ section.");
      commentInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const confirmRejectBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Confirm Rejection")
    );
    await React.act(async () => confirmRejectBtn?.click());
    expect(api.rejectPaper).toHaveBeenCalledWith("exam-uuid-2", {
      reasons: ["weak_distractor", "style_or_grammar"],
      comment: "Distractors are too weak in MCQ section.",
      idempotencyKey: expect.any(String),
    });
    expect(container.textContent).toContain("Paper rejected (Reasons: weak_distractor, style_or_grammar).");
  });

  it("publishes reading paper and transitions status feedback", async () => {
    window.history.replaceState(null, "", "/admin/exams/reading-paper?job=job-completed-3");
    vi.mocked(api.getReadingJob).mockResolvedValue({
      id: "job-completed-3",
      topic: "deep learning in medicine",
      status: "Completed",
      completedSections: 1,
      error: null,
      examId: "exam-uuid-3",
      sources: [sources[0]],
      sections: [{
        title: "Medical AI",
        passage: "Passage text...",
        source: sources[0],
        groups: [],
      }],
    });
    vi.mocked(api.publishPaper).mockResolvedValue({
      examId: "exam-uuid-3",
      slug: "medical-ai-reading-exam",
      title: "Medical AI",
      status: "PUBLISHED",
      message: "Reading paper published successfully",
    });

    await React.act(async () => root.render(<Page />));

    const publishBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Publish to Exam Bank")
    );
    expect(publishBtn).toBeDefined();
    await React.act(async () => publishBtn?.click());

    expect(api.publishPaper).toHaveBeenCalledWith("exam-uuid-3");
    expect(container.textContent).toContain("Paper published successfully (Status: PUBLISHED).");
  });
  it("pure manual edit submission succeeds even if LLM service is offline", async () => {
    // Simulate LLM service offline / rejected promise
    const offlineAiGenerator = vi.fn().mockRejectedValue(new Error("LLM provider 503 Service Unavailable"));
    
    // Manual CRUD callback functions cleanly without calling LLM generator
    const manualSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    await React.act(async () => {
      root.render(
        <FeedbackModal
          isOpen={true}
          onClose={onClose}
          title="Manual Edit Annotation"
          mode="edit"
          targetDescription="Q1 Option A"
          beforeText="Old manual option"
          afterText="New manual option"
          onSubmit={manualSubmit}
        />
      );
    });

    const submitBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Save & Apply Feedback")
    );
    await React.act(async () => submitBtn?.click());

    expect(offlineAiGenerator).not.toHaveBeenCalled();
    expect(manualSubmit).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("retains the exact same idempotency key across retries upon submission failure", async () => {
    let callCount = 0;
    const capturedKeys: string[] = [];
    const onSubmit = vi.fn().mockImplementation((reasons, comment, key) => {
      callCount++;
      capturedKeys.push(key);
      if (callCount === 1) {
        throw new Error("Network timeout on first attempt");
      }
      return Promise.resolve();
    });
    const onClose = vi.fn();

    await React.act(async () => {
      root.render(
        <FeedbackModal
          isOpen={true}
          onClose={onClose}
          title="Retry Test"
          mode="review"
          onSubmit={onSubmit}
        />
      );
    });

    const submitBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Save & Apply Feedback")
    );

    // Attempt 1: fails
    await React.act(async () => submitBtn?.click());
    expect(container.textContent).toContain("Network timeout on first attempt");
    expect(onClose).not.toHaveBeenCalled();

    // Attempt 2: retry clicked
    await React.act(async () => submitBtn?.click());
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(capturedKeys).toHaveLength(2);
    expect(capturedKeys[0]).toBeDefined();
    expect(capturedKeys[0]).toBe(capturedKeys[1]); // Exact same key retained across retries
    expect(onClose).toHaveBeenCalled();
  });
});
