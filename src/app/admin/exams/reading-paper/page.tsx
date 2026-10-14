"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  acceptPaper,
  cancelReadingJob,
  createReadingJob,
  getReadingJob,
  ingestReadingSource,
  listReadingJobs,
  publishPaper,
  rejectPaper,
  replaceReadingSources,
  retryReadingJob,
  searchReadingSources,
  type IngestSourcePayload,
  type ReadingJob,
  type ReadingJobSummary,
  type ReadingSource,
} from "./readingPaperApi";
import { FeedbackModal } from "./FeedbackModal";

function message(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = error.response as { data?: { detail?: string; error?: string } };
    return response.data?.detail ?? response.data?.error ?? "Request failed";
  }
  return error instanceof Error ? error.message : "Request failed";
}

const button = "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50";
const panel = "rounded-xl border border-slate-800 bg-slate-900/60 p-5";

export default function ReadingPaperPage() {
  const [topic, setTopic] = useState("");
  const [sourceTab, setSourceTab] = useState<"search" | "custom">("search");
  const [customType, setCustomType] = useState<"auto" | "url" | "text" | "markdown" | "html">("auto");
  const [customPayload, setCustomPayload] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [llmProvider, setLlmProvider] = useState<"auto" | "minimax" | "groq">("auto");
  const [sources, setSources] = useState<ReadingSource[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [job, setJob] = useState<ReadingJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<ReadingJobSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [logsCopied, setLogsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curationFeedback, setCurationFeedback] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    mode: "reject" | "accept" | "general";
    title: string;
    examId: string;
    targetDescription?: string;
    beforeText?: string;
    afterText?: string;
  } | null>(null);
  const [submittingCuration, setSubmittingCuration] = useState(false);
  const logBottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listReadingJobs().then(setRecentJobs).catch(() => undefined);
    const id = new URLSearchParams(window.location.search).get("job");
    if (!id) return;
    getReadingJob(id).then((result) => {
      if (!result?.id) return;
      setJob(result);
      setRecentJobs((current) => [result, ...current.filter((item) => item.id !== result.id)].slice(0, 20));
      setTopic(result.topic || "");
      setSelected((result.sources || []).map((source) => source.pmcid).filter(Boolean));
    }).catch((err: unknown) => setError(message(err)));
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("langfens_reading_llm_provider");
      if (saved === "auto" || saved === "minimax" || saved === "groq") {
        setLlmProvider(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const changeProvider = (p: "auto" | "minimax" | "groq") => {
    setLlmProvider(p);
    try {
      localStorage.setItem("langfens_reading_llm_provider", p);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!job?.id || !["Pending", "Running"].includes(job.status)) return;
    const timer = window.setInterval(() => {
      getReadingJob(job.id)
        .then((fresh) => {
          if (fresh?.id) setJob(fresh);
        })
        .catch((err: unknown) => setError(message(err)));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [job?.id, job?.status]);

  useEffect(() => {
    logBottom.current?.scrollIntoView?.({ block: "nearest" });
  }, [job?.logs?.length]);

  const search = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await searchReadingSources(topic.trim());
      setSources(result.sources);
      const firstSource = result.selectedPmcids[0] ?? result.sources[0]?.pmcid;
      setSelected(firstSource ? [firstSource] : []);
      setHint(result.message);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  const ingest = async () => {
    if (!customPayload.trim()) return;
    setBusy(true);
    setError(null);
    setIngestSuccess(null);
    try {
      const newSource = await ingestReadingSource({
        payload: customPayload.trim(),
        type: customType,
        title: customTitle.trim() || undefined,
      });
      setSources((current) => {
        const exists = current.some((s) => s.pmcid === newSource.pmcid);
        return exists ? current : [newSource, ...current];
      });
      setSelected((current) => (
        current.includes(newSource.pmcid)
          ? current
          : current.length < 3 ? [...current, newSource.pmcid] : current
      ));
      if (!topic.trim()) {
        setTopic(newSource.title.slice(0, 100));
      }
      setIngestSuccess(`Ingested "${newSource.title}" (${newSource.wordCount} words) successfully.`);
      setCustomPayload("");
      setCustomTitle("");
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  const selectedValid = selected.length >= 1 && selected.length <= 3
    && new Set(selected).size === selected.length
    && selected.every((id) => sources.some((source) => source.pmcid === id));

  const toggleSource = (pmcid: string) => {
    setSelected((current) => current.includes(pmcid)
      ? current.filter((id) => id !== pmcid)
      : current.length < 3 ? [...current, pmcid] : current);
  };

  const moveSource = (pmcid: string, direction: -1 | 1) => {
    setSelected((current) => {
      const index = current.indexOf(pmcid);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
      return reordered;
    });
  };

  const start = async () => {
    if (!selectedValid) return;
    setBusy(true);
    setError(null);
    try {
      const selectedSources = selected
        .map((id) => sources.find((source) => source.pmcid === id))
        .filter((source): source is ReadingSource => source !== undefined);
      const sourcesWithContent: ReadingSource[] = [];
      for (const source of selectedSources) {
        const content = source.content?.trim();
        if (content && content.length >= 50) {
          sourcesWithContent.push(source);
          continue;
        }
        if (!/^PMC\d+$/i.test(source.pmcid)) {
          throw new Error(`Selected source ${source.pmcid} has no verified full text.`);
        }
        const ingested = await ingestReadingSource({ payload: source.pmcid, type: "pmc" });
        if (
          ingested.pmcid.toUpperCase() !== source.pmcid.toUpperCase()
          || !ingested.content?.trim()
          || ingested.content.trim().length < 50
        ) {
          throw new Error(`Source ingestion did not return verified full text for ${source.pmcid}.`);
        }
        sourcesWithContent.push(ingested);
      }
      const providerArg = llmProvider === "auto" ? undefined : llmProvider;
      const result = job && ["NeedsSources", "Failed"].includes(job.status)
        ? (providerArg
            ? await replaceReadingSources(job.id, topic.trim(), undefined, sourcesWithContent, providerArg)
            : await replaceReadingSources(job.id, topic.trim(), undefined, sourcesWithContent))
        : (providerArg
            ? await createReadingJob(topic.trim(), undefined, sourcesWithContent, providerArg)
            : await createReadingJob(topic.trim(), undefined, sourcesWithContent));
      setJob(result);
      if (result?.id) {
        window.history.replaceState(null, "", `/admin/exams/reading-paper?job=${result.id}`);
      }
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    if (!job) return;
    setBusy(true);
    setError(null);
    try { setJob(await retryReadingJob(job.id)); }
    catch (err) { setError(message(err)); }
    finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!job) return;
    setBusy(true);
    setError(null);
    try { setJob(await cancelReadingJob(job.id)); }
    catch (err) { setError(message(err)); }
    finally { setBusy(false); }
  };

  const copyLogs = async () => {
    if (!job) return;
    const output = (job.logs ?? []).map((entry) =>
      `${entry.timestamp} [${entry.level}] ${entry.message}`,
    ).join("\n");
    try {
      await navigator.clipboard.writeText(output);
      setLogsCopied(true);
      window.setTimeout(() => setLogsCopied(false), 2000);
    } catch {
      setError("Could not copy logs. Check browser clipboard permissions.");
    }
  };

  const newJob = () => {
    setJob(null);
    setLogsCopied(false);
    setTopic("");
    setSources([]);
    setSelected([]);
    setHint(null);
    setError(null);
    window.history.replaceState(null, "", "/admin/exams/reading-paper");
  };

  const openJob = async (id: string) => {
    setError(null);
    try {
      const result = await getReadingJob(id);
      if (!result?.id) return;
      setJob(result);
      setLogsCopied(false);
      setTopic(result.topic || "");
      setSources([]);
      setSelected((result.sources || []).map((source) => source.pmcid).filter(Boolean));
      window.history.replaceState(null, "", `/admin/exams/reading-paper?job=${id}`);
    } catch (err) {
      setError(message(err));
    }
  };

  const handleOpenAccept = () => {
    if (!job?.examId) return;
    setModalConfig({
      isOpen: true,
      mode: "accept",
      title: "Accept & Curate Reading Paper",
      examId: job.examId,
      targetDescription: `Exam #${job.examId} (${job.topic})`,
    });
  };

  const handleOpenReject = () => {
    if (!job?.examId) return;
    setModalConfig({
      isOpen: true,
      mode: "reject",
      title: "Reject Reading Paper with Reason Taxonomy",
      examId: job.examId,
      targetDescription: `Exam #${job.examId} (${job.topic})`,
    });
  };

  const handlePublish = async () => {
    if (!job?.examId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await publishPaper(job.examId);
      setCurationFeedback(`Paper published successfully (Status: ${res.status}).`);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  const handleModalSubmit = async (reasons: string[], comment: string, idempotencyKey?: string) => {
    if (!modalConfig) return;
    setSubmittingCuration(true);
    try {
      if (modalConfig.mode === "reject") {
        await rejectPaper(modalConfig.examId, {
          reasons,
          comment: comment || undefined,
          idempotencyKey,
        });
        setCurationFeedback(`Paper rejected (Reasons: ${reasons.join(", ") || "none"}).`);
        if (job) {
          setJob({ ...job, status: "Failed", error: comment || "Rejected by curator" });
        }
      } else if (modalConfig.mode === "accept") {
        await acceptPaper(modalConfig.examId, {
          reasons,
          comment: comment || undefined,
          idempotencyKey,
        });
        setCurationFeedback("Paper accepted and marked for publication.");
      }
      setModalConfig(null);
    } catch (err) {
      setError(message(err));
    } finally {
      setSubmittingCuration(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/exams" className="text-sm text-indigo-300 hover:underline">← Exams</Link>
          <h1 className="mt-2 text-2xl font-bold">Create IELTS Academic Reading paper</h1>
          <p className="mt-1 text-sm text-slate-400">Choose 1–3 sources; each becomes one passage. Three sources make a complete 40-question paper.</p>
        </div>
        {job && <button onClick={newJob} className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">New paper</button>}
      </div>

      {error && <div role="alert" className="rounded-lg border border-rose-700 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-200">AI Model Provider:</span>
          <span className="text-slate-400">Select preferred LLM for passage rewriting & question generation</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            { id: "auto", label: "Auto (Groq + MiniMax M3 Failover)" },
            { id: "minimax", label: "MiniMax M3" },
            { id: "groq", label: "Groq (gpt-oss-20b)" },
          ] as const).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeProvider(item.id)}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                llmProvider === item.id
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                  : "border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {(!job || job.status === "NeedsSources" || job.status === "Failed") && (
        <section className={panel}>
          <h2 className="mb-3 font-semibold">1. Find and choose sources</h2>
          <div className="mb-4 flex border-b border-slate-800 text-sm">
            <button
              type="button"
              onClick={() => { setSourceTab("search"); setIngestSuccess(null); }}
              className={`px-4 py-2 font-medium transition-colors ${
                sourceTab === "search"
                  ? "border-b-2 border-indigo-500 text-indigo-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Search Europe PMC
            </button>
            <button
              type="button"
              onClick={() => { setSourceTab("custom"); setIngestSuccess(null); }}
              className={`px-4 py-2 font-medium transition-colors ${
                sourceTab === "custom"
                  ? "border-b-2 border-indigo-500 text-indigo-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              + Ingest Custom Source (URL, Text, Markdown, HTML)
            </button>
          </div>
          {sourceTab === "search" ? (
            <>
              <div className="flex flex-wrap gap-3">
                <input type="text" aria-label="Scientific topic" value={topic} onChange={(event) => setTopic(event.target.value)}
                  placeholder="e.g. urban biodiversity" maxLength={120}
                  className="min-w-64 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                <button onClick={search} disabled={busy || topic.trim().length < 3} className={button}>
                  {busy ? "Working…" : "Find sources"}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-400">Sources come from OpenAlex search and are checked against Europe PMC full text and the article license.</p>
              {hint && <p className="mt-3 text-sm text-amber-300">{hint}</p>}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Modal Type:</span>
                {(["auto", "url", "text", "markdown", "html"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCustomType(type)}
                    className={`rounded px-2.5 py-1 text-xs font-medium uppercase transition-colors ${
                      customType === type
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div>
                <input
                  aria-label="Custom title override"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Custom title override (optional)"
                  maxLength={180}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
              </div>
              <div>
                {customType === "url" ? (
                  <input
                    aria-label="Article Web URL"
                    type="url"
                    value={customPayload}
                    onChange={(e) => setCustomPayload(e.target.value)}
                    placeholder="https://example.org/article-to-ingest"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  />
                ) : (
                  <textarea
                    aria-label="Source payload content"
                    rows={4}
                    value={customPayload}
                    onChange={(e) => setCustomPayload(e.target.value)}
                    placeholder="Paste article text, markdown, or HTML here (minimum 600 words required)..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono"
                  />
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Accepts public web URLs, raw essays, HTML snippets or Markdown. Minimum 600 words.
                </p>
                <button
                  type="button"
                  onClick={ingest}
                  disabled={busy || !customPayload.trim()}
                  className={button}
                >
                  {busy ? "Ingesting…" : "Ingest & Validate"}
                </button>
              </div>
              {ingestSuccess && (
                <p className="mt-2 text-xs text-emerald-400">✓ {ingestSuccess}</p>
              )}
            </div>
          )}
          {sources.length > 0 && (
            <>
              <p className="mt-5 text-sm text-slate-300">Select 1–3 articles. Selection order sets passage order; use the arrows to change it.</p>
              <p className="mt-1 text-xs text-slate-400">
                {selected.length} selected · {([0, 13, 26, 40] as const)[selected.length]} questions · {selected.length * 20} minutes
              </p>
              {!selectedValid && <p className="mt-2 text-xs text-amber-300">Choose at least one verified article.</p>}
              <ul className="mt-5 max-h-72 space-y-2 overflow-y-auto">
                {sources.map((source) => {
                  const passageIndex = selected.indexOf(source.pmcid);
                  return (
                    <li key={source.pmcid} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex cursor-pointer items-start gap-2">
                          <input type="checkbox" aria-label={`Select ${source.title}`} checked={passageIndex >= 0}
                            disabled={passageIndex < 0 && selected.length >= 3}
                            onChange={() => toggleSource(source.pmcid)} className="mt-1" />
                          <span className="font-medium text-slate-100">{source.title}</span>
                          {source.sourceType && (
                            <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-300">
                              {source.sourceType}
                            </span>
                          )}
                        </label>
                        {passageIndex >= 0 && <span className="shrink-0 text-xs text-indigo-300">Passage {passageIndex + 1}</span>}
                      </div>
                      <div className="mt-1 pl-6 text-xs text-slate-400">
                        {source.authors ? `${source.authors} · ` : ""}
                        {source.metadata?.domain ? <span className="text-slate-300">[{source.metadata.domain}] · </span> : null}
                        {source.pmcid} · {source.wordCount} source words · <a href={source.license} target="_blank" rel="noopener noreferrer" className="underline">License</a>{source.doi ? ` · DOI ${source.doi}` : ""}
                      </div>
                      {source.contentPreview && (
                        <p className="mt-1.5 line-clamp-2 pl-6 text-xs italic text-slate-400">
                          &ldquo;{source.contentPreview}&rdquo;
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 pl-6 text-xs">
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline">Read source</a>
                        {passageIndex >= 0 && selected.length > 1 && <>
                          <button type="button" onClick={() => moveSource(source.pmcid, -1)} disabled={passageIndex === 0}
                            className="text-indigo-300 disabled:opacity-40">Move earlier</button>
                          <button type="button" onClick={() => moveSource(source.pmcid, 1)} disabled={passageIndex === selected.length - 1}
                            className="text-indigo-300 disabled:opacity-40">Move later</button>
                        </>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button onClick={start} disabled={busy || !selectedValid} className={`${button} mt-5`}>
                {job ? "Replace sources and continue" : `Create Draft (${selected.length} passage${selected.length === 1 ? "" : "s"})`}
              </button>
            </>
          )}
        </section>
      )}

      {job && (
        <section className={panel} aria-live="polite">
          <h2 className="font-semibold">2. Generation progress</h2>
          <p className="mt-2 text-sm">Status: <strong>{job.status}</strong> · {job.status === "NeedsSources"
            ? `${job.completedSections} passages complete`
            : `${job.completedSections}/${job.sources.length} passages complete`}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, Math.round(job.completedSections / Math.max(1, job.sources.length) * 100))}%` }} />
          </div>
          {job.error && <p className="mt-3 text-sm text-rose-300">{job.error}</p>}
          {job.status === "Failed" && <button onClick={retry} disabled={busy} className={`${button} mt-3`}>Retry failed step</button>}
          {["Pending", "Running"].includes(job.status) && (
            <button type="button" onClick={cancel} disabled={busy} className="mt-3 rounded-lg border border-rose-800 bg-rose-950/60 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-900 disabled:opacity-50">
              Cancel generation
            </button>
          )}
          {job.status === "Cancelled" && <p className="mt-3 text-sm text-rose-400">Generation was cancelled.</p>}
          {job.status === "NeedsSources" && <p className="mt-3 text-sm text-amber-300">Search again and choose one to three eligible sources to continue.</p>}
          <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950/70">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-3 py-2">
              <h3 className="text-sm font-semibold">Generation logs <span className="font-normal text-slate-400">({job.logs?.length ?? 0})</span></h3>
              <button type="button" onClick={copyLogs} disabled={!job.logs?.length}
                className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40">
                {logsCopied ? "Copied" : "Copy all logs"}
              </button>
            </div>
            <div role="log" aria-label="Generation logs" aria-live="polite"
              className="max-h-96 space-y-2 overflow-auto p-3 font-mono text-xs">
              {!job.logs?.length && <p className="text-slate-500">Waiting for the worker to report progress…</p>}
              {job.logs?.map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} className="border-b border-slate-900 pb-2 last:border-0">
                  <div className="flex flex-wrap gap-x-2 text-slate-500">
                    <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString()}</time>
                    <span className={entry.level.toLowerCase() === "error" ? "text-rose-400" : entry.level.toLowerCase() === "warning" ? "text-amber-300" : "text-indigo-300"}>
                      {entry.level}
                    </span>
                  </div>
                  <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-slate-200">{entry.message}</pre>
                </div>
              ))}
              <div ref={logBottom} />
            </div>
          </div>
        </section>
      )}

      {curationFeedback && (
        <div role="status" className="rounded-lg border border-emerald-700 bg-emerald-950/40 p-3 text-sm text-emerald-200">
          {curationFeedback}
        </div>
      )}

      {job?.status === "Completed" && job.examId && (
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">3. Review Draft & Curator Actions</h2>
              <p className="mt-1 text-sm text-slate-400">Check passages, answer keys and explanations. Accept, reject with taxonomy reasons, or publish directly.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAccept}
                disabled={busy}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                ✓ Accept Paper
              </button>
              <button
                type="button"
                onClick={handleOpenReject}
                disabled={busy}
                className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
              >
                ✕ Reject Paper
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={busy}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                🚀 Publish to Exam Bank
              </button>
              <Link href={`/admin/exams/${job.examId}`} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700">
                Open in Exam Editor →
              </Link>
            </div>
          </div>
          <div className="mt-5 space-y-5">
            {(job.sections || []).map((section, index) => (
              <details key={section.source?.pmcid || index} open className="rounded-lg border border-slate-700 p-4">
                <summary className="cursor-pointer font-semibold">Passage {index + 1}: {section.title}</summary>
                <p className="mt-2 text-xs text-slate-400">Source: <a href={section.source?.url} target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline">{section.source?.title}</a> · {section.source?.authors} · <a href={section.source?.license} target="_blank" rel="noopener noreferrer" className="underline">License</a> · {section.source?.doi || section.source?.pmcid}</p>
                <div className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm leading-7">{section.passage}</div>
                {(section.groups || []).map((group) => (
                  <div key={group.type} className="mt-5">
                    <h3 className="text-sm font-semibold text-indigo-300">{group.type.replaceAll("_", " ")}</h3>
                    <p className="mt-1 text-sm text-slate-400">{group.instruction}</p>
                    <ol className="mt-3 space-y-3">
                      {(group.questions || []).map((question) => (
                        <li key={question.number} className="rounded-lg border border-slate-800 p-3 text-sm">
                          <p><strong>{question.number}.</strong> {question.prompt}</p>
                          {(question.options || []).length > 0 && <p className="mt-1 text-slate-400">{(question.options || []).join(" · ")}</p>}
                          <p className="mt-2 text-emerald-300">Answer: {question.answer}</p>
                          <p className="mt-1 text-slate-300">{question.explanation}</p>
                          <p className="mt-1 text-xs text-slate-500">Evidence: “{question.evidenceQuote}”</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </details>
            ))}
          </div>
        </section>
      )}

      {recentJobs.length > 0 && (
        <section className={panel}>
          <h2 className="font-semibold">Recent Reading jobs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentJobs.map((item) => (
              <li key={item.id}>
                <button onClick={() => openJob(item.id)} className="text-indigo-300 hover:underline">{item.topic}</button>
                <span className="ml-2 text-slate-400">{item.status} · {item.completedSections} passage{item.completedSections === 1 ? "" : "s"} complete</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {modalConfig && (
        <FeedbackModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          title={modalConfig.title}
          mode={modalConfig.mode}
          targetDescription={modalConfig.targetDescription}
          beforeText={modalConfig.beforeText}
          afterText={modalConfig.afterText}
          onSubmit={handleModalSubmit}
          isSubmitting={submittingCuration}
        />
      )}
    </main>
  );
}
