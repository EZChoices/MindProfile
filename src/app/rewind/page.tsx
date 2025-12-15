"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateClientId } from "@/lib/clientId";
import { anonymizeText } from "@/lib/anonymize";
import type { RewindSummary } from "@/lib/rewind";
import { analyzeRewindFileClient } from "@/lib/rewindFileClient";
import type { RewindClientProgress } from "@/lib/rewindFileClient";
import { generateRewindBangers, type RewindBanger, type SpiceLevel } from "@/lib/rewindBangers";
import { sanitizeRewindForStorage } from "@/lib/rewindSanitize";

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

const pad2 = (n: number) => String(n).padStart(2, "0");

const monthKeyFromDate = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

const defaultYearWindow = () => {
  const now = new Date();
  const until = new Date(now.getFullYear(), now.getMonth(), 1);
  const since = new Date(until.getFullYear(), until.getMonth() - 12, 1);
  return { sinceMonth: monthKeyFromDate(since), untilMonth: monthKeyFromDate(until) };
};

const monthKeyToDate = (key: string): Date | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return new Date(year, month - 1, 1);
};

const monthKeyLabel = (key: string) => {
  const d = monthKeyToDate(key);
  if (!d) return key;
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(d);
};

const previousMonthKey = (key: string) => {
  const d = monthKeyToDate(key);
  if (!d) return key;
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return monthKeyFromDate(prev);
};

const formatCoverage = (coverage: RewindSummary["coverage"]) =>
  `${monthKeyLabel(coverage.sinceMonth)} → ${monthKeyLabel(coverage.untilMonth)} (${coverage.timezone})`;

type ShareInsight = { headline: string; subhead?: string };

const bySpice = (spice: SpiceLevel, variants: { mild: string; spicy: string; savage: string }) => variants[spice];

const personalizeYouLine = (name: string, line: string) => {
  const trimmedName = name.trim();
  if (!trimmedName) return line;
  return line.replace(/^You\b/, `${trimmedName}, you`);
};

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
  const [sinceMonth, setSinceMonth] = useState<string>(() => defaultYearWindow().sinceMonth);
  const [untilMonth, setUntilMonth] = useState<string>(() => defaultYearWindow().untilMonth);
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
  const [allowRedactedExcerpts, setAllowRedactedExcerpts] = useState(true);
  const [maskNamesInExcerpts, setMaskNamesInExcerpts] = useState(false);
  const [maskNumbersInExcerpts, setMaskNumbersInExcerpts] = useState(false);
  const [sharePersonalDetails, setSharePersonalDetails] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [sharePick, setSharePick] = useState(0);
  const [dismissedHighlights, setDismissedHighlights] = useState<string[]>([]);
  const [dismissedRabbitHoles, setDismissedRabbitHoles] = useState<string[]>([]);

  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    const flag = process.env.NEXT_PUBLIC_REWIND_DEBUG === "1";
    const query = new URLSearchParams(window.location.search);
    setDebugEnabled(flag || query.get("debug") === "1" || process.env.NODE_ENV !== "production");
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mindprofile_rewind_name");
      if (saved) setDisplayName(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("mindprofile_rewind_name", displayName);
    } catch {
      // ignore
    }
  }, [displayName]);

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
  }, [
    spice,
    includeSpicyWords,
    sharePersonalDetails,
    displayName,
    dismissedHighlights.length,
    dismissedRabbitHoles.length,
    rewind?.totalConversations,
  ]);

  const dismissedHighlightsSet = new Set(dismissedHighlights);
  const dismissedRabbitHolesSet = new Set(dismissedRabbitHoles);
  const rewindForBangers = rewind
    ? {
        ...rewind,
        wrapped: {
          ...rewind.wrapped,
          rabbitHoles: rewind.wrapped.rabbitHoles.filter((h) => !dismissedRabbitHolesSet.has(h.key)),
          lifeHighlights: rewind.wrapped.lifeHighlights.filter((h) => !dismissedHighlightsSet.has(h.key)),
        },
      }
    : null;

  const bangerPack = rewindForBangers
    ? generateRewindBangers(rewindForBangers, {
        spice,
        includeSpicyWords,
        includePersonalDetails: sharePersonalDetails,
        name: displayName,
      })
    : null;
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
          ["nickname", "whiplash", "politeness", "quick", "contradiction", "rage", "style", "rhythm", "catchphrase"].includes(
            b.category,
          ),
        )
        .slice(0, 6)
    : [];

  const visibleLifeHighlights = rewind
    ? rewind.wrapped.lifeHighlights.filter((h) => !dismissedHighlightsSet.has(h.key))
    : [];
  const highLifeHighlights = visibleLifeHighlights.filter((h) => h.level === "high");
  const lowLifeHighlights = visibleLifeHighlights.filter((h) => h.level !== "high");

  const visibleRabbitHoles = rewind ? rewind.wrapped.rabbitHoles.filter((h) => !dismissedRabbitHolesSet.has(h.key)) : [];

  const mindProfileYearBullets = (() => {
    if (!rewind) return [];
    const name = displayName.trim();
    const you = name ? `${name}, you` : "You";

    const bullets: string[] = [];
    const promptsPerChat =
      rewind.totalConversations > 0 ? Math.round(rewind.totalUserMessages / rewind.totalConversations) : 0;

    if (rewind.behavior.stepByStepCount >= 15 || promptsPerChat >= 12) {
      bullets.push(`${you} don’t ask once. You iterate. Then you iterate again.`);
    } else if (rewind.avgPromptChars != null && rewind.avgPromptChars >= 900) {
      bullets.push(`${you} think out loud in paragraphs — context first, clarity later.`);
    } else {
      bullets.push(`${you} move fast: quick asks, quick pivots, repeat.`);
    }

    const hasChaos =
      rewind.behavior.brokenCount > 0 ||
      rewind.behavior.wtfCount > 0 ||
      rewind.behavior.spicyWordCount > 0 ||
      rewind.behavior.yellingMessageCount > 0;

    if (rewind.behavior.pleaseCount >= 50 && hasChaos) {
      bullets.push(`${you} stayed polite… Until it didn’t work.`);
    } else if (rewind.behavior.pleaseCount >= 50) {
      bullets.push(`${you} ran polite mode all year. Respectfully.`);
    } else if (hasChaos) {
      bullets.push(`${you} didn’t sugarcoat it when things broke.`);
    }

    const topBuild = rewind.wrapped.projects[0] ?? null;
    if (topBuild) {
      const label =
        includeExamples && allowRedactedExcerpts && topBuild.projectLabelPrivate
          ? topBuild.projectLabelPrivate
          : topBuild.projectLabel;
      const built =
        includeExamples && allowRedactedExcerpts && topBuild.whatYouBuiltPrivate
          ? topBuild.whatYouBuiltPrivate
          : topBuild.whatYouBuilt;
      bullets.push(
        `${you} built ${rewind.wrapped.projects.length.toLocaleString()} things. Loudest era: ${label}. ${built}`,
      );
    }

    const topBoss = rewind.wrapped.bossFights[0] ?? null;
    if (topBoss && topBoss.chats >= 6) {
      bullets.push(`${you} fought ${topBoss.example} in ${topBoss.chats.toLocaleString()} chats.`);
    }

    const topTrip = rewind.wrapped.trips.topTrips[0] ?? null;
    if (rewind.wrapped.trips.tripCount > 0 && topTrip) {
      const tripLabel =
        includeExamples && allowRedactedExcerpts && topTrip.titlePrivate ? topTrip.titlePrivate : topTrip.title;
      bullets.push(`${you} planned ${rewind.wrapped.trips.tripCount.toLocaleString()} trips. Including ${tripLabel}.`);
    }

    const topFood = highLifeHighlights.find((h) => h.type === "food") ?? null;
    if (topFood) {
      const foodLabel =
        includeExamples && allowRedactedExcerpts && topFood.titlePrivate ? topFood.titlePrivate : topFood.title;
      bullets.push(`${you} asked me about ${foodLabel}. Priorities.`);
    }

    if (rewind.topWord) {
      bullets.push(`${you} couldn’t quit one word: "${rewind.topWord}".`);
    }

    if (rewind.promptLengthChangePercent != null && Math.abs(rewind.promptLengthChangePercent) >= 10) {
      bullets.push(
        rewind.promptLengthChangePercent < 0
          ? `${you} went from essays → commands. Fewer words. More intent.`
          : `${you} started bringing more context later in the year. More control.`,
      );
    }

    return bullets.slice(0, 6);
  })();

  const formatExcerpt = (text: string | null) => {
    if (!text) return null;
    let out = text;
    out = anonymizeText(out, { redactNames: maskNamesInExcerpts }).sanitized;
    if (maskNumbersInExcerpts) out = out.replace(/\b\d{4,}\b/g, "[number]");
    return out;
  };

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
    setAllowRedactedExcerpts(true);
    setMaskNamesInExcerpts(false);
    setMaskNumbersInExcerpts(false);
    setDismissedHighlights([]);
    setDismissedRabbitHoles([]);
  };

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

      const since = monthKeyToDate(sinceMonth);
      const until = monthKeyToDate(untilMonth);
      if (!since || !until || since.getTime() >= until.getTime()) {
        setApiError("Pick a valid year window.");
        return;
      }

      const summary = await analyzeRewindFileClient(file, (p) => setClientProgress(p), { since, until });
      setRewind(summary);
      setDismissedHighlights([]);
      setDismissedRabbitHoles([]);

      try {
        const year = new Date(until.getTime() - 1).getFullYear();
        await fetch("/api/rewind/store", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ clientId, rewind: sanitizeRewindForStorage(summary), year }),
        });
      } catch (err) {
        console.warn("Failed to persist rewind summary", err);
      }
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
    setAllowRedactedExcerpts(true);
    setMaskNamesInExcerpts(false);
    setMaskNumbersInExcerpts(false);
    setDismissedHighlights([]);
    setDismissedRabbitHoles([]);
  };

  const dismissHighlight = (key: string) =>
    setDismissedHighlights((prev) => (prev.includes(key) ? prev : [...prev, key]));

  const dismissRabbitHole = (key: string) =>
    setDismissedRabbitHoles((prev) => (prev.includes(key) ? prev : [...prev, key]));

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

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Year window</div>
              <p className="muted mt-2 text-xs text-slate-200">Default: last full 12 months.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-xs text-slate-200">
                  <span className="font-semibold uppercase tracking-[0.2em] text-slate-200">From</span>
                  <input
                    type="month"
                    value={sinceMonth}
                    onChange={(e) => setSinceMonth(e.currentTarget.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="grid gap-2 text-xs text-slate-200">
                  <span className="font-semibold uppercase tracking-[0.2em] text-slate-200">To</span>
                  <input
                    type="month"
                    value={untilMonth}
                    onChange={(e) => setUntilMonth(e.currentTarget.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
              </div>
              <p className="muted mt-3 text-xs text-slate-200">
                Coverage: {monthKeyLabel(sinceMonth)} → {monthKeyLabel(previousMonthKey(untilMonth))} (local time)
              </p>
            </div>

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
                Your export stays on this device — we only save a summary (no raw chats).
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
                   <p className="muted mt-2 text-sm text-slate-200">
                     {personalizeYouLine(displayName, rewind.wrapped.archetype.line)}
                   </p>
                   <p className="muted mt-2 text-xs text-slate-200">Coverage: {formatCoverage(rewind.coverage)}</p>
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
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Longest streak</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {rewind.wrapped.timeline.longestStreakDays != null
                          ? rewind.wrapped.timeline.longestStreakDays.toLocaleString()
                          : "-"}
                      </div>
                      <p className="muted mt-1 text-xs text-slate-200">Days in a row.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Avg prompt</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {rewind.avgPromptChars != null ? rewind.avgPromptChars.toLocaleString() : "-"}
                      </div>
                      <p className="muted mt-1 text-xs text-slate-200">Characters.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Longest prompt</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {rewind.longestPromptChars != null ? rewind.longestPromptChars.toLocaleString() : "-"}
                      </div>
                      <p className="muted mt-1 text-xs text-slate-200">Characters. An epic ask.</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-100">
                    <b>{personalizeYouLine(displayName, rewind.wrapped.hook.brag)}</b>
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

                  <p className="mt-3 text-sm text-slate-100">
                    {personalizeYouLine(displayName, rewind.wrapped.hook.roast)}
                  </p>
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

                  <div className="flex flex-col gap-3 text-xs text-slate-200 sm:items-end">
                    <label className="grid gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                        Name (optional)
                      </span>
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.currentTarget.value)}
                        placeholder="e.g. Maan"
                        className="w-56 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                      />
                    </label>
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
                      Show small excerpts (private)
                    </label>
                    {allowRedactedExcerpts && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={maskNamesInExcerpts}
                          onChange={(e) => setMaskNamesInExcerpts(e.currentTarget.checked)}
                          className="h-4 w-4 rounded border border-white/20 bg-white/5 text-emerald-300"
                        />
                        Mask names in excerpts
                      </label>
                    )}
                    {allowRedactedExcerpts && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={maskNumbersInExcerpts}
                          onChange={(e) => setMaskNumbersInExcerpts(e.currentTarget.checked)}
                          className="h-4 w-4 rounded border border-white/20 bg-white/5 text-emerald-300"
                        />
                        Mask numbers in excerpts
                      </label>
                    )}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sharePersonalDetails}
                        onChange={(e) => setSharePersonalDetails(e.currentTarget.checked)}
                        className="h-4 w-4 rounded border border-white/20 bg-white/5 text-emerald-300"
                      />
                      Share can include names/places
                    </label>
                    <p className="muted text-[11px] text-slate-200">
                      {sharePersonalDetails
                        ? "Sharing can include personal details. Double-check before posting."
                        : allowRedactedExcerpts && !maskNamesInExcerpts
                          ? "Excerpts can include names/places (private mode). Toggle “Mask names” if you want extra privacy."
                          : "Sharing stays safe by default. No raw prompts."}
                    </p>
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

            {mindProfileYearBullets.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">MindProfile: year edition</div>
                <p className="muted mt-3 text-sm text-slate-100">Not a report. A mirror.</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-100">
                  {mindProfileYearBullets.map((line) => (
                    <li key={line} className="leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Privacy scan</div>
              <p className="muted mt-3 text-sm text-slate-100">
                We scanned for obvious sensitive bits. Excerpts are masked based on your toggles.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-200">
                {(
                  [
                    ["emails", rewind.privacyScan.emails],
                    ["phones", rewind.privacyScan.phones],
                    ["urls", rewind.privacyScan.urls],
                    ["handles", rewind.privacyScan.handles],
                    ["ids", rewind.privacyScan.ids],
                    ["secrets", rewind.privacyScan.secrets],
                    ["cards", rewind.privacyScan.cards],
                    ["names", rewind.privacyScan.names],
                    ["passwords", rewind.privacyScan.passwords],
                    ["addresses", rewind.privacyScan.addresses],
                  ] as const
                )
                  .filter(([, count]) => count > 0)
                  .map(([label, count]) => (
                    <span
                      key={label}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                    >
                      {label}: <b className="text-slate-100">{count.toLocaleString()}</b>
                    </span>
                  ))}
                {Object.values(rewind.privacyScan).every((v) => v === 0) && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    No obvious PII detected in this window.
                  </span>
                )}
              </div>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Your AI use map</div>
              <p className="muted mt-3 text-sm text-slate-100">What happened. Before we interpret it.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Sessions</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {rewind.wrapped.deepDive.useMap.totalSessions.toLocaleString()}
                  </div>
                  <p className="muted mt-1 text-xs text-slate-200">
                    Avg session:{" "}
                    {rewind.wrapped.deepDive.useMap.avgSessionMins != null
                      ? `${rewind.wrapped.deepDive.useMap.avgSessionMins} min`
                      : "-"}
                    . Avg prompts:{" "}
                    {rewind.wrapped.deepDive.useMap.avgPromptsPerSession != null
                      ? rewind.wrapped.deepDive.useMap.avgPromptsPerSession.toLocaleString()
                      : "-"}
                    .
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Endings</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {rewind.wrapped.deepDive.useMap.resolvedSessions.toLocaleString()} resolved
                  </div>
                  <p className="muted mt-1 text-xs text-slate-200">
                    {rewind.wrapped.deepDive.useMap.abandonedSessions.toLocaleString()} abandoned.
                  </p>
                </div>
              </div>

              <p className="muted mt-4 text-sm text-slate-100">{rewind.wrapped.deepDive.useMap.ratios.line}</p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">By intent</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-100">
                    {rewind.wrapped.deepDive.useMap.intents.slice(0, 6).map((row) => (
                      <li key={row.key} className="flex items-center justify-between gap-3">
                        <span>{row.label}</span>
                        <span className="muted text-xs text-slate-200">{row.pct}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">By domain</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-100">
                    {rewind.wrapped.deepDive.useMap.domains.slice(0, 6).map((row) => (
                      <li key={row.key} className="flex items-center justify-between gap-3">
                        <span>{row.label}</span>
                        <span className="muted text-xs text-slate-200">{row.pct}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {rewind.wrapped.deepDive.useMap.topOpeners.length > 0 && (
                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Opening moves</div>
                  <ul className="mt-3 space-y-3 text-sm text-slate-100">
                    {rewind.wrapped.deepDive.useMap.topOpeners.slice(0, 3).map((o) => (
                      <li key={o.label}>
                        <b>{o.label}</b>{" "}
                        <span className="muted text-xs text-slate-200">({o.count.toLocaleString()} sessions)</span>
                        {includeExamples && allowRedactedExcerpts && o.excerpt && (
                          <div className="muted mt-1 text-xs text-slate-200">"{formatExcerpt(o.excerpt)}"</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Your AI relationship style</div>
              <p className="muted mt-3 text-sm text-slate-100">
                {rewind.wrapped.deepDive.relationshipStyle.line}
              </p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-200">Primary role</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {rewind.wrapped.deepDive.relationshipStyle.primary}
                </div>
                {rewind.wrapped.deepDive.relationshipStyle.roles.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
                    {rewind.wrapped.deepDive.relationshipStyle.roles.slice(0, 4).map((r) => (
                      <span
                        key={r.role}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                      >
                        {r.role}: <b className="text-slate-100">{r.pct}%</b>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {rewind.wrapped.deepDive.signaturePrompts.openingMoves.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Your signature prompts</div>
                <p className="muted mt-3 text-sm text-slate-100">Identity, but with receipts.</p>

                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                      Common openers
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-100">
                      {rewind.wrapped.deepDive.signaturePrompts.openingMoves.slice(0, 8).map((row) => (
                        <li key={row.phrase} className="flex items-center justify-between gap-3">
                          <span>"{row.phrase}"</span>
                          <span className="muted text-xs text-slate-200">{row.count.toLocaleString()}x</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                      How you like help
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-100">
                      {rewind.wrapped.deepDive.signaturePrompts.constraints.slice(0, 4).map((c) => (
                        <li key={c.label} className="leading-relaxed">
                          <b>{c.label}.</b> {c.line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {rewind.wrapped.deepDive.loops.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Loop detector</div>
                <p className="muted mt-3 text-sm text-slate-100">
                  Where you get stuck - and what to try next.
                </p>

                <ul className="mt-5 space-y-4 text-sm text-slate-100">
                  {rewind.wrapped.deepDive.loops.map((loop) => (
                    <li key={loop.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-white">{loop.title}</div>
                          <p className="muted mt-1 text-xs text-slate-200">{loop.observation}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">
                            {Math.round(loop.confidence * 100)}%
                          </div>
                          <p className="muted mt-1 text-xs text-slate-200">confidence</p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm text-slate-100">
                        <p>
                          <span className="muted text-slate-200">Cost:</span> {loop.cost}
                        </p>
                        <p>
                          <span className="muted text-slate-200">Experiment:</span> {loop.experiment}
                        </p>
                        <p>
                          <span className="muted text-slate-200">Metric:</span> {loop.successMetric}
                        </p>
                      </div>
                      {includeExamples && allowRedactedExcerpts && loop.evidence.length > 0 && (
                        <details className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                            Evidence (private)
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-slate-200">
                            {loop.evidence.slice(0, 3).map((e, idx) => (
                              <li key={`${loop.key}-ev-${idx}`}>
                                {(e.startDay ?? e.endDay ?? "date")} · {formatExcerpt(e.snippets[0] ?? "signal")}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rewind.wrapped.deepDive.insights.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Insights with receipts</div>
                <p className="muted mt-3 text-sm text-slate-100">Observation → evidence → meaning → experiment.</p>

                <ul className="mt-5 space-y-4 text-sm text-slate-100">
                  {rewind.wrapped.deepDive.insights.map((insight) => (
                    <li key={insight.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-base font-semibold text-white">{insight.title}</div>
                          <p className="muted mt-1 text-xs text-slate-200">
                            Confidence: {Math.round(insight.confidence * 100)}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 text-sm text-slate-100">
                        <p>
                          <b>Observation:</b> {insight.observation}
                        </p>
                        {insight.evidence.counts.length > 0 && (
                          <div>
                            <b>Evidence:</b>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-100">
                              {insight.evidence.counts.slice(0, 3).map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {includeExamples && allowRedactedExcerpts && insight.evidence.excerpts.length > 0 && (
                          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200">
                            “{formatExcerpt(insight.evidence.excerpts[0])}”
                          </div>
                        )}
                        <p>
                          <b>Interpretation:</b> {insight.interpretation}
                        </p>
                        <p>
                          <b>Cost:</b> {insight.cost}
                        </p>
                        <p>
                          <b>Experiment:</b> {insight.experiment}
                        </p>
                        <p>
                          <b>Success metric:</b> {insight.successMetric}
                        </p>
                      </div>

                      {includeExamples && allowRedactedExcerpts && insight.evidence.pointers.length > 0 && (
                        <details className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                            Evidence pointers (private)
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-slate-200">
                            {insight.evidence.pointers.slice(0, 3).map((e, idx) => (
                              <li key={`${insight.key}-ptr-${idx}`}>
                                {(e.startDay ?? e.endDay ?? "date")} · {formatExcerpt(e.snippets[0] ?? "signal")}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Action plan</div>
              <p className="muted mt-3 text-sm text-slate-100">The part you actually keep.</p>

              <div className="mt-5 grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Keep doing</div>
                  <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-100">
                    {rewind.wrapped.deepDive.actionPlan.keepDoing.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Adjust</div>
                  <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-100">
                    {rewind.wrapped.deepDive.actionPlan.adjust.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Stop doing</div>
                  <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-100">
                    {rewind.wrapped.deepDive.actionPlan.stopDoing.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {rewind.wrapped.deepDive.actionPlan.promptTemplates.length > 0 && (
                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                    Prompt templates
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {rewind.wrapped.deepDive.actionPlan.promptTemplates.slice(0, 5).map((t) => (
                      <div key={t.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-sm font-semibold text-white">{t.title}</div>
                        <pre className="muted mt-3 whitespace-pre-wrap break-words text-xs text-slate-200">
                          {t.template}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {rewind.wrapped.trips.tripCount > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Trips</div>
                <p className="muted mt-3 text-sm text-slate-100">
                  You planned {rewind.wrapped.trips.tripCount.toLocaleString()} trips with me.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {rewind.wrapped.trips.topTrips.map((t) => (
                    <div key={t.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-white">
                            {includeExamples && allowRedactedExcerpts && t.titlePrivate ? t.titlePrivate : t.title}
                          </div>
                          {t.month && <p className="muted mt-1 text-xs text-slate-200">{t.month}</p>}
                          {t.range && <p className="muted mt-1 text-xs text-slate-200">{t.range}</p>}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-100">{t.line}</p>
                      {includeExamples && allowRedactedExcerpts && t.excerpt && (
                        <p className="muted mt-2 text-xs text-slate-200">"{formatExcerpt(t.excerpt)}"</p>
                      )}
                      {includeExamples && allowRedactedExcerpts && t.evidence.length > 0 && (
                        <details className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                            Evidence (private)
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-slate-200">
                            {t.evidence.slice(0, 3).map((e, idx) => (
                              <li key={`${t.key}-ev-${idx}`}>
                                {(e.startDay ?? e.endDay ?? "date")} · {formatExcerpt(e.snippets[0] ?? "signal")}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {includeExamples && visibleLifeHighlights.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Life highlights</div>
                <p className="muted mt-3 text-sm text-slate-100">High confidence only by default. No raw prompts.</p>

                {highLifeHighlights.length > 0 ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {highLifeHighlights.slice(0, 8).map((h) => (
                      <div key={h.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-base font-semibold text-white">
                              {allowRedactedExcerpts && h.titlePrivate ? h.titlePrivate : h.title}
                            </div>
                            {h.month && <p className="muted mt-1 text-xs text-slate-200">{h.month}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => dismissHighlight(h.key)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-white/10"
                          >
                            Not me
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-slate-100">{h.line}</p>
                        {allowRedactedExcerpts && h.excerpt && (
                          <p className="muted mt-2 text-xs text-slate-200">"{formatExcerpt(h.excerpt)}"</p>
                        )}
                        {allowRedactedExcerpts && h.evidence.length > 0 && (
                          <details className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                            <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                              Evidence (private)
                            </summary>
                            <ul className="mt-2 space-y-1 text-xs text-slate-200">
                              {h.evidence.slice(0, 3).map((e, idx) => (
                                <li key={`${h.key}-ev-${idx}`}>
                                  {(e.startDay ?? e.endDay ?? "date")} · {formatExcerpt(e.snippets[0] ?? "signal")}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-100">No high-confidence life highlights found in this window.</p>
                )}

                {lowLifeHighlights.length > 0 && (
                  <details className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-100">
                      Other things we spotted (low confidence)
                    </summary>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {lowLifeHighlights.slice(0, 6).map((h) => (
                        <div key={h.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-semibold text-white">{h.title}</div>
                              {h.month && <p className="muted mt-1 text-xs text-slate-200">{h.month}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => dismissHighlight(h.key)}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-white/10"
                            >
                              Not me
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-slate-100">{h.line}</p>
                          {allowRedactedExcerpts && h.excerpt && (
                            <p className="muted mt-2 text-xs text-slate-200">"{formatExcerpt(h.excerpt)}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {visibleRabbitHoles.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Rabbit holes</div>
                <p className="muted mt-3 text-sm text-slate-100">Short obsessions. High intensity.</p>

                <ul className="mt-5 space-y-4 text-sm text-slate-100">
                  {visibleRabbitHoles.map((hole) => (
                    <li key={hole.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-white">{hole.title}</div>
                          <p className="muted mt-1 text-xs text-slate-200">{hole.range}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => dismissRabbitHole(hole.key)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-white/10"
                          >
                            Not me
                          </button>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-white">{hole.chats.toLocaleString()}</div>
                            <p className="muted mt-1 text-xs text-slate-200">
                              chats in {hole.days.toLocaleString()} days
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-100">{hole.why}</p>
                      {includeExamples && allowRedactedExcerpts && hole.excerpt && (
                        <p className="muted mt-2 text-xs text-slate-200">"{formatExcerpt(hole.excerpt)}"</p>
                      )}
                      {includeExamples && allowRedactedExcerpts && hole.evidence.length > 0 && (
                        <details className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                            Evidence (private)
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-slate-200">
                            {hole.evidence.slice(0, 3).map((e, idx) => (
                              <li key={`${hole.key}-ev-${idx}`}>
                                {(e.startDay ?? e.endDay ?? "date")} · {formatExcerpt(e.snippets[0] ?? "signal")}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rewind.wrapped.projects.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Your top builds</div>
                <p className="muted mt-3 text-sm text-slate-100">Your top "artists" this year.</p>

                <ol className="mt-5 space-y-4 text-sm text-slate-100">
                  {rewind.wrapped.projects.map((project, idx) => (
                    <li key={project.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-200">#{idx + 1}</div>
                          <div className="mt-2 text-base font-semibold text-white">
                            {includeExamples && allowRedactedExcerpts && project.projectLabelPrivate
                              ? project.projectLabelPrivate
                              : project.projectLabel}
                          </div>
                          {project.range && <p className="muted mt-1 text-xs text-slate-200">{project.range}</p>}
                          <p className="mt-2 text-sm text-slate-100">
                            {includeExamples && allowRedactedExcerpts && project.whatYouBuiltPrivate
                              ? project.whatYouBuiltPrivate
                              : project.whatYouBuilt}
                          </p>
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

                      {includeExamples && allowRedactedExcerpts && project.evidence.length > 0 && (
                        <details className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                            Evidence (private)
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-slate-200">
                            {project.evidence.slice(0, 3).map((e, idx2) => (
                              <li key={`${project.key}-ev-${idx2}`}>
                                {(e.startDay ?? e.endDay ?? "date")} · {formatExcerpt(e.snippets[0] ?? "signal")}
                              </li>
                            ))}
                          </ul>
                        </details>
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
                    <li key={boss.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-white">{boss.title}</div>
                          <p className="muted mt-1 text-xs text-slate-200">{boss.intensityLine}</p>
                          {boss.during && (
                            <p className="muted mt-2 text-xs text-slate-200">During: {boss.during}.</p>
                          )}
                          <p className="muted mt-2 text-xs text-slate-200">Example: {boss.example}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">{boss.chats.toLocaleString()}</div>
                          <p className="muted mt-1 text-xs text-slate-200">chats</p>
                        </div>
                      </div>
                      {includeExamples && allowRedactedExcerpts && boss.evidence.length > 0 && (
                        <details className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                            Evidence (private)
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-slate-200">
                            {boss.evidence.slice(0, 3).map((e, idx) => (
                              <li key={`${boss.key}-ev-${idx}`}>
                                {(e.startDay ?? e.endDay ?? "date")} · {formatExcerpt(e.snippets[0] ?? "signal")}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {visibleRabbitHoles.length === 0 && rewind.wrapped.weirdRabbitHole && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                  {rewind.wrapped.weirdRabbitHole.title}
                </div>
                <p className="mt-4 text-sm text-slate-100">{rewind.wrapped.weirdRabbitHole.detail}</p>
              </div>
            )}

            {rewind.wrapped.bestMoments.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Best moments</div>
                <p className="muted mt-3 text-sm text-slate-100">The highlight reel. No raw prompts.</p>

                <ul className="mt-5 space-y-4 text-sm text-slate-100">
                  {rewind.wrapped.bestMoments.map((m) => (
                    <li key={m.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-white">{m.title}</div>
                          {m.month && <p className="muted mt-1 text-xs text-slate-200">{m.month}</p>}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-100">{m.line}</p>
                      {includeExamples && allowRedactedExcerpts && m.excerpt && (
                        <p className="muted mt-2 text-xs text-slate-200">"{formatExcerpt(m.excerpt)}"</p>
                      )}
                      {includeExamples && allowRedactedExcerpts && m.evidence.length > 0 && (
                        <details className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                            Evidence (private)
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-slate-200">
                            {m.evidence.slice(0, 3).map((e, idx) => (
                              <li key={`${m.key}-ev-${idx}`}>
                                {(e.startDay ?? e.endDay ?? "date")} · {formatExcerpt(e.snippets[0] ?? "signal")}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
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

            {rewind.wrapped.youVsYou.length > 0 && (
              <div className="glass card-border rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">You vs you</div>
                <p className="muted mt-3 text-sm text-slate-100">No global stats. Just your own baseline.</p>
                <ul className="mt-5 space-y-3 text-sm text-slate-100">
                  {rewind.wrapped.youVsYou.map((line) => (
                    <li key={line} className="leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Character arc</div>
              <div className="mt-4 grid gap-3 text-sm text-slate-100">
                {rewind.wrapped.growthUpgrades.length > 0 && (
                  <ul className="space-y-2">
                    {rewind.wrapped.growthUpgrades.map((u) => (
                      <li key={u.title} className="leading-relaxed">
                        <b>{u.title}.</b> {u.line}{" "}
                        {u.delta && <span className="muted text-xs text-slate-200">({u.delta})</span>}
                      </li>
                    ))}
                  </ul>
                )}
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
                  <p key={line}>{personalizeYouLine(displayName, line)}</p>
                ))}
                <p className="mt-2 font-semibold text-white">
                  {personalizeYouLine(displayName, rewind.wrapped.closingLine)}
                </p>
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
