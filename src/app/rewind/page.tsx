"use client";

import { useEffect, useState, type ReactNode } from "react";
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

const formatHourRange = (hour: number) => `${formatHour(hour)}-${formatHour((hour + 1) % 24)}`;

type ShareInsight = { headline: string; subhead?: string };

const topicMeaning = (key: string | undefined) => {
  switch (key) {
    case "coding":
      return "You mostly came here to build things.";
    case "writing":
      return "You came here to find the right words.";
    case "learning":
      return "You came here to understand, not just to know.";
    case "planning":
      return "You came here to get organized and get moving.";
    case "travel":
      return "You came here to map it out before you went.";
    case "career":
      return "You came here to sharpen how you show up.";
    case "creative":
      return "You came here to play with ideas until they clicked.";
    default:
      return "You had a theme. You kept coming back to it.";
  }
};

const topicTagline = (key: string | undefined) => {
  switch (key) {
    case "coding":
      return "You treated AI like a co-builder, not a search engine.";
    case "writing":
      return "You came here to make it sound like you.";
    case "learning":
      return "You kept asking until it actually clicked.";
    case "planning":
      return "You used AI like a second brain with a deadline.";
    case "travel":
      return "You planned it like a pro (with a co-pilot).";
    case "career":
      return "You sharpened how you show up.";
    case "creative":
      return "You played with ideas until one sparked.";
    default:
      return "You kept coming back to the same few themes.";
  }
};

const timeOfDayLabel = (hour: number) => {
  if (hour >= 5 && hour <= 8) return "early mornings";
  if (hour >= 9 && hour <= 11) return "late mornings";
  if (hour >= 12 && hour <= 14) return "early afternoons";
  if (hour >= 15 && hour <= 17) return "late afternoons";
  if (hour >= 18 && hour <= 21) return "evenings";
  return "late nights";
};

const pickShareInsight = (summary: RewindSummary): ShareInsight => {
  const getPhrase = (phrase: string) => summary.frequentPhrases.find((p) => p.phrase === phrase);

  const please = getPhrase("please");
  if (please && please.count >= 25) {
    return { headline: "You ran ChatGPT in polite mode all year.", subhead: `"please" × ${please.count.toLocaleString()}` };
  }

  const thankYou = getPhrase("thank you");
  if (thankYou && thankYou.count >= 25) {
    return {
      headline: "Gratitude mode stayed on.",
      subhead: `"thank you" × ${thankYou.count.toLocaleString()}`,
    };
  }

  if (summary.promptLengthChangePercent != null) {
    if (summary.promptLengthChangePercent < 0) {
      return {
        headline: "You learned how to talk to AI this year.",
        subhead: `Your prompts got ${Math.abs(summary.promptLengthChangePercent)}% shorter.`,
      };
    }
    return {
      headline: "You got bolder with your asks this year.",
      subhead: `Your prompts got ${Math.abs(summary.promptLengthChangePercent)}% longer.`,
    };
  }

  if (summary.activeDays >= 200) {
    return {
      headline: `You showed up ${summary.activeDays.toLocaleString()} days.`,
      subhead: "This wasn’t casual use.",
    };
  }

  const topTopic = summary.topTopics[0];
  if (topTopic) {
    return {
      headline: `Top vibe: ${topTopic.label}.`,
      subhead: topicMeaning(topTopic.key),
    };
  }

  return { headline: "Your AI Year in Rewind.", subhead: "A private highlight reel." };
};

const closingReflectionLines = (summary: RewindSummary) => {
  const top = summary.topTopics[0]?.key;
  const lines: string[] = [];

  lines.push("This wasn’t about answers. It was about clarity.");

  switch (top) {
    case "coding":
      lines.push("You came here to build. And you kept building.");
      break;
    case "writing":
      lines.push("You came here to shape ideas into words.");
      break;
    case "learning":
      lines.push("You came here to understand things, not just skim them.");
      break;
    case "planning":
      lines.push("You came here to turn thoughts into a plan.");
      break;
    case "travel":
      lines.push("You came here to map it out before you went.");
      break;
    case "career":
      lines.push("You came here to sharpen your next move.");
      break;
    case "creative":
      lines.push("You came here to play until something clicked.");
      break;
    default:
      lines.push("You came here to get unstuck. And you did.");
      break;
  }

  if (summary.promptLengthChangePercent != null) {
    lines.push(
      summary.promptLengthChangePercent < 0
        ? "By the end of the year, you knew exactly what to ask."
        : "By the end of the year, you weren’t afraid to add context.",
    );
  } else {
    lines.push("By the end of the year, you had a rhythm with it.");
  }

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
  ctx.fillText("YOUR AI YEAR IN REWIND", 90, 132);

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

  const buildShareText = (insight: ShareInsight) =>
    insight.subhead ? `${insight.headline}\n${insight.subhead}` : insight.headline;

  const copyRewind = async () => {
    if (!rewind) return;
    const insight = pickShareInsight(rewind);
    try {
      await navigator.clipboard.writeText(buildShareText(insight));
      setShareStatus("Copied to clipboard.");
    } catch (err) {
      console.warn("Clipboard copy failed", err);
      setShareStatus("Couldn't copy - your browser blocked clipboard access.");
    }
  };

  const shareRewind = async () => {
    if (!rewind) return;
    const insight = pickShareInsight(rewind);
    const text = buildShareText(insight);

    if (typeof navigator.share === "function") {
      try {
        const png = await renderShareCardPng(insight);
        const file = new File([png], "mindprofile-rewind.png", { type: "image/png" });

        if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "Your AI Year in Rewind", text: insight.headline, files: [file] });
        } else {
          await navigator.share({ title: "Your AI Year in Rewind", text });
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
            Your AI Year in Rewind
          </h1>
          <p className="muted text-base leading-relaxed text-slate-100">
            It takes about 2 minutes. Nothing is uploaded. Nothing is shared.
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
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Days</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {rewind.activeDays.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <p className="muted mt-4 text-sm text-slate-100">
                    {rewind.activeDays >= 260
                      ? "This wasn’t casual use. You came back often."
                      : rewind.activeDays >= 120
                        ? "You kept coming back when something mattered."
                        : "You dropped in when you needed a second brain."}
                  </p>

                  {rewind.topTopics[0] && (
                    <p className="mt-3 text-sm text-slate-100">
                      Top vibe:{" "}
                      <b>
                        {rewind.topTopics[0].emoji} {rewind.topTopics[0].label}
                      </b>
                      .{" "}
                      <span className="muted text-slate-200">
                        {topicMeaning(rewind.topTopics[0].key)}
                      </span>
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
                  <p className="muted mt-1 text-xs text-slate-200">That's when your best questions happened.</p>
                  {rewind.lateNightPercent > 0 && (
                    <p className="muted mt-2 text-xs text-slate-200">
                      Late-night detours: {rewind.lateNightPercent}%.
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Busiest month</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {rewind.busiestMonth ?? "—"}
                  </div>
                  <p className="muted mt-1 text-xs text-slate-200">Something was clearly happening.</p>
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

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                What you came here for
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
                Your AI rhythm
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-100">
                <p>
                  {rewind.activeDays >= 260
                    ? `You showed up on ${rewind.activeDays.toLocaleString()} different days. This was a habit.`
                    : rewind.activeDays >= 120
                      ? `You showed up on ${rewind.activeDays.toLocaleString()} different days. Consistent energy.`
                      : `You showed up on ${rewind.activeDays.toLocaleString()} different days. You knew when you needed it.`}
                </p>

                {rewind.peakHour != null && (
                  <p>
                    Most of your chats landed in <b>{timeOfDayLabel(rewind.peakHour)}</b>. Prime time was{" "}
                    <b>{formatHourRange(rewind.peakHour)}</b>.
                  </p>
                )}

                {rewind.busiestMonth && (
                  <p>
                    And <b>{rewind.busiestMonth}</b> was your peak.
                  </p>
                )}

                <p className="muted text-slate-200">
                  {rewind.lateNightPercent >= 25
                    ? "Translation: you did some of your best thinking after hours."
                    : "Translation: you came here with clarity, not chaos."}
                </p>
              </div>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Your AI quirks
              </div>
              <p className="muted mt-3 text-sm text-slate-100">
                The part you'll want to screenshot.
              </p>

              <ul className="mt-5 space-y-3 text-sm text-slate-100">
                {(() => {
                  const get = (phrase: string) =>
                    rewind.frequentPhrases.find((p) => p.phrase === phrase)?.count ?? 0;
                  const please = get("please");
                  const thankYou = get("thank you");
                  const canYou = get("can you");
                  const quick = get("quick question");
                  const step = get("step by step");
                  const items: Array<{ key: string; node: ReactNode }> = [];

                  if (please > 0) {
                    items.push({
                      key: "please",
                      node: (
                        <span>
                          You ran ChatGPT in polite mode all year. Good manners survived automation.{" "}
                          <span className="muted text-xs text-slate-200">("please" × {please.toLocaleString()})</span>
                        </span>
                      ),
                    });
                  }

                  if (thankYou > 0) {
                    items.push({
                      key: "thankyou",
                      node: (
                        <span>
                          You said thanks a lot. Even to a machine.{" "}
                          <span className="muted text-xs text-slate-200">("thank you" × {thankYou.toLocaleString()})</span>
                        </span>
                      ),
                    });
                  }

                  if (canYou > 0) {
                    items.push({
                      key: "canyou",
                      node: (
                        <span>
                          You love a clean ask. "Can you…" was basically your opener.{" "}
                          <span className="muted text-xs text-slate-200">("can you" × {canYou.toLocaleString()})</span>
                        </span>
                      ),
                    });
                  }

                  if (quick > 0) {
                    items.push({
                      key: "quick",
                      node: (
                        <span>
                          Your "quick question" was rarely quick.{" "}
                          <span className="muted text-xs text-slate-200">("quick question" × {quick.toLocaleString()})</span>
                        </span>
                      ),
                    });
                  }

                  if (step > 0) {
                    items.push({
                      key: "step",
                      node: (
                        <span>
                          You love a step-by-step. Chaos was not invited.{" "}
                          <span className="muted text-xs text-slate-200">("step by step" × {step.toLocaleString()})</span>
                        </span>
                      ),
                    });
                  }

                  if (rewind.topWord) {
                    items.push({
                      key: "topword",
                      node: (
                        <span>
                          Word you kept coming back to: <b>{rewind.topWord}</b>.
                        </span>
                      ),
                    });
                  }

                  if (items.length === 0) {
                    items.push({
                      key: "fallback",
                      node: <span>You kept it fresh. No single quirk dominated.</span>,
                    });
                  }

                  return items.slice(0, 5).map((it) => (
                    <li key={it.key} className="leading-relaxed">
                      {it.node}
                    </li>
                  ));
                })()}
              </ul>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Growth over time
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-100">
                {rewind.promptLengthChangePercent != null && (
                  <p>
                    Your prompts got <b>{Math.abs(rewind.promptLengthChangePercent)}%</b>{" "}
                    {rewind.promptLengthChangePercent > 0 ? "longer" : "shorter"} over the year.{" "}
                    <span className="muted text-slate-200">
                      {rewind.promptLengthChangePercent > 0
                        ? "You started bringing more context."
                        : "You learned how to talk to AI."}
                    </span>
                  </p>
                )}
                {rewind.longestPromptChars != null && (
                  <p>
                    At least once, you went all-in:{" "}
                    <b>{rewind.longestPromptChars.toLocaleString()}</b> characters.{" "}
                    <span className="muted text-slate-200">No half-asking.</span>
                  </p>
                )}
                {rewind.avgPromptChars != null && (
                  <p>
                    Your typical ask: around <b>{rewind.avgPromptChars}</b> characters.{" "}
                    <span className="muted text-slate-200">You gave context.</span>
                  </p>
                )}
              </div>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Your year with AI
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-100">
                {closingReflectionLines(rewind).map((line) => (
                  <p key={line}>{line}</p>
                ))}
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
