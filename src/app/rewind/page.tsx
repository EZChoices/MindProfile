"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateClientId } from "@/lib/clientId";
import type { RewindSummary } from "@/lib/rewind";
import { analyzeRewindFileClient } from "@/lib/rewindFileClient";
import type { RewindClientProgress } from "@/lib/rewindFileClient";

const errorMessages: Record<string, string> = {
  no_file: "Please select your ChatGPT export file.",
  invalid_file: "We couldn’t read that file. Please upload the ChatGPT export ZIP or JSON.",
  no_data: "That export looks empty — make sure you have some chat history.",
  analysis_failed: "We couldn’t generate your Rewind. Please try again.",
};

const formatHour = (hour: number) => {
  const display = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${display} ${suffix}`;
};

const formatHourRange = (hour: number) => `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`;

export default function RewindPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [debugDetails, setDebugDetails] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [rewind, setRewind] = useState<RewindSummary | null>(null);
  const [clientProgress, setClientProgress] = useState<RewindClientProgress | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    const flag = process.env.NEXT_PUBLIC_REWIND_DEBUG === "1";
    const query = new URLSearchParams(window.location.search);
    setDebugEnabled(flag || query.get("debug") === "1" || process.env.NODE_ENV !== "production");
  }, []);

  useEffect(() => {
    if (!shareStatus) return;
    const t = window.setTimeout(() => setShareStatus(null), 2500);
    return () => window.clearTimeout(t);
  }, [shareStatus]);

  const buildShareText = (summary: RewindSummary) => {
    const parts: string[] = [];
    const topTopic = summary.topTopics[0]?.label;
    parts.push("My AI Year in Rewind");
    parts.push(`${summary.totalConversations.toLocaleString()} chats`);
    parts.push(`${summary.totalUserMessages.toLocaleString()} prompts`);
    if (topTopic) parts.push(`Top topic: ${topTopic}`);
    if (summary.peakHour != null) parts.push(`Prime time: ${formatHourRange(summary.peakHour)}`);
    return parts.join(" • ");
  };

  const copyRewind = async () => {
    if (!rewind) return;
    try {
      await navigator.clipboard.writeText(buildShareText(rewind));
      setShareStatus("Copied to clipboard.");
    } catch (err) {
      console.warn("Clipboard copy failed", err);
      setShareStatus("Couldn't copy - your browser blocked clipboard access.");
    }
  };

  const shareRewind = async () => {
    if (!rewind) return;
    const text = buildShareText(rewind);
    const url = window.location.href.split("?")[0];

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "AI Year in Rewind", text, url });
        setShareStatus("Shared.");
        return;
      } catch (err) {
        console.warn("Share cancelled/failed", err);
      }
    }

    await copyRewind();
  };

  const handleFileChange = (next: FileList | null) => {
    const chosen = next?.[0] ?? null;
    setFile(chosen);
    setApiError(null);
    setDebugDetails(null);
    setShowDebug(false);
    setRewind(null);
    setClientProgress(null);
    setShareStatus(null);
  };

  const shouldProcessLocally = (candidate: File) => candidate.size > 4 * 1024 * 1024;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);
    setDebugDetails(null);
    setShowDebug(false);
    setClientProgress(null);

    if (!file) {
      setApiError(errorMessages.no_file);
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".zip") && !lowerName.endsWith(".json")) {
      setApiError(errorMessages.invalid_file);
      return;
    }

    setLoading(true);
    try {
      const clientId = getOrCreateClientId();

      const processLocally = async () => {
        const summary = await analyzeRewindFileClient(file, (p) => setClientProgress(p));
        setRewind(summary);
        try {
          await fetch("/api/rewind/store", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ clientId, rewind: summary, year: new Date().getFullYear() }),
          });
        } catch (err) {
          console.warn("Failed to persist rewind summary", err);
        }
      };

      if (shouldProcessLocally(file)) {
        await processLocally();
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientId", clientId);

      const res = await fetch("/api/rewind", {
        method: "POST",
        body: formData,
        headers: debugEnabled ? { "x-rewind-debug": "1" } : undefined,
      });
      const contentType = res.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        const text = await res.text();
        setDebugDetails(`HTTP ${res.status} ${res.statusText}\n${text.slice(0, 800)}`);
        if (res.status === 403 || res.status === 413) {
          await processLocally();
          return;
        }
        setApiError(errorMessages.analysis_failed);
        return;
      }

      const data = (await res.json()) as { rewind?: RewindSummary; error?: string; message?: string };

      if (!res.ok || !data.rewind) {
        setApiError(errorMessages[data.error || "analysis_failed"] || errorMessages.analysis_failed);
        if (debugEnabled) {
          const debug = data?.message || `HTTP ${res.status} ${data?.error || "unknown_error"}`;
          setDebugDetails(debug);
        }
        return;
      }

      setRewind(data.rewind);
    } catch (err) {
      console.error("Rewind upload failed", err);
      const message = err instanceof Error ? err.message : String(err);
      const lower = message.toLowerCase();
      if (
        lower.includes("conversations.json") ||
        lower.includes("unsupported file type") ||
        lower.includes("unexpected token")
      ) {
        setApiError(errorMessages.invalid_file);
      } else {
        setApiError(errorMessages.analysis_failed);
      }
      setDebugDetails(message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setRewind(null);
    setApiError(null);
    setDebugDetails(null);
    setShowDebug(false);
    setClientProgress(null);
    setShareStatus(null);
  };

  return (
    <main className="beam gridlines relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 pb-16 pt-12 sm:px-10 lg:pt-16">
        <header className="space-y-4">
          <Link href="/" className="text-xs uppercase tracking-[0.2em] text-emerald-200">
            MindProfile
          </Link>
          <h1 className="font-[var(--font-display)] text-4xl text-white sm:text-5xl">
            AI Year in Rewind
          </h1>
          <p className="muted text-base leading-relaxed text-slate-100">
            Upload your ChatGPT export and get a private, just‑for‑fun highlight reel of your
            year with AI.
          </p>
        </header>

        <div className="glass card-border grid gap-6 rounded-3xl p-6 sm:p-10">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
              How to grab your export
            </div>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-100">
              <li>Open ChatGPT settings, then export your data.</li>
              <li>Check your email for the download link, then grab the file.</li>
              <li>Upload the ZIP or JSON here — no need to unzip.</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm text-slate-100">
              <span className="font-semibold">Upload your ChatGPT export</span>
              <input
                type="file"
                accept=".zip,.json,application/zip,application/json"
                onChange={(e) => handleFileChange(e.currentTarget.files)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-300/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-50 hover:file:bg-emerald-300/30"
              />
            </label>

            {apiError && (
              <div className="space-y-2">
                <p className="text-sm text-rose-200">{apiError}</p>
                {debugEnabled && debugDetails && (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <button
                      type="button"
                      onClick={() => setShowDebug((v) => !v)}
                      className="text-xs font-semibold text-emerald-200 underline"
                    >
                      {showDebug ? "Hide details" : "Show details"}
                    </button>
                    {showDebug && (
                      <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-200">
                        {debugDetails}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {clientProgress && !rewind && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                  Processing on this device
                </div>
                <p className="muted mt-2 text-xs">
                  Nothing is uploaded. Big exports can take a minute.
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-200">
                  <span className="muted">
                    {clientProgress.phase === "unzipping"
                      ? "Unzipping..."
                      : clientProgress.phase === "parsing"
                        ? "Reading chats..."
                        : clientProgress.phase === "reading"
                          ? "Reading file..."
                          : "Done."}
                  </span>
                  <span className="muted">
                    {(clientProgress.phase === "unzipping" || clientProgress.phase === "reading") &&
                    clientProgress.totalBytes > 0
                      ? `${Math.round((clientProgress.bytesRead / clientProgress.totalBytes) * 100)}%`
                      : ""}
                  </span>
                </div>
                {clientProgress.conversationsProcessed > 0 && (
                  <p className="muted mt-2 text-xs">
                    Conversations scanned: {clientProgress.conversationsProcessed.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-300 to-sky-300 px-6 py-3 text-base font-semibold text-slate-900 shadow-xl shadow-emerald-500/30 transition hover:translate-y-[-1px] disabled:opacity-60"
              >
                {loading ? "Generating your Rewind..." : "Generate my Rewind"}
              </button>
              <p className="muted text-xs text-slate-200">
                Your data stays private — we anonymize and don’t save raw chats.
              </p>
            </div>
          </form>
        </div>

        {rewind && (
          <section className="grid gap-6">
            <div className="glass card-border rounded-3xl p-6 sm:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                    Your year at a glance
                  </div>
                  <p className="mt-3 text-base text-slate-100">
                    <b>{rewind.totalConversations.toLocaleString()}</b> chats •{" "}
                    <b>{rewind.totalUserMessages.toLocaleString()}</b> prompts •{" "}
                    <b>{rewind.activeDays.toLocaleString()}</b> active days
                  </p>
                  {rewind.topTopics[0] && (
                    <p className="muted mt-2 text-sm text-slate-100">
                      Top vibe:{" "}
                      <b>
                        {rewind.topTopics[0].emoji} {rewind.topTopics[0].label}
                      </b>
                      .
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={shareRewind}
                    className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-5 py-2 text-sm font-semibold text-emerald-50 hover:border-emerald-300/80 hover:bg-emerald-300/20"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={copyRewind}
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-100 hover:border-emerald-300/60 hover:bg-white/10"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {shareStatus && <p className="mt-3 text-xs text-emerald-200">{shareStatus}</p>}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Prime time</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {rewind.peakHour != null ? formatHourRange(rewind.peakHour) : "—"}
                  </div>
                  <p className="muted mt-1 text-xs text-slate-200">
                    {rewind.lateNightPercent > 0
                      ? `${rewind.lateNightPercent}% late-night chats`
                      : "No strong late-night streak"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Busiest month</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {rewind.busiestMonth ?? "—"}
                  </div>
                  <p className="muted mt-1 text-xs text-slate-200">Your most chatty stretch.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Prompts per chat</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {rewind.totalConversations > 0
                      ? Math.round(rewind.totalUserMessages / rewind.totalConversations).toLocaleString()
                      : "—"}
                  </div>
                  <p className="muted mt-1 text-xs text-slate-200">On average.</p>
                </div>
              </div>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Your top topics
              </div>
              <ul className="mt-5 space-y-4 text-sm text-slate-100">
                {rewind.topTopics.map((t) => {
                  const pct =
                    rewind.totalConversations > 0
                      ? Math.round((t.count / rewind.totalConversations) * 100)
                      : 0;
                  return (
                    <li key={t.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span>
                          {t.emoji} <b>{t.label}</b>
                        </span>
                        <span className="muted text-xs">
                          {t.count.toLocaleString()} chats • {pct}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-emerald-300/70 to-sky-300/60"
                          style={{ width: `${Math.max(3, pct)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                When you chat
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-100">
                <p>
                  You showed up on <b>{rewind.activeDays.toLocaleString()}</b> days and had{" "}
                  <b>{rewind.totalConversations.toLocaleString()}</b> chats.
                  {rewind.activeDays > 0 && (
                    <>
                      {" "}
                      That's about{" "}
                      <b>{(rewind.totalConversations / rewind.activeDays).toFixed(1)}</b> chats on an
                      active day.
                    </>
                  )}
                </p>
                {rewind.peakHour != null && (
                  <p>
                    Prime time: <b>{formatHourRange(rewind.peakHour)}</b>.
                  </p>
                )}
                {rewind.lateNightPercent > 0 && (
                  <p>
                    Late-night chats made up <b>{rewind.lateNightPercent}%</b> of your year.
                  </p>
                )}
              </div>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Your AI quirks
              </div>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-100">
                {rewind.topWord && (
                  <li>
                    Most-used word: <b>{rewind.topWord}</b>.
                  </li>
                )}
                {rewind.frequentPhrases.map((p) => (
                  <li key={p.phrase}>
                    {p.phrase === "please"
                      ? `Polite mode: "please" `
                      : p.phrase === "thank you"
                        ? `Gratitude: "${p.phrase}" `
                        : `Signature move: "${p.phrase}" `}
                    about <b>{p.count.toLocaleString()}</b> times.
                  </li>
                ))}
                {rewind.frequentPhrases.length === 0 && (
                  <li>You kept things fresh - no single phrase dominated.</li>
                )}
              </ul>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Year records
              </div>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-100">
                {rewind.longestPromptChars != null && (
                  <li>
                    Longest prompt: <b>{rewind.longestPromptChars.toLocaleString()}</b> characters.
                  </li>
                )}
                {rewind.avgPromptChars != null && (
                  <li>
                    Typical prompt length: around <b>{rewind.avgPromptChars}</b> characters.
                  </li>
                )}
                {rewind.promptLengthChangePercent != null && (
                  <li>
                    Your prompts got{" "}
                    <b>{Math.abs(rewind.promptLengthChangePercent)}%</b>{" "}
                    {rewind.promptLengthChangePercent > 0 ? "longer" : "shorter"} over the year.
                  </li>
                )}
              </ul>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={shareRewind}
                className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-6 py-3 text-sm font-semibold text-emerald-50 hover:border-emerald-300/80 hover:bg-emerald-300/20"
              >
                Share
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 hover:border-emerald-300/60 hover:bg-white/10"
              >
                Try another export
              </button>
              <Link
                href="/"
                className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-6 py-3 text-sm font-semibold text-emerald-50 hover:border-emerald-300/80 hover:bg-emerald-300/20"
              >
                Back to home
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
