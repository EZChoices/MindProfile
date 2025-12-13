"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateClientId } from "@/lib/clientId";
import type { RewindSummary } from "@/lib/rewind";
import { analyzeRewindFileClient } from "@/lib/rewindFileClient";
import type { RewindClientProgress } from "@/lib/rewindFileClient";
import { generateRewindBangers, type RewindBanger, type SpiceLevel } from "@/lib/rewindBangers";

const errorMessages: Record<string, string> = {
  no_file: "Please select your ChatGPT export file.",
  invalid_file: "We couldn't read that file. Please upload the ChatGPT export ZIP or JSON.",
  no_data: "That export looks empty - make sure you have some chat history.",
  analysis_failed: "We couldn't generate your Rewind. Please try again.",
};

const formatHour = (hour: number) => {
  const display = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${display} ${suffix}`;
};

const formatHourRange = (hour: number) => `${formatHour(hour)}-${formatHour((hour + 1) % 24)}`;

type ShareInsight = { headline: string; subhead?: string };

const bySpice = (spice: SpiceLevel, variants: { mild: string; spicy: string; savage: string }) => variants[spice];

const topicMeaning = (key: string | undefined) => {
  switch (key) {
    case "coding":
      return "You came here to build things. Not just look them up.";
    case "writing":
      return "You came here to find the right words — then rewrite them.";
    case "learning":
      return "You didn’t want trivia. You wanted it to click.";
    case "planning":
      return "You came here to turn chaos into a plan.";
    case "travel":
      return "You came here to map it out before you went.";
    case "career":
      return "You came here to sharpen your next move.";
    case "creative":
      return "You came here to play until something stuck.";
    default:
      return "You had a few lanes. You stayed in them.";
  }
};

const topicTagline = (key: string | undefined) => {
  switch (key) {
    case "coding":
      return "You didn’t use AI to browse. You used it to build.";
    case "writing":
      return "You came here to make it sound like you (but better).";
    case "learning":
      return "You kept asking until it actually clicked. Respect.";
    case "planning":
      return 'You turned "??" into checklists. Repeatedly.';
    case "travel":
      return "You planned it like a pro (with a co-pilot).";
    case "career":
      return "You workshopped your next move like it mattered.";
    case "creative":
      return "You played with ideas until one sparked.";
    default:
      return "You kept coming back to the same few themes.";
  }
};

const primeTimeRoast = (hour: number) => {
  if (hour >= 5 && hour <= 8) return "Fresh brain. Zero distractions.";
  if (hour >= 9 && hour <= 11) return "Coffee in. Brain online.";
  if (hour >= 12 && hour <= 14) return "Midday focus. Clear head.";
  if (hour >= 15 && hour <= 17) return "Last-minute genius hours.";
  if (hour >= 18 && hour <= 21) return "After-hours thinking.";
  return "Late-night energy. You brought it here.";
};

const closingReflectionLines = (summary: RewindSummary, spice: SpiceLevel) => {
  const top = summary.topTopics[0]?.key;
  const lines: string[] = [];

  lines.push(
    bySpice(spice, {
      mild: "This wasn't about answers. It was about clarity.",
      spicy: "This wasn't about answers. It was about control, clarity, and getting unstuck.",
      savage: "You didn't come here for magic. You came here because you were done guessing.",
    }),
  );

  switch (top) {
    case "coding":
      lines.push("You didn’t come here to browse. You came here to ship.");
      break;
    case "writing":
      lines.push("You came here to make the words behave.");
      break;
    case "learning":
      lines.push("You kept pushing until it clicked.");
      break;
    case "planning":
      lines.push("You came here because guessing wasn’t working.");
      break;
    case "travel":
      lines.push("You planned it like you were allergic to surprises.");
      break;
    case "career":
      lines.push("You came here to rehearse the next move.");
      break;
    case "creative":
      lines.push("You came here to play — then polish.");
      break;
    default:
      lines.push("You came here to think out loud until it made sense.");
      break;
  }

  const hasChaos =
    summary.behavior.whiplashChatCount > 0 ||
    summary.behavior.brokenCount > 0 ||
    summary.behavior.spicyWordCount > 0 ||
    summary.behavior.wtfCount > 0 ||
    summary.behavior.yellingMessageCount > 0;

  lines.push(
    hasChaos
      ? bySpice(spice, {
          mild: "You had feelings. You brought them here. You still kept going.",
          spicy: "You argued with a machine. You lost sometimes. You came back anyway.",
          savage: "You argued with a machine. You lost sometimes. You came back anyway.",
        })
      : bySpice(spice, {
          mild: "You used AI to think better. That counts.",
          spicy: "You used a machine to think better. That counts.",
          savage: "You didn't just use AI. You learned how to work with it.",
        }),
  );

  return lines;
};

const wrapCanvasText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) => {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, y);
  return y;
};

const renderShareCardPng = async (insight: ShareInsight) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#020617");
  grad.addColorStop(0.55, "#0b1220");
  grad.addColorStop(1, "#022c22");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
  ctx.beginPath();
  ctx.arc(170, 220, 320, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(56, 189, 248, 0.10)";
  ctx.beginPath();
  ctx.arc(940, 920, 420, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(167, 243, 208, 0.95)";
  ctx.font = "700 34px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("MINDPROFILE", 90, 96);

  ctx.fillStyle = "rgba(148, 163, 184, 0.95)";
  ctx.font = "600 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("AI YEAR IN REWIND - UNFILTERED", 90, 132);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 72px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  let y = wrapCanvasText(ctx, insight.headline, 90, 290, 900, 86);

  if (insight.subhead) {
    ctx.fillStyle = "rgba(226, 232, 240, 0.92)";
    ctx.font = "600 34px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    y += 36;
    wrapCanvasText(ctx, insight.subhead, 90, y, 900, 48);
  }

  ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
  ctx.font = "600 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("PRIVATE. JUST FOR FUN.", 90, 1010);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to render image"))), "image/png");
  });
  return blob;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function RewindPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [debugDetails, setDebugDetails] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [rewind, setRewind] = useState<RewindSummary | null>(null);
  const [clientProgress, setClientProgress] = useState<RewindClientProgress | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [spice, setSpice] = useState<SpiceLevel>("spicy");
  const [includeSpicyWords, setIncludeSpicyWords] = useState(false);
  const [includeExamples, setIncludeExamples] = useState(true);
  const [allowRedactedExcerpts, setAllowRedactedExcerpts] = useState(false);
  const [sharePick, setSharePick] = useState(0);

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

  useEffect(() => {
    if (spice === "mild") setIncludeSpicyWords(false);
  }, [spice]);

  useEffect(() => {
    setSharePick(0);
  }, [spice, includeSpicyWords, rewind?.totalConversations]);

  const bangerPack = rewind ? generateRewindBangers(rewind, { spice, includeSpicyWords }) : null;
  const shareBangers = bangerPack?.share ?? [];
  const currentShareBanger: RewindBanger | null =
    shareBangers.length > 0 ? shareBangers[sharePick % shareBangers.length] : null;
  const currentShareInsight: ShareInsight | null = currentShareBanger
    ? { headline: currentShareBanger.line1, subhead: currentShareBanger.line2 }
    : rewind
      ? { headline: "Your AI Year in Rewind.", subhead: "Private. Unfiltered. Just for fun." }
      : null;
  const treatedBangers = bangerPack
    ? bangerPack.all
        .filter((b) => ["nickname", "whiplash", "rage"].includes(b.category))
        .slice(0, 3)
    : [];
  const receiptBangers = bangerPack
    ? bangerPack.all
        .filter((b) =>
          ["nickname", "whiplash", "politeness", "quick", "contradiction", "rage", "style", "rhythm"].includes(b.category),
        )
        .slice(0, 6)
    : [];

  const momentLines = (() => {
    if (!rewind || !allowRedactedExcerpts) return [];
    const picked: string[] = [];
    const seen = new Set<string>();

    const add = (predicate: (c: RewindSummary["conversations"][number]) => boolean) => {
      const found = rewind.conversations.find((c) => predicate(c) && c.oneLineSummary && !seen.has(c.oneLineSummary));
      if (!found) return;
      seen.add(found.oneLineSummary);
      picked.push(found.oneLineSummary.length > 140 ? found.oneLineSummary.slice(0, 137) + "…" : found.oneLineSummary);
    };

    add((c) => c.comeback);
    add((c) => c.mood === "flow");
    add((c) => c.mood === "frustrated");

    if (picked.length < 3) {
      const sorted = [...rewind.conversations].sort((a, b) => b.userMessages - a.userMessages);
      for (const c of sorted) {
        if (!c.oneLineSummary || seen.has(c.oneLineSummary)) continue;
        seen.add(c.oneLineSummary);
        picked.push(c.oneLineSummary.length > 140 ? c.oneLineSummary.slice(0, 137) + "…" : c.oneLineSummary);
        if (picked.length >= 3) break;
      }
    }

    return picked.slice(0, 3);
  })();

  const buildShareText = (insight: ShareInsight) =>
    insight.subhead ? `${insight.headline}\n${insight.subhead}` : insight.headline;

  const shuffleShare = () => {
    if (shareBangers.length <= 1) return;
    setSharePick((idx) => (idx + 1) % shareBangers.length);
    setShareStatus("Shuffled.");
  };

  const copyRewind = async () => {
    const insight = currentShareInsight;
    if (!insight) return;
    try {
      await navigator.clipboard.writeText(buildShareText(insight));
      setShareStatus("Copied to clipboard.");
    } catch (err) {
      console.warn("Clipboard copy failed", err);
      setShareStatus("Couldn't copy - your browser blocked clipboard access.");
    }
  };

  const shareRewind = async () => {
    const insight = currentShareInsight;
    if (!insight) return;
    const text = buildShareText(insight);

    if (typeof navigator.share === "function") {
      try {
        const png = await renderShareCardPng(insight);
        const file = new File([png], "mindprofile-rewind.png", { type: "image/png" });

        if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "AI Year in Rewind - Unfiltered", text, files: [file] });
        } else {
          await navigator.share({ title: "AI Year in Rewind - Unfiltered", text });
        }
        setShareStatus("Shared.");
        return;
      } catch (err) {
        console.warn("Share cancelled/failed", err);
      }
    }

    try {
      const png = await renderShareCardPng(insight);
      downloadBlob(png, "mindprofile-rewind.png");
      setShareStatus("Downloaded a share card.");
    } catch (err) {
      console.warn("Share card render failed", err);
      await copyRewind();
    }
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
    setSharePick(0);
    setIncludeSpicyWords(false);
    setIncludeExamples(true);
    setAllowRedactedExcerpts(false);
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
    setSharePick(0);
    setIncludeSpicyWords(false);
    setIncludeExamples(true);
    setAllowRedactedExcerpts(false);
  };

  return (
    <main className="beam gridlines relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 pb-16 pt-12 sm:px-10 lg:pt-16">
        <header className="space-y-4">
          <Link href="/" className="text-xs uppercase tracking-[0.2em] text-emerald-200">
            MindProfile
          </Link>
          <h1 className="font-[var(--font-display)] text-4xl text-white sm:text-5xl">
            Your AI Year in Rewind
          </h1>
          <p className="muted text-base leading-relaxed text-slate-100">
            This is the part where you get called out.
          </p>
          <p className="muted text-sm text-slate-200">
            It takes about 2 minutes. Your export stays on this device. We only save a redacted summary (no raw chats).
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
              <li>Upload the file you downloaded - no need to unzip.</li>
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
                  Your export stays on this device. Big exports can take a minute.
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
                Your export stays private — we anonymize and only save a redacted summary (no raw chats).
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
                    How deep you went
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">
                    {rewind.wrapped.archetype.title}
                  </div>
                  <p className="muted mt-2 text-sm text-slate-200">{rewind.wrapped.archetype.line}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Chats</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {rewind.totalConversations.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Prompts</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {rewind.totalUserMessages.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Days you showed up</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {rewind.activeDays.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-100">
                    <b>{rewind.wrapped.hook.brag}</b>
                  </p>

                  {rewind.topTopics[0] && (
                    <p className="mt-3 text-sm text-slate-100">
                      Main obsession:{" "}
                      <b>
                        {rewind.topTopics[0].emoji} {rewind.topTopics[0].label}
                      </b>
                      .{" "}
                      <span className="muted text-slate-200">
                        {topicMeaning(rewind.topTopics[0].key)}
                      </span>
                    </p>
                  )}

                  <p className="mt-3 text-sm text-slate-100">{rewind.wrapped.hook.roast}</p>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
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
                    <button
                      type="button"
                      onClick={shuffleShare}
                      disabled={shareBangers.length <= 1}
                      className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-100 hover:border-emerald-300/60 hover:bg-white/10 disabled:opacity-50"
                    >
                      Shuffle
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                      Spice level
                    </span>
                    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                      {(["mild", "spicy", "savage"] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSpice(level)}
                          className={
                            level === spice
                              ? "rounded-full bg-emerald-300/25 px-3 py-1 text-xs font-semibold text-emerald-50"
                              : "rounded-full px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
                          }
                        >
                          {level === "mild" ? "Mild" : level === "spicy" ? "Spicy" : "Savage"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-xs text-slate-200 sm:items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeExamples}
                        onChange={(e) => setIncludeExamples(e.currentTarget.checked)}
                        className="h-4 w-4 rounded border border-white/20 bg-white/5 text-emerald-300"
                      />
                      Include concrete examples (private)
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allowRedactedExcerpts}
                        onChange={(e) => setAllowRedactedExcerpts(e.currentTarget.checked)}
                        className="h-4 w-4 rounded border border-white/20 bg-white/5 text-emerald-300"
                      />
                      Allow small redacted excerpts (private)
                    </label>
                    <p className="muted text-[11px] text-slate-200">Sharing stays safe. No raw prompts.</p>
                  </div>
                </div>
              </div>

              {shareStatus && <p className="mt-3 text-xs text-emerald-200">{shareStatus}</p>}

              {currentShareBanger && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Share card</div>
                  <p className="mt-3 text-base font-semibold text-white">{currentShareBanger.line1}</p>
                  {currentShareBanger.line2 && (
                    <p className="muted mt-2 text-xs text-slate-200">{currentShareBanger.line2}</p>
                  )}
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Prime time</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {rewind.peakHour != null ? formatHourRange(rewind.peakHour) : "-"}
                  </div>
                  <p className="muted mt-1 text-xs text-slate-200">
                    {rewind.peakHour != null ? primeTimeRoast(rewind.peakHour) : "You had a schedule. Kind of."}
                  </p>
                  {rewind.lateNightPercent > 0 && (
                    <p className="muted mt-2 text-xs text-slate-200">
                      After-hours energy: {rewind.lateNightPercent}%.
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Busiest month</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {rewind.busiestMonth ?? "-"}
                  </div>
                  <p className="muted mt-1 text-xs text-slate-200">
                    {rewind.busiestMonth ? `${rewind.busiestMonth} was unhinged.` : "You had a peak. We saw it."}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Prompts per chat</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {rewind.totalConversations > 0
                      ? Math.round(rewind.totalUserMessages / rewind.totalConversations).toLocaleString()
                      : "—"}
                  </div>
                  <p className="muted mt-1 text-xs text-slate-200">You don’t ask once. You iterate.</p>
                </div>
              </div>
            </div>

            {rewind.wrapped.projects.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Your top builds</div>
                <p className="muted mt-3 text-sm text-slate-100">Your top “artists” this year.</p>

                <ol className="mt-5 space-y-4 text-sm text-slate-100">
                  {rewind.wrapped.projects.map((project, idx) => (
                    <li key={`${project.projectLabel}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-200">#{idx + 1}</div>
                          <div className="mt-2 text-base font-semibold text-white">{project.projectLabel}</div>
                          <p className="mt-2 text-sm text-slate-100">{project.whatYouBuilt}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                            {project.statusGuess}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                            {project.intensity}
                          </span>
                        </div>
                      </div>

                      {includeExamples && (
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-2">
                            {project.stack.slice(0, 6).map((t) => (
                              <span
                                key={t}
                                className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-50"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          {project.monthsActive.length > 0 && (
                            <div className="muted text-xs text-slate-200">
                              {project.monthsActive.slice(0, 4).join(", ")}
                              {project.monthsActive.length > 4 ? "…" : ""}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {rewind.wrapped.bossFights.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                  Boss fights you couldn't stop replaying
                </div>
                <p className="muted mt-3 text-sm text-slate-100">We saw the same enemies show up. Again.</p>

                <ul className="mt-5 space-y-4 text-sm text-slate-100">
                  {rewind.wrapped.bossFights.map((boss) => (
                    <li key={`${boss.title}-${boss.example}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-white">{boss.title}</div>
                          <p className="muted mt-1 text-xs text-slate-200">Example: {boss.example}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">{boss.count.toLocaleString()}x</div>
                          <p className="muted mt-1 text-xs text-slate-200">replayed</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rewind.wrapped.weirdRabbitHole && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                  {rewind.wrapped.weirdRabbitHole.title}
                </div>
                <p className="mt-4 text-sm text-slate-100">{rewind.wrapped.weirdRabbitHole.detail}</p>
              </div>
            )}

            {allowRedactedExcerpts && momentLines.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Tiny redacted moments</div>
                <p className="muted mt-3 text-sm text-slate-100">Private view only. No raw prompts.</p>
                <ul className="mt-5 space-y-3 text-sm text-slate-100">
                  {momentLines.map((m) => (
                    <li key={m} className="leading-relaxed">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                How you treated AI
              </div>
              <p className="muted mt-3 text-sm text-slate-100">Not judging. Just holding up the mirror.</p>

              <ul className="mt-5 space-y-4 text-sm text-slate-100">
                {treatedBangers.length > 0 ? (
                  treatedBangers.map((banger) => (
                    <li key={banger.id} className="leading-relaxed">
                      <span>
                        {banger.line1}{" "}
                        {banger.line2 && <span className="muted text-xs text-slate-200">{banger.line2}</span>}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="leading-relaxed">You kept it surprisingly civil. Still demanding. Still curious.</li>
                )}
              </ul>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Receipts</div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="muted text-sm text-slate-100">We brought evidence.</p>
                <label className="flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={includeSpicyWords}
                    onChange={(e) => setIncludeSpicyWords(e.currentTarget.checked)}
                    disabled={spice === "mild" || rewind.nicknames.length === 0}
                    className="h-4 w-4 rounded border border-white/20 bg-white/5 text-emerald-300"
                  />
                  Include the spicy words I used
                </label>
              </div>

              <ul className="mt-5 space-y-3 text-sm text-slate-100">
                {receiptBangers.length > 0 ? (
                  receiptBangers.map((banger) => (
                    <li key={banger.id} className="leading-relaxed">
                      <span>
                        {banger.line1}{" "}
                        {banger.line2 && <span className="muted text-xs text-slate-200">{banger.line2}</span>}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="leading-relaxed">
                    {bySpice(spice, {
                      mild: "Mostly wholesome. Mild chaos, at worst.",
                      spicy: "Nothing too chaotic. Respect.",
                      savage: "You were annoyingly reasonable. Congrats.",
                    })}
                  </li>
                )}
              </ul>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                What you actually used AI for
              </div>
              {rewind.topTopics[0] && (
                <p className="muted mt-3 text-sm text-slate-100">
                  {topicTagline(rewind.topTopics[0].key)}
                </p>
              )}
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
                          {t.count.toLocaleString()} chats | {pct}%
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
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Character arc</div>
              <div className="mt-4 grid gap-3 text-sm text-slate-100">
                {rewind.promptLengthChangePercent != null && (
                  <p>
                    Your prompts got <b>{Math.abs(rewind.promptLengthChangePercent)}%</b>{" "}
                    {rewind.promptLengthChangePercent > 0 ? "longer" : "shorter"} over the year.{" "}
                    <span className="muted text-slate-200">
                      {rewind.promptLengthChangePercent > 0
                        ? "More context. More control."
                        : "Early-year: essays. End-of-year: commands."}
                    </span>
                  </p>
                )}
                {rewind.longestPromptChars != null && (
                  <p>
                    Longest prompt: <b>{rewind.longestPromptChars.toLocaleString()}</b> characters.{" "}
                    <span className="muted text-slate-200">You did not come to play.</span>
                  </p>
                )}
                {rewind.avgPromptChars != null && (
                  <p>
                    Typical ask: around <b>{rewind.avgPromptChars}</b> characters.{" "}
                    <span className="muted text-slate-200">You don't do vague.</span>
                  </p>
                )}
              </div>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Highs, lows, and comebacks
              </div>
              <p className="muted mt-3 text-sm text-slate-100">The highlight reel. And the outtakes.</p>

              <ul className="mt-5 space-y-3 text-sm text-slate-100">
                {rewind.wrapped.wins[0] && (
                  <li>
                    High: <b>{rewind.wrapped.wins[0].title}</b> ({rewind.wrapped.wins[0].count.toLocaleString()})
                  </li>
                )}
                {rewind.wrapped.timeline.mostActiveWeek && (
                  <li>
                    Most active week: <b>{rewind.wrapped.timeline.mostActiveWeek}</b>.
                  </li>
                )}
                {rewind.wrapped.timeline.mostChaoticWeek && (
                  <li>
                    Most chaotic week: <b>{rewind.wrapped.timeline.mostChaoticWeek}</b>.
                  </li>
                )}
                {rewind.wrapped.timeline.longestStreakDays != null && (
                  <li>
                    Longest streak: <b>{rewind.wrapped.timeline.longestStreakDays}</b> days.
                  </li>
                )}
                {rewind.wrapped.timeline.villainMonth && (
                  <li>
                    Villain era: <b>{rewind.wrapped.timeline.villainMonth}</b>.{" "}
                    {bySpice(spice, {
                      mild: "Something was happening. You brought it here.",
                      spicy: "It was a lot. We have receipts.",
                      savage: "It was unhinged. We’re not asking questions.",
                    })}
                  </li>
                )}
                {rewind.wrapped.comebackMoment && (
                  <li>
                    <b>{rewind.wrapped.comebackMoment.title}:</b> {rewind.wrapped.comebackMoment.detail}
                  </li>
                )}
              </ul>

              {includeExamples && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Flow months</div>
                    <p className="mt-2 text-sm text-slate-100">
                      {rewind.wrapped.timeline.flowMonths.length ? rewind.wrapped.timeline.flowMonths.join(", ") : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Friction months</div>
                    <p className="mt-2 text-sm text-slate-100">
                      {rewind.wrapped.timeline.frictionMonths.length
                        ? rewind.wrapped.timeline.frictionMonths.join(", ")
                        : "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">2026 forecast</div>
              <p className="muted mt-3 text-sm text-slate-100">
                {bySpice(spice, {
                  mild: "Playful prediction. For fun. For you.",
                  spicy: "Playful prediction. Yes, it's probably accurate.",
                  savage: "Playful prediction. We're probably right.",
                })}
              </p>
              <ul className="mt-5 space-y-3 text-sm text-slate-100">
                {rewind.wrapped.forecast.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Character arc
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-100">
                {rewind.promptLengthChangePercent != null && (
                  <p>
                    Your prompts got <b>{Math.abs(rewind.promptLengthChangePercent)}%</b>{" "}
                    {rewind.promptLengthChangePercent > 0 ? "longer" : "shorter"} over the year.{" "}
                    <span className="muted text-slate-200">
                      {rewind.promptLengthChangePercent > 0
                        ? "More context. More control."
                        : "Early-year: essays. End-of-year: commands."}
                    </span>
                  </p>
                )}
                {rewind.longestPromptChars != null && (
                  <p>
                    Longest prompt: <b>{rewind.longestPromptChars.toLocaleString()}</b> characters.{" "}
                    <span className="muted text-slate-200">You did not come to play.</span>
                  </p>
                )}
                {rewind.avgPromptChars != null && (
                  <p>
                    Typical ask: around <b>{rewind.avgPromptChars}</b> characters.{" "}
                    <span className="muted text-slate-200">You don’t do vague.</span>
                  </p>
                )}
              </div>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                So… what was this really about?
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-100">
                {closingReflectionLines(rewind, spice).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p className="mt-2 font-semibold text-white">{rewind.wrapped.closingLine}</p>
              </div>
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
